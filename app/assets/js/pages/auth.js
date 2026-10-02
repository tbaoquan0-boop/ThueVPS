/* =========================================================
   pages/auth.js — Đăng nhập, đăng ký
========================================================= */
'use strict';

(function () {
    function renderLogin() {
        return renderLayout(
            '<div class="auth">' +
                '<div class="auth-card fade-up">' +
                    '<h1>Đăng nhập</h1>' +
                    '<p class="sub">Chào mừng bạn trở lại.</p>' +
                    '<form data-form="auth-login" autocomplete="on">' +
                        '<div class="field"><label>Email</label>' +
                            '<i class="bi bi-envelope"></i>' +
                            '<input type="email" name="email" required value="khach@vps.test" autocomplete="username">' +
                        '</div>' +
                        '<div class="field"><label>Mật khẩu</label>' +
                            '<i class="bi bi-lock"></i>' +
                            '<input type="password" name="password" required value="khach123" autocomplete="current-password">' +
                        '</div>' +
                        '<div class="auth-options">' +
                            '<label><input type="checkbox" name="remember" checked> Ghi nhớ đăng nhập</label>' +
                        '</div>' +
                        '<button type="submit" class="auth-submit" data-submit-label="Đăng nhập">Đăng nhập</button>' +
                    '</form>' +
                    '<div class="alt">Chưa có tài khoản? <a href="#/register" style="color:var(--accent);font-weight:500">Đăng ký ngay</a></div>' +
                    
                '</div>' +
            '</div>'
        );
    }

    function renderRegister() {
        return renderLayout(
            '<div class="auth">' +
                '<div class="auth-card fade-up">' +
                    '<h1>Tạo tài khoản</h1>' +
                    '<p class="sub">Miễn phí, khởi tạo trong 30 giây.</p>' +
                    '<form data-form="auth-register" autocomplete="on">' +
                        '<div class="field"><label>Họ và tên</label>' +
                            '<i class="bi bi-person"></i>' +
                            '<input type="text" name="name" required></div>' +
                        '<div class="field"><label>Email</label>' +
                            '<i class="bi bi-envelope"></i>' +
                            '<input type="email" name="email" required></div>' +
                        '<div class="field"><label>Số điện thoại</label>' +
                            '<i class="bi bi-telephone"></i>' +
                            '<input type="tel" name="phone"></div>' +
                        '<div class="field"><label>Mật khẩu</label>' +
                            '<i class="bi bi-lock"></i>' +
                            '<input type="password" name="password" required minlength="6"></div>' +
                        '<div class="auth-options">' +
                            '<label><input type="checkbox" name="remember" checked> Ghi nhớ đăng nhập</label>' +
                        '</div>' +
                        '<button type="submit" class="auth-submit">Đăng ký</button>' +
                    '</form>' +
                    '<div class="alt">Đã có tài khoản? <a href="#/login" style="color:var(--accent);font-weight:500">Đăng nhập</a></div>' +
                '</div>' +
            '</div>'
        );
    }

    function doLogin(form) {
        const fd = new FormData(form);
        const remember = fd.get('remember') === 'on';
        const btn = form.querySelector('button[type=submit]');
        if (btn) { btn.disabled = true; btn.textContent = 'Đang đăng nhập…'; }
        setTimeout(function () {
            try {
                const u = Session.login(fd.get('email'), fd.get('password'));
                try { localStorage.setItem('vpssieutoc_remember', remember ? '1' : '0'); } catch (_) {}
                Flash.show('Chào mừng ' + u.name, 'success');
                Router.go('/dashboard');
            } catch (e) {
                Flash.show(e.message, 'danger');
                if (btn) { btn.disabled = false; btn.textContent = btn.dataset.submitLabel || 'Đăng nhập'; }
            }
        }, 80);
    }

    function doRegister(form) {
        const fd = new FormData(form);
        const remember = fd.get('remember') === 'on';
        const btn = form.querySelector('button[type=submit]');
        if (btn) { btn.disabled = true; btn.textContent = 'Đang tạo…'; }
        setTimeout(function () {
            try {
                const u = Session.register({
                    name: fd.get('name'), email: fd.get('email'),
                    password: fd.get('password'), phone: fd.get('phone'),
                });
                try { localStorage.setItem('vpssieutoc_remember', remember ? '1' : '0'); } catch (_) {}
                Flash.show('Đăng ký thành công', 'success');
                Router.go('/dashboard');
            } catch (e) {
                Flash.show(e.message, 'danger');
                if (btn) { btn.disabled = false; btn.textContent = 'Đăng ký'; }
            }
        }, 80);
    }

    Router.add('GET', '/login', renderLogin);
    Router.add('GET', '/register', renderRegister);

    window.App = window.App || {};
    window.App['auth-login']    = doLogin;
    window.App['auth-register'] = doRegister;
})();