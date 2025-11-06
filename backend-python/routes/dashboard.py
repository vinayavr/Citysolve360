from flask import Blueprint, request, jsonify
from functools import wraps
from config.database import db
import jwt
import os
import logging

logger = logging.getLogger(__name__)

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this')

def token_required(f):
    """Decorator to verify JWT token from Authorization header"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            logger.warning('❌ [TOKEN_REQUIRED] No token provided')
            return jsonify({'success': False, 'message': 'Token is missing'}), 401
        
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        try:
            logger.info('📍 [TOKEN_REQUIRED] Verifying token...')
            # Decode using same secret as auth.py
            data = jwt.decode(token, os.getenv('JWT_SECRET'), algorithms=['HS256'])
            request.user_id = data.get('userId')  # Use userId (capital U)
            if not request.user_id:
                logger.warning('❌ [TOKEN_REQUIRED] userId not found in token')
                return jsonify({'success': False, 'message': 'Invalid token'}), 401
            logger.info(f'✅ [TOKEN_REQUIRED] Token verified for user: {request.user_id}')
        except jwt.ExpiredSignatureError:
            logger.warning('❌ [TOKEN_REQUIRED] Token has expired')
            return jsonify({'success': False, 'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            logger.warning('❌ [TOKEN_REQUIRED] Invalid token')
            return jsonify({'success': False, 'message': 'Invalid token'}), 401
        except Exception as e:
            logger.error(f'❌ [TOKEN_REQUIRED] Token validation error: {e}')
            return jsonify({'success': False, 'message': 'Token validation failed'}), 401
        
        return f(*args, **kwargs)
    return decorated

@dashboard_bp.route('/citizen/issues', methods=['GET'])
@token_required
def citizen_dashboard():
    """Get all issues for citizen dashboard"""
    try:
        logger.info('📍 [CITIZEN_DASHBOARD] Request received')
        user_id = request.user_id
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        offset = (page - 1) * limit
        status_filter = request.args.get('status', '')
        
        # Get citizen_id
        citizen = db.fetch_one('SELECT id FROM citizens WHERE user_id = %s', (user_id,))
        if not citizen:
            logger.warning(f'❌ [CITIZEN_DASHBOARD] Citizen not found for user {user_id}')
            return jsonify({'success': False, 'message': 'Citizen profile not found'}), 404
        
        citizen_id = citizen['id']
        logger.info(f'✅ [CITIZEN_DASHBOARD] Citizen ID: {citizen_id}')
        
        # Get issues with optional filter
        if status_filter:
            issues = db.fetch_all(
                '''SELECT id, category, description, status, created_at, updated_at
                FROM issues
                WHERE citizen_id = %s AND status = %s
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s''',
                (citizen_id, status_filter, limit, offset)
            )
            total_result = db.fetch_one(
                'SELECT COUNT(*) as total FROM issues WHERE citizen_id = %s AND status = %s',
                (citizen_id, status_filter)
            )
        else:
            issues = db.fetch_all(
                '''SELECT id, category, description, status, created_at, updated_at
                FROM issues
                WHERE citizen_id = %s
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s''',
                (citizen_id, limit, offset)
            )
            total_result = db.fetch_one('SELECT COUNT(*) as total FROM issues WHERE citizen_id = %s', (citizen_id,))
        
        total_count = total_result['total'] if total_result else 0
        logger.info(f'✅ [CITIZEN_DASHBOARD] Found {len(issues)} issues')
        
        return jsonify({
            'success': True,
            'data': issues,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'pages': (total_count + limit - 1) // limit
            }
        }), 200
        
    except Exception as error:
        logger.error(f'❌ [CITIZEN_DASHBOARD] Error: {error}')
        return jsonify({'success': False, 'message': 'Error fetching dashboard data', 'error': str(error)}), 500


@dashboard_bp.route('/citizen/statistics', methods=['GET'])
@token_required
def citizen_statistics():
    """Get statistics for citizen dashboard"""
    try:
        logger.info('📍 [CITIZEN_STATISTICS] Request received')
        user_id = request.user_id
        
        # Get citizen_id
        citizen = db.fetch_one('SELECT id FROM citizens WHERE user_id = %s', (user_id,))
        if not citizen:
            logger.warning(f'❌ [CITIZEN_STATISTICS] Citizen not found for user {user_id}')
            return jsonify({'success': False, 'message': 'Citizen profile not found'}), 404
        
        citizen_id = citizen['id']
        
        # Get statistics
        stats = db.fetch_all(
            '''SELECT status, COUNT(*) as count
            FROM issues
            WHERE citizen_id = %s
            GROUP BY status''',
            (citizen_id,)
        )
        
        total_result = db.fetch_one('SELECT COUNT(*) as total FROM issues WHERE citizen_id = %s', (citizen_id,))
        total_issues = total_result['total'] if total_result else 0
        
        # Format statistics
        statistics = {
            'total': total_issues,
            'created': 0,
            'in_progress': 0,
            'escalated': 0,
            'rejected': 0,
            'completed': 0
        }
        
        for stat in stats:
            status_key = stat['status'].replace(' ', '_')
            statistics[status_key] = stat['count']
        
        logger.info(f'✅ [CITIZEN_STATISTICS] Statistics retrieved')
        
        return jsonify({'success': True, 'data': statistics}), 200
        
    except Exception as error:
        logger.error(f'❌ [CITIZEN_STATISTICS] Error: {error}')
        return jsonify({'success': False, 'message': 'Error fetching statistics', 'error': str(error)}), 500


@dashboard_bp.route('/official/issues', methods=['GET'])
@token_required
def official_dashboard():
    """Get issues for official's department"""
    try:
        logger.info('📍 [OFFICIAL_DASHBOARD] Request received')
        user_id = request.user_id
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        offset = (page - 1) * limit
        
        # Get official and department
        official = db.fetch_one('SELECT id, department FROM officials WHERE user_id = %s', (user_id,))
        if not official:
            logger.warning(f'❌ [OFFICIAL_DASHBOARD] Official not found for user {user_id}')
            return jsonify({'success': False, 'message': 'Official profile not found'}), 404
        
        department = official['department']
        logger.info(f'✅ [OFFICIAL_DASHBOARD] Department: {department}')
        
        # Get issues for this department (excluding escalated)
        issues = db.fetch_all(
            '''SELECT id, category, description, status, created_at, updated_at, citizen_id
            FROM issues
            WHERE category = %s AND status != 'escalated'
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s''',
            (department, limit, offset)
        )
        
        total_result = db.fetch_one(
            'SELECT COUNT(*) as total FROM issues WHERE category = %s AND status != %s',
            (department, 'escalated')
        )
        total_count = total_result['total'] if total_result else 0
        
        logger.info(f'✅ [OFFICIAL_DASHBOARD] Found {len(issues)} issues')
        
        return jsonify({
            'success': True,
            'data': issues,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'pages': (total_count + limit - 1) // limit
            }
        }), 200
        
    except Exception as error:
        logger.error(f'❌ [OFFICIAL_DASHBOARD] Error: {error}')
        return jsonify({'success': False, 'message': 'Error fetching dashboard data', 'error': str(error)}), 500


@dashboard_bp.route('/higher-official/issues', methods=['GET'])
@token_required
def higher_official_dashboard():
    """Get escalated issues for higher official"""
    try:
        logger.info('📍 [HIGHER_OFFICIAL_DASHBOARD] Request received')
        user_id = request.user_id
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        offset = (page - 1) * limit
        
        # Get higher official and department
        official = db.fetch_one('SELECT id, department FROM officials WHERE user_id = %s AND reports_to IS NULL', (user_id,))
        if not official:
            logger.warning(f'❌ [HIGHER_OFFICIAL_DASHBOARD] Higher official not found for user {user_id}')
            return jsonify({'success': False, 'message': 'Higher official profile not found'}), 404
        
        department = official['department']
        logger.info(f'✅ [HIGHER_OFFICIAL_DASHBOARD] Department: {department}')
        
        # Get escalated issues for this department
        issues = db.fetch_all(
            '''SELECT id, category, description, status, created_at, updated_at, citizen_id
            FROM issues
            WHERE category = %s AND status = 'escalated'
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s''',
            (department, limit, offset)
        )
        
        total_result = db.fetch_one(
            'SELECT COUNT(*) as total FROM issues WHERE category = %s AND status = %s',
            (department, 'escalated')
        )
        total_count = total_result['total'] if total_result else 0
        
        logger.info(f'✅ [HIGHER_OFFICIAL_DASHBOARD] Found {len(issues)} escalated issues')
        
        return jsonify({
            'success': True,
            'data': issues,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'pages': (total_count + limit - 1) // limit
            }
        }), 200
        
    except Exception as error:
        logger.error(f'❌ [HIGHER_OFFICIAL_DASHBOARD] Error: {error}')
        return jsonify({'success': False, 'message': 'Error fetching dashboard data', 'error': str(error)}), 500
