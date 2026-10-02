/* =========================================================
   admin/tickets.js — Hỗ trợ khách hàng (CRUD + reply thật)
   ========================================================= */
'use strict';

(function () {
    var esc = window.AdminUI.escapeHTML;
    var ui = window.AdminUI;

    var filters = { q: '', priority: 'all', status: 'all' };

    function seedIfEmpty() {
        if (DB.all('tickets').length > 0) return;
        var firstCust = DB.findWhere('users', function (u) { return u.role === 'customer'; });
        var uid = firstCust ? firstCust.id : 2;
        var samples = [
            { subject:'VPS không khởi động được',    priority:'high',   status:'open' },
            { subject:'Gia hạn gói Cloud S2',        priority:'low',    status:'open' },
            { subject:'Reset mật khẩu root',         priority:'medium', status:'replied' },
            { subject:'Không truy cập được SSH',     priority:'high',   status:'open' },
            { subject:'Yêu cầu nâng cấp RAM',       priority:'medium', status:'replied' },
            { subject:'Hoàn tiền đơn ORD-2836',      priority:'medium', status:'resolved' },
        ];
        var now = Date.now();
        samples.forEach(function (t, i) {
            var id = DB.all('tickets').length ? Math.max.apply(null, DB.all('tickets').map(function (x) { return x.id; })) + 1 : 1;
            var tid = 'TKT-' + (340 + i);
            DB.insert('tickets', Object.assign({}, t, {
                id: tid, user_id: uid,
                created_at: new Date(now - i * 3600000).toISOString(),
                updated_at: new Date(now - i * 3600000).toISOString(),
            }));
        });
    }

    function prioBadge(p) {
        if (p === 'high')   return '<span class="vm-badge danger"><i class="bi bi-arrow-up"></i> Cao</span>';
        if (p === 'medium') return '<span class="vm-badge warn"><i class="bi bi-dash"></i> Trung bình</span>';
        return '<span class="vm-badge muted"><i class="bi bi-arrow-down"></i> Thấp</span>';
    }
    function statusBadge(s) {
        if (s === 'open')     return '<span class="vm-badge info">Mở</span>';
        if (s === 'replied')  return '<span class="vm-badge warn">Đã phản hồi</span>';
        if (s === 'resolved') return '<span class="vm-badge success">Đã đóng</span>';
        return '<span class="vm-badge muted">' + esc(s || '') + '</span>';
    }
    function userName(id) {
        var u = DB.find('users', id);
        return u ? u.name : ('User #' + id);
    }

    function getFiltered() {
        var q = (filters.q || '').toLowerCase();
        return DB.all('tickets').filter(function (t) {
            if (filters.priority !== 'all' && t.priority !== filters.priority) return false;
            if (filters.status !== 'all' && t.status !== filters.status) return false;
            if (q) {
                var hay = (String(t.id) + ' ' + (t.subject || '') + ' ' + userName(t.user_id)).toLowerCase();
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        });
    }

    function replyForm(ticket) {
        var replies = DB.filter('ticket_replies', function (r) { return r.ticket_id === ticket.id; });
        var adminUser = Session.current();
        var replyHTML = replies.map(function (r) {
            var isAdmin = r.is_admin;
            var align = isAdmin ? 'right' : 'left';
            var bg = isAdmin ? 'linear-gradient(135deg,var(--vm-accent),#8b5cf6)' : 'var(--vm-surface-2)';
            var color = isAdmin ? '#fff' : 'var(--vm-ink)';
            return '<div style="display:flex;justify-content:' + align + ';margin-bottom:10px">' +
                '<div style="max-width:80%;background:' + bg + ';color:' + color + ';padding:10px 14px;border-radius:12px;font-size:.9rem;line-height:1.45">' +
                    '<div style="font-size:.72rem;opacity:.75;margin-bottom:4px">' + esc(r.author || (isAdmin ? 'Admin' : userName(r.user_id))) + ' · ' + esc((r.created_at || '').slice(0, 16).replace('T', ' ')) + '</div>' +
                    esc(r.body || '') +
                '</div>' +
            '</div>';
        }).join('') || '<div style="text-align:center;color:var(--vm-muted);font-size:.85rem;padding:10px">Chưa có phản hồi nào.</div>';

        var body = document.createElement('div');
        body.innerHTML = '' +
            '<div style="background:var(--vm-surface-2);border:1px solid var(--vm-line);border-radius:10px;padding:14px;margin-bottom:14px">' +
                '<div style="display:flex;justify-content:space-between;align-items:start;gap:10px;margin-bottom:6px">' +
                    '<div><b>' + esc(ticket.subject) + '</b> <span style="color:var(--vm-muted);font-size:.78rem">#' + esc(ticket.id) + '</span></div>' +
                    '<div style="display:flex;gap:6px">' + prioBadge(ticket.priority) + statusBadge(ticket.status) + '</div>' +
                '</div>' +
                '<div style="font-size:.82rem;color:var(--vm-muted)">Từ: ' + esc(userName(ticket.user_id)) + ' · ' + esc((ticket.created_at || '').slice(0, 16).replace('T', ' ')) + '</div>' +
            '</div>' +
            '<div style="max-height:280px;overflow:auto;padding:8px;background:var(--vm-bg);border-radius:10px;margin-bottom:12px">' + replyHTML + '</div>' +
            '<div class="ad-row"><label>Phản hồi cho khách</label><textarea class="ad-inp" id="tkReply" rows="4" placeholder="Nhập nội dung phản hồi…"></textarea></div>' +
            '<div style="display:flex;gap:8px;margin-top:10px">' +
                '<select class="ad-inp" id="tkStatus" style="flex:0 0 180px">' +
                    '<option value="open"' + (ticket.status === 'open' ? ' selected' : '') + '>Mở</option>' +
                    '<option value="replied"' + (ticket.status === 'replied' ? ' selected' : '') + '>Đã phản hồi</option>' +
                    '<option value="resolved"' + (ticket.status === 'resolved' ? ' selected' : '') + '>Đã đóng</option>' +
                '</select>' +
            '</div>';

        var footer = '<button type="button" class="ad-btn" data-act="cancel">Đóng</button>' +
            '<button type="button" class="ad-btn danger" data-act="resolve"><i class="bi bi-check2"></i> Đóng ticket</button>' +
            '<button type="button" class="ad-btn primary" data-act="reply"><i class="bi bi-send"></i> Gửi phản hồi</button>';

        var m = ui.Modal({ title: 'Ticket ' + ticket.id + ' · ' + ticket.subject, body: body, footer: footer, size: 'lg' });
        m.querySelector('[data-act=cancel]').addEventListener('click', function () { ui.closeModal(); });
        m.querySelector('[data-act=resolve]').addEventListener('click', function () {
            DB.update('tickets', ticket.id, { status: 'resolved', updated_at: new Date().toISOString() });
            ui.toast('Đã đóng ticket ' + ticket.id, 'success');
            ui.closeModal(); ui.rerender();
        });
        m.querySelector('[data-act=reply]').addEventListener('click', function () {
            var ta = document.getElementById('tkReply');
            var sel = document.getElementById('tkStatus');
            if (!ta || !ta.value.trim()) { ui.toast('Nhập nội dung phản hồi', 'danger'); return; }
            var rid = DB.all('ticket_replies').length ? Math.max.apply(null, DB.all('ticket_replies').map(function (x) { return x.id; })) + 1 : 1;
            DB.insert('ticket_replies', {
                id: rid, ticket_id: ticket.id,
                user_id: adminUser ? adminUser.id : 1,
                is_admin: true,
                author: adminUser ? adminUser.name : 'Admin',
                body: ta.value.trim(),
                created_at: new Date().toISOString(),
            });
            DB.update('tickets', ticket.id, {
                status: sel.value,
                updated_at: new Date().toISOString(),
            });
            ui.toast('Đã gửi phản hồi', 'success');
            ui.closeModal(); ui.rerender();
        });
        setTimeout(function () { var t = document.getElementById('tkReply'); if (t) t.focus(); }, 50);
    }

    function render() {
        seedIfEmpty();
        var tickets = getFiltered();
        var all = DB.all('tickets');
        var openCount = all.filter(function (t) { return t.status === 'open'; }).length;
        var repliedCount = all.filter(function (t) { return t.status === 'replied'; }).length;
        var highCount = all.filter(function (t) { return t.priority === 'high'; }).length;

        var rows = tickets.map(function (t) {
            return '<tr>' +
                '<td><b>' + esc(t.id) + '</b></td>' +
                '<td>' + esc(t.subject) +
                    '<div style="color:var(--vm-muted);font-size:.72rem">' + esc(userName(t.user_id)) + '</div></td>' +
                '<td>' + prioBadge(t.priority) + '</td>' +
                '<td>' + statusBadge(t.status) + '</td>' +
                '<td style="font-size:.78rem">' + esc((t.created_at || '').slice(0, 16).replace('T', ' ')) + '</td>' +
                '<td style="white-space:nowrap">' +
                    '<button class="vm-btn sm" data-action="reply" data-id="' + esc(t.id) + '" title="Xem / Phản hồi"><i class="bi bi-reply"></i></button> ' +
                    (t.status !== 'resolved'
                        ? '<button class="vm-btn sm" data-action="resolve" data-id="' + esc(t.id) + '" title="Đóng" style="color:var(--vm-success)"><i class="bi bi-check2"></i></button>'
                        : '<button class="vm-btn sm" data-action="reopen" data-id="' + esc(t.id) + '" title="Mở lại" style="color:var(--vm-warn)"><i class="bi bi-arrow-counterclockwise"></i></button>') +
                    '<button class="vm-btn sm danger" data-action="delete" data-id="' + esc(t.id) + '" title="Xóa"><i class="bi bi-trash"></i></button>' +
                '</td>' +
            '</tr>';
        }).join('');

        return '' +
            '<div class="vm-page-head">' +
                '<div><h1>Hỗ trợ khách hàng</h1><p>Quản lý ticket và phản hồi yêu cầu</p></div>' +
                '<div class="vm-page-actions">' +
                    '<button class="vm-btn" data-action="reset-filter"><i class="bi bi-x-circle"></i> Reset</button>' +
                '</div>' +
            '</div>' +
            '<div class="vm-kpi-grid">' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Đang mở</div></div><div class="vm-kpi-val" style="color:var(--vm-accent)">' + openCount + '</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Đã phản hồi</div></div><div class="vm-kpi-val" style="color:var(--vm-warn)">' + repliedCount + '</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Ưu tiên cao</div></div><div class="vm-kpi-val" style="color:var(--vm-danger)">' + highCount + '</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Tổng ticket</div></div><div class="vm-kpi-val">' + all.length + '</div></div>' +
            '</div>' +
            '<div class="vm-filterbar">' +
                '<input id="tk-q" placeholder="Tìm theo mã, chủ đề, user…" value="' + esc(filters.q) + '">' +
                '<select id="tk-prio">' +
                    '<option value="all">Tất cả ưu tiên</option>' +
                    '<option value="high"' + (filters.priority === 'high' ? ' selected' : '') + '>Cao</option>' +
                    '<option value="medium"' + (filters.priority === 'medium' ? ' selected' : '') + '>Trung bình</option>' +
                    '<option value="low"' + (filters.priority === 'low' ? ' selected' : '') + '>Thấp</option>' +
                '</select>' +
                '<select id="tk-status">' +
                    '<option value="all">Tất cả trạng thái</option>' +
                    '<option value="open"' + (filters.status === 'open' ? ' selected' : '') + '>Mở</option>' +
                    '<option value="replied"' + (filters.status === 'replied' ? ' selected' : '') + '>Đã phản hồi</option>' +
                    '<option value="resolved"' + (filters.status === 'resolved' ? ' selected' : '') + '>Đã đóng</option>' +
                '</select>' +
            '</div>' +
            '<div class="vm-card">' +
                '<div class="vm-card-body tight">' +
                    (tickets.length === 0
                        ? '<div class="vm-empty">Không có ticket nào.</div>'
                        : '<table class="vm-table">' +
                            '<thead><tr><th>Mã</th><th>Chủ đề / User</th><th>Ưu tiên</th><th>Trạng thái</th><th>Thời gian</th><th></th></tr></thead>' +
                            '<tbody>' + rows + '</tbody>' +
                          '</table>') +
                '</div>' +
            '</div>';
    }

    AdminRouter.onRender(function (path) {
        if (path !== '/tickets') return;
        var q = document.getElementById('tk-q');
        if (q) q.addEventListener('input', function () { filters.q = q.value; ui.rerender(); setTimeout(function () { var n = document.getElementById('tk-q'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 0); });
        var pr = document.getElementById('tk-prio');
        if (pr) pr.addEventListener('change', function () { filters.priority = pr.value; ui.rerender(); });
        var st = document.getElementById('tk-status');
        if (st) st.addEventListener('change', function () { filters.status = st.value; ui.rerender(); });
        var content = document.getElementById('adContent');
        if (!content) return;
        content.querySelectorAll('[data-action]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var action = btn.dataset.action;
                var id = btn.dataset.id;
                var ticket = id ? DB.findWhere('tickets', function (t) { return t.id === id; }) : null;
                if (action === 'reset-filter') { filters.q = ''; filters.priority = 'all'; filters.status = 'all'; ui.rerender(); return; }
                if (!ticket) return;
                if (action === 'reply') replyForm(ticket);
                else if (action === 'resolve') {
                    DB.update('tickets', ticket.id, { status: 'resolved', updated_at: new Date().toISOString() });
                    ui.toast('Đã đóng ' + ticket.id, 'success'); ui.rerender();
                }
                else if (action === 'reopen') {
                    DB.update('tickets', ticket.id, { status: 'open', updated_at: new Date().toISOString() });
                    ui.toast('Đã mở lại ' + ticket.id, 'warn'); ui.rerender();
                }
                else if (action === 'delete') {
                    ui.confirm({ title: 'Xóa ticket', message: 'Xóa ticket ' + ticket.id + ' và toàn bộ reply?', danger: true, okText: 'Xóa',
                        onOk: function () {
                            DB.remove('tickets', ticket.id);
                            DB.transaction(function (d) { d.ticket_replies = d.ticket_replies.filter(function (r) { return r.ticket_id !== ticket.id; }); });
                            ui.toast('Đã xóa ' + ticket.id, 'success'); ui.rerender();
                        }
                    });
                }
            });
        });
    });

    AdminRouter.add('/tickets', 'Hỗ trợ', render);
})();