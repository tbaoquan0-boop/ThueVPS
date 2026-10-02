/* =========================================================
   admin.js — Boot UI: render sidebar, topbar search & start router
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

        // Tự động đóng sidebar khi click link trên màn hình di động
        nav.querySelectorAll('.vm-nav-link').forEach(function (link) {
            link.addEventListener('click', function () {
                var side = document.getElementById('adSidebar');
                if (side && window.innerWidth <= 992) {
                    side.classList.remove('open');
                }
            });
        });
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
        var backdrop = document.getElementById('adSidebarBackdrop');

        if (btn && side) {
            btn.addEventListener('click', function () {
                side.classList.toggle('open');
            });
        }
        if (backdrop && side) {
            backdrop.addEventListener('click', function () {
                side.classList.remove('open');
            });
        }
    }

    function initUserTopbar(user) {
        var nameEl = document.getElementById('adUserName');
        var avatarEl = document.getElementById('adUserAvatar');
        var roleEl = document.getElementById('adUserRole');
        var logoutBtn = document.getElementById('adLogoutBtn');

        if (nameEl) nameEl.textContent = user.name || 'Admin';
        if (avatarEl) avatarEl.textContent = (user.name || 'A').charAt(0).toUpperCase();
        if (roleEl) roleEl.innerHTML = '<span class="vm-badge-status ready" style="font-size:10px;padding:2px 6px">Admin</span>';

        if (logoutBtn) {
            logoutBtn.addEventListener('click', function () {
                if (window.AdminUI && AdminUI.confirm) {
                    AdminUI.confirm({
                        title: 'Đăng xuất',
                        message: 'Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị?',
                        okText: 'Đăng xuất',
                        onOk: function () {
                            AdminSession.logout();
                            window.location.reload();
                        }
                    });
                } else {
                    AdminSession.logout();
                    window.location.reload();
                }
            });
        }
    }

    function initGlobalSearch() {
        var input = document.getElementById('adTopSearch');
        if (!input) return;

        // Global hotkey: Ctrl+K hoặc Cmd+K
        window.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                input.focus();
                input.select();
            }
        });

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                var q = (input.value || '').trim().toLowerCase();
                if (!q) return;

                if (q.indexOf('ord-') === 0 || q.indexOf('đơn') === 0) {
                    window.location.hash = '#/orders';
                } else if (q.indexOf('tkt-') === 0 || q.indexOf('hỗ trợ') === 0 || q.indexOf('vé') === 0) {
                    window.location.hash = '#/tickets';
                } else if (q.indexOf('vps') >= 0 || q.indexOf('sv-') === 0 || q.indexOf('server') >= 0 || q.indexOf('máy chủ') >= 0) {
                    window.location.hash = '#/servers';
                } else if (q.indexOf('gói') >= 0 || q.indexOf('plan') >= 0) {
                    window.location.hash = '#/plans';
                } else if (q.indexOf('tiền') >= 0 || q.indexOf('ví') >= 0 || q.indexOf('nạp') >= 0 || q.indexOf('tài chính') >= 0) {
                    window.location.hash = '#/finance';
                } else if (q.indexOf('chat') >= 0 || q.indexOf('tin nhắn') >= 0) {
                    window.location.hash = '#/chat';
                } else if (q.indexOf('user') >= 0 || q.indexOf('khách') >= 0 || q.indexOf('người dùng') >= 0 || q.indexOf('@') >= 0) {
                    window.location.hash = '#/users';
                } else if (q.indexOf('cài đặt') >= 0 || q.indexOf('setting') >= 0) {
                    window.location.hash = '#/settings';
                } else if (q.indexOf('bài') >= 0 || q.indexOf('nội dung') >= 0 || q.indexOf('blog') >= 0) {
                    window.location.hash = '#/content';
                } else {
                    // Mặc định tìm kiếm chung: chuyển sang dashboard hoặc orders
                    window.location.hash = '#/orders';
                }
                input.blur();
            }
        });
    }

    function initNotifications() {
        var notifBtn = document.getElementById('adNotifBtn');
        var badge = document.getElementById('adNotifBadge');
        if (!notifBtn) return;

        function updateBadge() {
            var orders = DB.all('orders');
            var tickets = DB.all('tickets');
            var txs = DB.all('transactions');

            var pendingOrders = orders.filter(function (o) { return o.status === 'pending'; }).length;
            var openTickets = tickets.filter(function (o) { return o.status === 'open'; }).length;
            var pendingTxs = txs.filter(function (t) { return t.status === 'pending'; }).length;
            var total = pendingOrders + openTickets + pendingTxs;

            if (badge) {
                if (total > 0) {
                    badge.textContent = total > 9 ? '9+' : total;
                    badge.hidden = false;
                } else {
                    badge.hidden = true;
                }
            }
            return { orders: pendingOrders, tickets: openTickets, txs: pendingTxs, total: total };
        }

        updateBadge();

        notifBtn.addEventListener('click', function () {
            var counts = updateBadge();
            var body = document.createElement('div');
            body.innerHTML = '' +
                '<div style="font-size:.9rem;line-height:1.6">' +
                    (counts.total === 0
                        ? '<div style="text-align:center;padding:24px 10px;color:var(--vm-muted,#8b949e)">' +
                            '<i class="bi bi-shield-check" style="font-size:2.2rem;color:var(--vm-success,#10b981);display:block;margin-bottom:8px"></i>' +
                            '<b>Tất cả đều ổn!</b><div style="font-size:.82rem;margin-top:4px">Không có đơn hàng, ticket hay giao dịch nào đang chờ xử lý.</div>' +
                          '</div>'
                        : '<div style="display:flex;flex-direction:column;gap:10px">' +
                            (counts.orders > 0
                                ? '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:var(--vm-surface-2,#141b2a);border-radius:10px;border-left:3px solid var(--vm-accent,#3b82f6)">' +
                                    '<div><b>' + counts.orders + '</b> đơn hàng đang chờ duyệt kích hoạt</div>' +
                                    '<a href="#/orders" class="vm-btn sm primary" data-close-modal="1">Xem ngay</a>' +
                                  '</div>'
                                : '') +
                            (counts.tickets > 0
                                ? '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:var(--vm-surface-2,#141b2a);border-radius:10px;border-left:3px solid var(--vm-danger,#ef4444)">' +
                                    '<div><b>' + counts.tickets + '</b> ticket hỗ trợ của khách hàng đang mở</div>' +
                                    '<a href="#/tickets" class="vm-btn sm danger" data-close-modal="1">Hỗ trợ</a>' +
                                  '</div>'
                                : '') +
                            (counts.txs > 0
                                ? '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:var(--vm-surface-2,#141b2a);border-radius:10px;border-left:3px solid var(--vm-warn,#f59e0b)">' +
                                    '<div><b>' + counts.txs + '</b> giao dịch nạp tiền chờ xác nhận</div>' +
                                    '<a href="#/finance" class="vm-btn sm warn" data-close-modal="1">Duyệt ví</a>' +
                                  '</div>'
                                : '') +
                          '</div>') +
                '</div>';

            var footer = '<button type="button" class="ad-btn" data-act="cancel">Đóng</button>';
            var m = window.AdminUI.Modal({ title: 'Thông báo & Tồn đọng', body: body, footer: footer, size: 'sm' });
            m.querySelector('[data-act=cancel]').addEventListener('click', function () { AdminUI.closeModal(); });
            m.querySelectorAll('[data-close-modal]').forEach(function (el) {
                el.addEventListener('click', function () { AdminUI.closeModal(); });
            });
        });
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
                            '<div class="vm-login-brand-sub">TáoVPS Web</div>' +
                        '</div>' +
                    '</div>' +
                    '<h2>Đăng nhập quản trị</h2>' +
                    '<p class="vm-login-tip">Chỉ tài khoản có vai trò <b>admin</b> mới có thể truy cập.</p>' +
                    '<form id="adLoginForm" data-form="admin-login" autocomplete="on">' +
                        '<label>Email quản trị</label>' +
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
                            '<i class="bi bi-box-arrow-in-right"></i> <span>Đăng nhập hệ thống</span>' +
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
                if (btn) { btn.disabled = true; if (btnSpan) btnSpan.textContent = 'Đang xác thực…'; }
                setTimeout(function () {
                    try {
                        var user = AdminSession.login(email, pwd);
                        try { localStorage.setItem('vpssieutoc_remember', remember ? '1' : '0'); } catch (_) {}
                        window.location.reload();
                    } catch (ex) {
                        if (err) {
                            err.hidden = false;
                            err.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i> ' + (ex.message || 'Đăng nhập thất bại');
                        }
                        if (btn) { btn.disabled = false; if (btnSpan) btnSpan.textContent = 'Đăng nhập hệ thống'; }
                    }
                }, 80);
            });
        }
    }

    function boot() {
        var user = AdminSession.current();
        if (!user) {
            renderLogin();
            return;
        }

        var shell = document.querySelector('.vm-shell');
        if (shell) shell.classList.remove('vm-shell-login');
        renderNav();
        initTheme();
        initBurger();
        initUserTopbar(user);
        initGlobalSearch();
        initNotifications();

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
