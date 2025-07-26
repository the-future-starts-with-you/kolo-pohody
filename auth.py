from flask import Blueprint, jsonify, request, redirect, url_for, session
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from authlib.integrations.flask_client import OAuth
from src.models.user import User, db
import os
import requests

auth_bp = Blueprint('auth', __name__)

# OAuth configuration
oauth = OAuth()

# Google OAuth
google = oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID', 'demo_client_id'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET', 'demo_client_secret'),
    server_metadata_url='https://accounts.google.com/.well-known/openid_configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# Microsoft OAuth
microsoft = oauth.register(
    name='microsoft',
    client_id=os.getenv('MICROSOFT_CLIENT_ID', 'demo_client_id'),
    client_secret=os.getenv('MICROSOFT_CLIENT_SECRET', 'demo_client_secret'),
    tenant_id=os.getenv('MICROSOFT_TENANT_ID', 'common'),
    authorize_url='https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    access_token_url='https://login.microsoftonline.com/common/oauth2/v2.0/token',
    client_kwargs={'scope': 'openid email profile'}
)

# Apple OAuth (simplified - would need proper Apple Sign In implementation)
apple = oauth.register(
    name='apple',
    client_id=os.getenv('APPLE_CLIENT_ID', 'demo_client_id'),
    client_secret=os.getenv('APPLE_CLIENT_SECRET', 'demo_client_secret'),
    authorize_url='https://appleid.apple.com/auth/authorize',
    access_token_url='https://appleid.apple.com/auth/token',
    client_kwargs={'scope': 'name email'}
)

@auth_bp.route('/login/<provider>', methods=['GET'])
def login(provider):
    """Initiate OAuth login with specified provider"""
    if provider == 'google':
        redirect_uri = url_for('auth.callback', provider='google', _external=True)
        return google.authorize_redirect(redirect_uri)
    elif provider == 'microsoft':
        redirect_uri = url_for('auth.callback', provider='microsoft', _external=True)
        return microsoft.authorize_redirect(redirect_uri)
    elif provider == 'apple':
        redirect_uri = url_for('auth.callback', provider='apple', _external=True)
        return apple.authorize_redirect(redirect_uri)
    else:
        return jsonify({'error': 'Unsupported provider'}), 400

@auth_bp.route('/callback/<provider>')
def callback(provider):
    """Handle OAuth callback and create/login user"""
    try:
        if provider == 'google':
            token = google.authorize_access_token()
            user_info = token.get('userinfo')
            if user_info:
                email = user_info['email']
                name = user_info['name']
                provider_id = user_info['sub']
                avatar_url = user_info.get('picture')
            else:
                return jsonify({'error': 'Failed to get user info from Google'}), 400
                
        elif provider == 'microsoft':
            token = microsoft.authorize_access_token()
            # Get user info from Microsoft Graph API
            resp = requests.get(
                'https://graph.microsoft.com/v1.0/me',
                headers={'Authorization': f'Bearer {token["access_token"]}'}
            )
            if resp.status_code == 200:
                user_info = resp.json()
                email = user_info.get('mail') or user_info.get('userPrincipalName')
                name = user_info.get('displayName')
                provider_id = user_info.get('id')
                avatar_url = None  # Microsoft Graph doesn't provide avatar URL directly
            else:
                return jsonify({'error': 'Failed to get user info from Microsoft'}), 400
                
        elif provider == 'apple':
            token = apple.authorize_access_token()
            # Apple Sign In implementation would be more complex
            # For demo purposes, we'll use mock data
            email = 'demo@apple.com'
            name = 'Apple User'
            provider_id = 'apple_demo_id'
            avatar_url = None
        else:
            return jsonify({'error': 'Unsupported provider'}), 400

        # Find or create user
        user = User.query.filter_by(email=email, provider=provider).first()
        if not user:
            user = User(
                email=email,
                name=name,
                provider=provider,
                provider_id=provider_id,
                avatar_url=avatar_url
            )
            db.session.add(user)
            db.session.commit()
            
            # Create default wellness categories for new users
            create_default_categories(user.id)

        # Create JWT tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        # In a real app, you'd redirect to frontend with tokens
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    current_user_id = get_jwt_identity()
    new_token = create_access_token(identity=current_user_id)
    return jsonify({'access_token': new_token})

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (in a real app, you'd blacklist the token)"""
    return jsonify({'message': 'Successfully logged out'})

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if user:
        return jsonify(user.to_dict())
    return jsonify({'error': 'User not found'}), 404

def create_default_categories(user_id):
    """Create default wellness categories for new users"""
    from src.models.user import WellnessCategory
    
    default_categories = [
        {'name': 'Tělo', 'color': '#A8B4A0', 'icon': 'body', 'order_index': 0},
        {'name': 'Mysl', 'color': '#8C7B6F', 'icon': 'mind', 'order_index': 1},
        {'name': 'Vztahy', 'color': '#C8A89A', 'icon': 'relationships', 'order_index': 2},
        {'name': 'Inspirace', 'color': '#6B7F6B', 'icon': 'inspiration', 'order_index': 3},
        {'name': 'Práce', 'color': '#5A6A70', 'icon': 'work', 'order_index': 4},
        {'name': 'Zábava', 'color': '#E0E0D8', 'icon': 'fun', 'order_index': 5},
    ]
    
    for cat_data in default_categories:
        category = WellnessCategory(
            user_id=user_id,
            **cat_data
        )
        db.session.add(category)
    
    db.session.commit()

# Demo login endpoint for testing without OAuth
@auth_bp.route('/demo-login', methods=['POST'])
def demo_login():
    """Demo login for testing purposes"""
    data = request.get_json()
    email = data.get('email', 'demo@example.com')
    name = data.get('name', 'Demo User')
    
    # Find or create demo user
    user = User.query.filter_by(email=email, provider='demo').first()
    if not user:
        user = User(
            email=email,
            name=name,
            provider='demo',
            provider_id='demo_id',
            avatar_url=None
        )
        db.session.add(user)
        db.session.commit()
        
        # Create default categories
        create_default_categories(user.id)

    # Create JWT tokens
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    })

