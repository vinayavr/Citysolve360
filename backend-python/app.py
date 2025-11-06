import os
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configure CORS
cors_origin = os.getenv('CORS_ORIGIN', 'http://localhost:3000')
logger.info(f'📍 CORS enabled for: {cors_origin}')

CORS(app, resources={
    r"/api/*": {
        "origins": cors_origin,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Import database
from config.database import db

# Import blueprints
from routes.auth import auth_bp
from routes.issues import issues_bp
from routes.dashboard import dashboard_bp

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(issues_bp, url_prefix='/api/issues') 
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health():
    logger.info('📍 Health check request')
    return jsonify({
        'success': True,
        'status': 'OK',
        'message': 'Python Flask Server is running',
        'timestamp': datetime.now().isoformat()
    }), 200

# 404 handler
@app.errorhandler(404)
def not_found(error):
    logger.warning(f'404 Error: Route not found - {request.path}')
    return jsonify({
        'success': False,
        'message': f'Route {request.path} not found'
    }), 404

# 500 handler
@app.errorhandler(500)
def server_error(error):
    logger.error(f'500 Error: {str(error)}')
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    logger.info(f'=' * 60)
    logger.info(f'🚀 Flask server starting on port {port}')
    logger.info(f'🌐 CORS origin: {cors_origin}')
    logger.info(f'=' * 60)
    app.run(debug=True, port=port, host='0.0.0.0')
