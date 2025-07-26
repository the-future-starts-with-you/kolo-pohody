from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db, AIInspiration, User
from datetime import datetime, timedelta
import openai
import os
import random

inspiration_bp = Blueprint('inspiration', __name__)

# Wellness-themed prompts for different categories
INSPIRATION_PROMPTS = {
    'daily_quote': [
        "Generate an inspiring wellness quote about mindfulness and self-care in Czech language. Keep it short and meaningful.",
        "Create a motivational quote about finding balance in life in Czech. Make it uplifting and practical.",
        "Generate a peaceful quote about gratitude and appreciation in Czech language. Focus on daily joy.",
        "Create an inspiring quote about personal growth and wellness in Czech. Make it encouraging.",
        "Generate a calming quote about inner peace and mindfulness in Czech language."
    ],
    'wellness_tip': [
        "Provide a practical wellness tip for improving daily well-being in Czech language. Keep it actionable and simple.",
        "Share a mindfulness technique that can be done in 5 minutes in Czech. Make it easy to follow.",
        "Give advice on how to create a peaceful morning routine in Czech language. Be specific and helpful.",
        "Suggest a simple way to reduce stress during a busy day in Czech. Make it practical.",
        "Provide a tip for better sleep hygiene in Czech language. Keep it actionable."
    ],
    'reflection_prompt': [
        "Create a thoughtful reflection question about personal growth in Czech language. Make it introspective.",
        "Generate a journaling prompt about gratitude and appreciation in Czech. Make it meaningful.",
        "Suggest a self-reflection question about life balance in Czech language. Make it thought-provoking.",
        "Create a prompt for evening reflection about the day's positive moments in Czech.",
        "Generate a question that encourages mindful thinking about personal values in Czech language."
    ],
    'affirmation': [
        "Create a positive affirmation about self-worth and confidence in Czech language. Make it empowering.",
        "Generate an affirmation about inner strength and resilience in Czech. Keep it uplifting.",
        "Create a self-love affirmation in Czech language. Make it warm and encouraging.",
        "Generate an affirmation about embracing change and growth in Czech. Make it inspiring.",
        "Create a calming affirmation about peace and serenity in Czech language."
    ]
}

@inspiration_bp.route('/daily', methods=['GET'])
@jwt_required()
def get_daily_inspiration():
    """Get daily inspiration for the current user"""
    try:
        user_id = get_jwt_identity()
        today = datetime.now().date()
        
        # Check if user already has inspiration for today
        existing_inspiration = AIInspiration.query.filter_by(
            user_id=user_id,
            created_date=today
        ).first()
        
        if existing_inspiration:
            return jsonify({
                'id': existing_inspiration.id,
                'type': existing_inspiration.inspiration_type,
                'content': existing_inspiration.content,
                'created_date': existing_inspiration.created_date.isoformat(),
                'is_cached': True
            })
        
        # Generate new inspiration
        inspiration_type = random.choice(['daily_quote', 'wellness_tip', 'reflection_prompt', 'affirmation'])
        content = generate_ai_inspiration(inspiration_type)
        
        # Save to database
        new_inspiration = AIInspiration(
            user_id=user_id,
            inspiration_type=inspiration_type,
            content=content,
            created_date=today
        )
        
        db.session.add(new_inspiration)
        db.session.commit()
        
        return jsonify({
            'id': new_inspiration.id,
            'type': new_inspiration.inspiration_type,
            'content': new_inspiration.content,
            'created_date': new_inspiration.created_date.isoformat(),
            'is_cached': False
        })
        
    except Exception as e:
        print(f"Error getting daily inspiration: {e}")
        return jsonify({'error': 'Failed to get daily inspiration'}), 500

@inspiration_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_inspiration():
    """Generate new inspiration based on type"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        inspiration_type = data.get('type', 'daily_quote')
        
        if inspiration_type not in INSPIRATION_PROMPTS:
            return jsonify({'error': 'Invalid inspiration type'}), 400
        
        content = generate_ai_inspiration(inspiration_type)
        
        # Save to database
        new_inspiration = AIInspiration(
            user_id=user_id,
            inspiration_type=inspiration_type,
            content=content,
            created_date=datetime.now().date()
        )
        
        db.session.add(new_inspiration)
        db.session.commit()
        
        return jsonify({
            'id': new_inspiration.id,
            'type': new_inspiration.inspiration_type,
            'content': new_inspiration.content,
            'created_date': new_inspiration.created_date.isoformat()
        })
        
    except Exception as e:
        print(f"Error generating inspiration: {e}")
        return jsonify({'error': 'Failed to generate inspiration'}), 500

@inspiration_bp.route('/history', methods=['GET'])
@jwt_required()
def get_inspiration_history():
    """Get user's inspiration history"""
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 20, type=int)
        
        inspirations = AIInspiration.query.filter_by(user_id=user_id)\
            .order_by(AIInspiration.created_date.desc())\
            .limit(limit)\
            .all()
        
        return jsonify([{
            'id': insp.id,
            'type': insp.inspiration_type,
            'content': insp.content,
            'created_date': insp.created_date.isoformat()
        } for insp in inspirations])
        
    except Exception as e:
        print(f"Error getting inspiration history: {e}")
        return jsonify({'error': 'Failed to get inspiration history'}), 500

@inspiration_bp.route('/<int:inspiration_id>', methods=['DELETE'])
@jwt_required()
def delete_inspiration(inspiration_id):
    """Delete an inspiration"""
    try:
        user_id = get_jwt_identity()
        
        inspiration = AIInspiration.query.filter_by(
            id=inspiration_id,
            user_id=user_id
        ).first()
        
        if not inspiration:
            return jsonify({'error': 'Inspiration not found'}), 404
        
        db.session.delete(inspiration)
        db.session.commit()
        
        return jsonify({'message': 'Inspiration deleted successfully'})
        
    except Exception as e:
        print(f"Error deleting inspiration: {e}")
        return jsonify({'error': 'Failed to delete inspiration'}), 500

def generate_ai_inspiration(inspiration_type):
    """Generate AI inspiration using OpenAI"""
    try:
        # Get random prompt for the type
        prompts = INSPIRATION_PROMPTS.get(inspiration_type, INSPIRATION_PROMPTS['daily_quote'])
        prompt = random.choice(prompts)
        
        # Use OpenAI to generate content
        client = openai.OpenAI(
            api_key=os.getenv('OPENAI_API_KEY'),
            base_url=os.getenv('OPENAI_API_BASE')
        )
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system", 
                    "content": "You are a wellness coach and mindfulness expert. Generate content in Czech language that is warm, encouraging, and practical. Keep responses concise and meaningful."
                },
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.8
        )
        
        content = response.choices[0].message.content.strip()
        
        # Remove quotes if present
        if content.startswith('"') and content.endswith('"'):
            content = content[1:-1]
        
        return content
        
    except Exception as e:
        print(f"Error generating AI content: {e}")
        # Fallback to predefined content
        return get_fallback_inspiration(inspiration_type)

def get_fallback_inspiration(inspiration_type):
    """Fallback inspiration content when AI is not available"""
    fallbacks = {
        'daily_quote': [
            "Každý den je nová příležitost k růstu a objevování radosti v malých věcech.",
            "Klid v srdci je největší poklad, který si můžeme dát.",
            "Vděčnost proměňuje to, co máme, v dostatek.",
            "Malé kroky vedou k velkým změnám. Buďte trpěliví sami se sebou.",
            "Dnes je dobrý den na to, abychom byli laskaví k sobě i ostatním."
        ],
        'wellness_tip': [
            "Začněte den třemi hlubokými nádechy a nastavte si pozitivní záměr.",
            "Udělejte si 5minutovou pauzu a věnujte se pouze svému dechu.",
            "Zapište si tři věci, za které jste dnes vděční.",
            "Protáhněte se a uvědomte si, jak se vaše tělo cítí.",
            "Vypněte telefon na hodinu a věnujte se něčemu, co vás těší."
        ],
        'reflection_prompt': [
            "Co mi dnes přineslo největší radost?",
            "Jak jsem dnes projevil laskavost k sobě nebo ostatním?",
            "Za co jsem dnes nejvíce vděčný?",
            "Jaký malý úspěch jsem dnes dosáhl?",
            "Co bych chtěl zítra udělat jinak nebo lépe?"
        ],
        'affirmation': [
            "Jsem hoden lásky a respektu, včetně toho od sebe sama.",
            "Mám v sobě sílu překonat jakékoli výzvy, které přijdou.",
            "Každý den rostou a učím se něco nového o sobě.",
            "Zasloužím si klid, radost a naplnění ve svém životě.",
            "Jsem přesně tam, kde mám být na své cestě."
        ]
    }
    
    options = fallbacks.get(inspiration_type, fallbacks['daily_quote'])
    return random.choice(options)

