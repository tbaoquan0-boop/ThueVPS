/* =========================================================
   admin/orders.js — Quản lý đơn hàng (CRUD thật)
   ========================================================= */
'use strict';

(function () {
    var esc = window.AdminUI.escapeHTML;
    var ui = window.AdminUI;
    var vnd = function (n) { return (n || 0).toLocaleString('vi-VN') + '₫'; };

    var filters = { q: '', status: 'all' };

    function seedIfEmpty() {
        var orders = DB.all('orders');
        if (orders.length > 0) return;
        var adminUser = DB.findWhere('users', function (u) { return u.role === 'customer'; });
        var samples = [
            { user_id: adminUser ? adminUser.id : 2, plan_id: 2, cycle: 1, total: 89000, status: 'paid' },
            { user_id: adminUser ? adminUser.id : 2, plan_id: 4, cycle: 12, total: 1140000, status: 'paid' },
            { user_id: adminUser ? adminUser.id : 2, plan_id: 11, cycle: 1, total: 1890000, status: 'pending' },
        ];
        var now = Date.now();
        samples.forEach(function (o, i) {
            var id = 'ORD-' + (now + i);
            DB.insert('orders', Object.assign({}, o, { id: id, created_at: new Date(now - i * 86400000).toISOString() }));
        });
    }

    function statusBadge(s) {
        var map = {
            paid:     '<span class="vm-badge success"><i class="bi bi-check2"></i> Đã thanh toán</span>',
            pending:  '<span class="vm-badge warn"><i class="bi bi-clock"></i> Chờ thanh toán</span>',
            failed:   '<span class="vm-badge danger"><i class="bi bi-x"></i> Thất bại</span>',
            refunded: '<span class="vm-badge info"><i class="bi bi-arrow-counterclockwise"></i> Hoàn tiền</span>',
            cancelled:'<span class="vm-badge muted"><i class="bi bi-slash-circle"></i> Đã hủy</span>',
        };
        return map[s] || '<span class="vm-badge muted">' + esc(s || '') + '</span>';
    }

    function planName(id) {
        var p = DB.find('plans', id);
        return p ? p.name : ('#' + id);
    }
    function userName(id) {
        var u = DB.find('users', id);
        return u ? u.name : ('User #' + id);
    }

    function getFiltered() {
        var q = (filters.q || '').toLowerCase();
        return DB.all('orders').filter(function (o) {
            if (filters.status !== 'all' && o.status !== filters.status) return false;
            if (q) {
                var hay = (o.id + ' ' + userName(o.user_id) + ' ' + planName(o.plan_id)).toLowerCase();
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        });
    }

    function orderForm(order) {
        var plans = DB.all('plans');
        var users = DB.filter('users', function (u) { return u.role !== 'admin' || (order && u.id === order.user_id); });
        var isEdit = !!order;
        ui.formModal({
            title: isEdit ? 'Sửa đơn hàng ' + order.id : 'Tạo đơn hàng',
            okText: isEdit ? 'Cập nhật' : 'Tạo',
            fields: [
                { name: 'user_id', label: 'Khách hàng', type: 'select', required: true, value: order && order.user_id, options: users.map(function (u) { return { value: u.id, label: u.name + ' (' + u.email + ')' }; }) },
                { name: 'plan_id', label: 'Gói dịch vụ', type: 'select', required: true, value: order && order.plan_id, options: plans.map(function (p) { return { value: p.id, label: p.name }; }) },
                { name: 'cycle', label: 'Chu kỳ (tháng)', type: 'number', required: true, value: order ? order.cycle : 1 },
                { name: 'total', label: 'Tổng tiền (₫)', type: 'number', required: true, value: order ? order.total : 0 },
                { name: 'status', label: 'Trạng thái', type: 'select', value: order ? order.status : 'pending', options: [
                    { value: 'pending', label: 'Chờ thanh toán' },
                    { value: 'paid', label: 'Đã thanh toán' },
                    { value: 'failed', label: 'Thất bại' },
                    { value: 'cancelled', label: 'Đã hủy' },
                    { value: 'refunded', label: 'Hoàn tiền' },
                ]},
            ],
            onSubmit: function (vals) {
                var uid = Number(vals.user_id);
                var pid = Number(vals.plan_id);
                var cycle = Number(vals.cycle) || 1;
                var total = Number(vals.total) || 0;
                if (!uid) throw new Error('Chọn khách hàng');
                if (!pid) throw new Error('Chọn gói');
                if (cycle < 1) throw new Error('Chu kỳ phải >= 1');
                if (isEdit) {
                    var prev = order;
                    DB.update('orders', order.id, {
                        user_id: uid, plan_id: pid, cycle: cycle, total: total, status: vals.status,
                    });
                    // Nếu đổi từ pending -> paid: cộng tiền vào ví user (chưa cộng trước đó)
                    if (prev.status !== 'paid' && vals.status === 'paid') {
                        var u = DB.find('users', uid);
                        if (u) DB.update('users', u.id, { balance: (u.balance || 0) }); // no-op, ta không tự trừ tiền user
                    }
                    ui.toast('Đã cập nhật ' + order.id, 'success');
                } else {
                    var oid = 'ORD-' + Date.now();
                    DB.insert('orders', {
                        id: oid, user_id: uid, plan_id: pid, cycle: cycle, total: total,
                        status: vals.status, created_at: new Date().toISOString(),
                    });
                    ui.toast('Đã tạo ' + oid, 'success');
                }
                ui.rerender();
            }
        });
    }

    function render() {
        seedIfEmpty();
        var orders = getFiltered();
        var all = DB.all('orders');
        var totalRev = all.reduce(function (s, o) { return s + (o.status === 'paid' ? (o.total || 0) : 0); }, 0);

        var rows = orders.map(function (o) {
            return '<tr>' +
                '<td><b>' + esc(o.id) + '</b>' +
                    '<div style="color:var(--vm-muted);font-size:.72rem">' + esc((o.created_at || '').slice(0, 10)) + '</div></td>' +
                '<td>' + esc(userName(o.user_id)) + '</td>' +
                '<td>' + esc(planName(o.plan_id)) + ' <span class="vm-muted">· ' + o.cycle + ' tháng</span></td>' +
                '<td><b>' + vnd(o.total) + '</b></td>' +
                '<td>' + statusBadge(o.status) + '</td>' +
                '<td style="white-space:nowrap">' +
                    '<button class="vm-btn sm" data-action="view" data-id="' + esc(o.id) + '" title="Xem"><i class="bi bi-eye"></i></button> ' +
                    '<button class="vm-btn sm" data-action="edit" data-id="' + esc(o.id) + '" title="Sửa"><i class="bi bi-pencil"></i></button> ' +
                    (o.status === 'pending'
                        ? '<button class="vm-btn sm" data-action="approve" data-id="' + esc(o.id) + '" title="Duyệt" style="color:var(--vm-success)"><i class="bi bi-check2-circle"></i></button> ' +
                          '<button class="vm-btn sm danger" data-action="cancel" data-id="' + esc(o.id) + '" title="Hủy"><i class="bi bi-x-circle"></i></button>'
                        : '') +
                    (o.status === 'paid'
                        ? '<button class="vm-btn sm" data-action="refund" data-id="' + esc(o.id) + '" title="Hoàn tiền"><i class="bi bi-arrow-counterclockwise"></i></button>'
                        : '') +
                '</td>' +
            '</tr>';
        }).join('');

        return '' +
            '<div class="vm-page-head">' +
                '<div><h1>Đơn hàng</h1><p>Theo dõi và xử lý đơn đặt dịch vụ</p></div>' +
                '<div class="vm-page-actions">' +
                    '<button class="vm-btn" data-action="reset-filter"><i class="bi bi-x-circle"></i> Reset</button>' +
                    '<button class="vm-btn primary" data-action="add"><i class="bi bi-plus-lg"></i> Tạo đơn</button>' +
                '</div>' +
            '</div>' +
            '<div class="vm-kpi-grid">' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Tổng đơn</div></div><div class="vm-kpi-val">' + all.length + '</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Đã thanh toán</div></div><div class="vm-kpi-val" style="color:var(--vm-success)">' + all.filter(function (o) { return o.status === 'paid'; }).length + '</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Chờ thanh toán</div></div><div class="vm-kpi-val" style="color:var(--vm-warn)">' + all.filter(function (o) { return o.status === 'pending'; }).length + '</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Doanh thu</div></div><div class="vm-kpi-val">' + vnd(totalRev) + '</div></div>' +
            '</div>' +
            '<div class="vm-filterbar">' +
                '<input id="ord-q" placeholder="Tìm mã đơn, user, gói…" value="' + esc(filters.q) + '">' +
                '<select id="ord-status">' +
                    '<option value="all"' + (filters.status === 'all' ? ' selected' : '') + '>Tất cả trạng thái</option>' +
                    '<option value="pending"' + (filters.status === 'pending' ? ' selected' : '') + '>Chờ thanh toán</option>' +
                    '<option value="paid"' + (filters.status === 'paid' ? ' selected' : '') + '>Đã thanh toán</option>' +
                    '<option value="failed"' + (filters.status === 'failed' ? ' selected' : '') + '>Thất bại</option>' +
                    '<option value="cancelled"' + (filters.status === 'cancelled' ? ' selected' : '') + '>Đã hủy</option>' +
                    '<option value="refunded"' + (filters.status === 'refunded' ? ' selected' : '') + '>Hoàn tiền</option>' +
                '</select>' +
            '</div>' +
            '<div class="vm-card">' +
                '<div class="vm-card-body tight">' +
                    (orders.length === 0
                        ? '<div class="vm-empty">Không có đơn hàng nào.</div>'
                        : '<table class="vm-table">' +
                            '<thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Gói · Chu kỳ</th><th>Tổng</th><th>Trạng thái</th><th></th></tr></thead>' +
                            '<tbody>' + rows + '</tbody>' +
                          '</table>') +
                '</div>' +
            '</div>';
    }

    function handleAction(action, id) {
        var order = id ? DB.findWhere('orders', function (o) { return o.id === id; }) : null;
        if (action === 'add') orderForm(null);
        else if (action === 'edit' && order) orderForm(order);
        else if (action === 'view' && order) {
            ui.Modal({
                title: 'Đơn hàng ' + order.id,
                body: '<table class="vm-table"><tbody>' +
                    '<tr><td style="color:var(--vm-muted)">Khách hàng</td><td>' + esc(userName(order.user_id)) + '</td></tr>' +
                    '<tr><td style="color:var(--vm-muted)">Gói</td><td>' + esc(planName(order.plan_id)) + ' · ' + order.cycle + ' tháng</td></tr>' +
                    '<tr><td style="color:var(--vm-muted)">Tổng</td><td><b>' + vnd(order.total) + '</b></td></tr>' +
                    '<tr><td style="color:var(--vm-muted)">Trạng thái</td><td>' + statusBadge(order.status) + '</td></tr>' +
                    '<tr><td style="color:var(--vm-muted)">Ngày tạo</td><td>' + esc((order.created_at || '').slice(0, 19).replace('T', ' ')) + '</td></tr>' +
                    '</tbody></table>',
                footer: '<button type="button" class="ad-btn" data-act="ok">Đóng</button>',
            });
            var m = document.getElementById('adModalRoot').lastChild;
            var okBtn = m.querySelector('[data-act=ok]');
            if (okBtn) okBtn.addEventListener('click', function () { ui.closeModal(); });
        }
        else if (action === 'approve' && order && order.status === 'pending') {
            ui.confirm({
                title: 'Duyệt đơn hàng',
                message: 'Xác nhận duyệt thanh toán cho đơn ' + order.id + '?',
                okText: 'Duyệt',
                onOk: function () {
                    DB.update('orders', order.id, { status: 'paid' });
                    ui.toast('Đã duyệt ' + order.id, 'success');
                    ui.rerender();
                }
            });
        }
        else if (action === 'cancel' && order && order.status === 'pending') {
            ui.confirm({
                title: 'Hủy đơn hàng',
                message: 'Hủy đơn ' + order.id + '?',
                danger: true, okText: 'Hủy đơn',
                onOk: function () {
                    DB.update('orders', order.id, { status: 'cancelled' });
                    ui.toast('Đã hủy ' + order.id, 'warn');
                    ui.rerender();
                }
            });
        }
        else if (action === 'refund' && order && order.status === 'paid') {
            ui.confirm({
                title: 'Hoàn tiền',
                message: 'Hoàn ' + vnd(order.total) + ' cho đơn ' + order.id + '? Đơn sẽ chuyển sang trạng thái Hoàn tiền.',
                okText: 'Hoàn tiền',
                onOk: function () {
                    DB.update('orders', order.id, { status: 'refunded' });
                    ui.toast('Đã hoàn tiền ' + order.id, 'success');
                    ui.rerender();
                }
            });
        }
    }

    AdminRouter.onRender(function (path) {
        if (path !== '/orders') return;
        var q = document.getElementById('ord-q');
        if (q) q.addEventListener('input', function () { filters.q = q.value; ui.rerender(); setTimeout(function () { var n = document.getElementById('ord-q'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 0); });
        var st = document.getElementById('ord-status');
        if (st) st.addEventListener('change', function () { filters.status = st.value; ui.rerender(); });
        var content = document.getElementById('adContent');
        if (!content) return;
        content.querySelectorAll('[data-action]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var action = btn.dataset.action;
                var id = btn.dataset.id || null;
                if (action === 'reset-filter') { filters.q = ''; filters.status = 'all'; ui.rerender(); return; }
                handleAction(action, id);
            });
        });
    });

    AdminRouter.add('/orders', 'Đơn hàng', render);
})();