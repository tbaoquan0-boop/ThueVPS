/* =========================================================
   pages/auth.js — Đăng nhập, đăng ký
========================================================= */
'use strict';

(function () {
    function renderLogin() {
        return renderLayout(
            '<div class="auth-wrap">' +
                '<div class="auth-card">' +
                    '<h1>Đăng nhập</h1>' +
                    '<p class="subtitle">Chào mừng bạn trở lại!</p>' +
                    '<form data-form="auth-login">' +
                        '<div class="form-group">' +
                            '<label>Email</label>' +
                            '<input type="email" name="email" class="form-control" required value="khach@vps.test">' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label>Mật khẩu</label>' +
                            '<input type="password" name="password" class="form-control" required value="khach123">' +
                        '</div>' +
                        '<button type="submit" class="btn btn-primary" style="width:100%">Đăng nhập</button>' +
                    '</form>' +
                    '<div class="alt-link">Chưa có tài khoản? <a href="#/register">Đăng ký ngay</a></div>' +
                    '<div style="margin-top:16px;padding:12px;background:rgba(37,99,235,.06);border-radius:8px;font-size:.85rem;color:var(--c-muted)">' +
                        '<b>Tài khoản demo:</b><br>' +
                        'Khách: khach@vps.test / khach123<br>' +
                        'Admin: admin@vps.test / admin123' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    }

    function renderRegister() {
        return renderLayout(
            '<div class="auth-wrap">' +
                '<div class="auth-card">' +
                    '<h1>Đăng ký</h1>' +
                    '<p class="subtitle">Tạo tài khoản miễn phí trong 30 giây</p>' +
                    '<form data-form="auth-register">' +
                        '<div class="form-group">' +
                            '<label>Họ và tên</label>' +
                            '<input type="text" name="name" class="form-control" required>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label>Email</label>' +
                            '<input type="email" name="email" class="form-control" required>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label>Số điện thoại</label>' +
                            '<input type="tel" name="phone" class="form-control">' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label>Mật khẩu</label>' +
                            '<input type="password" name="password" class="form-control" required minlength="6">' +
                        '</div>' +
                        '<button type="submit" class="btn btn-primary" style="width:100%">Đăng ký</button>' +
                    '</form>' +
                    '<div class="alt-link">Đã có tài khoản? <a href="#/login">Đăng nhập</a></div>' +
                '</div>' +
            '</div>'
        );
    }

    function doLogin(form) {
        const fd = new FormData(form);
        try {
            const u = Session.login(fd.get('email'), fd.get('password'));
            Flash.show('Chào mừng ' + u.name + '!', 'success');
            Router.go('/dashboard');
        } catch (e) {
            Flash.show(e.message, 'danger');
        }
    }

    function doRegister(form) {
        const fd = new FormData(form);
        try {
            const u = Session.register({
                name: fd.get('name'),
                email: fd.get('email'),
                password: fd.get('password'),
                phone: fd.get('phone'),
            });
            Flash.show('Đăng ký thành công!', 'success');
            Router.go('/dashboard');
        } catch (e) {
            Flash.show(e.message, 'danger');
        }
    }

    Router.add('GET', '/login', renderLogin);
    Router.add('GET', '/register', renderRegister);

    window.App = window.App || {};
    window.App['auth-login'] = doLogin;
    window.App['auth-register'] = doRegister;
})();
