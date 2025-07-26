import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from src.models.user import db
from src.routes.user import user_bp
from src.routes.auth import auth_bp, oauth
from src.routes.wellness import wellness_bp
from src.routes.journal import journal_bp
from src.routes.inspiration import inspiration_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-string')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # For demo purposes

# Enable CORS for all routes
CORS(app, origins="*")

# Initialize JWT
jwt = JWTManager(app)

# Initialize OAuth
oauth.init_app(app)

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(wellness_bp, url_prefix='/api')
app.register_blueprint(journal_bp, url_prefix='/api')
app.register_blueprint(inspiration_bp, url_prefix='/api/inspiration')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Create tables
with app.app_context():
    db.create_all()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

# Health check endpoint
@app.route('/health')
def health_check():
    return {'status': 'healthy', 'message': 'Kolo Pohody API is running'}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
