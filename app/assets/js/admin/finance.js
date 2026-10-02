/* =========================================================
   admin/finance.js — Tài chính & Quản lý Dòng tiền (CRUD thật)
   ========================================================= */
'use strict';

(function () {
    var esc = (window.AdminUI && window.AdminUI.escapeHTML) || window.escapeHTML || function (s) { return String(s || '').replace(/[&<>"']/g, ''); };
    var ui = window.AdminUI;
    var vnd = function (n) { return (Number(n) || 0).toLocaleString('vi-VN') + '₫'; };

    var filters = { q: '', type: 'all', status: 'all' };

    function seedIfEmpty() {
        if (DB.all('transactions').length > 0) return;
        var firstCust = DB.findWhere('users', function (u) { return u.role === 'customer'; });
        var uid = firstCust ? firstCust.id : 2;
        var now = Date.now();
        [
            { type:'deposit', amount: 5000000, method:'Vietcombank', status:'success', hours:1, note:'Nạp ví tự động qua mã QR' },
            { type:'order',   amount: -89000,  method:'Ví tài khoản', status:'success', hours:2, note:'Thanh toán đơn hàng ORD-2831' },
            { type:'deposit', amount: 2000000, method:'Momo',        status:'success', hours:3, note:'Nạp tiền qua Ví điện tử MoMo' },
            { type:'deposit', amount: 1500000, method:'Vietcombank', status:'pending', hours:5, note:'Chuyển khoản thủ công cần xác nhận' },
            { type:'refund',  amount: 680000,  method:'Ví tài khoản', status:'success', hours:8, note:'Hoàn tiền đổi cấu hình dịch vụ' },
        ].forEach(function (t, i) {
            var id = DB.all('transactions').length ? Math.max.apply(null, DB.all('transactions').map(function (x) { return Number(x.id) || 0; })) + 1 : 1;
            DB.insert('transactions', {
                id: id,
                user_id: uid,
                type: t.type,
                amount: t.amount,
                method: t.method,
                status: t.status,
                balance_after: 5000000,
                ref_id: 'TXN-' + (89230 + i),
                created_at: new Date(now - t.hours * 3600000).toISOString(),
                note: t.note || '',
            });
        });
    }

    function typeBadge(t) {
        var map = {
            deposit:  '<span class="vm-badge info"><i class="bi bi-arrow-down-left"></i> Nạp tiền</span>',
            order:    '<span class="vm-badge muted"><i class="bi bi-receipt"></i> Đơn hàng</span>',
            refund:   '<span class="vm-badge warn"><i class="bi bi-arrow-counterclockwise"></i> Hoàn tiền</span>',
            withdraw: '<span class="vm-badge danger"><i class="bi bi-arrow-up-right"></i> Rút tiền</span>',
            adjust:   '<span class="vm-badge muted"><i class="bi bi-pencil-square"></i> Điều chỉnh</span>',
        };
        return map[t] || '<span class="vm-badge muted">' + esc(t || 'Khác') + '</span>';
    }

    function statusBadge(s) {
        var st = s || 'success';
        if (st === 'success') return '<span class="vm-badge success"><i class="bi bi-check-circle"></i> Thành công</span>';
        if (st === 'pending') return '<span class="vm-badge warn"><i class="bi bi-hourglass-split"></i> Đang chờ</span>';
        if (st === 'failed')  return '<span class="vm-badge danger"><i class="bi bi-x-circle"></i> Thất bại</span>';
        return '<span class="vm-badge muted">' + esc(st) + '</span>';
    }

    function userName(id) {
        var u = DB.find('users', id);
        return u ? (u.name + ' (' + u.email + ')') : ('User #' + id);
    }

    function getFiltered() {
        var q = (filters.q || '').toLowerCase().trim();
        return DB.all('transactions').filter(function (t) {
            var st = t.status || 'success';
            if (filters.type !== 'all' && t.type !== filters.type) return false;
            if (filters.status !== 'all' && st !== filters.status) return false;
            if (q) {
                var hay = (String(t.id) + ' ' + (t.ref_id || '') + ' ' + userName(t.user_id) + ' ' + (t.method || '') + ' ' + (t.note || '')).toLowerCase();
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        });
    }

    function showTxDetail(tx) {
        var u = DB.find('users', tx.user_id);
        var st = tx.status || 'success';
        var isPositive = tx.amount >= 0;
        var color = isPositive ? 'var(--vm-success,#10b981)' : 'var(--vm-danger,#ef4444)';
        var sign = isPositive ? '+' : '';

        var body = document.createElement('div');
        body.innerHTML = '' +
            '<div style="text-align:center;padding:16px;background:var(--vm-surface-2,#141b2a);border-radius:12px;margin-bottom:16px;border:1px solid var(--vm-line,rgba(255,255,255,0.08))">' +
                '<div style="font-size:.85rem;color:var(--vm-muted,#8b949e);margin-bottom:4px">Số tiền giao dịch</div>' +
                '<div style="font-size:1.8rem;font-weight:800;color:' + color + '">' + sign + vnd(tx.amount) + '</div>' +
                '<div style="display:flex;justify-content:center;gap:8px;margin-top:8px">' +
                    typeBadge(tx.type) +
                    statusBadge(st) +
                '</div>' +
            '</div>' +

            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:.88rem">' +
                '<div style="background:var(--vm-surface-2,#141b2a);padding:12px;border-radius:10px;border:1px solid var(--vm-line,rgba(255,255,255,0.06))">' +
                    '<div style="font-size:.76rem;color:var(--vm-muted,#8b949e)">Mã giao dịch</div>' +
                    '<div style="font-weight:700;margin-top:2px">#' + esc(String(tx.id)) + '</div>' +
                '</div>' +
                '<div style="background:var(--vm-surface-2,#141b2a);padding:12px;border-radius:10px;border:1px solid var(--vm-line,rgba(255,255,255,0.06))">' +
                    '<div style="font-size:.76rem;color:var(--vm-muted,#8b949e)">Mã tham chiếu (Ref ID)</div>' +
                    '<div style="font-weight:700;margin-top:2px">' + esc(tx.ref_id || '—') + '</div>' +
                '</div>' +
                '<div style="background:var(--vm-surface-2,#141b2a);padding:12px;border-radius:10px;border:1px solid var(--vm-line,rgba(255,255,255,0.06))">' +
                    '<div style="font-size:.76rem;color:var(--vm-muted,#8b949e)">Khách hàng</div>' +
                    '<div style="font-weight:700;margin-top:2px">' + esc(u ? u.name : ('User #' + tx.user_id)) + '</div>' +
                    '<div style="font-size:.76rem;color:var(--vm-muted,#8b949e)">' + esc(u ? u.email : '') + '</div>' +
                '</div>' +
                '<div style="background:var(--vm-surface-2,#141b2a);padding:12px;border-radius:10px;border:1px solid var(--vm-line,rgba(255,255,255,0.06))">' +
                    '<div style="font-size:.76rem;color:var(--vm-muted,#8b949e)">Phương thức</div>' +
                    '<div style="font-weight:700;margin-top:2px">' + esc(tx.method || 'Mặc định') + '</div>' +
                    '<div style="font-size:.76rem;color:var(--vm-muted,#8b949e)">Số dư sau GD: ' + (tx.balance_after != null ? vnd(tx.balance_after) : '—') + '</div>' +
                '</div>' +
            '</div>' +

            '<div style="background:var(--vm-surface-2,#141b2a);padding:12px;border-radius:10px;border:1px solid var(--vm-line,rgba(255,255,255,0.06));margin-top:12px">' +
                '<div style="font-size:.76rem;color:var(--vm-muted,#8b949e)">Ghi chú nội dung</div>' +
                '<div style="margin-top:4px;color:rgba(255,255,255,0.9)">' + esc(tx.note || 'Không có ghi chú bổ sung') + '</div>' +
            '</div>' +
            '<div style="font-size:.78rem;color:var(--vm-muted,#8b949e);margin-top:12px;text-align:right">' +
                'Khởi tạo lúc: ' + esc((tx.created_at || '').slice(0, 19).replace('T', ' ')) +
            '</div>';

        var footer = '<button type="button" class="ad-btn" data-act="cancel">Đóng</button>' +
            (st === 'pending'
                ? '<button type="button" class="ad-btn danger" data-act="reject"><i class="bi bi-x"></i> Từ chối</button>' +
                  '<button type="button" class="ad-btn primary" data-act="approve"><i class="bi bi-check2"></i> Duyệt giao dịch</button>'
                : '');

        var m = ui.Modal({ title: 'Chi tiết Giao dịch #' + tx.id, body: body, footer: footer, size: 'md' });
        m.querySelector('[data-act=cancel]').addEventListener('click', function () { ui.closeModal(); });

        var appBtn = m.querySelector('[data-act=approve]');
        if (appBtn) {
            appBtn.addEventListener('click', function () {
                var user = DB.find('users', tx.user_id);
                if (user && tx.amount > 0) DB.update('users', user.id, { balance: (user.balance || 0) + tx.amount });
                DB.update('transactions', tx.id, { status: 'success', balance_after: user ? (user.balance || 0) + tx.amount : null });
                ui.toast('Đã duyệt giao dịch #' + tx.id, 'success');
                ui.closeModal(); ui.rerender();
            });
        }
        var rejBtn = m.querySelector('[data-act=reject]');
        if (rejBtn) {
            rejBtn.addEventListener('click', function () {
                DB.update('transactions', tx.id, { status: 'failed' });
                ui.toast('Đã từ chối giao dịch #' + tx.id, 'warn');
                ui.closeModal(); ui.rerender();
            });
        }
    }

    function adjustForm() {
        var users = DB.filter('users', function (u) { return u.role !== 'admin'; });
        ui.formModal({
            title: 'Điều chỉnh số dư ví khách hàng',
            okText: 'Xác nhận điều chỉnh',
            fields: [
                { name: 'user_id', label: 'Khách hàng', type: 'select', required: true, options: users.map(function (u) { return { value: u.id, label: u.name + ' (' + u.email + ') · Ví: ' + vnd(u.balance) }; }) },
                { name: 'type', label: 'Thao tác', type: 'select', required: true, value: 'deposit', options: [
                    { value: 'deposit', label: 'Cộng tiền vào ví (+)' },
                    { value: 'withdraw', label: 'Trừ tiền khỏi ví (−)' },
                    { value: 'adjust', label: 'Đặt lại số dư ví (Set cố định)' },
                ]},
                { name: 'amount', label: 'Số tiền thay đổi (₫)', type: 'number', required: true, placeholder: 'Ví dụ: 500000' },
                { name: 'note', label: 'Lý do / Ghi chú điều chỉnh', type: 'textarea', placeholder: 'Ví dụ: Khuyến mãi sự kiện, đền bù sự cố mạng…' },
            ],
            onSubmit: function (vals) {
                var uid = Number(vals.user_id);
                var u = DB.find('users', uid);
                if (!u) throw new Error('Khách hàng không tồn tại');
                var amt = Number(vals.amount) || 0;
                if (amt <= 0 && vals.type !== 'adjust') throw new Error('Số tiền phải lớn hơn 0');
                var delta = 0;
                if (vals.type === 'deposit') delta = amt;
                else if (vals.type === 'withdraw') delta = -amt;
                else if (vals.type === 'adjust') delta = amt - (u.balance || 0);

                var newBal = (u.balance || 0) + delta;
                if (newBal < 0) throw new Error('Số dư ví không đủ để thực hiện thao tác trừ này');

                DB.update('users', uid, { balance: newBal });
                var tid = DB.all('transactions').length ? Math.max.apply(null, DB.all('transactions').map(function (x) { return Number(x.id) || 0; })) + 1 : 1;
                DB.insert('transactions', {
                    id: tid,
                    user_id: uid,
                    type: vals.type,
                    amount: delta,
                    method: 'Admin Manual',
                    status: 'success',
                    balance_after: newBal,
                    ref_id: 'ADJ-' + Date.now().toString().slice(-6),
                    created_at: new Date().toISOString(),
                    note: vals.note || 'Admin điều chỉnh số dư trực tiếp',
                });
                ui.toast('Đã cập nhật số dư của ' + u.name + ' thành ' + vnd(newBal), 'success');
                ui.rerender();
            }
        });
    }

    function render() {
        seedIfEmpty();
        var txs = getFiltered();
        var all = DB.all('transactions');

        var totalIn = all.filter(function (t) {
            return t.amount > 0 && (t.status === 'success' || !t.status);
        }).reduce(function (s, t) { return s + t.amount; }, 0);

        var totalOut = Math.abs(all.filter(function (t) {
            return t.amount < 0 && (t.status === 'success' || !t.status);
        }).reduce(function (s, t) { return s + t.amount; }, 0));

        var profit = totalIn - totalOut;
        var pendingCount = all.filter(function (t) { return t.status === 'pending'; }).length;

        var rows = txs.map(function (t) {
            var isPos = t.amount >= 0;
            var color = isPos ? 'var(--vm-success,#10b981)' : 'var(--vm-danger,#ef4444)';
            var sign = isPos ? '+' : '';
            var st = t.status || 'success';

            return '<tr>' +
                '<td><b>#' + esc(String(t.id)) + '</b></td>' +
                '<td>' + typeBadge(t.type) + '</td>' +
                '<td>' +
                    '<div style="font-weight:600">' + esc(userName(t.user_id)) + '</div>' +
                    (t.note ? '<div style="color:var(--vm-muted,#8b949e);font-size:.72rem;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(t.note) + '</div>' : '') +
                '</td>' +
                '<td><b style="color:' + color + ';font-size:.92rem">' + sign + vnd(t.amount) + '</b></td>' +
                '<td style="font-size:.82rem;color:var(--vm-muted,#8b949e)">' + esc(t.method || 'Ví') + '</td>' +
                '<td>' + statusBadge(st) + '</td>' +
                '<td style="font-size:.78rem;color:var(--vm-muted,#8b949e)">' + esc((t.created_at || '').slice(0, 16).replace('T', ' ')) + '</td>' +
                '<td style="white-space:nowrap">' +
                    '<button class="vm-btn sm" data-action="view" data-id="' + t.id + '" title="Chi tiết"><i class="bi bi-eye"></i></button> ' +
                    (st === 'pending'
                        ? '<button class="vm-btn sm" data-action="approve" data-id="' + t.id + '" title="Duyệt ngay" style="color:var(--vm-success,#10b981)"><i class="bi bi-check2"></i></button> ' +
                          '<button class="vm-btn sm danger" data-action="reject" data-id="' + t.id + '" title="Từ chối"><i class="bi bi-x"></i></button> '
                        : '') +
                    '<button class="vm-btn sm danger" data-action="delete" data-id="' + t.id + '" title="Xóa"><i class="bi bi-trash"></i></button>' +
                '</td>' +
            '</tr>';
        }).join('');

        return '' +
            '<div class="vm-page-head">' +
                '<div><h1>Tài chính & Giao dịch</h1><p>Theo dõi luồng doanh thu, nạp tiền ví, lịch sử giao dịch và lợi nhuận ròng</p></div>' +
                '<div class="vm-page-actions">' +
                    '<button class="vm-btn" data-action="reset-filter"><i class="bi bi-x-circle"></i> Đặt lại</button>' +
                    '<button class="vm-btn primary" data-action="adjust"><i class="bi bi-cash-coin"></i> Điều chỉnh ví</button>' +
                '</div>' +
            '</div>' +

            '<div class="vm-kpi-grid">' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Tổng tiền vào</div><i class="bi bi-arrow-down-left" style="color:var(--vm-success,#10b981)"></i></div><div class="vm-kpi-val" style="color:var(--vm-success,#10b981)">' + vnd(totalIn) + '</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Tổng chi / Đơn hàng</div><i class="bi bi-arrow-up-right" style="color:var(--vm-danger,#ef4444)"></i></div><div class="vm-kpi-val" style="color:var(--vm-danger,#ef4444)">' + vnd(totalOut) + '</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Lợi nhuận ròng</div><i class="bi bi-graph-up-arrow"></i></div><div class="vm-kpi-val" style="color:var(--vm-accent,#3b82f6)">' + vnd(profit) + '</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">GD chờ duyệt</div><i class="bi bi-clock-history" style="color:var(--vm-warn,#f59e0b)"></i></div><div class="vm-kpi-val" style="color:var(--vm-warn,#f59e0b)">' + pendingCount + '</div></div>' +
            '</div>' +

            '<div class="vm-filterbar">' +
                '<input id="fin-q" placeholder="Tìm theo mã GD, Ref ID, khách hàng, ghi chú…" value="' + esc(filters.q) + '">' +
                '<select id="fin-type">' +
                    '<option value="all">Tất cả loại giao dịch</option>' +
                    '<option value="deposit"' + (filters.type === 'deposit' ? ' selected' : '') + '>Nạp tiền (+)</option>' +
                    '<option value="order"' + (filters.type === 'order' ? ' selected' : '') + '>Đơn hàng VPS (−)</option>' +
                    '<option value="refund"' + (filters.type === 'refund' ? ' selected' : '') + '>Hoàn tiền (+)</option>' +
                    '<option value="withdraw"' + (filters.type === 'withdraw' ? ' selected' : '') + '>Rút tiền (−)</option>' +
                    '<option value="adjust"' + (filters.type === 'adjust' ? ' selected' : '') + '>Điều chỉnh</option>' +
                '</select>' +
                '<select id="fin-status">' +
                    '<option value="all">Tất cả trạng thái</option>' +
                    '<option value="success"' + (filters.status === 'success' ? ' selected' : '') + '>Thành công</option>' +
                    '<option value="pending"' + (filters.status === 'pending' ? ' selected' : '') + '>Đang chờ duyệt</option>' +
                    '<option value="failed"' + (filters.status === 'failed' ? ' selected' : '') + '>Thất bại</option>' +
                '</select>' +
            '</div>' +

            '<div class="vm-card">' +
                '<div class="vm-card-body tight">' +
                    (txs.length === 0
                        ? '<div class="vm-empty"><i class="bi bi-wallet" style="font-size:1.8rem;display:block;margin-bottom:8px;opacity:.6"></i>Không có giao dịch nào khớp với bộ lọc.</div>'
                        : '<table class="vm-table">' +
                            '<thead><tr><th>Mã GD</th><th>Loại</th><th>Khách hàng & Ghi chú</th><th>Số tiền</th><th>Phương thức</th><th>Trạng thái</th><th>Thời gian</th><th>Thao tác</th></tr></thead>' +
                            '<tbody>' + rows + '</tbody>' +
                          '</table>') +
                '</div>' +
            '</div>';
    }

    AdminRouter.onRender(function (path) {
        if (path !== '/finance') return;
        var q = document.getElementById('fin-q');
        if (q) {
            q.addEventListener('input', function () {
                filters.q = q.value; ui.rerender();
                setTimeout(function () {
                    var n = document.getElementById('fin-q');
                    if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
                }, 0);
            });
        }
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
                else if (action === 'reset-filter') {
                    filters.q = ''; filters.type = 'all'; filters.status = 'all'; ui.rerender();
                }
                else if (action === 'view' && tx) {
                    showTxDetail(tx);
                }
                else if (action === 'approve' && tx && (tx.status === 'pending' || !tx.status)) {
                    var u = DB.find('users', tx.user_id);
                    if (u && tx.amount > 0) DB.update('users', u.id, { balance: (u.balance || 0) + tx.amount });
                    DB.update('transactions', tx.id, { status: 'success', balance_after: u ? (u.balance || 0) + tx.amount : null });
                    ui.toast('Đã duyệt giao dịch #' + tx.id, 'success'); ui.rerender();
                }
                else if (action === 'reject' && tx) {
                    ui.confirm({
                        title: 'Từ chối giao dịch',
                        message: 'Từ chối giao dịch #' + tx.id + ' của khách hàng?',
                        danger: true,
                        okText: 'Từ chối',
                        onOk: function () {
                            DB.update('transactions', tx.id, { status: 'failed' });
                            ui.toast('Đã từ chối giao dịch #' + tx.id, 'warn'); ui.rerender();
                        }
                    });
                }
                else if (action === 'delete' && tx) {
                    ui.confirm({
                        title: 'Xóa giao dịch',
                        message: 'Xóa giao dịch #' + tx.id + '? Hành động này không thể hoàn tác.',
                        danger: true,
                        okText: 'Xóa vĩnh viễn',
                        onOk: function () {
                            DB.remove('transactions', tx.id);
                            ui.toast('Đã xóa giao dịch #' + tx.id, 'success'); ui.rerender();
                        }
                    });
                }
            });
        });
    });

    AdminRouter.add('/finance', 'Tài chính', render);
})();