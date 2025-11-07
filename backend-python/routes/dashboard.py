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
            'in progress': 0,
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
def get_official_issues():
    """Get issues assigned to official's category"""
    try:
        logger.info('=' * 60)
        logger.info('📍 [OFFICIAL_DASHBOARD] Request received')
        logger.info('=' * 60)
        
        user_id = request.user_id
        
        # Get all official categories for this user
        logger.info(f'📍 [OFFICIAL_DASHBOARD] Getting official categories for user {user_id}')
        official_categories = db.fetch_all(
            '''SELECT o.id, o.issue_category_id, ic.name as category_name
            FROM officials o
            JOIN issue_categories ic ON o.issue_category_id = ic.id
            WHERE o.user_id = %s''',
            (user_id,)
        )
        
        if not official_categories:
            logger.warning(f'❌ [OFFICIAL_DASHBOARD] No official profile found for user {user_id}')
            return jsonify({'success': False, 'message': 'Official profile not found'}), 404
        
        logger.info(f'✅ [OFFICIAL_DASHBOARD] Official found with {len(official_categories)} categories')
        
        # Get all category names this official handles
        category_names = [cat['category_name'] for cat in official_categories]
        
        # Get all issues in these categories
        logger.info(f'📍 [OFFICIAL_DASHBOARD] Fetching issues for categories: {category_names}')
        placeholders = ','.join(['%s'] * len(category_names))
        issues = db.fetch_all(
            f'''SELECT i.id, i.citizen_id, i.category, i.description, i.status, i.created_at, i.updated_at
            FROM issues i
            WHERE i.category IN ({placeholders})
            ORDER BY i.created_at DESC''',
            tuple(category_names)
        )
        
        if not issues:
            logger.info(f'📍 [OFFICIAL_DASHBOARD] No issues found for categories')
            issues = []
        else:
            logger.info(f'✅ [OFFICIAL_DASHBOARD] Found {len(issues)} issues')
        
        logger.info('=' * 60)
        logger.info('✅ [OFFICIAL_DASHBOARD] SUCCESS')
        logger.info('=' * 60)
        
        return jsonify({
            'success': True,
            'data': issues,
            'categories': category_names,
            'count': len(issues)
        }), 200
        
    except Exception as error:
        logger.error('=' * 60)
        logger.error(f'❌ [OFFICIAL_DASHBOARD] ERROR: {error}')
        logger.error('=' * 60)
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': 'Error fetching issues', 'error': str(error)}), 500


@dashboard_bp.route('/higher-official/issues', methods=['GET'])
@token_required
def get_higher_official_issues():
    """Get all issues for higher official (with escalation focus)"""
    try:
        logger.info('=' * 60)
        logger.info('📍 [HIGHER_OFFICIAL_DASHBOARD] Request received')
        logger.info('=' * 60)
        
        user_id = request.user_id
        
        # Verify user is higher_official
        user = db.fetch_one('SELECT role FROM users WHERE id = %s', (user_id,))
        
        if user['role'] != 'higherofficial':
            logger.warning(f'❌ [HIGHER_OFFICIAL_DASHBOARD] Unauthorized: user {user_id} is {user["role"]}')
            return jsonify({'success': False, 'message': 'Only higher officials can access this'}), 403
        
        logger.info(f'✅ [HIGHER_OFFICIAL_DASHBOARD] User authorized')
        
        # Get ALL issues (higher official sees everything)
        issues = db.fetch_all(
            '''SELECT i.id, i.citizen_id, i.category, i.description, i.status,
                      i.created_at, i.updated_at
            FROM issues i
            WHERE i.status NOT IN ('completed', 'rejected')
            ORDER BY 
              CASE i.status
                WHEN 'escalated' THEN 0
                WHEN 'in progress' THEN 1
                WHEN 'created' THEN 2
              END,
              i.created_at DESC'''
        )
        
        if not issues:
            logger.info('📍 [HIGHER_OFFICIAL_DASHBOARD] No issues found')
            issues = []
        else:
            logger.info(f'✅ [HIGHER_OFFICIAL_DASHBOARD] Found {len(issues)} issues')
        
        logger.info('=' * 60)
        logger.info('✅ [HIGHER_OFFICIAL_DASHBOARD] SUCCESS')
        logger.info('=' * 60)
        
        return jsonify({
            'success': True,
            'data': issues,
            'count': len(issues)
        }), 200
        
    except Exception as error:
        logger.error('=' * 60)
        logger.error(f'❌ [HIGHER_OFFICIAL_DASHBOARD] ERROR: {error}')
        logger.error('=' * 60)
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': 'Error fetching issues', 'error': str(error)}), 500
