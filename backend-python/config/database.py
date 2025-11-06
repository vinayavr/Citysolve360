import mysql.connector
from mysql.connector import Error
import os
import logging

logger = logging.getLogger(__name__)

class Database:
    """Database connection manager with connection pooling"""
    
    def __init__(self):
        self.connection = None
        self.connect()
    
    def connect(self):
        """Connect to MySQL database"""
        try:
            self.connection = mysql.connector.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASSWORD', ''),
                database=os.getenv('DB_NAME', 'Citysolve360'),
                port=int(os.getenv('DB_PORT', 3306)),
                autocommit=True,
                pool_name='mypool',
                pool_size=5
            )
            
            if self.connection.is_connected():
                db_info = self.connection.get_server_info()
                logger.info(f'✅ Database connected successfully (MySQL {db_info})')
                return True
            
        except Error as e:
            logger.error(f'❌ Database connection failed: {str(e)}')
            return False
    
    def reconnect_if_needed(self):
        """Reconnect if connection is lost"""
        try:
            if not self.connection or not self.connection.is_connected():
                logger.warning('⚠️ Database connection lost. Reconnecting...')
                self.connect()
        except Exception as e:
            logger.error(f'Reconnection error: {str(e)}')
    
    def execute_query(self, query, params=None):
        """Execute INSERT/UPDATE/DELETE query"""
        try:
            self.reconnect_if_needed()
            cursor = self.connection.cursor(dictionary=True)
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            self.connection.commit()
            
            result = {
                'affected_rows': cursor.rowcount,
                'last_id': cursor.lastrowid
            }
            
            cursor.close()
            return result
        
        except Error as e:
            logger.error(f'❌ Execute query error: {str(e)}')
            logger.error(f'Query: {query}')
            logger.error(f'Params: {params}')
            return None
    
    def fetch_all(self, query, params=None):
        """Fetch multiple rows (SELECT query)"""
        try:
            self.reconnect_if_needed()
            cursor = self.connection.cursor(dictionary=True)
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            result = cursor.fetchall()
            cursor.close()
            return result if result else []
        
        except Error as e:
            logger.error(f'❌ Fetch all error: {str(e)}')
            logger.error(f'Query: {query}')
            return []
    
    def fetch_one(self, query, params=None):
        """Fetch single row (SELECT query)"""
        try:
            self.reconnect_if_needed()
            cursor = self.connection.cursor(dictionary=True)
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            result = cursor.fetchone()
            cursor.close()
            return result
        
        except Error as e:
            logger.error(f'❌ Fetch one error: {str(e)}')
            logger.error(f'Query: {query}')
            return None
    
    def close(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logger.info('Database connection closed')

# Global database instance
db = Database()
