/* =========================================================
   admin.js — Boot UI: render sidebar + start router
   ========================================================= */
'use strict';

(function () {
    var NAV_ITEMS = [
        { path: '/dashboard', icon: 'bi-speedometer2',       label: 'Dashboard' },
        { path: '/plans',     icon: 'bi-box-seam',           label: 'Gói dịch vụ' },
        { path: '/users',     icon: 'bi-people',             label: 'Người dùng' },
        { path: '/orders',    icon: 'bi-receipt',            label: 'Đơn hàng' },
        { path: '/servers',   icon: 'bi-hdd-rack',           label: 'Server' },
        { path: '/finance',   icon: 'bi-wallet2',            label: 'Tài chính' },
        { path: '/tickets',   icon: 'bi-life-preserver',     label: 'Hỗ trợ' },
        { path: '/chat',      icon: 'bi-chat-dots-fill',     label: 'Trò chuyện' },
        { path: '/content',   icon: 'bi-file-text',          label: 'Nội dung' },
        { path: '/settings',  icon: 'bi-gear',               label: 'Cài đặt' },
    ];

    function renderNav() {
        var nav = document.getElementById('adNav');
        if (!nav) return;
        nav.innerHTML = NAV_ITEMS.map(function (n) {
            return '<a class="vm-nav-link" href="#' + n.path + '">' +
                '<i class="bi ' + n.icon + '"></i><span>' + n.label + '</span></a>';
        }).join('');
    }

    function initTheme() {
        var saved = 'dark';
        try { saved = localStorage.getItem('admin-theme') || 'dark'; } catch (e) {}
        document.documentElement.setAttribute('data-bs-theme', saved);
        var btn = document.getElementById('adThemeToggle');
        if (!btn) return;
        var setIcon = function (theme) {
            var ic = btn.querySelector('i');
            if (ic) ic.className = theme === 'dark' ? 'bi bi-moon-stars' : 'bi bi-sun';
        };
        setIcon(saved);
        btn.addEventListener('click', function () {
            var cur = document.documentElement.getAttribute('data-bs-theme');
            var next = cur === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-bs-theme', next);
            try { localStorage.setItem('admin-theme', next); } catch (e) {}
            setIcon(next);
        });
    }

    function initBurger() {
        var btn = document.getElementById('adBurger');
        var side = document.getElementById('adSidebar');
        if (btn && side) {
            btn.addEventListener('click', function () { side.classList.toggle('open'); });
        }
    }

    function renderLogin() {
        var shell = document.querySelector('.vm-shell');
        if (!shell) return;
        shell.classList.add('vm-shell-login');
        var errId = 'adLoginErr';
        shell.innerHTML = '' +
            '<div class="vm-login-wrap">' +
                '<div class="vm-login-card">' +
                    '<div class="vm-login-brand">' +
                        '<i class="bi bi-shield-lock-fill"></i>' +
                        '<div>' +
                            '<div class="vm-login-brand-name">Admin Panel</div>' +
                            '<div class="vm-login-brand-sub">VPSSIEUTOC.VN</div>' +
                        '</div>' +
                    '</div>' +
                    '<h2>Đăng nhập quản trị</h2>' +
                    '<p class="vm-login-tip">Chỉ tài khoản có vai trò <b>admin</b> mới có thể truy cập.</p>' +
                    '<form id="adLoginForm" data-form="admin-login" autocomplete="on">' +
                        '<label>Email</label>' +
                        '<div class="vm-login-field"><i class="bi bi-envelope"></i>' +
                            '<input type="email" name="email" required placeholder="admin@vps.test" autocomplete="username">' +
                        '</div>' +
                        '<label>Mật khẩu</label>' +
                        '<div class="vm-login-field"><i class="bi bi-lock"></i>' +
                            '<input type="password" name="password" required placeholder="••••••••" autocomplete="current-password">' +
                        '</div>' +
                        '<div class="vm-login-row">' +
                            '<label><input type="checkbox" name="remember" checked> Ghi nhớ đăng nhập</label>' +
                        '</div>' +
                        '<div id="' + errId + '" class="vm-login-err" hidden></div>' +
                        '<button type="submit" class="vm-login-submit" id="adLoginBtn">' +
                            '<i class="bi bi-box-arrow-in-right"></i> <span>Đăng nhập</span>' +
                        '</button>' +
                    '</form>' +
                    '<div class="vm-login-foot">' +
                        '<a href="index.html"><i class="bi bi-arrow-left"></i> Về trang chủ</a>' +
                    '</div>' +
                '</div>' +
            '</div>';
        var form = document.getElementById('adLoginForm');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var fd = new FormData(form);
                var email = fd.get('email');
                var pwd = fd.get('password');
                var remember = fd.get('remember') === 'on';
                var err = document.getElementById(errId);
                var btn = document.getElementById('adLoginBtn');
                var btnSpan = btn && btn.querySelector('span');
                if (btn) { btn.disabled = true; if (btnSpan) btnSpan.textContent = 'Đang đăng nhập…'; }
                // nhờ setTimeout để UI cập nhật trước
                setTimeout(function () {
                    try {
                        var user = Session.login(email, pwd);
                        if (!user || user.role !== 'admin') {
                            Session.logout();
                            throw new Error('Tài khoản không có quyền admin');
                        }
                        try { localStorage.setItem('vpssieutoc_remember', remember ? '1' : '0'); } catch (_) {}
                        // Reload để boot lại với session admin
                        window.location.reload();
                    } catch (ex) {
                        if (err) {
                            err.hidden = false;
                            err.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i> ' + (ex.message || 'Đăng nhập thất bại');
                        }
                        if (btn) { btn.disabled = false; if (btnSpan) btnSpan.textContent = 'Đăng nhập'; }
                    }
                }, 80);
            });
        }
    }

    function boot() {
        var user = Session.current();
        if (!user || user.role !== 'admin') {
            // Auto-logout nếu đang nhầm session customer
            if (user && user.role !== 'admin') Session.logout();
            renderLogin();
            return;
        }

        var shell = document.querySelector('.vm-shell');
        if (shell) shell.classList.remove('vm-shell-login');
        renderNav();
        initTheme();
        initBurger();
        if (!window.AdminRouter) {
            console.error('[admin] AdminRouter chưa được load');
            return;
        }
        AdminRouter.init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();

window.App = window.App || {};
window.App['admin-login'] = function () {};
