from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta, timezone
import jwt
import hashlib
from app.core.logger_config import logger

auth_bp = Blueprint('auth', __name__)

# Secret key cho JWT (trong production nên dùng environment variable)
JWT_SECRET_KEY = 'iot-secret-key-2024-hailong'
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24


def generate_token(user_data):
    """Generate JWT token từ user data"""
    payload = {
        'user': user_data,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.now(timezone.utc)
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token


def verify_token(token):
    """Verify và decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        return None
    except jwt.InvalidTokenError:
        logger.warning("Invalid token")
        return None


# Mock user database (trong production nên dùng MongoDB)
MOCK_USERS = {
    'admin': {
        'password_hash': hashlib.sha256('password123'.encode()).hexdigest(),
        'full_name': 'Trần Hải Long',
        'student_id': 'B23DCCN510',
        'email': 'tranhailong2407@gmail.com',
        'role': 'Admin'
    },
    'B23DCCN510': {
        'password_hash': hashlib.sha256('password123'.encode()).hexdigest(),
        'full_name': 'Trần Hải Long',
        'student_id': 'B23DCCN510',
        'email': 'tranhailong2407@gmail.com',
        'role': 'Sinh viên'
    },
    'demo': {
        'password_hash': hashlib.sha256('password123'.encode()).hexdigest(),
        'full_name': 'Người dùng Thử nghiệm',
        'student_id': 'B23DCCN000',
        'email': 'demo@ptit.edu.vn',
        'role': 'Demo User'
    }
}


@auth_bp.route("/login", methods=['POST'])
def login():
    """API Đăng nhập - Xác thực username/password và trả về JWT token"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "status": "error",
                "message": "Missing request body"
            }), 400

        username = data.get('username', '').strip()
        password = data.get('password', '')

        if not username:
            return jsonify({
                "status": "error",
                "message": "Username is required"
            }), 400

        if not password:
            return jsonify({
                "status": "error",
                "message": "Password is required"
            }), 400

        # Tìm user trong mock database
        user_info = MOCK_USERS.get(username)

        if not user_info:
            return jsonify({
                "status": "error",
                "message": "Invalid username or password"
            }), 401

        # Verify password
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        if password_hash != user_info['password_hash']:
            return jsonify({
                "status": "error",
                "message": "Invalid username or password"
            }), 401

        # Tạo user profile (loại bỏ password_hash)
        user_profile = {
            'username': username,
            'full_name': user_info['full_name'],
            'student_id': user_info['student_id'],
            'email': user_info['email'],
            'role': user_info['role']
        }

        # Generate JWT token
        token = generate_token(user_profile)

        logger.info(f"User {username} logged in successfully")

        return jsonify({
            "status": "success",
            "data": {
                "token": token,
                "token_type": "Bearer",
                "expires_in": JWT_EXPIRATION_HOURS * 3600,
                "user": user_profile
            },
            "message": "Login successful"
        })

    except Exception as e:
        logger.error(f"Error in login: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
