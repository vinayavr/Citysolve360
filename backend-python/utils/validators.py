import re
import logging

logger = logging.getLogger(__name__)

class ValidationError(Exception):
    """Custom validation exception"""
    pass

def validate_email(email):
    """Validate email format"""
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(pattern, email):
        raise ValidationError('Invalid email format (e.g., user@example.com)')
    if len(email) > 255:
        raise ValidationError('Email must be less than 255 characters')

def validate_password(password):
    """Validate password strength"""
    if len(password) < 6:
        raise ValidationError('Password must be at least 6 characters')
    if not re.search(r'[a-z]', password):
        raise ValidationError('Password must contain at least one lowercase letter')
    if not re.search(r'[A-Z]', password):
        raise ValidationError('Password must contain at least one uppercase letter')
    if not re.search(r'\d', password):
        raise ValidationError('Password must contain at least one number')

def validate_phone(phone):
    """Validate phone number"""
    if not re.match(r'^\d{10}$', phone):
        raise ValidationError('Phone must be exactly 10 digits (no spaces or dashes)')

def validate_name(name):
    """Validate name"""
    if len(name) < 2 or len(name) > 255:
        raise ValidationError('Name must be between 2-255 characters')
    if not re.match(r'^[a-zA-Z\s]+$', name):
        raise ValidationError('Name can only contain letters and spaces')

def validate_address(address):
    """Validate address"""
    if len(address) < 10 or len(address) > 500:
        raise ValidationError('Address must be between 10-500 characters')

def validate_issue_title(title):
    """Validate issue title"""
    if len(title) < 5 or len(title) > 200:
        raise ValidationError('Title must be between 5-200 characters')

def validate_issue_description(description):
    """Validate issue description"""
    if len(description) < 20 or len(description) > 2000:
        raise ValidationError('Description must be between 20-2000 characters')

def validate_priority(priority):
    """Validate priority"""
    valid_priorities = ['low', 'medium', 'high']
    if priority not in valid_priorities:
        raise ValidationError(f'Priority must be one of: {", ".join(valid_priorities)}')

def validate_status(status):
    """Validate status"""
    valid_statuses = ['open', 'in progress', 'resolved', 'closed', 'escalated']
    if status not in valid_statuses:
        raise ValidationError(f'Status must be one of: {", ".join(valid_statuses)}')

# ⭐ THIS WAS MISSING - ADDING NOW
def validate_all(email, password, name=None, phone=None, address=None):
    """Validate all fields and return errors if any"""
    errors = []
    
    # Validate email
    try:
        validate_email(email)
    except ValidationError as e:
        errors.append({'field': 'email', 'message': str(e)})
    
    # Validate password
    try:
        validate_password(password)
    except ValidationError as e:
        errors.append({'field': 'password', 'message': str(e)})
    
    # Optional fields for registration
    if name is not None:
        try:
            validate_name(name)
        except ValidationError as e:
            errors.append({'field': 'name', 'message': str(e)})
    
    if phone is not None:
        try:
            validate_phone(phone)
        except ValidationError as e:
            errors.append({'field': 'phone', 'message': str(e)})
    
    if address is not None:
        try:
            validate_address(address)
        except ValidationError as e:
            errors.append({'field': 'address', 'message': str(e)})
    
    return errors

