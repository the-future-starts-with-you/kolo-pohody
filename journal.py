from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db, JournalEntry
from datetime import datetime, date
import json

journal_bp = Blueprint('journal', __name__)

@journal_bp.route('/journal', methods=['GET'])
@jwt_required()
def get_journal_entries():
    """Get journal entries with optional filtering"""
    current_user_id = get_jwt_identity()
    
    # Get query parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    include_private = request.args.get('include_private', 'true').lower() == 'true'
    limit = request.args.get('limit', type=int, default=50)
    search = request.args.get('search', '').strip()
    
    # Build query
    query = JournalEntry.query.filter_by(user_id=current_user_id)
    
    # Filter by privacy setting
    if not include_private:
        query = query.filter_by(is_private=False)
    
    # Date filtering
    if start_date:
        try:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(JournalEntry.entry_date >= start_date_obj)
        except ValueError:
            return jsonify({'error': 'Invalid start_date format. Use YYYY-MM-DD'}), 400
    
    if end_date:
        try:
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(JournalEntry.entry_date <= end_date_obj)
        except ValueError:
            return jsonify({'error': 'Invalid end_date format. Use YYYY-MM-DD'}), 400
    
    # Search filtering
    if search:
        search_term = f'%{search}%'
        query = query.filter(
            db.or_(
                JournalEntry.title.ilike(search_term),
                JournalEntry.content.ilike(search_term),
                JournalEntry.tags.ilike(search_term)
            )
        )
    
    entries = query.order_by(JournalEntry.entry_date.desc(), JournalEntry.created_at.desc()).limit(limit).all()
    
    return jsonify([entry.to_dict() for entry in entries])

@journal_bp.route('/journal', methods=['POST'])
@jwt_required()
def create_journal_entry():
    """Create new journal entry"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('content'):
        return jsonify({'error': 'Content is required'}), 400
    
    # Parse entry date
    entry_date_str = data.get('entry_date')
    if entry_date_str:
        try:
            entry_date = datetime.strptime(entry_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid entry_date format. Use YYYY-MM-DD'}), 400
    else:
        entry_date = date.today()
    
    # Process tags
    tags = data.get('tags', [])
    if isinstance(tags, list):
        tags_json = json.dumps(tags)
    else:
        tags_json = json.dumps([])
    
    entry = JournalEntry(
        user_id=current_user_id,
        title=data.get('title', ''),
        content=data['content'],
        entry_date=entry_date,
        is_private=data.get('is_private', False),
        tags=tags_json
    )
    
    db.session.add(entry)
    db.session.commit()
    
    return jsonify(entry.to_dict()), 201

@journal_bp.route('/journal/<int:entry_id>', methods=['GET'])
@jwt_required()
def get_journal_entry(entry_id):
    """Get specific journal entry"""
    current_user_id = get_jwt_identity()
    entry = JournalEntry.query.filter_by(
        id=entry_id, 
        user_id=current_user_id
    ).first()
    
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404
    
    return jsonify(entry.to_dict())

@journal_bp.route('/journal/<int:entry_id>', methods=['PUT'])
@jwt_required()
def update_journal_entry(entry_id):
    """Update journal entry"""
    current_user_id = get_jwt_identity()
    entry = JournalEntry.query.filter_by(
        id=entry_id, 
        user_id=current_user_id
    ).first()
    
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Update fields
    if 'title' in data:
        entry.title = data['title']
    
    if 'content' in data:
        entry.content = data['content']
    
    if 'entry_date' in data:
        try:
            entry.entry_date = datetime.strptime(data['entry_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid entry_date format. Use YYYY-MM-DD'}), 400
    
    if 'is_private' in data:
        entry.is_private = data['is_private']
    
    if 'tags' in data:
        tags = data['tags']
        if isinstance(tags, list):
            entry.tags = json.dumps(tags)
        else:
            entry.tags = json.dumps([])
    
    entry.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(entry.to_dict())

@journal_bp.route('/journal/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_journal_entry(entry_id):
    """Delete journal entry"""
    current_user_id = get_jwt_identity()
    entry = JournalEntry.query.filter_by(
        id=entry_id, 
        user_id=current_user_id
    ).first()
    
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404
    
    db.session.delete(entry)
    db.session.commit()
    
    return '', 204

@journal_bp.route('/journal/<int:entry_id>/privacy', methods=['PUT'])
@jwt_required()
def toggle_journal_privacy(entry_id):
    """Toggle privacy setting of journal entry"""
    current_user_id = get_jwt_identity()
    entry = JournalEntry.query.filter_by(
        id=entry_id, 
        user_id=current_user_id
    ).first()
    
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404
    
    data = request.get_json()
    if 'is_private' not in data:
        return jsonify({'error': 'is_private field is required'}), 400
    
    entry.is_private = data['is_private']
    entry.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'id': entry.id,
        'is_private': entry.is_private,
        'message': 'Privacy setting updated'
    })

@journal_bp.route('/journal/today', methods=['GET'])
@jwt_required()
def get_today_entries():
    """Get today's journal entries"""
    current_user_id = get_jwt_identity()
    today = date.today()
    
    entries = JournalEntry.query.filter_by(
        user_id=current_user_id,
        entry_date=today
    ).order_by(JournalEntry.created_at.desc()).all()
    
    return jsonify([entry.to_dict() for entry in entries])

@journal_bp.route('/journal/stats', methods=['GET'])
@jwt_required()
def get_journal_stats():
    """Get journal statistics"""
    current_user_id = get_jwt_identity()
    
    # Get query parameters
    days = request.args.get('days', type=int, default=30)
    
    # Calculate date range
    end_date = date.today()
    start_date = date.fromordinal(end_date.toordinal() - days)
    
    # Get entries in date range
    entries = JournalEntry.query.filter(
        JournalEntry.user_id == current_user_id,
        JournalEntry.entry_date >= start_date,
        JournalEntry.entry_date <= end_date
    ).all()
    
    # Calculate statistics
    total_entries = len(entries)
    private_entries = sum(1 for entry in entries if entry.is_private)
    public_entries = total_entries - private_entries
    
    # Entries per day
    entries_by_date = {}
    for entry in entries:
        date_str = entry.entry_date.isoformat()
        if date_str not in entries_by_date:
            entries_by_date[date_str] = 0
        entries_by_date[date_str] += 1
    
    # Most common tags
    all_tags = []
    for entry in entries:
        if entry.tags:
            try:
                tags = json.loads(entry.tags)
                all_tags.extend(tags)
            except json.JSONDecodeError:
                continue
    
    tag_counts = {}
    for tag in all_tags:
        tag_counts[tag] = tag_counts.get(tag, 0) + 1
    
    # Sort tags by frequency
    popular_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    # Average entries per day
    avg_entries_per_day = round(total_entries / days, 1) if days > 0 else 0
    
    return jsonify({
        'total_entries': total_entries,
        'private_entries': private_entries,
        'public_entries': public_entries,
        'entries_by_date': entries_by_date,
        'popular_tags': [{'tag': tag, 'count': count} for tag, count in popular_tags],
        'average_entries_per_day': avg_entries_per_day,
        'date_range': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'days': days
        }
    })

@journal_bp.route('/journal/tags', methods=['GET'])
@jwt_required()
def get_all_tags():
    """Get all unique tags used by the user"""
    current_user_id = get_jwt_identity()
    
    entries = JournalEntry.query.filter_by(user_id=current_user_id).all()
    
    all_tags = set()
    for entry in entries:
        if entry.tags:
            try:
                tags = json.loads(entry.tags)
                all_tags.update(tags)
            except json.JSONDecodeError:
                continue
    
    return jsonify(sorted(list(all_tags)))

