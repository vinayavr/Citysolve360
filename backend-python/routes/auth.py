from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import jwt
import bcrypt
import logging
import os
from config.database import db
from utils.validators import validate_all, ValidationError


logger = logging.getLogger(__name__)
auth_bp = Blueprint('auth', __name__)


def hash_password(password):
    """Hash password using bcrypt"""
    try:
        salt = bcrypt.gensalt(rounds=10)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    except Exception as e:
        logger.error(f'Password hashing error: {str(e)}')
        return None


def verify_password(plain_password, hashed_password):
    """Verify password against hash"""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception as e:
        logger.error(f'Password verification error: {str(e)}')
        return False


def generate_token(user_id, role, citizen_id=None):
    """Generate JWT token"""
    try:
        payload = {
            'userId': user_id,
            'role': role,
            'citizenId': citizen_id,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(days=7)
        }
        token = jwt.encode(
            payload,
            os.getenv('JWT_SECRET'),
            algorithm='HS256'
        )
        return token
    except Exception as e:
        logger.error(f'Token generation error: {str(e)}')
        return None


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
        return {'error': 'Token expired'}
    except jwt.InvalidTokenError:
        return {'error': 'Invalid token'}


# ============================================================================
# REGISTER ENDPOINT
# ============================================================================
@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new citizen"""
    
    try:
        logger.info('=' * 60)
        logger.info('📍 [REGISTER] Request received')
        logger.info('=' * 60)
        
        data = request.get_json()
        
        # Extract fields
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        phone = data.get('phone', '').strip()
        address = data.get('address', '').strip()
        
        logger.info(f'📍 [REGISTER] Input: name={name[:20]}..., email={email}')
        
        # Validate fields
        logger.info('📍 [REGISTER] Validating fields...')
        errors = validate_all(email, password, name, phone, address)
        
        if errors:
            logger.warning(f'❌ [REGISTER] Validation failed: {errors}')
            return jsonify({
                'success': False,
                'message': 'Validation failed',
                'errors': errors
            }), 400
        
        logger.info('✅ [REGISTER] Validation passed')
        
        # Check if email exists
        logger.info(f'📍 [REGISTER] Checking if email exists: {email}')
        existing_user = db.fetch_one(
            'SELECT id FROM users WHERE email = %s',
            (email,)
        )
        
        if existing_user:
            logger.warning(f'❌ [REGISTER] Email already exists: {email}')
            return jsonify({
                'success': False,
                'message': 'Email already registered. Please login or use a different email.'
            }), 400
        
        logger.info('✅ [REGISTER] Email is unique')
        
        # Hash password
        logger.info('📍 [REGISTER] Hashing password...')
        hashed_password = hash_password(password)
        
        if not hashed_password:
            logger.error('❌ [REGISTER] Password hashing failed')
            return jsonify({
                'success': False,
                'message': 'Error processing password'
            }), 500
        
        logger.info('✅ [REGISTER] Password hashed')
        
        # Step 1: Insert into users table
        logger.info('📍 [REGISTER] Step 1: Inserting into users table...')
        user_result = db.execute_query(
            '''INSERT INTO users (name, email, password, role)
               VALUES (%s, %s, %s, %s)''',
            (name, email, hashed_password, 'citizen')
        )
        
        if not user_result:
            logger.error('❌ [REGISTER] Users table insert failed')
            return jsonify({
                'success': False,
                'message': 'Error creating user account'
            }), 500
        
        user_id = user_result['last_id']
        logger.info(f'✅ [REGISTER] User created in users table: ID={user_id}')
        
        # Step 2: Insert into citizens table with phone and address
        logger.info('📍 [REGISTER] Step 2: Inserting into citizens table...')
        citizen_result = db.execute_query(
            '''INSERT INTO citizens (user_id, phone, address)
               VALUES (%s, %s, %s)''',
            (user_id, phone, address)
        )
        
        if not citizen_result:
            logger.error('❌ [REGISTER] Citizens table insert failed')
            # Rollback: delete from users if citizen creation fails
            db.execute_query('DELETE FROM users WHERE id = %s', (user_id,))
            return jsonify({
                'success': False,
                'message': 'Error creating citizen profile'
            }), 500
        
        citizen_id = citizen_result['last_id']
        logger.info(f'✅ [REGISTER] Citizen created in citizens table: ID={citizen_id}')
        
        # Step 3: Generate token
        logger.info('📍 [REGISTER] Step 3: Generating JWT token...')
        token = generate_token(user_id, 'citizen', citizen_id)
        
        if not token:
            logger.error('❌ [REGISTER] Token generation failed')
            return jsonify({
                'success': False,
                'message': 'Error generating authentication token'
            }), 500
        
        logger.info('=' * 60)
        logger.info('✅ [REGISTER] REGISTRATION SUCCESSFUL')
        logger.info('=' * 60)
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'token': token,
            'user': {
                'userId': user_id,
                'name': name,
                'email': email,
                'phone': phone,
                'address': address,
                'role': 'citizen',
                'citizenId': citizen_id,
                'redirect': '/citizen/dashboard'  # ADD THIS
            }
        }), 201
    
    except Exception as e:
        logger.error('=' * 60)
        logger.error(f'❌ [REGISTER] ERROR: {str(e)}')
        logger.error('=' * 60)
        import traceback
        logger.error(traceback.format_exc())
        
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500


# ============================================================================
# LOGIN ENDPOINT
# ============================================================================


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    
    try:
        logger.info('=' * 60)
        logger.info('📍 [LOGIN] Request received')
        logger.info('=' * 60)
        
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        logger.info(f'📍 [LOGIN] Login attempt with email: {email}')
        
        # Validate inputs
        if not email or not password:
            logger.warning('❌ [LOGIN] Email or password missing')
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400
        
        # Find user
        logger.info(f'📍 [LOGIN] Searching for user: {email}')
        user = db.fetch_one(
            'SELECT id, name, email, password, role FROM users WHERE email = %s',
            (email,)
        )
        
        if not user:
            logger.warning(f'❌ [LOGIN] User not found: {email}')
            return jsonify({
                'success': False,
                'message': 'Email not registered. Please sign up first.'
            }), 401
        
        logger.info(f'✅ [LOGIN] User found: {email}')
        
        # Verify password
        logger.info('📍 [LOGIN] Verifying password...')
        if not verify_password(password, user['password']):
            logger.warning(f'❌ [LOGIN] Invalid password for user: {email}')
            return jsonify({
                'success': False,
                'message': 'Incorrect password. Please try again.'
            }), 401
        
        logger.info(f'✅ [LOGIN] Password verified successfully')
        
        # Get citizen details (including phone and address)
        citizen_id = None
        phone = None
        address = None
        redirect_path = None  # ADD THIS
        
        if user['role'] == 'citizen':
            logger.info(f'📍 [LOGIN] Fetching citizen details for user: {user["id"]}')
            citizen = db.fetch_one(
                'SELECT id, phone, address FROM citizens WHERE user_id = %s',
                (user['id'],)
            )
            
            if not citizen:
                logger.warning(f'❌ [LOGIN] Citizen data not found for user: {email}')
                return jsonify({
                    'success': False,
                    'message': 'Citizen profile not found. Contact support.'
                }), 500
            
            citizen_id = citizen['id']
            phone = citizen['phone']
            address = citizen['address']
            redirect_path = '/citizen/dashboard'  # ADD THIS
            logger.info(f'✅ [LOGIN] Citizen found with ID: {citizen_id}')
        
        # HANDLE OFFICIAL LOGIN
        elif user['role'] == 'official':
            logger.info(f'📍 [LOGIN] Fetching official details for user: {user["id"]}')
            official = db.fetch_one(
                '''SELECT o.id, o.issue_category_id, ic.name as category_name
                FROM officials o
                JOIN issue_categories ic ON o.issue_category_id = ic.id
                WHERE o.user_id = %s''',
                (user['id'],)
            )
            
            if not official:
                logger.warning(f'❌ [LOGIN] Official profile not found for user: {email}')
                return jsonify({
                    'success': False,
                    'message': 'Official profile not found. Contact support.'
                }), 500
            
            redirect_path = '/official/dashboard'  # ADD THIS
            logger.info(f'✅ [LOGIN] Official found with category: {official["category_name"]}')
        
        # HANDLE HIGHER OFFICIAL LOGIN
        elif user['role'] in ['higher_official', 'higherofficial']:
            logger.info(f'📍 [LOGIN] HigherOfficial user: {user["id"]}')
            redirect_path = '/higher-official/dashboard'  # ADD THIS
            logger.info(f'✅ [LOGIN] HigherOfficial authenticated')
        
        # Generate token
        logger.info('📍 [LOGIN] Generating JWT token...')
        token = generate_token(user['id'], user['role'], citizen_id)
        
        if not token:
            logger.error('❌ [LOGIN] Failed to generate token')
            return jsonify({
                'success': False,
                'message': 'Error generating authentication token'
            }), 500
        
        logger.info(f'✅ [LOGIN] JWT token generated successfully')
        logger.info('=' * 60)
        logger.info(f'✅ [LOGIN] LOGIN SUCCESSFUL for: {email} (Role: {user["role"]})')
        logger.info('=' * 60)
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token': token,
            'user': {
                'userId': user['id'],
                'name': user['name'],
                'email': user['email'],
                'phone': phone,
                'address': address,
                'role': user['role'],
                'citizenId': citizen_id,
                'redirect': redirect_path  # ADD THIS - IMPORTANT
            }
        }), 200
    
    except Exception as e:
        logger.error('=' * 60)
        logger.error(f'❌ [LOGIN] UNEXPECTED ERROR: {str(e)}')
        logger.error('=' * 60)
        import traceback
        logger.error(traceback.format_exc())
        
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500


# ============================================================================
# GET PROFILE ENDPOINT
# ============================================================================


@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    """
    Get user profile
    GET /api/auth/profile
    
    Headers:
    Authorization: Bearer <token>
    
    Response:
    {
        "success": true,
        "user": {
            "userId": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "role": "citizen"
        }
    }
    """
    
    try:
        logger.info('📍 [PROFILE] Request received')
        
        # Get token from header
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            logger.warning('❌ [PROFILE] No token provided')
            return jsonify({
                'success': False,
                'message': 'No token provided. Please login first.'
            }), 401
        
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        logger.info('📍 [PROFILE] Verifying token...')
        
        # Verify token
        payload = verify_token(token)
        
        if 'error' in payload:
            logger.warning(f'❌ [PROFILE] Token error: {payload["error"]}')
            return jsonify({
                'success': False,
                'message': payload['error']
            }), 401
        
        user_id = payload.get('userId')
        logger.info(f'✅ [PROFILE] Token verified for user: {user_id}')
        
        # Fetch user
        logger.info(f'📍 [PROFILE] Fetching user {user_id} details...')
        user = db.fetch_one(
            'SELECT id, name, email, phone, address, role FROM users WHERE id = %s',
            (user_id,)
        )
        
        if not user:
            logger.warning(f'❌ [PROFILE] User not found: {user_id}')
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        logger.info(f'✅ [PROFILE] User profile retrieved')
        
        return jsonify({
            'success': True,
            'message': 'Profile retrieved successfully',
            'user': user
        }), 200
    
    except Exception as e:
        logger.error(f'❌ [PROFILE] Error: {str(e)}')
        import traceback
        logger.error(traceback.format_exc())
        
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500
