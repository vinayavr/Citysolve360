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
        
        # Get user role from database
        user = db.fetch_one('SELECT role FROM users WHERE id = %s', (user_id,))
        if not user:
            logger.warning(f'❌ [GET_ISSUE] User not found: {user_id}')
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        user_role = user['role']
        logger.info(f'📍 [GET_ISSUE] User role: {user_role}')
        
        # Get issue with citizen info
        logger.info(f'📍 [GET_ISSUE] Fetching issue data for ID: {issue_id}')
        issue = db.fetch_one(
            '''SELECT i.id, i.citizen_id, i.category, i.description, i.status, 
            i.created_at, i.updated_at, c.user_id as citizen_user_id
            FROM issues i
            LEFT JOIN citizens c ON i.citizen_id = c.id
            WHERE i.id = %s''',
            (issue_id,)
        )
        
        if not issue:
            logger.warning(f'❌ [GET_ISSUE] Issue not found: {issue_id}')
            return jsonify({'success': False, 'message': 'Issue not found'}), 404
        
        logger.info(f'✅ [GET_ISSUE] Issue found: {issue_id}')
        
        # Authorization check based on role
        if user_role == 'citizen':
            # Citizens can only view their own issues
            if issue['citizen_user_id'] != user_id:
                logger.warning(f'❌ [GET_ISSUE] Unauthorized citizen access to issue {issue_id} by user {user_id}')
                return jsonify({'success': False, 'message': 'Unauthorized access'}), 403
            logger.info(f'✅ [GET_ISSUE] Citizen authorized for own issue {issue_id}')
            
        elif user_role == 'official':
            # Officials can view issues in their assigned categories
            official_categories = db.fetch_all(
                '''SELECT ic.name FROM officials o
                JOIN issue_categories ic ON o.issue_category_id = ic.id
                WHERE o.user_id = %s''',
                (user_id,)
            )
            
            category_names = [cat['name'] for cat in official_categories]
            if issue['category'] not in category_names:
                logger.warning(f'❌ [GET_ISSUE] Official {user_id} cannot access issue {issue_id} (category mismatch)')
                return jsonify({'success': False, 'message': 'Unauthorized access'}), 403
            logger.info(f'✅ [GET_ISSUE] Official authorized for issue {issue_id}')
            
        elif user_role in ['higher_official', 'higherofficial']:
            # Higher officials can view all issues
            logger.info(f'✅ [GET_ISSUE] HigherOfficial authorized to view all issues')
            
        else:
            logger.warning(f'❌ [GET_ISSUE] Unknown user role: {user_role}')
            return jsonify({'success': False, 'message': 'Unauthorized access'}), 403
        
        # Get attachments
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
        else:
            logger.info(f'📍 [GET_ISSUE] No attachments found for issue {issue_id}')
            attachments = []
        
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

# ============= NEW ENDPOINTS FOR OFFICIAL WORKFLOW =============

@issues_bp.route('/<int:issue_id>/comment', methods=['POST'])
@token_required
def add_comment(issue_id):
    """Add a comment with optional attachments and status update"""
    try:
        logger.info('=' * 60)
        logger.info(f'📍 [ADD_COMMENT] Request for issue {issue_id}')
        logger.info('=' * 60)
        
        user_id = request.user_id
        comment_text = request.form.get('comment', '').strip()
        new_status = request.form.get('status', '').strip()
        
        logger.info(f'📍 [ADD_COMMENT] User {user_id}, status: {new_status}, comment length: {len(comment_text)}')
        
        # Validate comment (optional but if provided, should be valid)
        if len(comment_text) > 5000:
            logger.warning('❌ [ADD_COMMENT] Comment exceeds 5000 characters')
            return jsonify({'success': False, 'message': 'Comment too long (max 5000 chars)'}), 400
        
        # Validate status is one of the allowed values
        valid_statuses = ['in_progress', 'rejected', 'completed']
        if new_status not in valid_statuses:
            logger.warning(f'❌ [ADD_COMMENT] Invalid status: {new_status}')
            return jsonify({'success': False, 'message': f'Invalid status. Must be one of: {valid_statuses}'}), 400
        
        # Verify issue exists
        issue = db.fetch_one('SELECT id FROM issues WHERE id = %s', (issue_id,))
        if not issue:
            logger.warning(f'❌ [ADD_COMMENT] Issue not found: {issue_id}')
            return jsonify({'success': False, 'message': 'Issue not found'}), 404
        
        logger.info(f'✅ [ADD_COMMENT] Issue verified: {issue_id}')
        
        # Insert comment if provided
        comment_id = None
        if comment_text:
            logger.info('📍 [ADD_COMMENT] Inserting comment...')
            try:
                result = db.execute_query(
                    '''INSERT INTO comments (issue_id, user_id, comment_text, created_at, updated_at)
                    VALUES (%s, %s, %s, NOW(), NOW())''',
                    (issue_id, user_id, comment_text)
                )
                comment_id = result.get('last_id', None)
                logger.info(f'✅ [ADD_COMMENT] Comment added with ID: {comment_id}')
            except Exception as db_error:
                logger.error(f'❌ [ADD_COMMENT] Database error: {db_error}')
                return jsonify({'success': False, 'message': f'Error adding comment: {str(db_error)}'}), 500
        
        # Update issue status
        logger.info(f'📍 [ADD_COMMENT] Updating status to: {new_status}')
        try:
            db.execute_query(
                '''UPDATE issues 
                SET status = %s, updated_at = NOW()
                WHERE id = %s''',
                (new_status, issue_id)
            )
            logger.info(f'✅ [ADD_COMMENT] Status updated to: {new_status}')
        except Exception as db_error:
            logger.error(f'❌ [ADD_COMMENT] Failed to update status: {db_error}')
            return jsonify({'success': False, 'message': f'Error updating status: {str(db_error)}'}), 500
        
        # Handle attachments if provided
        logger.info('📍 [ADD_COMMENT] Processing attachments...')
        attachment_count = 0
        if 'attachments' in request.files:
            files = request.files.getlist('attachments')
            logger.info(f'📍 [ADD_COMMENT] Processing {len(files)} files')
            
            for file in files:
                if file and file.filename:
                    try:
                        file_data = file.read()
                        mimetype = file.content_type or 'application/octet-stream'
                        
                        db.execute_query(
                            '''INSERT INTO attachments (issue_id, comment_id, filename, mimetype, data)
                            VALUES (%s, %s, %s, %s, %s)''',
                            (issue_id, comment_id, file.filename, mimetype, file_data)
                        )
                        attachment_count += 1
                        logger.info(f'✅ [ADD_COMMENT] Attachment saved: {file.filename}')
                    except Exception as file_error:
                        logger.error(f'❌ [ADD_COMMENT] Error saving attachment: {file_error}')
        
        logger.info('=' * 60)
        logger.info('✅ [ADD_COMMENT] SUCCESS')
        logger.info('=' * 60)
        
        return jsonify({
            'success': True,
            'message': f'Status updated to {new_status.replace("_", " ")}. Comment and attachments saved.',
            'data': {
                'issue_id': issue_id,
                'status': new_status,
                'comment_id': comment_id,
                'attachments_saved': attachment_count
            }
        }), 201
        
    except Exception as error:
        logger.error('=' * 60)
        logger.error(f'❌ [ADD_COMMENT] ERROR: {error}')
        logger.error('=' * 60)
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': 'Error processing request', 'error': str(error)}), 500


@issues_bp.route('/<int:issue_id>/comments', methods=['GET'])
@token_required
def get_comments(issue_id):
    """Get all comments for an issue"""
    try:
        logger.info(f'📍 [GET_COMMENTS] Fetching comments for issue {issue_id}')
        
        # Verify issue exists
        issue = db.fetch_one('SELECT id FROM issues WHERE id = %s', (issue_id,))
        if not issue:
            logger.warning(f'❌ [GET_COMMENTS] Issue not found: {issue_id}')
            return jsonify({'success': False, 'message': 'Issue not found'}), 404
        
        comments = db.fetch_all(
            '''SELECT c.id, c.user_id, u.name, u.role, c.comment_text, c.created_at
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.issue_id = %s
            ORDER BY c.created_at ASC''',
            (issue_id,)
        )
        
        if not comments:
            logger.info(f'📍 [GET_COMMENTS] No comments found for issue {issue_id}')
            comments = []
        else:
            logger.info(f'✅ [GET_COMMENTS] Found {len(comments)} comments')
        
        return jsonify({
            'success': True,
            'data': comments,
            'count': len(comments)
        }), 200
        
    except Exception as error:
        logger.error(f'❌ [GET_COMMENTS] ERROR: {error}')
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': 'Error fetching comments', 'error': str(error)}), 500


@issues_bp.route('/<int:issue_id>/status', methods=['PUT'])
@token_required
def update_issue_status(issue_id):
    """Update issue status (officials only) - LEGACY, use add_comment instead"""
    try:
        logger.info('=' * 60)
        logger.info(f'📍 [UPDATE_STATUS] Request for issue {issue_id}')
        logger.info('=' * 60)
        
        user_id = request.user_id
        data = request.get_json()
        new_status = data.get('status', '').strip()
        
        logger.info(f'📍 [UPDATE_STATUS] User {user_id}, new status: {new_status}')
        
        # Validate status
        valid_statuses = ['created', 'in_progress', 'escalated', 'rejected', 'completed']
        if new_status not in valid_statuses:
            logger.warning(f'❌ [UPDATE_STATUS] Invalid status: {new_status}')
            return jsonify({'success': False, 'message': f'Invalid status. Must be one of: {valid_statuses}'}), 400
        
        # Get user role
        user = db.fetch_one('SELECT role FROM users WHERE id = %s', (user_id,))
        if user['role'] not in ['official', 'higher_official']:
            logger.warning(f'❌ [UPDATE_STATUS] Unauthorized: user role is {user["role"]}')
            return jsonify({'success': False, 'message': 'Only officials can update status'}), 403
        
        logger.info(f'✅ [UPDATE_STATUS] User authorized (role: {user["role"]})')
        
        # Verify issue exists
        issue = db.fetch_one('SELECT id FROM issues WHERE id = %s', (issue_id,))
        if not issue:
            logger.warning(f'❌ [UPDATE_STATUS] Issue not found: {issue_id}')
            return jsonify({'success': False, 'message': 'Issue not found'}), 404
        
        # Update status
        logger.info('📍 [UPDATE_STATUS] Updating issue status...')
        result = db.execute_query(
            '''UPDATE issues 
            SET status = %s, updated_at = NOW()
            WHERE id = %s''',
            (new_status, issue_id)
        )
        
        if not result:
            logger.error('❌ [UPDATE_STATUS] Failed to update status')
            return jsonify({'success': False, 'message': 'Error updating status'}), 500
        
        logger.info(f'✅ [UPDATE_STATUS] Status updated to: {new_status}')
        
        logger.info('=' * 60)
        logger.info('✅ [UPDATE_STATUS] SUCCESS')
        logger.info('=' * 60)
        
        from datetime import datetime
        return jsonify({
            'success': True,
            'message': f'Status updated to {new_status}',
            'data': {
                'id': issue_id,
                'status': new_status,
                'updated_at': datetime.now().isoformat()
            }
        }), 200
        
    except Exception as error:
        logger.error('=' * 60)
        logger.error(f'❌ [UPDATE_STATUS] ERROR: {error}')
        logger.error('=' * 60)
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': 'Error updating status', 'error': str(error)}), 500

@issues_bp.route('/<int:issue_id>/escalate-category', methods=['PUT'])
@token_required
def escalate_category(issue_id):
    """Escalate issue based on category escalation timelines"""
    try:
        logger.info('=' * 60)
        logger.info(f'📍 [CATEGORY_ESCALATE] Issue {issue_id}')
        logger.info('=' * 60)
        
        user_id = request.user_id
        data = request.get_json()
        reason = data.get('reason', '').strip()
        note = data.get('note', '').strip()
        
        # Validate inputs
        if not reason or not note or len(note) < 10:
            return jsonify({'success': False, 'message': 'Reason and note (min 10 chars) required'}), 400
        
        # Get issue with category info
        issue = db.fetch_one(
            '''SELECT i.id, i.citizen_id, i.category, i.status, i.created_at,
                      ic.priority, ic.can_escalate_after_hours, ic.expected_resolution_hours
            FROM issues i
            LEFT JOIN issue_categories ic ON i.category = ic.name
            WHERE i.id = %s''',
            (issue_id,)
        )
        
        if not issue:
            return jsonify({'success': False, 'message': 'Issue not found'}), 404
        
        # Verify citizen owns this issue
        citizen = db.fetch_one('SELECT user_id FROM citizens WHERE id = %s', (issue['citizen_id'],))
        if not citizen or citizen['user_id'] != user_id:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
        # Check status
        if issue['status'] != 'created':
            return jsonify({
                'success': False,
                'message': f'Only created issues can be escalated. Current: {issue["status"]}'
            }), 400
        
        # Calculate hours since creation
        from datetime import datetime
        hours_old = (datetime.now() - issue['created_at']).total_seconds() / 3600
        can_escalate_after = issue['can_escalate_after_hours'] or 72
        
        # Check if enough time passed
        if hours_old < can_escalate_after:
            hours_remaining = can_escalate_after - hours_old
            return jsonify({
                'success': False,
                'message': f'Please wait {int(hours_remaining)} more hours before escalating',
                'data': {
                    'hours_required': can_escalate_after,
                    'hours_remaining': round(hours_remaining, 1)
                }
            }), 400
        
        # Update status
        db.execute_query(
            'UPDATE issues SET status = %s, updated_at = NOW() WHERE id = %s',
            ('escalated', issue_id)
        )
        
        # Add comment
        db.execute_query(
            '''INSERT INTO comments (issue_id, user_id, comment_text, created_at)
            VALUES (%s, %s, %s, NOW())''',
            (issue_id, user_id, f'[CATEGORY ESCALATION - {issue["priority"].upper()}]\nReason: {reason}\n\nDetails: {note}')
        )
        
        logger.info('✅ [CATEGORY_ESCALATE] SUCCESS')
        
        return jsonify({
            'success': True,
            'message': f'Escalated to {issue["priority"].upper()} priority. Expected: {issue["expected_resolution_hours"]}h',
            'data': {
                'id': issue_id,
                'status': 'escalated',
                'priority': issue['priority']
            }
        }), 200
        
    except Exception as error:
        logger.error(f'❌ [CATEGORY_ESCALATE] ERROR: {error}')
        return jsonify({'success': False, 'message': 'Error escalating'}), 500

@issues_bp.route('/<int:issue_id>/escalate', methods=['PUT'])
@token_required
def escalate_issue(issue_id):
    """Escalate issue to higher authority"""
    try:
        logger.info('=' * 60)
        logger.info(f'📍 [ESCALATE] Issue {issue_id}')
        logger.info('=' * 60)
        
        user_id = request.user_id
        data = request.get_json()
        reason = data.get('reason', '').strip()
        note = data.get('note', '').strip()
        
        logger.info(f'📍 [ESCALATE] User {user_id}, reason: {reason}')
        
        # Validate
        if not reason or not note or len(note) < 10:
            logger.warning('❌ [ESCALATE] Invalid input')
            return jsonify({'success': False, 'message': 'Reason and note (min 10 chars) required'}), 400
        
        # Get issue
        issue = db.fetch_one(
            'SELECT id, citizen_id, status FROM issues WHERE id = %s',
            (issue_id,)
        )
        if not issue:
            logger.warning(f'❌ [ESCALATE] Issue not found: {issue_id}')
            return jsonify({'success': False, 'message': 'Issue not found'}), 404
        
        # Verify citizen owns issue
        citizen = db.fetch_one('SELECT user_id FROM citizens WHERE id = %s', (issue['citizen_id'],))
        if not citizen or citizen['user_id'] != user_id:
            logger.warning(f'❌ [ESCALATE] Unauthorized user {user_id}')
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
        # Check status
        if issue['status'] not in ['created', 'in_progress']:
            logger.warning(f'❌ [ESCALATE] Cannot escalate status: {issue["status"]}')
            return jsonify({'success': False, 'message': f'Cannot escalate {issue["status"]} issues'}), 400
        
        # Update to escalated
        logger.info('📍 [ESCALATE] Updating status to escalated...')
        db.execute_query(
            'UPDATE issues SET status = %s, updated_at = NOW() WHERE id = %s',
            ('escalated', issue_id)
        )
        
        # Add comment
        logger.info('📍 [ESCALATE] Adding escalation comment...')
        db.execute_query(
            'INSERT INTO comments (issue_id, user_id, comment_text, created_at) VALUES (%s, %s, %s, NOW())',
            (issue_id, user_id, f'[ESCALATION]\nReason: {reason}\n\nDetails: {note}')
        )
        
        logger.info('=' * 60)
        logger.info('✅ [ESCALATE] SUCCESS')
        logger.info('=' * 60)
        
        return jsonify({
            'success': True,
            'message': 'Issue escalated successfully',
            'data': {'id': issue_id, 'status': 'escalated'}
        }), 200
        
    except Exception as error:
        logger.error('=' * 60)
        logger.error(f'❌ [ESCALATE] ERROR: {error}')
        logger.error('=' * 60)
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': 'Error escalating'}), 500
