/* =========================================================
   admin/users.js — Quản lý người dùng (CRUD thật)
   ========================================================= */
'use strict';

(function () {
    var esc = window.AdminUI.escapeHTML;
    var ui = window.AdminUI;

    var filters = { q: '', role: 'all', status: 'all' };

    function initials(name, email) {
        var src = name || email || '?';
        return src.split(' ').map(function (s) { return s[0] || ''; }).slice(0, 2).join('').toUpperCase() || '?';
    }
    function vnd(n) { return (n || 0).toLocaleString('vi-VN') + '₫'; }

    function seedIfEmpty() {
        var users = DB.all('users');
        if (users.length >= 2) return;
        var samples = [
            { id:1, name:'Admin',         email:'admin@taovps.vn',    balance:0,       role:'admin',   status:'active', password:'admin123', phone:'0900000000', created_at:'2025-01-10' },
            { id:2, name:'Nguyễn Văn A',  email:'nguyenvana@gmail.com',   balance:520000,   role:'customer',status:'active', password:'user123', phone:'0912345001', created_at:'2025-03-12' },
            { id:3, name:'Trần Thị B',    email:'tranb@example.com',      balance:2100000,  role:'customer',status:'active', password:'user123', phone:'0912345002', created_at:'2025-05-04' },
            { id:4, name:'Lê Văn C',      email:'levanc@gmail.com',       balance:0,        role:'customer',status:'locked', password:'user123', phone:'0912345003', created_at:'2025-09-20' },
            { id:5, name:'Phạm Thị D',    email:'phamthid@yahoo.com',     balance:840000,   role:'customer',status:'active', password:'user123', phone:'0912345004', created_at:'2025-11-02' },
        ];
        samples.forEach(function (u) { DB.insert('users', u); });
        DB.update('counters', null, { user: Math.max(DB.all('users').length, 5) });
    }

    function getFiltered() {
        var users = DB.all('users');
        var q = (filters.q || '').toLowerCase().trim();
        return users.filter(function (u) {
            if (filters.role !== 'all' && u.role !== filters.role) return false;
            if (filters.status !== 'all' && u.status !== filters.status) return false;
            if (q) {
                var hay = ((u.name || '') + ' ' + (u.email || '') + ' ' + (u.phone || '')).toLowerCase();
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        });
    }

    function userForm(user) {
        var isEdit = !!user;
        ui.formModal({
            title: isEdit ? 'Sửa người dùng' : 'Thêm người dùng',
            okText: isEdit ? 'Cập nhật' : 'Tạo',
            fields: [
                { name: 'name', label: 'Họ và tên', required: true, value: user && user.name, placeholder: 'Nguyễn Văn A' },
                { name: 'email', label: 'Email', type: 'email', required: true, value: user && user.email, placeholder: 'user@example.com' },
                { name: 'phone', label: 'Số điện thoại', value: user && user.phone, placeholder: '0912xxx' },
                { name: 'password', label: isEdit ? 'Mật khẩu (để trống giữ nguyên)' : 'Mật khẩu', type: 'password', value: '', placeholder: 'Tối thiểu 6 ký tự' },
                { name: 'role', label: 'Vai trò', type: 'select', value: user ? user.role : 'customer', options: [
                    { value: 'customer', label: 'Customer' },
                    { value: 'admin', label: 'Admin' },
                ]},
                { name: 'status', label: 'Trạng thái', type: 'select', value: user ? user.status : 'active', options: [
                    { value: 'active', label: 'Active' },
                    { value: 'locked', label: 'Bị khóa' },
                ]},
                { name: 'balance', label: 'Số dư ví (₫)', type: 'number', value: user ? user.balance : 0, placeholder: '0' },
            ],
            onSubmit: function (vals) {
                vals.name = (vals.name || '').trim();
                vals.email = (vals.email || '').trim();
                if (!vals.name) throw new Error('Họ tên không được trống');
                if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(vals.email)) throw new Error('Email không hợp lệ');
                var exists = DB.findWhere('users', function (u) { return u.email === vals.email && (!user || u.id !== user.id); });
                if (exists) throw new Error('Email đã tồn tại');
                if (isEdit) {
                    var patch = {
                        name: vals.name, email: vals.email, phone: vals.phone || '',
                        role: vals.role, status: vals.status, balance: Number(vals.balance) || 0,
                    };
                    if (vals.password) {
                        if (vals.password.length < 6) throw new Error('Mật khẩu tối thiểu 6 ký tự');
                        patch.password = vals.password;
                    }
                    DB.update('users', user.id, patch);
                    ui.toast('Đã cập nhật ' + vals.name, 'success');
                } else {
                    if (!vals.password || vals.password.length < 6) throw new Error('Mật khẩu tối thiểu 6 ký tự');
                    var id = DB.nextId('user');
                    DB.insert('users', {
                        id: id,
                        name: vals.name, email: vals.email, phone: vals.phone || '',
                        role: vals.role, status: vals.status, balance: Number(vals.balance) || 0,
                        password: vals.password,
                        created_at: new Date().toISOString(),
                    });
                    ui.toast('Đã tạo ' + vals.name, 'success');
                }
                ui.rerender();
            }
        });
    }

    function render() {
        seedIfEmpty();
        var users = getFiltered();
        var all = DB.all('users');
        var verified = all.filter(function (u) { return u.status === 'active'; }).length;
        var totalBal = all.reduce(function (s, u) { return s + (u.balance || 0); }, 0);

        var rows = users.map(function (u) {
            var st = u.status === 'locked'
                ? '<span class="vm-badge danger"><i class="bi bi-lock-fill"></i> Bị khóa</span>'
                : '<span class="vm-badge success"><i class="bi bi-patch-check-fill"></i> Active</span>';
            var roleBadge = u.role === 'admin'
                ? '<span class="vm-badge info">Admin</span>'
                : '<span class="vm-badge muted">User</span>';
            return '<tr>' +
                '<td><div class="vm-flex">' +
                    '<div class="vm-avatar">' + esc(initials(u.name, u.email)) + '</div>' +
                    '<div><b>' + esc(u.name || '—') + '</b>' +
                        '<div style="color:var(--vm-muted);font-size:.75rem">' + esc(u.email) + '</div>' +
                    '</div>' +
                '</div></td>' +
                '<td>' + roleBadge + '</td>' +
                '<td>' + st + '</td>' +
                '<td><b>' + vnd(u.balance) + '</b></td>' +
                '<td style="font-size:.78rem;color:var(--vm-muted)">' + (u.created_at ? String(u.created_at).slice(0, 10) : '—') + '</td>' +
                '<td style="white-space:nowrap">' +
                    '<button class="vm-btn sm" data-action="view" data-id="' + u.id + '" title="Xem"><i class="bi bi-eye"></i></button> ' +
                    '<button class="vm-btn sm" data-action="edit" data-id="' + u.id + '" title="Sửa"><i class="bi bi-pencil"></i></button> ' +
                    '<button class="vm-btn sm" data-action="toggle" data-id="' + u.id + '" title="' + (u.status === 'locked' ? 'Mở khóa' : 'Khóa') + '"><i class="bi bi-' + (u.status === 'locked' ? 'unlock' : 'slash-circle') + '"></i></button> ' +
                    '<button class="vm-btn sm danger" data-action="delete" data-id="' + u.id + '" title="Xóa"><i class="bi bi-trash"></i></button>' +
                '</td>' +
            '</tr>';
        }).join('');

        return '' +
            '<div class="vm-page-head">' +
                '<div><h1>Người dùng</h1><p>Quản lý tài khoản khách hàng và quyền truy cập</p></div>' +
                '<div class="vm-page-actions">' +
                    '<button class="vm-btn" data-action="reset-filter" title="Xóa bộ lọc"><i class="bi bi-x-circle"></i> Reset</button>' +
                    '<button class="vm-btn primary" data-action="add"><i class="bi bi-plus-lg"></i> Thêm user</button>' +
                '</div>' +
            '</div>' +

            '<div class="vm-kpi-grid">' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Tổng user</div></div><div class="vm-kpi-val">' + all.length.toLocaleString('vi-VN') + '</div><div class="vm-kpi-sub">' + users.length + ' sau lọc</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Đang hoạt động</div></div><div class="vm-kpi-val">' + verified + '</div><div class="vm-kpi-sub">' + (all.length ? Math.round(verified / all.length * 100) : 0) + '% tổng số</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Admin</div></div><div class="vm-kpi-val">' + all.filter(function (u) { return u.role === 'admin'; }).length + '</div><div class="vm-kpi-sub">Quyền quản trị</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Tổng số dư ví</div></div><div class="vm-kpi-val">' + vnd(totalBal) + '</div></div>' +
            '</div>' +

            '<div class="vm-filterbar">' +
                '<input id="user-q" placeholder="Tìm theo email, tên, SĐT…" value="' + esc(filters.q) + '">' +
                '<select id="user-role">' +
                    '<option value="all"' + (filters.role === 'all' ? ' selected' : '') + '>Tất cả vai trò</option>' +
                    '<option value="customer"' + (filters.role === 'customer' ? ' selected' : '') + '>Customer</option>' +
                    '<option value="admin"' + (filters.role === 'admin' ? ' selected' : '') + '>Admin</option>' +
                '</select>' +
                '<select id="user-status">' +
                    '<option value="all"' + (filters.status === 'all' ? ' selected' : '') + '>Tất cả trạng thái</option>' +
                    '<option value="active"' + (filters.status === 'active' ? ' selected' : '') + '>Active</option>' +
                    '<option value="locked"' + (filters.status === 'locked' ? ' selected' : '') + '>Bị khóa</option>' +
                '</select>' +
            '</div>' +
            '<div class="vm-card">' +
                '<div class="vm-card-body tight">' +
                    (users.length === 0
                        ? '<div class="vm-empty">Không có user nào khớp bộ lọc.</div>'
                        : '<table class="vm-table">' +
                            '<thead><tr><th>User</th><th>Vai trò</th><th>Trạng thái</th><th>Số dư ví</th><th>Ngày tạo</th><th></th></tr></thead>' +
                            '<tbody>' + rows + '</tbody>' +
                          '</table>') +
                '</div>' +
            '</div>';
    }

    AdminRouter.onRender(function (path) {
        if (path !== '/users') return;
        var q = document.getElementById('user-q');
        if (q) q.addEventListener('input', function () { filters.q = q.value; ui.rerender(); setTimeout(function () { var n = document.getElementById('user-q'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 0); });
        var role = document.getElementById('user-role');
        if (role) role.addEventListener('change', function () { filters.role = role.value; ui.rerender(); });
        var status = document.getElementById('user-status');
        if (status) status.addEventListener('change', function () { filters.status = status.value; ui.rerender(); });

        var content = document.getElementById('adContent');
        if (!content) return;
        content.querySelectorAll('[data-action]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var action = btn.dataset.action;
                var id = btn.dataset.id ? Number(btn.dataset.id) : null;
                var user = id ? DB.find('users', id) : null;
                if (action === 'add') userForm(null);
                else if (action === 'edit' && user) userForm(user);
                else if (action === 'toggle' && user) {
                    var next = user.status === 'locked' ? 'active' : 'locked';
                    DB.update('users', user.id, { status: next });
                    ui.toast(user.status === 'locked' ? 'Đã mở khóa ' + user.name : 'Đã khóa ' + user.name, next === 'locked' ? 'warn' : 'success');
                    ui.rerender();
                }
                else if (action === 'delete' && user) {
                    ui.confirm({
                        title: 'Xóa người dùng',
                        message: 'Xóa "' + user.name + '" (' + user.email + ')? Hành động này không thể hoàn tác.',
                        danger: true, okText: 'Xóa',
                        onOk: function () {
                            DB.remove('users', user.id);
                            ui.toast('Đã xóa ' + user.name, 'success');
                            ui.rerender();
                        }
                    });
                }
                else if (action === 'view' && user) {
                    var m = ui.Modal({
                        title: 'Thông tin người dùng',
                        body: '' +
                                '<div style="display:flex;gap:14px;align-items:center;margin-bottom:16px">' +
                                    '<div class="vm-avatar" style="width:56px;height:56px;font-size:1.3rem">' + esc(initials(user.name, user.email)) + '</div>' +
                                    '<div><div style="font-weight:700;font-size:1.05rem">' + esc(user.name) + '</div>' +
                                    '<div style="color:var(--vm-muted);font-size:.85rem">' + esc(user.email) + '</div></div>' +
                                '</div>' +
                                '<table class="vm-table">' +
                                '<tbody><tr><td style="color:var(--vm-muted)">Vai trò</td><td>' + (user.role === 'admin' ? 'Admin' : 'Customer') + '</td></tr>' +
                                '<tr><td style="color:var(--vm-muted)">Trạng thái</td><td>' + (user.status === 'locked' ? 'Bị khóa' : 'Active') + '</td></tr>' +
                                '<tr><td style="color:var(--vm-muted)">Số dư</td><td><b>' + vnd(user.balance) + '</b></td></tr>' +
                                '<tr><td style="color:var(--vm-muted)">Số điện thoại</td><td>' + esc(user.phone || '—') + '</td></tr>' +
                                '<tr><td style="color:var(--vm-muted)">Ngày tạo</td><td>' + esc(String(user.created_at || '—').slice(0, 10)) + '</td></tr></tbody></table>',
                        footer: '<button type="button" class="ad-btn" data-act="ok">Đóng</button>',
                    });
                    var okBtn = m.querySelector('[data-act=ok]');
                    if (okBtn) okBtn.addEventListener('click', function () { ui.closeModal(); });
                }
                else if (action === 'reset-filter') {
                    filters.q = ''; filters.role = 'all'; filters.status = 'all';
                    ui.rerender();
                }
            });
        });
    });

    AdminRouter.add('/users', 'Người dùng', render);
})();