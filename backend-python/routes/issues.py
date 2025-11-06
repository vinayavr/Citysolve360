from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
from config.database import db
from middleware.auth_middleware import auth_required, citizen_required, official_required
from utils.validators import (
    validate_issue_title, 
    validate_issue_description, 
    validate_priority,
    validate_status,
    ValidationError
)

logger = logging.getLogger(__name__)
issues_bp = Blueprint('issues', __name__)

# ============================================================================
# GET CATEGORIES
# ============================================================================

@issues_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all issue categories"""
    try:
        logger.info('📍 [CATEGORIES] Fetching issue categories')
        
        categories = db.fetch_all(
            'SELECT id, name, description FROM issue_categories WHERE active = 1 ORDER BY name'
        )
        
        logger.info(f'✅ [CATEGORIES] Fetched {len(categories)} categories')
        
        return jsonify({
            'success': True,
            'message': 'Categories retrieved successfully',
            'data': categories
        }), 200
    
    except Exception as e:
        logger.error(f'❌ [CATEGORIES] Error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Error fetching categories'
        }), 500

# ============================================================================
# CREATE ISSUE
# ============================================================================

@issues_bp.route('/', methods=['POST'])
@auth_required
@citizen_required
def create_issue():
    """Create a new issue (citizen only)"""
    try:
        logger.info('=' * 60)
        logger.info(f'📍 [CREATE ISSUE] Request from user: {request.user["userId"]}')
        
        data = request.get_json()
        
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        category_id = data.get('category_id')
        priority = data.get('priority', 'medium').lower()
        
        logger.info(f'📍 [CREATE ISSUE] Title: {title[:50]}...')
        
        # Validate
        errors = []
        try:
            validate_issue_title(title)
        except ValidationError as e:
            errors.append({'field': 'title', 'message': str(e)})
        
        try:
            validate_issue_description(description)
        except ValidationError as e:
            errors.append({'field': 'description', 'message': str(e)})
        
        try:
            validate_priority(priority)
        except ValidationError as e:
            errors.append({'field': 'priority', 'message': str(e)})
        
        if not category_id:
            errors.append({'field': 'category_id', 'message': 'Category is required'})
        
        if errors:
            return jsonify({
                'success': False,
                'message': 'Validation failed',
                'errors': errors
            }), 400
        
        # Get citizen ID
        citizen = db.fetch_one(
            'SELECT id FROM citizens WHERE user_id = %s',
            (request.user['userId'],)
        )
        
        if not citizen:
            return jsonify({'success': False, 'message': 'Citizen not found'}), 404
        
        # Insert issue
        result = db.execute_query(
            '''INSERT INTO issues (citizen_id, title, description, category_id, priority, status, created_by, created_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())''',
            (citizen['id'], title, description, category_id, priority, 'open', request.user['userId'])
        )
        
        if not result:
            return jsonify({'success': False, 'message': 'Error creating issue'}), 500
        
        logger.info(f'✅ [CREATE ISSUE] Issue created with ID: {result["last_id"]}')
        
        return jsonify({
            'success': True,
            'message': 'Issue created successfully',
            'data': {
                'issueId': result['last_id'],
                'title': title,
                'status': 'open',
                'createdAt': datetime.now().isoformat()
            }
        }), 201
    
    except Exception as e:
        logger.error(f'❌ [CREATE ISSUE] Error: {str(e)}')
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': 'Error creating issue'}), 500

# ============================================================================
# GET MY ISSUES (CITIZEN)
# ============================================================================

@issues_bp.route('/my-issues', methods=['GET'])
@auth_required
@citizen_required
def get_my_issues():
    """Get citizen's own issues"""
    try:
        user_id = request.user['userId']
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        status = request.args.get('status')
        
        offset = (page - 1) * limit
        
        logger.info(f'📍 [MY ISSUES] Fetching issues for citizen: {user_id}')
        
        # Get citizen ID
        citizen = db.fetch_one(
            'SELECT id FROM citizens WHERE user_id = %s',
            (user_id,)
        )
        
        if not citizen:
            return jsonify({'success': False, 'message': 'Citizen not found'}), 404
        
        citizen_id = citizen['id']
        
        query = '''
            SELECT 
                i.id, 
                i.title, 
                i.description, 
                i.category_id, 
                ic.name as category_name,
                i.priority, 
                i.status, 
                i.created_at
            FROM issues i
            LEFT JOIN issue_categories ic ON i.category_id = ic.id
            WHERE i.citizen_id = %s
        '''
        
        params = [citizen_id]
        
        if status:
            query += ' AND i.status = %s'
            params.append(status)
        
        query += ' ORDER BY i.created_at DESC LIMIT %s OFFSET %s'
        params.extend([limit, offset])
        
        issues = db.fetch_all(query, tuple(params))
        
        logger.info(f'✅ [MY ISSUES] Fetched {len(issues)} issues')
        
        return jsonify({
            'success': True,
            'message': 'Issues retrieved successfully',
            'data': issues,
            'pagination': {'page': page, 'limit': limit, 'total': len(issues)}
        }), 200
    
    except Exception as e:
        logger.error(f'❌ [MY ISSUES] Error: {str(e)}')
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': 'Error fetching issues'}), 500

# ============================================================================
# GET OFFICIAL ISSUES
# ============================================================================

@issues_bp.route('/official', methods=['GET'])
@auth_required
@official_required
def get_official_issues():
    """Get issues assigned to official"""
    try:
        user_id = request.user['userId']
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        status = request.args.get('status')
        
        offset = (page - 1) * limit
        
        logger.info(f'📍 [OFFICIAL ISSUES] Fetching issues for official: {user_id}')
        
        query = '''
            SELECT 
                i.id, 
                i.title, 
                i.description, 
                i.category_id, 
                ic.name as category_name,
                i.priority, 
                i.status, 
                i.created_at,
                c.id as citizen_id,
                u.name as citizen_name,
                u.email as citizen_email
            FROM issues i
            LEFT JOIN issue_categories ic ON i.category_id = ic.id
            LEFT JOIN citizens c ON i.citizen_id = c.id
            LEFT JOIN users u ON c.user_id = u.id
            WHERE i.assigned_to = %s
        '''
        
        params = [user_id]
        
        if status:
            query += ' AND i.status = %s'
            params.append(status)
        
        query += ' ORDER BY i.created_at DESC LIMIT %s OFFSET %s'
        params.extend([limit, offset])
        
        issues = db.fetch_all(query, tuple(params))
        
        logger.info(f'✅ [OFFICIAL ISSUES] Fetched {len(issues)} issues')
        
        return jsonify({
            'success': True,
            'message': 'Issues retrieved successfully',
            'data': issues,
            'pagination': {'page': page, 'limit': limit, 'total': len(issues)}
        }), 200
    
    except Exception as e:
        logger.error(f'❌ [OFFICIAL ISSUES] Error: {str(e)}')
        return jsonify({'success': False, 'message': 'Error fetching issues'}), 500

# ============================================================================
# GET ISSUE DETAILS
# ============================================================================

@issues_bp.route('/<int:issue_id>', methods=['GET'])
@auth_required
def get_issue_details(issue_id):
    """Get issue details by ID"""
    try:
        logger.info(f'📍 [ISSUE DETAILS] Fetching issue: {issue_id}')
        
        issue = db.fetch_one(
            '''SELECT 
                i.*, 
                ic.name as category_name,
                c.id as citizen_id,
                u.name as citizen_name,
                u.email as citizen_email
            FROM issues i
            LEFT JOIN issue_categories ic ON i.category_id = ic.id
            LEFT JOIN citizens c ON i.citizen_id = c.id
            LEFT JOIN users u ON c.user_id = u.id
            WHERE i.id = %s''',
            (issue_id,)
        )
        
        if not issue:
            return jsonify({'success': False, 'message': 'Issue not found'}), 404
        
        # Get attachments
        attachments = db.fetch_all(
            'SELECT id, file_name, file_path FROM issue_attachments WHERE issue_id = %s',
            (issue_id,)
        )
        
        issue['attachments'] = attachments
        
        logger.info(f'✅ [ISSUE DETAILS] Issue retrieved')
        
        return jsonify({
            'success': True,
            'message': 'Issue details retrieved successfully',
            'data': issue
        }), 200
    
    except Exception as e:
        logger.error(f'❌ [ISSUE DETAILS] Error: {str(e)}')
        return jsonify({'success': False, 'message': 'Error fetching issue'}), 500

# ============================================================================
# UPDATE ISSUE STATUS
# ============================================================================

@issues_bp.route('/<int:issue_id>/status', methods=['PUT'])
@auth_required
@official_required
def update_issue_status(issue_id):
    """Update issue status (official only)"""
    try:
        logger.info(f'📍 [UPDATE STATUS] Updating issue: {issue_id}')
        
        data = request.get_json()
        status = data.get('status', '').lower()
        remarks = data.get('remarks', '').strip()
        
        try:
            validate_status(status)
        except ValidationError as e:
            return jsonify({'success': False, 'message': str(e)}), 400
        
        result = db.execute_query(
            '''UPDATE issues 
               SET status = %s, remarks = %s, modified_by = %s, modified_at = NOW()
               WHERE id = %s''',
            (status, remarks, request.user['userId'], issue_id)
        )
        
        if result['affected_rows'] == 0:
            return jsonify({'success': False, 'message': 'Issue not found'}), 404
        
        logger.info(f'✅ [UPDATE STATUS] Issue {issue_id} updated to: {status}')
        
        return jsonify({
            'success': True,
            'message': 'Issue status updated successfully',
            'data': {'issueId': issue_id, 'status': status}
        }), 200
    
    except Exception as e:
        logger.error(f'❌ [UPDATE STATUS] Error: {str(e)}')
        return jsonify({'success': False, 'message': 'Error updating issue'}), 500

# ============================================================================
# ESCALATE ISSUE
# ============================================================================

@issues_bp.route('/<int:issue_id>/escalate', methods=['POST'])
@auth_required
@official_required
def escalate_issue(issue_id):
    """Escalate issue to higher official"""
    try:
        logger.info(f'📍 [ESCALATE] Escalating issue: {issue_id}')
        
        data = request.get_json()
        reason = data.get('reason', '').strip()
        
        if not reason:
            return jsonify({'success': False, 'message': 'Escalation reason is required'}), 400
        
        result = db.execute_query(
            '''UPDATE issues 
               SET priority = 'high', status = 'escalated', remarks = %s, modified_by = %s, modified_at = NOW()
               WHERE id = %s''',
            (reason, request.user['userId'], issue_id)
        )
        
        if result['affected_rows'] == 0:
            return jsonify({'success': False, 'message': 'Issue not found'}), 404
        
        logger.info(f'✅ [ESCALATE] Issue {issue_id} escalated')
        
        return jsonify({
            'success': True,
            'message': 'Issue escalated successfully',
            'data': {'issueId': issue_id, 'status': 'escalated', 'priority': 'high'}
        }), 200
    
    except Exception as e:
        logger.error(f'❌ [ESCALATE] Error: {str(e)}')
        return jsonify({'success': False, 'message': 'Error escalating issue'}), 500
