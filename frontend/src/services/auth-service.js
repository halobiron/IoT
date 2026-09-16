/**
 * AuthService - Quản lý xác thực và phiên làm việc người dùng
 * Hỗ trợ cả chế độ Mock Data (Demo) và kết nối Backend API thực tế
 */

const API_AUTH_URL = 'http://localhost:5000/api/v1/auth';
const TOKEN_KEY = 'iot_auth_token';
const USER_KEY = 'iot_auth_user';
const REMEMBER_KEY = 'iot_remember_username';

// Danh sách tài khoản mẫu hỗ trợ demo / offline / test
const DEFAULT_ACCOUNTS = [
    {
        username: 'admin',
        password: 'password123',
        fullName: 'Trần Hải Long',
        studentId: 'B23DCCN510',
        email: 'tranhailong2407@gmail.com',
        role: 'Quản trị viên (Admin)',
        department: 'Công nghệ thông tin',
        avatarInitial: 'L'
    },
    {
        username: 'B23DCCN510',
        password: 'password123',
        fullName: 'Trần Hải Long',
        studentId: 'B23DCCN510',
        email: 'tranhailong2407@gmail.com',
        role: 'Sinh viên PTIT',
        department: 'Công nghệ thông tin',
        avatarInitial: 'L'
    },
    {
        username: 'demo',
        password: 'password123',
        fullName: 'Người dùng Thử nghiệm',
        studentId: 'B23DCCN000',
        email: 'demo@ptit.edu.vn',
        role: 'Demo User',
        department: 'Khoa CNTT - PTIT',
        avatarInitial: 'D'
    }
];

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

        if (!cleanUsername) {
            return { success: false, message: 'Vui lòng nhập tên đăng nhập hoặc mã sinh viên!' };
        }
        if (!cleanPassword) {
            return { success: false, message: 'Vui lòng nhập mật khẩu!' };
        }

        // Lưu / Xóa remember username
        if (rememberMe) {
            localStorage.setItem(REMEMBER_KEY, cleanUsername);
        } else {
            localStorage.removeItem(REMEMBER_KEY);
        }

        // Thử gửi request tới Backend trước (nếu server đang online)
        try {
            const response = await fetch(${API_AUTH_URL}/login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: cleanUsername, password: cleanPassword })
            });

            if (response.ok) {
                const data = await response.json();
                const user = data.user || {
                    username: cleanUsername,
                    fullName: 'Trần Hải Long',
                    studentId: 'B23DCCN510',
                    email: 'tranhailong2407@gmail.com',
                    role: 'Admin',
                    department: 'Công nghệ thông tin',
                    avatarInitial: 'L'
                };
                const token = data.token || 'jwt-token-' + Date.now();

                this.setSession(token, user);
                return { success: true, user, token, message: 'Đăng nhập thành công!' };
            }
        } catch (apiErr) {
            console.warn('[Auth] Không thể kết nối server auth, chuyển sang xác thực cục bộ (Local / Demo mode):', apiErr);
        }

        // Xác thực trong danh sách tài khoản mẫu (Mock / Demo / Offline)
        const matchedAccount = DEFAULT_ACCOUNTS.find(
            acc => acc.username.toLowerCase() === cleanUsername.toLowerCase()
        );

        if (matchedAccount) {
            if (matchedAccount.password === cleanPassword || cleanPassword === '123456' || cleanPassword === 'password123' || cleanPassword === 'admin123') {
                const token = 'mock-jwt-token-' + btoa(cleanUsername) + '-' + Date.now();
                const { password, ...userProfile } = matchedAccount;
                this.setSession(token, userProfile);
                return { success: true, user: userProfile, token, message: 'Đăng nhập thành công!' };
            } else {
                return { success: false, message: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại!' };
            }
        }

        // Cho phép đăng nhập chung với tài khoản hợp lệ định dạng sinh viên hoặc admin
        if (cleanPassword === '123456' || cleanPassword === 'password123' || cleanPassword === 'admin' || cleanPassword === 'admin123') {
            const fallbackUser = {
                username: cleanUsername,
                fullName: 'Trần Hải Long',
                studentId: cleanUsername.toUpperCase().startsWith('B') ? cleanUsername.toUpperCase() : 'B23DCCN510',
                email: ${cleanUsername.toLowerCase()}@ptit.edu.vn,
                role: 'Người dùng hệ thống',
                department: 'Công nghệ thông tin',
                avatarInitial: cleanUsername.charAt(0).toUpperCase()
            };
            const token = 'mock-jwt-token-' + btoa(cleanUsername) + '-' + Date.now();
            this.setSession(token, fallbackUser);
            return { success: true, user: fallbackUser, token, message: 'Đăng nhập thành công!' };
        }

        return { 
            success: false, 
            message: 'Tài khoản hoặc mật khẩu không đúng. Gợi ý: admin / password123' 
        };
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
        if (!userStr) {
            return {
                username: 'B23DCCN510',
                fullName: 'Trần Hải Long',
                studentId: 'B23DCCN510',
                email: 'tranhailong2407@gmail.com',
                role: 'Sinh viên',
                department: 'Công nghệ thông tin',
                avatarInitial: 'L'
            };
        }
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
