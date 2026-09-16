import AuthService from '../services/auth-service.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('usernameInput');
    const passwordInput = document.getElementById('passwordInput');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const submitBtn = document.getElementById('submitBtn');
    const loginAlert = document.getElementById('loginAlert');
    const alertMessage = document.getElementById('alertMessage');
    const alertIcon = document.getElementById('alertIcon');
    const loginCard = document.getElementById('loginCard');
    const passwordToggleBtn = document.getElementById('passwordToggleBtn');

    // Modal elements
    const forgotModal = document.getElementById('forgotModal');

    // 1. Tải username đã nhớ (nếu có)
    const remembered = AuthService.getRememberedUsername();
    if (remembered) {
        usernameInput.value = remembered;
        rememberMeCheckbox.checked = true;
        passwordInput.focus();
    } else {
        usernameInput.focus();
    }

    // 2. Xử lý Toggle xem mật khẩu
    if (passwordToggleBtn) {
        passwordToggleBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            const icon = passwordToggleBtn.querySelector('i');
            if (icon) {
                icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
            }
        });
    }

    // 3. Xử lý click chọn tài khoản Demo (Admin / Sinh viên)
    document.querySelectorAll('.demo-chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const u = btn.getAttribute('data-user');
            const p = btn.getAttribute('data-pass');
            if (u && p) {
                usernameInput.value = u;
                passwordInput.value = p;
                hideAlert();
                
                // Hiệu ứng feedback trực quan khi chọn tài khoản
                btn.style.transform = 'scale(0.97)';
                setTimeout(() => {
                    btn.style.transform = 'scale(1)';
                }, 120);

                passwordInput.focus();
            }
        });
    });

    // 4. Xử lý Submit Form
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAlert();

            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;

            if (!username) {
                showAlert('Vui lòng nhập tên đăng nhập hoặc mã sinh viên!', 'error');
                usernameInput.focus();
                triggerShake();
                return;
            }

            if (!password) {
                showAlert('Vui lòng nhập mật khẩu!', 'error');
                passwordInput.focus();
                triggerShake();
                return;
            }

            // Trạng thái Loading
            setLoading(true);

            try {
                // Tạo độ trễ nhẹ cho trải nghiệm giao diện mượt mà (300ms)
                await new Promise(r => setTimeout(r, 300));
                
                const result = await AuthService.login(username, password, rememberMe);

                if (result.success) {
                    showAlert('Đăng nhập thành công! Đang chuyển hướng đến Dashboard...', 'success');
                    setTimeout(() => {
                        window.location.href = 'home-page.html';
                    }, 650);
                } else {
                    showAlert(result.message || 'Tên đăng nhập hoặc mật khẩu không chính xác!', 'error');
                    triggerShake();
                    setLoading(false);
                }
            } catch (error) {
                console.error('[Login Error]', error);
                showAlert('Lỗi hệ thống khi đăng nhập. Vui lòng thử lại sau!', 'error');
                triggerShake();
                setLoading(false);
            }
        });
    }

    // Các hàm trợ giúp (Helper Functions)
    function showAlert(msg, type = 'error') {
        if (!loginAlert || !alertMessage) return;
        
        loginAlert.className = login-alert ;
        alertMessage.textContent = msg;

        if (alertIcon) {
            alertIcon.className = type === 'success' 
                ? 'fas fa-check-circle' 
                : 'fas fa-exclamation-triangle';
        }
    }

    function hideAlert() {
        if (loginAlert) {
            loginAlert.className = 'login-alert';
            loginAlert.style.display = 'none';
        }
    }

    function triggerShake() {
        if (loginCard) {
            loginCard.classList.remove('shake');
            void loginCard.offsetWidth; // Trigger reflow
            loginCard.classList.add('shake');
        }
    }

    function setLoading(isLoading) {
        if (!submitBtn) return;
        submitBtn.disabled = isLoading;
        if (isLoading) {
            submitBtn.innerHTML = '<i class=\"fas fa-circle-notch fa-spin\"></i> Đang xử lý...';
        } else {
            submitBtn.innerHTML = '<span>Đăng nhập</span> <i class=\"fas fa-arrow-right\"></i>';
        }
    }
});

// Điều khiển Modal Quên mật khẩu
window.openForgotModal = function() {
    const modal = document.getElementById('forgotModal');
    if (modal) {
        modal.style.display = 'flex';
    }
};

window.closeForgotModal = function() {
    const modal = document.getElementById('forgotModal');
    if (modal) {
        modal.style.display = 'none';
    }
};
