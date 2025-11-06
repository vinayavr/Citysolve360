from flask import Blueprint, request, jsonify
from datetime import datetime
from functools import wraps
from config.database import db
import jwt
import os
import logging

logger = logging.getLogger(__name__)

issues_bp = Blueprint('issues', __name__, url_prefix='/api/issues')

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


@issues_bp.route('/categories', methods=['GET'])
@token_required
def get_categories():
    """Fetch all issue categories"""
    try:
        logger.info('📍 [GET_CATEGORIES] Request received')
        categories = db.fetch_all('SELECT id, name FROM issue_categories ORDER BY name ASC')
        logger.info(f'✅ [GET_CATEGORIES] Found {len(categories)} categories')
        return jsonify({'success': True, 'data': categories}), 200
    except Exception as error:
        logger.error(f'❌ [GET_CATEGORIES] Error: {error}')
        return jsonify({'success': False, 'message': 'Error fetching categories', 'error': str(error)}), 500


@issues_bp.route('/create', methods=['POST'])
@token_required
def create_issue():
    """Create a new issue"""
    try:
        logger.info('=' * 60)
        logger.info('📍 [CREATE_ISSUE] Request received')
        logger.info('=' * 60)
        
        user_id = request.user_id
        description = request.form.get('description', '').strip()
        category_id = request.form.get('category_id')
        files = request.files.getlist('attachments')
        
        logger.info(f'📍 [CREATE_ISSUE] user_id={user_id}, category_id={category_id}')
        
        # Validation
        if not description:
            logger.warning('❌ [CREATE_ISSUE] Description is required')
            return jsonify({'success': False, 'message': 'Description is required'}), 400
        
        if len(description) > 2000:
            logger.warning('❌ [CREATE_ISSUE] Description exceeds 2000 characters')
            return jsonify({'success': False, 'message': 'Description cannot exceed 2000 characters'}), 400
        
        if not category_id:
            logger.warning('❌ [CREATE_ISSUE] Category is required')
            return jsonify({'success': False, 'message': 'Category is required'}), 400
        
        # Get citizen_id
        logger.info('📍 [CREATE_ISSUE] Getting citizen_id...')
        citizen = db.fetch_one('SELECT id FROM citizens WHERE user_id = %s', (user_id,))
        if not citizen:
            logger.warning(f'❌ [CREATE_ISSUE] Citizen profile not found for user {user_id}')
            return jsonify({'success': False, 'message': 'Citizen profile not found'}), 404
        
        citizen_id = citizen['id']
        logger.info(f'✅ [CREATE_ISSUE] Citizen ID: {citizen_id}')
        
        # Get category name
        logger.info('📍 [CREATE_ISSUE] Getting category name...')
        category = db.fetch_one('SELECT name FROM issue_categories WHERE id = %s', (category_id,))
        if not category:
            logger.warning(f'❌ [CREATE_ISSUE] Invalid category: {category_id}')
            return jsonify({'success': False, 'message': 'Invalid category selected'}), 400
        
        category_name = category['name']
        logger.info(f'✅ [CREATE_ISSUE] Category: {category_name}')
        
        # Create issue
        logger.info('📍 [CREATE_ISSUE] Creating issue in database...')
        result = db.execute_query(
            '''INSERT INTO issues 
            (citizen_id, category, description, status, created_by, updated_by, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())''',
            (citizen_id, category_name, description, 'created', user_id, user_id)
        )
        
        if not result:
            logger.error('❌ [CREATE_ISSUE] Failed to create issue')
            return jsonify({'success': False, 'message': 'Error creating issue'}), 500
        
        issue_id = result['last_id']
        logger.info(f'✅ [CREATE_ISSUE] Issue created with ID: {issue_id}')
        
        # Handle attachments
        if files:
            logger.info(f'📍 [CREATE_ISSUE] Processing {len(files)} attachments...')
            for file in files:
                if file.filename:
                    try:
                        file_content = file.read()
                        file_type = file.content_type
                        file_name = file.filename
                        
                        db.execute_query(
                            '''INSERT INTO attachments 
                            (issue_id, filename, mimetype, data)
                            VALUES (%s, %s, %s, %s)''',
                            (issue_id, file_name, file_type, file_content)
                        )
                        logger.info(f'✅ [CREATE_ISSUE] Attachment uploaded: {file_name}')
                    except Exception as file_error:
                        logger.warning(f'⚠️  [CREATE_ISSUE] Error uploading {file_name}: {file_error}')
        
        logger.info('=' * 60)
        logger.info('✅ [CREATE_ISSUE] SUCCESS')
        logger.info('=' * 60)
        
        return jsonify({
            'success': True,
            'message': 'Issue created successfully',
            'data': {
                'id': issue_id,
                'citizen_id': citizen_id,
                'category': category_name,
                'description': description,
                'status': 'created',
                'created_at': datetime.now().isoformat()
            }
        }), 201
        
    except Exception as error:
        logger.error('=' * 60)
        logger.error(f'❌ [CREATE_ISSUE] ERROR: {error}')
        logger.error('=' * 60)
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': 'Error creating issue', 'error': str(error)}), 500


@issues_bp.route('/my-issues', methods=['GET'])
@token_required
def get_my_issues():
    """Get all issues for citizen"""
    try:
        logger.info('📍 [GET_MY_ISSUES] Request received')
        user_id = request.user_id
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        offset = (page - 1) * limit
        
        # Get citizen_id
        citizen = db.fetch_one('SELECT id FROM citizens WHERE user_id = %s', (user_id,))
        if not citizen:
            logger.warning(f'❌ [GET_MY_ISSUES] Citizen not found for user {user_id}')
            return jsonify({'success': False, 'message': 'Citizen profile not found'}), 404
        
        citizen_id = citizen['id']
        
        # Get issues
        issues = db.fetch_all(
            '''SELECT id, category, description, status, created_at, updated_at
            FROM issues
            WHERE citizen_id = %s
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s''',
            (citizen_id, limit, offset)
        )
        
        # Get total count
        total_result = db.fetch_one('SELECT COUNT(*) as total FROM issues WHERE citizen_id = %s', (citizen_id,))
        total_count = total_result['total'] if total_result else 0
        
        logger.info(f'✅ [GET_MY_ISSUES] Found {len(issues)} issues for citizen {citizen_id}')
        
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
        logger.error(f'❌ [GET_MY_ISSUES] Error: {error}')
        return jsonify({'success': False, 'message': 'Error fetching issues', 'error': str(error)}), 500

@issues_bp.route('/<int:issue_id>', methods=['GET'])
@token_required
def get_issue_details(issue_id):
    """Get issue details with attachments"""
    try:
        logger.info('=' * 60)
        logger.info(f'📍 [GET_ISSUE] Request for issue {issue_id}')
        logger.info('=' * 60)
        
        user_id = request.user_id
        
        # Get issue with citizen info
        logger.info(f'📍 [GET_ISSUE] Fetching issue data for ID: {issue_id}')
        issue = db.fetch_one(
            '''SELECT i.id, i.citizen_id, i.category, i.description, i.status, 
            i.created_at, i.updated_at, c.user_id
            FROM issues i
            JOIN citizens c ON i.citizen_id = c.id
            WHERE i.id = %s''',
            (issue_id,)
        )
        
        if not issue:
            logger.warning(f'❌ [GET_ISSUE] Issue not found: {issue_id}')
            return jsonify({'success': False, 'message': 'Issue not found'}), 404
        
        logger.info(f'✅ [GET_ISSUE] Issue found: {issue_id}')
        
        # Check ownership
        if issue['user_id'] != user_id:
            logger.warning(f'❌ [GET_ISSUE] Unauthorized access to issue {issue_id} by user {user_id}')
            return jsonify({'success': False, 'message': 'Unauthorized access'}), 403
        
        logger.info(f'✅ [GET_ISSUE] User authorized for issue {issue_id}')
        
        # Get attachments - Fixed query without uploaded_at
        logger.info(f'📍 [GET_ISSUE] Fetching attachments for issue {issue_id}')
        attachments = db.fetch_all(
            '''SELECT id, filename, mimetype
            FROM attachments
            WHERE issue_id = %s AND comment_id IS NULL
            ORDER BY id ASC''',
            (issue_id,)
        )
        
        if attachments:
            logger.info(f'✅ [GET_ISSUE] Found {len(attachments)} attachments for issue {issue_id}')
            for att in attachments:
                logger.info(f'  - {att["filename"]} ({att["mimetype"]})')
        else:
            logger.info(f'📍 [GET_ISSUE] No attachments found for issue {issue_id}')
        
        logger.info('=' * 60)
        logger.info(f'✅ [GET_ISSUE] SUCCESS - Issue {issue_id} retrieved')
        logger.info('=' * 60)
        
        return jsonify({
            'success': True,
            'data': {
                'id': issue['id'],
                'citizen_id': issue['citizen_id'],
                'category': issue['category'],
                'description': issue['description'],
                'status': issue['status'],
                'created_at': issue['created_at'].isoformat() if issue['created_at'] else None,
                'updated_at': issue['updated_at'].isoformat() if issue['updated_at'] else None,
                'attachments': attachments if attachments else []
            }
        }), 200
        
    except Exception as error:
        logger.error('=' * 60)
        logger.error(f'❌ [GET_ISSUE] ERROR: {error}')
        logger.error('=' * 60)
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': 'Error fetching issue', 'error': str(error)}), 500

@issues_bp.route('/attachment/<int:attachment_id>', methods=['GET'])
@token_required
def download_attachment(attachment_id):
    """Download attachment file"""
    try:
        logger.info(f'📍 [DOWNLOAD_ATTACHMENT] Request for attachment {attachment_id}')
        user_id = request.user_id
        
        # Get attachment
        attachment = db.fetch_one(
            'SELECT id, filename, mimetype, data, issue_id FROM attachments WHERE id = %s',
            (attachment_id,)
        )
        
        if not attachment:
            logger.warning(f'❌ [DOWNLOAD_ATTACHMENT] Attachment not found: {attachment_id}')
            return jsonify({'success': False, 'message': 'Attachment not found'}), 404
        
        # Verify user owns this issue
        issue = db.fetch_one(
            'SELECT i.id, c.user_id FROM issues i JOIN citizens c ON i.citizen_id = c.id WHERE i.id = %s',
            (attachment['issue_id'],)
        )
        
        if not issue or issue['user_id'] != user_id:
            logger.warning(f'❌ [DOWNLOAD_ATTACHMENT] Unauthorized access to attachment {attachment_id}')
            return jsonify({'success': False, 'message': 'Unauthorized access'}), 403
        
        logger.info(f'✅ [DOWNLOAD_ATTACHMENT] Sending file: {attachment["filename"]}')
        
        # Return file as attachment
        from flask import send_file
        from io import BytesIO
        
        return send_file(
            BytesIO(attachment['data']),
            mimetype=attachment['mimetype'],
            as_attachment=True,
            download_name=attachment['filename']
        )
        
    except Exception as error:
        logger.error(f'❌ [DOWNLOAD_ATTACHMENT] ERROR: {error}')
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': 'Error downloading attachment', 'error': str(error)}), 500
