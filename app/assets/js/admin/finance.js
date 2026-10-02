/* =========================================================
   admin/finance.js — Tài chính / Giao dịch (CRUD thật)
   ========================================================= */
'use strict';

(function () {
    var esc = window.AdminUI.escapeHTML;
    var ui = window.AdminUI;
    var vnd = function (n) { return (n || 0).toLocaleString('vi-VN') + '₫'; };

    var filters = { q: '', type: 'all', status: 'all' };

    function seedIfEmpty() {
        if (DB.all('transactions').length > 0) return;
        var firstCust = DB.findWhere('users', function (u) { return u.role === 'customer'; });
        var uid = firstCust ? firstCust.id : 2;
        var now = Date.now();
        [
            { type:'deposit', amount: 5000000, method:'Vietcombank', status:'success', hours:1 },
            { type:'order',   amount: -89000,  method:'Ví',          status:'success', hours:2 },
            { type:'deposit', amount: 2000000, method:'Momo',        status:'success', hours:3 },
            { type:'deposit', amount: 1500000, method:'Vietcombank', status:'pending', hours:5 },
            { type:'refund',  amount: 680000,   method:'Ví',          status:'success', hours:8 },
        ].forEach(function (t, i) {
            var id = DB.all('transactions').length ? Math.max.apply(null, DB.all('transactions').map(function (x) { return x.id; })) + 1 : 1;
            DB.insert('transactions', {
                id: id, user_id: uid, type: t.type, amount: t.amount, method: t.method, status: t.status,
                balance_after: null, ref_id: null,
                created_at: new Date(now - t.hours * 3600000).toISOString(),
                note: '',
            });
        });
    }

    function typeBadge(t) {
        var map = {
            deposit:  '<span class="vm-badge info"><i class="bi bi-arrow-down-left"></i> Nạp tiền</span>',
            order:    '<span class="vm-badge muted"><i class="bi bi-receipt"></i> Đơn hàng</span>',
            refund:   '<span class="vm-badge warn"><i class="bi bi-arrow-counterclockwise"></i> Hoàn tiền</span>',
            withdraw: '<span class="vm-badge danger"><i class="bi bi-arrow-up-right"></i> Rút tiền</span>',
            adjust:   '<span class="vm-badge muted"><i class="bi bi-pencil"></i> Điều chỉnh</span>',
        };
        return map[t] || '<span class="vm-badge muted">' + esc(t || '') + '</span>';
    }
    function statusBadge(s) {
        if (s === 'success') return '<span class="vm-badge success">Thành công</span>';
        if (s === 'pending') return '<span class="vm-badge warn">Đang xử lý</span>';
        if (s === 'failed')  return '<span class="vm-badge danger">Thất bại</span>';
        return '<span class="vm-badge muted">' + esc(s || '') + '</span>';
    }
    function userName(id) {
        var u = DB.find('users', id);
        return u ? (u.name + ' (' + u.email + ')') : ('User #' + id);
    }

    function getFiltered() {
        var q = (filters.q || '').toLowerCase();
        return DB.all('transactions').filter(function (t) {
            if (filters.type !== 'all' && t.type !== filters.type) return false;
            if (filters.status !== 'all' && t.status !== filters.status) return false;
            if (q) {
                var hay = (String(t.id) + ' ' + userName(t.user_id) + ' ' + (t.method || '') + ' ' + (t.note || '')).toLowerCase();
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        });
    }

    function adjustForm() {
        var users = DB.filter('users', function (u) { return u.role !== 'admin'; });
        ui.formModal({
            title: 'Điều chỉnh số dư',
            okText: 'Thực hiện',
            fields: [
                { name: 'user_id', label: 'Khách hàng', type: 'select', required: true, options: users.map(function (u) { return { value: u.id, label: u.name + ' (' + u.email + ') · số dư: ' + vnd(u.balance) }; }) },
                { name: 'type', label: 'Loại', type: 'select', required: true, value: 'deposit', options: [
                    { value: 'deposit', label: 'Nạp tiền (+)' },
                    { value: 'withdraw', label: 'Trừ tiền (−)' },
                    { value: 'adjust', label: 'Điều chỉnh (set)' },
                ]},
                { name: 'amount', label: 'Số tiền (₫)', type: 'number', required: true, placeholder: '0' },
                { name: 'note', label: 'Ghi chú', type: 'textarea', placeholder: 'Lý do điều chỉnh…' },
            ],
            onSubmit: function (vals) {
                var uid = Number(vals.user_id);
                var u = DB.find('users', uid);
                if (!u) throw new Error('User không tồn tại');
                var amt = Number(vals.amount) || 0;
                if (amt <= 0) throw new Error('Số tiền phải > 0');
                var delta = 0;
                if (vals.type === 'deposit') delta = amt;
                else if (vals.type === 'withdraw') delta = -amt;
                else if (vals.type === 'adjust') delta = amt - (u.balance || 0);
                var newBal = (u.balance || 0) + delta;
                if (newBal < 0) throw new Error('Số dư không đủ để trừ');
                DB.update('users', uid, { balance: newBal });
                var tid = DB.all('transactions').length ? Math.max.apply(null, DB.all('transactions').map(function (x) { return x.id; })) + 1 : 1;
                DB.insert('transactions', {
                    id: tid, user_id: uid, type: vals.type, amount: delta, method: 'Admin',
                    status: 'success', balance_after: newBal, ref_id: null,
                    created_at: new Date().toISOString(), note: vals.note || 'Admin điều chỉnh',
                });
                ui.toast('Đã cập nhật ví ' + u.name + ' → ' + vnd(newBal), 'success');
                ui.rerender();
            }
        });
    }

    function render() {
        seedIfEmpty();
        var txs = getFiltered();
        var all = DB.all('transactions');
        var totalIn = all.filter(function (t) { return t.amount > 0 && t.status === 'success'; }).reduce(function (s, t) { return s + t.amount; }, 0);
        var totalOut = Math.abs(all.filter(function (t) { return t.amount < 0 && t.status === 'success'; }).reduce(function (s, t) { return s + t.amount; }, 0));
        var profit = totalIn - totalOut;
        var pendingCount = all.filter(function (t) { return t.status === 'pending'; }).length;

        var rows = txs.map(function (t) {
            var color = t.amount >= 0 ? 'var(--vm-success)' : 'var(--vm-danger)';
            var sign = t.amount >= 0 ? '+' : '';
            return '<tr>' +
                '<td><b>#' + esc(String(t.id)) + '</b></td>' +
                '<td>' + typeBadge(t.type) + '</td>' +
                '<td style="font-size:.82rem">' + esc(userName(t.user_id)) + '</td>' +
                '<td><b style="color:' + color + '">' + sign + vnd(t.amount) + '</b></td>' +
                '<td style="font-size:.82rem">' + esc(t.method || '—') + '</td>' +
                '<td>' + statusBadge(t.status) + '</td>' +
                '<td style="font-size:.78rem">' + esc((t.created_at || '').slice(0, 16).replace('T', ' ')) + '</td>' +
                '<td style="white-space:nowrap">' +
                    (t.status === 'pending'
                        ? '<button class="vm-btn sm" data-action="approve" data-id="' + t.id + '" title="Duyệt" style="color:var(--vm-success)"><i class="bi bi-check2"></i></button> ' +
                          '<button class="vm-btn sm danger" data-action="reject" data-id="' + t.id + '" title="Từ chối"><i class="bi bi-x"></i></button>'
                        : '') +
                    '<button class="vm-btn sm" data-action="delete" data-id="' + t.id + '" title="Xóa"><i class="bi bi-trash"></i></button>' +
                '</td>' +
            '</tr>';
        }).join('');

        return '' +
            '<div class="vm-page-head">' +
                '<div><h1>Tài chính</h1><p>Theo dõi dòng tiền vào/ra và các giao dịch</p></div>' +
                '<div class="vm-page-actions">' +
                    '<button class="vm-btn" data-action="reset-filter"><i class="bi bi-x-circle"></i> Reset</button>' +
                    '<button class="vm-btn primary" data-action="adjust"><i class="bi bi-cash-coin"></i> Điều chỉnh số dư</button>' +
                '</div>' +
            '</div>' +

            '<div class="vm-kpi-grid">' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Tổng tiền vào</div></div><div class="vm-kpi-val" style="color:var(--vm-success)">' + vnd(totalIn) + '</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Tổng tiền ra</div></div><div class="vm-kpi-val" style="color:var(--vm-danger)">' + vnd(totalOut) + '</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Lợi nhuận ròng</div></div><div class="vm-kpi-val">' + vnd(profit) + '</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">GD chờ duyệt</div></div><div class="vm-kpi-val" style="color:var(--vm-warn)">' + pendingCount + '</div></div>' +
            '</div>' +

            '<div class="vm-filterbar">' +
                '<input id="fin-q" placeholder="Tìm mã GD, user, ghi chú…" value="' + esc(filters.q) + '">' +
                '<select id="fin-type">' +
                    '<option value="all">Tất cả loại</option>' +
                    '<option value="deposit"' + (filters.type === 'deposit' ? ' selected' : '') + '>Nạp tiền</option>' +
                    '<option value="withdraw"' + (filters.type === 'withdraw' ? ' selected' : '') + '>Rút tiền</option>' +
                    '<option value="order"' + (filters.type === 'order' ? ' selected' : '') + '>Đơn hàng</option>' +
                    '<option value="refund"' + (filters.type === 'refund' ? ' selected' : '') + '>Hoàn tiền</option>' +
                    '<option value="adjust"' + (filters.type === 'adjust' ? ' selected' : '') + '>Điều chỉnh</option>' +
                '</select>' +
                '<select id="fin-status">' +
                    '<option value="all">Tất cả trạng thái</option>' +
                    '<option value="success"' + (filters.status === 'success' ? ' selected' : '') + '>Thành công</option>' +
                    '<option value="pending"' + (filters.status === 'pending' ? ' selected' : '') + '>Đang xử lý</option>' +
                    '<option value="failed"' + (filters.status === 'failed' ? ' selected' : '') + '>Thất bại</option>' +
                '</select>' +
            '</div>' +

            '<div class="vm-card">' +
                '<div class="vm-card-body tight">' +
                    (txs.length === 0
                        ? '<div class="vm-empty">Không có giao dịch nào.</div>'
                        : '<table class="vm-table">' +
                            '<thead><tr><th>Mã GD</th><th>Loại</th><th>User</th><th>Số tiền</th><th>Phương thức</th><th>Trạng thái</th><th>Thời gian</th><th></th></tr></thead>' +
                            '<tbody>' + rows + '</tbody>' +
                          '</table>') +
                '</div>' +
            '</div>';
    }

    AdminRouter.onRender(function (path) {
        if (path !== '/finance') return;
        var q = document.getElementById('fin-q');
        if (q) q.addEventListener('input', function () { filters.q = q.value; ui.rerender(); setTimeout(function () { var n = document.getElementById('fin-q'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 0); });
        var tp = document.getElementById('fin-type');
        if (tp) tp.addEventListener('change', function () { filters.type = tp.value; ui.rerender(); });
        var st = document.getElementById('fin-status');
        if (st) st.addEventListener('change', function () { filters.status = st.value; ui.rerender(); });

        var content = document.getElementById('adContent');
        if (!content) return;
        content.querySelectorAll('[data-action]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var action = btn.dataset.action;
                var id = btn.dataset.id ? Number(btn.dataset.id) : null;
                var tx = id ? DB.findWhere('transactions', function (t) { return t.id === id; }) : null;
                if (action === 'adjust') adjustForm();
                else if (action === 'reset-filter') { filters.q = ''; filters.type = 'all'; filters.status = 'all'; ui.rerender(); }
                else if (action === 'approve' && tx && tx.status === 'pending') {
                    var u = DB.find('users', tx.user_id);
                    if (u && tx.amount > 0) DB.update('users', u.id, { balance: (u.balance || 0) + tx.amount });
                    DB.update('transactions', tx.id, { status: 'success', balance_after: u ? (u.balance || 0) + tx.amount : null });
                    ui.toast('Đã duyệt GD #' + tx.id, 'success'); ui.rerender();
                }
                else if (action === 'reject' && tx && tx.status === 'pending') {
                    ui.confirm({ title: 'Từ chối giao dịch', message: 'Từ chối GD #' + tx.id + '?', danger: true, okText: 'Từ chối',
                        onOk: function () {
                            DB.update('transactions', tx.id, { status: 'failed' });
                            ui.toast('Đã từ chối GD #' + tx.id, 'warn'); ui.rerender();
                        }
                    });
                }
                else if (action === 'delete' && tx) {
                    ui.confirm({ title: 'Xóa giao dịch', message: 'Xóa GD #' + tx.id + '? Hành động này không thể hoàn tác.', danger: true, okText: 'Xóa',
                        onOk: function () {
                            DB.remove('transactions', tx.id);
                            ui.toast('Đã xóa GD #' + tx.id, 'success'); ui.rerender();
                        }
                    });
                }
            });
        });
    });

    AdminRouter.add('/finance', 'Tài chính', render);
})();