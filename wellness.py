from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db, WellnessCategory, WellnessEntry
from datetime import datetime, date
import json

wellness_bp = Blueprint('wellness', __name__)

# Wellness Categories Routes
@wellness_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Get all wellness categories for current user"""
    current_user_id = get_jwt_identity()
    categories = WellnessCategory.query.filter_by(
        user_id=current_user_id, 
        is_active=True
    ).order_by(WellnessCategory.order_index).all()
    
    return jsonify([category.to_dict() for category in categories])

@wellness_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    """Create new wellness category"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Category name is required'}), 400
    
    # Get the next order index
    max_order = db.session.query(db.func.max(WellnessCategory.order_index)).filter_by(
        user_id=current_user_id
    ).scalar() or 0
    
    category = WellnessCategory(
        user_id=current_user_id,
        name=data['name'],
        color=data.get('color', '#A8B4A0'),
        icon=data.get('icon', 'default'),
        order_index=max_order + 1
    )
    
    db.session.add(category)
    db.session.commit()
    
    return jsonify(category.to_dict()), 201

@wellness_bp.route('/categories/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    """Update wellness category"""
    current_user_id = get_jwt_identity()
    category = WellnessCategory.query.filter_by(
        id=category_id, 
        user_id=current_user_id
    ).first()
    
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Update fields
    if 'name' in data:
        category.name = data['name']
    if 'color' in data:
        category.color = data['color']
    if 'icon' in data:
        category.icon = data['icon']
    if 'order_index' in data:
        category.order_index = data['order_index']
    
    db.session.commit()
    return jsonify(category.to_dict())

@wellness_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    """Delete wellness category (soft delete)"""
    current_user_id = get_jwt_identity()
    category = WellnessCategory.query.filter_by(
        id=category_id, 
        user_id=current_user_id
    ).first()
    
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    
    # Soft delete - mark as inactive
    category.is_active = False
    db.session.commit()
    
    return '', 204

# Wellness Entries Routes
@wellness_bp.route('/entries', methods=['GET'])
@jwt_required()
def get_entries():
    """Get wellness entries with optional filtering"""
    current_user_id = get_jwt_identity()
    
    # Get query parameters
    category_id = request.args.get('category_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    limit = request.args.get('limit', type=int, default=100)
    
    # Build query
    query = WellnessEntry.query.filter_by(user_id=current_user_id)
    
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    if start_date:
        try:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(WellnessEntry.entry_date >= start_date_obj)
        except ValueError:
            return jsonify({'error': 'Invalid start_date format. Use YYYY-MM-DD'}), 400
    
    if end_date:
        try:
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(WellnessEntry.entry_date <= end_date_obj)
        except ValueError:
            return jsonify({'error': 'Invalid end_date format. Use YYYY-MM-DD'}), 400
    
    entries = query.order_by(WellnessEntry.entry_date.desc()).limit(limit).all()
    
    return jsonify([entry.to_dict() for entry in entries])

@wellness_bp.route('/entries', methods=['POST'])
@jwt_required()
def create_entry():
    """Create or update wellness entry"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['category_id', 'score', 'entry_date']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Validate score
    score = data['score']
    if not isinstance(score, int) or score < 1 or score > 10:
        return jsonify({'error': 'Score must be an integer between 1 and 10'}), 400
    
    # Validate category belongs to user
    category = WellnessCategory.query.filter_by(
        id=data['category_id'], 
        user_id=current_user_id,
        is_active=True
    ).first()
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    
    # Parse entry date
    try:
        entry_date = datetime.strptime(data['entry_date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid entry_date format. Use YYYY-MM-DD'}), 400
    
    # Check if entry already exists for this date and category
    existing_entry = WellnessEntry.query.filter_by(
        user_id=current_user_id,
        category_id=data['category_id'],
        entry_date=entry_date
    ).first()
    
    if existing_entry:
        # Update existing entry
        existing_entry.score = score
        existing_entry.note = data.get('note', '')
        existing_entry.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify(existing_entry.to_dict())
    else:
        # Create new entry
        entry = WellnessEntry(
            user_id=current_user_id,
            category_id=data['category_id'],
            score=score,
            note=data.get('note', ''),
            entry_date=entry_date
        )
        db.session.add(entry)
        db.session.commit()
        return jsonify(entry.to_dict()), 201

@wellness_bp.route('/entries/<int:entry_id>', methods=['PUT'])
@jwt_required()
def update_entry(entry_id):
    """Update wellness entry"""
    current_user_id = get_jwt_identity()
    entry = WellnessEntry.query.filter_by(
        id=entry_id, 
        user_id=current_user_id
    ).first()
    
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Update fields
    if 'score' in data:
        score = data['score']
        if not isinstance(score, int) or score < 1 or score > 10:
            return jsonify({'error': 'Score must be an integer between 1 and 10'}), 400
        entry.score = score
    
    if 'note' in data:
        entry.note = data['note']
    
    entry.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(entry.to_dict())

@wellness_bp.route('/entries/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_entry(entry_id):
    """Delete wellness entry"""
    current_user_id = get_jwt_identity()
    entry = WellnessEntry.query.filter_by(
        id=entry_id, 
        user_id=current_user_id
    ).first()
    
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404
    
    db.session.delete(entry)
    db.session.commit()
    
    return '', 204

@wellness_bp.route('/entries/today', methods=['GET'])
@jwt_required()
def get_today_entries():
    """Get today's wellness entries for all categories"""
    current_user_id = get_jwt_identity()
    today = date.today()
    
    # Get all active categories
    categories = WellnessCategory.query.filter_by(
        user_id=current_user_id, 
        is_active=True
    ).order_by(WellnessCategory.order_index).all()
    
    # Get today's entries
    entries = WellnessEntry.query.filter_by(
        user_id=current_user_id,
        entry_date=today
    ).all()
    
    # Create a map of category_id to entry
    entry_map = {entry.category_id: entry for entry in entries}
    
    # Build response with categories and their entries
    result = []
    for category in categories:
        entry = entry_map.get(category.id)
        result.append({
            'category': category.to_dict(),
            'entry': entry.to_dict() if entry else None
        })
    
    return jsonify(result)

@wellness_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_wellness_stats():
    """Get wellness statistics for charts and progress tracking"""
    current_user_id = get_jwt_identity()
    
    # Get query parameters
    days = request.args.get('days', type=int, default=30)
    category_id = request.args.get('category_id', type=int)
    
    # Calculate date range
    end_date = date.today()
    start_date = date.fromordinal(end_date.toordinal() - days)
    
    # Build query
    query = WellnessEntry.query.filter(
        WellnessEntry.user_id == current_user_id,
        WellnessEntry.entry_date >= start_date,
        WellnessEntry.entry_date <= end_date
    )
    
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    entries = query.order_by(WellnessEntry.entry_date).all()
    
    # Group entries by category and date
    stats = {}
    for entry in entries:
        cat_id = entry.category_id
        entry_date = entry.entry_date.isoformat()
        
        if cat_id not in stats:
            stats[cat_id] = {
                'category_id': cat_id,
                'category_name': entry.category.name,
                'entries': [],
                'average_score': 0,
                'trend': 'stable'
            }
        
        stats[cat_id]['entries'].append({
            'date': entry_date,
            'score': entry.score,
            'note': entry.note
        })
    
    # Calculate averages and trends
    for cat_id, cat_stats in stats.items():
        scores = [entry['score'] for entry in cat_stats['entries']]
        if scores:
            cat_stats['average_score'] = round(sum(scores) / len(scores), 1)
            
            # Simple trend calculation (compare first half vs second half)
            if len(scores) >= 4:
                mid_point = len(scores) // 2
                first_half_avg = sum(scores[:mid_point]) / mid_point
                second_half_avg = sum(scores[mid_point:]) / (len(scores) - mid_point)
                
                if second_half_avg > first_half_avg + 0.5:
                    cat_stats['trend'] = 'improving'
                elif second_half_avg < first_half_avg - 0.5:
                    cat_stats['trend'] = 'declining'
                else:
                    cat_stats['trend'] = 'stable'
    
    return jsonify(list(stats.values()))

