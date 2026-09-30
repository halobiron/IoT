/* AuthService quản lý phiên đăng nhập qua backend. */

const API_AUTH_URL = 'http://localhost:5000/api/v1/auth';
const TOKEN_KEY = 'iot_auth_token';
const USER_KEY = 'iot_auth_user';
const REMEMBER_KEY = 'iot_remember_username';

class AuthService {
    /**
     * Thực hiện đăng nhập với username và password
     * @param {string} username 
     * @param {string} password 
     * @param {boolean} rememberMe 
     * @returns {Promise<{success: boolean, user?: object, token?: string, message?: string}>}
     */
    static async login(username, password, rememberMe = false) {
        const cleanUsername = (username || '').trim();
        const cleanPassword = (password || '').trim();
        if (!cleanUsername || !cleanPassword) {
            return { success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu!' };
        }
        if (rememberMe) localStorage.setItem(REMEMBER_KEY, cleanUsername);
        else localStorage.removeItem(REMEMBER_KEY);

        try {
            const response = await fetch(`${API_AUTH_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: cleanUsername, password: cleanPassword })
            });
            const result = await response.json();
            const data = result.data || result;
            if (!response.ok || !data.token || !data.user) {
                return { success: false, message: result.message || 'Tài khoản hoặc mật khẩu không đúng.' };
            }
            const rawUser = data.user;
            const user = {
                username: rawUser.username,
                fullName: rawUser.full_name || rawUser.fullName || rawUser.username,
                studentId: rawUser.student_id || rawUser.studentId || '',
                email: rawUser.email || '',
                role: rawUser.role || '',
                department: rawUser.department || '',
                avatarInitial: (rawUser.full_name || rawUser.fullName || rawUser.username || '?').charAt(0).toUpperCase()
            };
            this.setSession(data.token, user);
            return { success: true, user, token: data.token, message: result.message || 'Đăng nhập thành công!' };
        } catch (error) {
            return { success: false, message: 'Không thể kết nối máy chủ đăng nhập.' };
        }
    }

    /**
     * Lưu thông tin token và user vào LocalStorage
     */
    static setSession(token, user) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    /**
     * Lấy token hiện tại
     */
    static getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    /**
     * Lấy thông tin user hiện tại đang đăng nhập
     */
    static getCurrentUser() {
        const userStr = localStorage.getItem(USER_KEY);
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }

    /**
     * Kiểm tra trạng thái đã đăng nhập chưa
     */
    static isAuthenticated() {
        return !!localStorage.getItem(TOKEN_KEY);
    }

    /**
     * Lấy username đã lưu nhớ (nếu có)
     */
    static getRememberedUsername() {
        return localStorage.getItem(REMEMBER_KEY) || '';
    }

    /**
     * Đăng xuất và điều hướng về trang login
     */
    static logout(redirect = true) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        if (redirect) {
            window.location.href = 'login.html';
        }
    }
}

// Gán vào window để hỗ trợ cả non-module scripts
if (typeof window !== 'undefined') {
    window.AuthService = AuthService;
}

export default AuthService;
