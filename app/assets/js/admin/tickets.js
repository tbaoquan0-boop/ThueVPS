/* =========================================================
   admin/tickets.js — Hỗ trợ khách hàng (Full Cross-Portal Sync)
   ========================================================= */
'use strict';

(function () {
    var esc = (window.AdminUI && window.AdminUI.escapeHTML) || window.escapeHTML || function (s) { return String(s || '').replace(/[&<>"']/g, ''); };
    var ui = window.AdminUI;

    var filters = { q: '', priority: 'all', status: 'all' };

    function seedIfEmpty() {
        if (DB.all('tickets').length > 0) return;
        var firstCust = DB.findWhere('users', function (u) { return u.role === 'customer'; });
        var uid = firstCust ? firstCust.id : 2;
        var samples = [
            { title:'VPS không khởi động được sau khi đổi OS', priority:'high',   status:'open',    content:'Sau khi em cài lại Ubuntu 22.04 từ trang quản lý thì SSH không được, ping cũng timeout.' },
            { title:'Gia hạn thêm gói Cloud S2 12 tháng',      priority:'low',    status:'open',    content:'Cho mình hỏi nếu gia hạn trước 10 ngày có được giữ nguyên IP và ưu đãi không?' },
            { title:'Reset mật khẩu root server SV-1002',       priority:'medium', status:'replied', content:'Mình quên mật khẩu root, nhờ admin reset giúp gửi về email đăng ký.' },
            { title:'Không truy cập được cổng 443 HTTPS',      priority:'high',   status:'open',    content:'Mình đã mở ufw allow 443 nhưng bên ngoài vẫn báo connection refused.' },
            { title:'Yêu cầu nâng cấp thêm 4GB RAM',           priority:'medium', status:'replied', content:'Hệ thống đang chạy MySQL bị OOM, mình muốn nâng thêm RAM gói S1.' },
            { title:'Đã nhận hỗ trợ cấu hình firewall',        priority:'low',    status:'resolved', content:'Cảm ơn support đã cấu hình iptables giúp mình rất nhanh.' },
        ];
        var now = Date.now();
        samples.forEach(function (t, i) {
            var id = DB.all('tickets').length ? Math.max.apply(null, DB.all('tickets').map(function (x) { return x.id; })) + 1 : 1;
            DB.insert('tickets', {
                id: id,
                user_id: uid,
                title: t.title,
                subject: t.title,
                content: t.content,
                priority: t.priority,
                status: t.status,
                created_at: new Date(now - (i + 1) * 7200000).toISOString(),
                updated_at: new Date(now - i * 3600000).toISOString(),
            });
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
        if (s === 'resolved' || s === 'closed') return '<span class="vm-badge success">Đã đóng</span>';
        return '<span class="vm-badge muted">' + esc(s || '') + '</span>';
    }

    function userName(id) {
        var u = DB.find('users', id);
        return u ? (u.name + ' (' + u.email + ')') : ('User #' + id);
    }

    function getFiltered() {
        var q = (filters.q || '').toLowerCase().trim();
        return DB.all('tickets').filter(function (t) {
            var st = (t.status === 'closed') ? 'resolved' : (t.status || 'open');
            if (filters.priority !== 'all' && (t.priority || 'medium') !== filters.priority) return false;
            if (filters.status !== 'all' && st !== filters.status) return false;
            if (q) {
                var title = (t.title || t.subject || '');
                var content = (t.content || t.description || '');
                var user = userName(t.user_id);
                var hay = (String(t.id) + ' ' + title + ' ' + content + ' ' + user).toLowerCase();
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        });
    }

    function replyForm(ticket) {
        var replies = DB.filter('ticket_replies', function (r) {
            return String(r.ticket_id) === String(ticket.id);
        });
        var adminUser = (window.AdminSession && AdminSession.current()) || (window.Session && Session.current());
        var ticketTitle = ticket.title || ticket.subject || ('Ticket #' + ticket.id);
        var initialContent = ticket.content || ticket.description || 'Không có mô tả chi tiết.';

        var replyHTML = replies.map(function (r) {
            var isStaff = r.is_admin || r.is_staff;
            var align = isStaff ? 'right' : 'left';
            var bg = isStaff ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'var(--vm-surface-2, #182234)';
            var color = '#ffffff';
            var authorName = r.author_name || r.author || (isStaff ? 'Kỹ thuật viên' : userName(r.user_id));
            var replyText = r.content || r.body || '';

            return '<div style="display:flex;justify-content:' + align + ';margin-bottom:12px">' +
                '<div style="max-width:82%;background:' + bg + ';color:' + color + ';padding:10px 14px;border-radius:12px;font-size:.88rem;line-height:1.5;box-shadow:0 2px 6px rgba(0,0,0,0.2)">' +
                    '<div style="font-size:.72rem;opacity:.8;margin-bottom:4px;display:flex;gap:8px;justify-content:space-between">' +
                        '<b>' + esc(authorName) + (isStaff ? ' (Support)' : '') + '</b>' +
                        '<span>' + esc((r.created_at || '').slice(0, 16).replace('T', ' ')) + '</span>' +
                    '</div>' +
                    '<div style="white-space:pre-wrap">' + esc(replyText) + '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        var body = document.createElement('div');
        body.innerHTML = '' +
            '<div style="background:var(--vm-surface-2,#141b2a);border:1px solid var(--vm-line,rgba(255,255,255,0.08));border-radius:12px;padding:14px;margin-bottom:14px">' +
                '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px">' +
                    '<div>' +
                        '<div style="font-size:1.05rem;font-weight:700;color:var(--vm-ink,#fff)">' + esc(ticketTitle) + '</div>' +
                        '<div style="font-size:.8rem;color:var(--vm-muted,#8b949e);margin-top:2px">Khách hàng: <b style="color:var(--vm-ink,#fff)">' + esc(userName(ticket.user_id)) + '</b> · Tạo lúc: ' + esc((ticket.created_at || '').slice(0, 16).replace('T', ' ')) + '</div>' +
                    '</div>' +
                    '<div style="display:flex;gap:6px;flex-shrink:0">' +
                        prioBadge(ticket.priority || 'medium') +
                        statusBadge(ticket.status || 'open') +
                    '</div>' +
                '</div>' +
                '<div style="background:rgba(0,0,0,0.25);border-left:3px solid var(--vm-accent,#3b82f6);padding:10px 12px;border-radius:6px;font-size:.86rem;color:rgba(255,255,255,0.9);white-space:pre-wrap;margin-top:8px">' +
                    esc(initialContent) +
                '</div>' +
            '</div>' +

            '<div style="font-size:.8rem;font-weight:600;color:var(--vm-muted,#8b949e);text-transform:uppercase;margin-bottom:6px;letter-spacing:0.5px">Lịch sử trao đổi (' + replies.length + ')</div>' +
            '<div style="max-height:260px;min-height:90px;overflow-y:auto;padding:12px;background:var(--vm-bg,#0a0e17);border:1px solid var(--vm-line,rgba(255,255,255,0.06));border-radius:12px;margin-bottom:14px">' +
                (replyHTML || '<div style="text-align:center;color:var(--vm-muted,#8b949e);font-size:.85rem;padding:20px"><i class="bi bi-chat-left-dots" style="font-size:1.4rem;display:block;margin-bottom:6px"></i>Chưa có phản hồi nào cho ticket này.</div>') +
            '</div>' +

            '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">' +
                '<span style="font-size:.75rem;color:var(--vm-muted,#8b949e);align-self:center">Mẫu phản hồi nhanh:</span>' +
                '<button type="button" class="vm-btn sm" data-quick-tpl="1" style="font-size:.74rem">Đã tiếp nhận & kiểm tra</button>' +
                '<button type="button" class="vm-btn sm" data-quick-tpl="2" style="font-size:.74rem">Đã khởi động lại server</button>' +
                '<button type="button" class="vm-btn sm" data-quick-tpl="3" style="font-size:.74rem">Yêu cầu thông tin IP/Pass</button>' +
            '</div>' +

            '<div class="ad-row" style="margin-bottom:10px">' +
                '<label style="font-weight:600">Nội dung phản hồi khách hàng</label>' +
                '<textarea class="ad-inp" id="tkReply" rows="3" placeholder="Nhập nội dung phản hồi kỹ thuật..." style="resize:vertical"></textarea>' +
            '</div>' +

            '<div style="display:flex;align-items:center;gap:10px">' +
                '<label style="font-size:.82rem;color:var(--vm-muted,#8b949e);white-space:nowrap">Cập nhật trạng thái:</label>' +
                '<select class="ad-inp" id="tkStatus" style="flex:0 0 200px">' +
                    '<option value="open"' + (ticket.status === 'open' ? ' selected' : '') + '>Mở (Open)</option>' +
                    '<option value="replied"' + (ticket.status === 'replied' ? ' selected' : '') + '>Đã phản hồi (Replied)</option>' +
                    '<option value="resolved"' + (ticket.status === 'resolved' || ticket.status === 'closed' ? ' selected' : '') + '>Đã giải quyết (Closed)</option>' +
                '</select>' +
            '</div>';

        var footer = '<button type="button" class="ad-btn" data-act="cancel">Đóng</button>' +
            (ticket.status !== 'resolved' && ticket.status !== 'closed'
                ? '<button type="button" class="ad-btn danger" data-act="resolve"><i class="bi bi-check2-circle"></i> Đóng ticket</button>'
                : '<button type="button" class="ad-btn warn" data-act="reopen"><i class="bi bi-arrow-counterclockwise"></i> Mở lại ticket</button>') +
            '<button type="button" class="ad-btn primary" data-act="reply"><i class="bi bi-send-fill"></i> Gửi phản hồi</button>';

        var m = ui.Modal({ title: 'Xử lý Ticket #' + ticket.id, body: body, footer: footer, size: 'lg' });

        // Quick templates
        m.querySelectorAll('[data-quick-tpl]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var code = btn.dataset.quickTpl;
                var ta = document.getElementById('tkReply');
                if (!ta) return;
                if (code === '1') {
                    ta.value = 'Kính chào quý khách,\nBộ phận kỹ thuật đã tiếp nhận yêu cầu và đang tiến hành kiểm tra trên hệ thống node máy chủ. Dự kiến hoàn tất trong 15-30 phút tới.';
                } else if (code === '2') {
                    ta.value = 'Kính chào quý khách,\nKỹ thuật đã tiến hành soft-reboot và khôi phục mạng cho VPS của quý khách. Quý khách vui lòng kiểm tra lại kết nối SSH.';
                } else if (code === '3') {
                    ta.value = 'Kính chào quý khách,\nĐể kỹ thuật có thể kiểm tra trực tiếp bên trong OS, quý khách vui lòng phản hồi xác nhận IP server và mật khẩu root tạm thời.';
                }
                ta.focus();
            });
        });

        m.querySelector('[data-act=cancel]').addEventListener('click', function () { ui.closeModal(); });
        var resolveBtn = m.querySelector('[data-act=resolve]');
        if (resolveBtn) {
            resolveBtn.addEventListener('click', function () {
                DB.update('tickets', ticket.id, { status: 'resolved', updated_at: new Date().toISOString() });
                ui.toast('Đã đóng ticket #' + ticket.id, 'success');
                ui.closeModal(); ui.rerender();
            });
        }
        var reopenBtn = m.querySelector('[data-act=reopen]');
        if (reopenBtn) {
            reopenBtn.addEventListener('click', function () {
                DB.update('tickets', ticket.id, { status: 'open', updated_at: new Date().toISOString() });
                ui.toast('Đã mở lại ticket #' + ticket.id, 'warn');
                ui.closeModal(); ui.rerender();
            });
        }

        m.querySelector('[data-act=reply]').addEventListener('click', function () {
            var ta = document.getElementById('tkReply');
            var sel = document.getElementById('tkStatus');
            var replyText = ta ? ta.value.trim() : '';
            if (!replyText) { ui.toast('Vui lòng nhập nội dung phản hồi', 'danger'); return; }

            var rid = DB.all('ticket_replies').length ? Math.max.apply(null, DB.all('ticket_replies').map(function (x) { return Number(x.id) || 0; })) + 1 : 1;
            var author = (adminUser && adminUser.name) ? adminUser.name : 'Kỹ thuật viên Admin';

            // Insert cross-portal compatible reply
            DB.insert('ticket_replies', {
                id: rid,
                ticket_id: ticket.id,
                user_id: adminUser ? adminUser.id : 1,
                author: author,
                author_name: author,
                is_admin: true,
                is_staff: true,
                body: replyText,
                content: replyText,
                created_at: new Date().toISOString(),
            });

            var newStatus = sel ? sel.value : 'replied';
            DB.update('tickets', ticket.id, {
                status: newStatus,
                updated_at: new Date().toISOString(),
            });

            ui.toast('Đã gửi phản hồi thành công!', 'success');
            ui.closeModal();
            ui.rerender();
        });

        setTimeout(function () {
            var t = document.getElementById('tkReply');
            if (t) t.focus();
        }, 100);
    }

    function render() {
        seedIfEmpty();
        var tickets = getFiltered();
        var all = DB.all('tickets');
        var openCount = all.filter(function (t) { return t.status === 'open'; }).length;
        var repliedCount = all.filter(function (t) { return t.status === 'replied'; }).length;
        var highCount = all.filter(function (t) { return t.priority === 'high'; }).length;

        var rows = tickets.map(function (t) {
            var title = t.title || t.subject || ('Ticket #' + t.id);
            var content = t.content || t.description || '';
            var preview = content ? ('<div style="color:var(--vm-muted,#8b949e);font-size:.74rem;margin-top:2px;max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(content) + '</div>') : '';

            return '<tr>' +
                '<td><b>#' + esc(String(t.id)) + '</b></td>' +
                '<td>' +
                    '<a href="javascript:void(0)" data-action="reply" data-id="' + esc(t.id) + '" style="font-weight:600;color:var(--vm-ink,#fff);text-decoration:none">' + esc(title) + '</a>' +
                    preview +
                    '<div style="color:var(--vm-muted,#8b949e);font-size:.72rem;margin-top:2px"><i class="bi bi-person"></i> ' + esc(userName(t.user_id)) + '</div>' +
                '</td>' +
                '<td>' + prioBadge(t.priority || 'medium') + '</td>' +
                '<td>' + statusBadge(t.status || 'open') + '</td>' +
                '<td style="font-size:.78rem;color:var(--vm-muted,#8b949e)">' + esc((t.created_at || '').slice(0, 16).replace('T', ' ')) + '</td>' +
                '<td style="white-space:nowrap">' +
                    '<button class="vm-btn sm primary" data-action="reply" data-id="' + esc(t.id) + '" title="Xem / Phản hồi"><i class="bi bi-reply-fill"></i> Phản hồi</button> ' +
                    (t.status !== 'resolved' && t.status !== 'closed'
                        ? '<button class="vm-btn sm" data-action="resolve" data-id="' + esc(t.id) + '" title="Đóng ticket" style="color:var(--vm-success,#10b981)"><i class="bi bi-check2"></i></button>'
                        : '<button class="vm-btn sm" data-action="reopen" data-id="' + esc(t.id) + '" title="Mở lại" style="color:var(--vm-warn,#f59e0b)"><i class="bi bi-arrow-counterclockwise"></i></button>') +
                    ' <button class="vm-btn sm danger" data-action="delete" data-id="' + esc(t.id) + '" title="Xóa"><i class="bi bi-trash"></i></button>' +
                '</td>' +
            '</tr>';
        }).join('');

        return '' +
            '<div class="vm-page-head">' +
                '<div><h1>Hỗ trợ khách hàng</h1><p>Quản lý vé hỗ trợ, trao đổi kỹ thuật và giải quyết sự cố 24/7</p></div>' +
                '<div class="vm-page-actions">' +
                    '<button class="vm-btn" data-action="reset-filter"><i class="bi bi-x-circle"></i> Đặt lại</button>' +
                '</div>' +
            '</div>' +

            '<div class="vm-kpi-grid">' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Đang chờ xử lý</div><i class="bi bi-envelope-open" style="color:var(--vm-accent,#3b82f6)"></i></div><div class="vm-kpi-val" style="color:var(--vm-accent,#3b82f6)">' + openCount + '</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Đã phản hồi</div><i class="bi bi-reply" style="color:var(--vm-warn,#f59e0b)"></i></div><div class="vm-kpi-val" style="color:var(--vm-warn,#f59e0b)">' + repliedCount + '</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Ưu tiên cao</div><i class="bi bi-exclamation-triangle" style="color:var(--vm-danger,#ef4444)"></i></div><div class="vm-kpi-val" style="color:var(--vm-danger,#ef4444)">' + highCount + '</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Tổng tickets</div><i class="bi bi-life-preserver"></i></div><div class="vm-kpi-val">' + all.length + '</div></div>' +
            '</div>' +

            '<div class="vm-filterbar">' +
                '<input id="tk-q" placeholder="Tìm theo mã, tiêu đề, nội dung, khách hàng…" value="' + esc(filters.q) + '">' +
                '<select id="tk-prio">' +
                    '<option value="all">Tất cả mức ưu tiên</option>' +
                    '<option value="high"' + (filters.priority === 'high' ? ' selected' : '') + '>Ưu tiên cao</option>' +
                    '<option value="medium"' + (filters.priority === 'medium' ? ' selected' : '') + '>Ưu tiên trung bình</option>' +
                    '<option value="low"' + (filters.priority === 'low' ? ' selected' : '') + '>Ưu tiên thấp</option>' +
                '</select>' +
                '<select id="tk-status">' +
                    '<option value="all">Tất cả trạng thái</option>' +
                    '<option value="open"' + (filters.status === 'open' ? ' selected' : '') + '>Mở (Open)</option>' +
                    '<option value="replied"' + (filters.status === 'replied' ? ' selected' : '') + '>Đã phản hồi</option>' +
                    '<option value="resolved"' + (filters.status === 'resolved' ? ' selected' : '') + '>Đã đóng</option>' +
                '</select>' +
            '</div>' +

            '<div class="vm-card">' +
                '<div class="vm-card-body tight">' +
                    (tickets.length === 0
                        ? '<div class="vm-empty"><i class="bi bi-inbox" style="font-size:1.8rem;display:block;margin-bottom:8px;opacity:.6"></i>Không tìm thấy ticket nào phù hợp với bộ lọc.</div>'
                        : '<table class="vm-table">' +
                            '<thead><tr><th>Mã</th><th>Chủ đề & Khách hàng</th><th>Ưu tiên</th><th>Trạng thái</th><th>Gửi lúc</th><th>Thao tác</th></tr></thead>' +
                            '<tbody>' + rows + '</tbody>' +
                          '</table>') +
                '</div>' +
            '</div>';
    }

    AdminRouter.onRender(function (path) {
        if (path !== '/tickets') return;
        var q = document.getElementById('tk-q');
        if (q) {
            q.addEventListener('input', function () {
                filters.q = q.value;
                ui.rerender();
                setTimeout(function () {
                    var n = document.getElementById('tk-q');
                    if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
                }, 0);
            });
        }
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
                var ticket = id ? DB.findWhere('tickets', function (t) { return String(t.id) === String(id); }) : null;
                if (action === 'reset-filter') {
                    filters.q = ''; filters.priority = 'all'; filters.status = 'all';
                    ui.rerender(); return;
                }
                if (!ticket) return;
                if (action === 'reply') {
                    replyForm(ticket);
                } else if (action === 'resolve') {
                    DB.update('tickets', ticket.id, { status: 'resolved', updated_at: new Date().toISOString() });
                    ui.toast('Đã đóng ticket #' + ticket.id, 'success');
                    ui.rerender();
                } else if (action === 'reopen') {
                    DB.update('tickets', ticket.id, { status: 'open', updated_at: new Date().toISOString() });
                    ui.toast('Đã mở lại ticket #' + ticket.id, 'warn');
                    ui.rerender();
                } else if (action === 'delete') {
                    ui.confirm({
                        title: 'Xóa ticket',
                        message: 'Bạn có chắc chắn muốn xóa ticket #' + ticket.id + ' và toàn bộ lịch sử phản hồi liên quan?',
                        danger: true,
                        okText: 'Xóa vĩnh viễn',
                        onOk: function () {
                            DB.remove('tickets', ticket.id);
                            DB.transaction(function (d) {
                                d.ticket_replies = (d.ticket_replies || []).filter(function (r) {
                                    return String(r.ticket_id) !== String(ticket.id);
                                });
                            });
                            ui.toast('Đã xóa ticket #' + ticket.id, 'success');
                            ui.rerender();
                        }
                    });
                }
            });
        });
    });

    AdminRouter.add('/tickets', 'Hỗ trợ', render);
})();