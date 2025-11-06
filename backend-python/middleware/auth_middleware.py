from functools import wraps
from flask import request, jsonify
import jwt
import os
import logging

logger = logging.getLogger(__name__)

def verify_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(
            token,
            os.getenv('JWT_SECRET'),
            algorithms=['HS256']
        )
        return payload
    except jwt.ExpiredSignatureError:
        return {'error': 'Token expired. Please login again.'}
    except jwt.InvalidTokenError:
        return {'error': 'Invalid token. Please login again.'}

def auth_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get token from header
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            logger.warning('❌ No token provided')
            return jsonify({
                'success': False,
                'message': 'No token provided. Please login first.'
            }), 401
        
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        
        # Verify token
        payload = verify_token(token)
        
        if 'error' in payload:
            logger.warning(f'❌ Token error: {payload["error"]}')
            return jsonify({
                'success': False,
                'message': payload['error']
            }), 401
        
        # Attach user info to request
        request.user = payload
        
        return f(*args, **kwargs)
    
    return decorated_function

def citizen_required(f):
    """Decorator to require citizen role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(request, 'user') or request.user.get('role') != 'citizen':
            return jsonify({
                'success': False,
                'message': 'Access denied. Citizens only.'
            }), 403
        return f(*args, **kwargs)
    return decorated_function

def official_required(f):
    """Decorator to require official role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(request, 'user') or request.user.get('role') not in ['official', 'higherofficial']:
            return jsonify({
                'success': False,
                'message': 'Access denied. Officials only.'
            }), 403
        return f(*args, **kwargs)
    return decorated_function
