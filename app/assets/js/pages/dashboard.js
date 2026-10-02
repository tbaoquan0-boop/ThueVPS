/* =========================================================
   pages/dashboard.js — Dashboard sau đăng nhập
========================================================= */
'use strict';

(function () {
    const DashboardPage = {
        view: 'overview',
        ticketId: null,

        ensureAuth() {
            const u = Session.current();
            if (!u) {
                Flash.show('Vui lòng đăng nhập', 'warning');
                Router.go('/login');
                return null;
            }
            return u;
        },

        render(query) {
            const user = this.ensureAuth();
            if (!user) return renderLayout('<div></div>');

            this.view = query.view || 'overview';
            this.ticketId = query.id ? Number(query.id) : null;

            const content = (
                this.view === 'overview'   ? this.renderOverview(user) :
                this.view === 'services'   ? this.renderServices(user) :
                this.view === 'invoices'   ? this.renderInvoices(user) :
                this.view === 'wallet'     ? this.renderWallet(user) :
                this.view === 'tickets'    ? this.renderTickets(user) :
                this.view === 'profile'    ? this.renderProfile(user) :
                this.view === 'admin'      ? this.renderAdmin(user) :
                                            this.renderOverview(user)
            );

            const sideItem = (view, icon, label) =>
                '<a href="#/dashboard?view=' + view + '"' + (this.view === view ? ' class="active"' : '') + '>' +
                '<i class="bi ' + icon + '"></i> ' + label + '</a>';

            const adminItem = user.role === 'admin'
                ? '<div style="margin-top:24px;padding:0 14px;font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em">Quản trị</div>' +
                  sideItem('admin', 'bi-shield-lock', 'Admin')
                : '';

            const html =
                '<div class="wrap dash">' +
                    '<div class="dash-grid">' +
                        '<aside class="dash-side">' +
                            sideItem('overview', 'bi-grid', 'Tổng quan') +
                            sideItem('services', 'bi-hdd-stack', 'Dịch vụ') +
                            sideItem('invoices', 'bi-receipt', 'Hoá đơn') +
                            sideItem('wallet', 'bi-wallet2', 'Ví') +
                            sideItem('tickets', 'bi-chat-square-text', 'Hỗ trợ') +
                            sideItem('profile', 'bi-person', 'Cá nhân') +
                            adminItem +
                        '</aside>' +
                        '<div class="dash-main fade-in">' + content + '</div>' +
                    '</div>' +
                '</div>';

            return renderLayout(html);
        },

        renderOverview(user) {
            const orders = DB.filter('orders', o => o.user_id === user.id);
            const servers = DB.filter('servers', s => s.user_id === user.id);
            const invoices = DB.filter('invoices', i => i.user_id === user.id);
            const running = servers.filter(s => s.status === 'running').length;
            const tickets = DB.filter('tickets', t => t.user_id === user.id);

            return (
                '<h1>Xin chào, ' + escapeHTML(user.name) + '</h1>' +
                '<div class="kpis">' +
                    '<div class="kpi"><div class="l">Số dư</div><div class="v">' + fmtVND(user.balance) + '</div></div>' +
                    '<div class="kpi"><div class="l">Đơn hàng</div><div class="v">' + orders.length + '</div></div>' +
                    '<div class="kpi"><div class="l">Server</div><div class="v">' + running + '</div></div>' +
                    '<div class="kpi"><div class="l">Tickets</div><div class="v">' + tickets.length + '</div></div>' +
                '</div>' +
                '<div class="panel">' +
                    '<div class="panel-head"><h3>Hoạt động gần đây</h3>' +
                    '<a href="#/pricing" class="btn btn-solid btn-sm">+ Tạo server</a></div>' +
                    (orders.length === 0
                        ? '<p style="color:var(--muted)">Chưa có đơn hàng nào. <a href="#/pricing" style="color:var(--accent)">Đặt dịch vụ đầu tiên</a></p>'
                        : this.recentOrdersTable(orders.slice(-5).reverse())) +
                '</div>'
            );
        },

        recentOrdersTable(orders) {
            const rows = orders.map(o => {
                const plan = DB.find('plans', o.plan_id);
                return '<tr>' +
                    '<td>#' + o.id + '</td>' +
                    '<td>' + escapeHTML(plan ? plan.name : '—') + '</td>' +
                    '<td>' + o.cycle_months + ' tháng</td>' +
                    '<td>' + fmtVND(o.total) + '</td>' +
                    '<td><span class="tag ' + badgeFor(o.status) + '">' + statusLabel(o.status) + '</span></td>' +
                    '<td>' + fmtShortDate(o.created_at) + '</td>' +
                    '</tr>';
            }).join('');
            return '<div class="table-wrap"><table class="data-table"><thead><tr><th>Mã</th><th>Gói</th><th>Chu kỳ</th><th>Tổng</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
        },

        renderServices(user) {
            const servers = DB.filter('servers', s => s.user_id === user.id);
            if (servers.length === 0) {
                return '<h1>Dịch vụ của tôi</h1>' +
                       '<div class="panel"><p style="color:var(--muted)">Chưa có dịch vụ nào. <a href="#/pricing" style="color:var(--accent)">Đặt ngay</a></p></div>';
            }
            const rows = servers.map(s => {
                const days = daysBetween(new Date(), s.due_at);
                const dueLabel = days < 0 ? '<span class="tag bad">Quá hạn</span>' :
                                 days < 7 ? '<span class="tag warn">Còn ' + days + ' ngày</span>' :
                                 '<span class="tag ok">' + days + ' ngày</span>';
                return '<tr>' +
                '<td><a href="#/server/' + s.id + '" style="color:var(--accent);font-weight:600">' + escapeHTML(s.hostname) + '</a></td>' +
                '<td><span style="font-family:ui-monospace,monospace">' + s.ip + '</span></td>' +
                '<td>' + s.cpu + 'C / ' + s.ram + 'GB / ' + s.disk + 'GB</td>' +
                '<td>' + escapeHTML(s.os_name) + '</td>' +
                '<td><span class="tag ' + badgeFor(s.status) + '">' + statusLabel(s.status) + '</span></td>' +
                '<td>' + dueLabel + '</td>' +
                '<td><a class="btn btn-line btn-sm" href="#/server/' + s.id + '">Quản lý</a></td>' +
                '</tr>';
            }).join('');
            return '<h1>Dịch vụ của tôi</h1>' +
                   '<div class="panel"><div class="panel-head"><h3>' + servers.length + ' server đang hoạt động</h3>' +
                   '<a href="#/pricing" class="btn btn-solid btn-sm">+ Tạo mới</a></div>' +
                   '<div class="table-wrap"><table class="data-table"><thead><tr><th>Hostname</th><th>IP</th><th>Cấu hình</th><th>OS</th><th>Trạng thái</th><th>Hết hạn</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
                   '</div>';
        },

        renderInvoices(user) {
            const invoices = DB.filter('invoices', i => i.user_id === user.id).reverse();
            if (invoices.length === 0) {
                return '<h1>Hoá đơn</h1><div class="panel"><p style="color:var(--muted)">Chưa có hoá đơn nào.</p></div>';
            }
            const rows = invoices.map(i => {
                const isUnpaid = i.status === 'unpaid';
                const actions = isUnpaid
                    ? '<div style="display:flex;gap:6px">' +
                          '<button type="button" class="btn btn-solid btn-sm" data-action="dash-pay-invoice" data-id="' + i.id + '"><i class="bi bi-wallet2"></i> Thanh toán</button>' +
                          '<button type="button" class="btn btn-line btn-sm" data-action="dash-view-invoice" data-id="' + i.id + '">Chi tiết</button>' +
                      '</div>'
                    : '<button type="button" class="btn btn-line btn-sm" data-action="dash-view-invoice" data-id="' + i.id + '"><i class="bi bi-receipt"></i> Chi tiết</button>';

                return (
                    '<tr>' +
                    '<td><b>#' + i.id + '</b></td>' +
                    '<td>#' + (i.order_id || '—') + '</td>' +
                    '<td style="font-weight:600">' + fmtVND(i.amount) + '</td>' +
                    '<td><span class="tag ' + badgeFor(i.status) + '">' + statusLabel(i.status) + '</span></td>' +
                    '<td>' + fmtShortDate(i.issued_at) + '</td>' +
                    '<td>' + actions + '</td>' +
                    '</tr>'
                );
            }).join('');

            return '<h1>Hoá đơn & Thanh toán</h1>' +
                   '<div class="panel">' +
                       '<div class="panel-head">' +
                           '<h3>Danh sách hoá đơn (' + invoices.length + ')</h3>' +
                       '</div>' +
                       '<div class="table-wrap">' +
                           '<table class="data-table">' +
                               '<thead><tr><th>Mã HĐ</th><th>Đơn</th><th>Số tiền</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead>' +
                               '<tbody>' + rows + '</tbody>' +
                           '</table>' +
                       '</div>' +
                   '</div>';
        },

        renderWallet(user) {
            return '<h1>Ví & Nạp tiền</h1>' +
                '<div class="panel" style="background:linear-gradient(135deg, color-mix(in srgb, var(--accent) 6%, var(--surface)), var(--surface))">' +
                    '<div class="panel-head"><h3>Số dư khả dụng</h3></div>' +
                    '<div style="font-size:2.4rem;font-weight:700;letter-spacing:-0.03em;margin:4px 0 6px;color:var(--accent)">' + fmtVND(user.balance) + '</div>' +
                    '<p style="color:var(--muted);font-size:.88rem;margin:0 0 20px">Dùng để thanh toán đơn hàng, gia hạn VPS và nâng cấp dịch vụ tự động.</p>' +
                    '<div style="border-top:1px solid var(--line);padding-top:18px">' +
                        '<label style="display:block;font-size:.88rem;font-weight:600;margin-bottom:8px">Số tiền cần nạp:</label>' +
                        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px">' +
                            '<div style="position:relative;flex:1;min-width:220px;max-width:360px">' +
                                '<input type="number" id="wallet-amt-input" class="input" value="200000" min="20000" step="10000" style="font-size:1.1rem;font-weight:600;padding-right:45px">' +
                                '<span style="position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--muted);font-weight:600">VNĐ</span>' +
                            '</div>' +
                            '<button type="button" class="btn btn-solid btn-lg" data-action="wallet-open-qr"><i class="bi bi-qr-code-scan"></i> Tạo mã nạp tiền VietQR</button>' +
                        '</div>' +
                        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
                            '<button type="button" class="btn btn-line btn-sm" data-action="wallet-set-amt" data-amt="50000">+ 50.000đ</button>' +
                            '<button type="button" class="btn btn-line btn-sm" data-action="wallet-set-amt" data-amt="100000">+ 100.000đ</button>' +
                            '<button type="button" class="btn btn-line btn-sm" data-action="wallet-set-amt" data-amt="200000">+ 200.000đ</button>' +
                            '<button type="button" class="btn btn-line btn-sm" data-action="wallet-set-amt" data-amt="500000">+ 500.000đ</button>' +
                            '<button type="button" class="btn btn-line btn-sm" data-action="wallet-set-amt" data-amt="1000000">+ 1.000.000đ</button>' +
                            '<button type="button" class="btn btn-line btn-sm" data-action="wallet-set-amt" data-amt="2000000">+ 2.000.000đ</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="panel">' +
                    '<div class="panel-head"><h3>Lịch sử giao dịch</h3></div>' +
                    this.transactionsTable(user) +
                '</div>';
        },

        transactionsTable(user) {
            const txs = DB.filter('transactions', t => t.user_id === user.id).slice().reverse();
            if (txs.length === 0) return '<p style="color:var(--muted)">Chưa có giao dịch nào.</p>';
            const rows = txs.map(t => (
                '<tr>' +
                '<td>' + fmtDate(t.created_at) + '</td>' +
                '<td>' + escapeHTML(t.type) + (t.note ? '<br><span style="color:var(--muted);font-size:.82rem">' + escapeHTML(t.note) + '</span>' : '') + '</td>' +
                '<td style="color:' + (t.amount < 0 ? '#b91c1c' : '#047857') + ';font-weight:600">' +
                    (t.amount > 0 ? '+' : '') + fmtVND(t.amount) + '</td>' +
                '<td style="font-weight:500">' + fmtVND(t.balance_after) + '</td>' +
                '</tr>'
            )).join('');
            return '<div class="table-wrap"><table class="data-table"><thead><tr><th>Thời gian</th><th>Loại</th><th>Số tiền</th><th>Số dư sau</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
        },

        renderTickets(user) {
            if (this.ticketId) {
                return this.renderTicketDetail(user, this.ticketId);
            }

            const tickets = DB.filter('tickets', t => t.user_id === user.id).slice().reverse();
            const list = tickets.length === 0
                ? '<p style="color:var(--muted)">Chưa có ticket nào. Hãy tạo ticket bên dưới khi cần hỗ trợ kỹ thuật.</p>'
                : '<div class="table-wrap"><table class="data-table"><thead><tr><th>Mã</th><th>Tiêu đề</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead><tbody>' +
                    tickets.map(t =>
                        '<tr>' +
                        '<td><b>#' + t.id + '</b></td>' +
                        '<td><a href="#/dashboard?view=tickets&id=' + t.id + '" style="color:var(--accent);font-weight:600">' + escapeHTML(t.title) + '</a></td>' +
                        '<td><span class="tag ' + badgeFor(t.status) + '">' + statusLabel(t.status) + '</span></td>' +
                        '<td>' + fmtDate(t.created_at) + '</td>' +
                        '<td><a class="btn btn-line btn-sm" href="#/dashboard?view=tickets&id=' + t.id + '">Xem trao đổi</a></td>' +
                        '</tr>'
                    ).join('') +
                  '</tbody></table></div>';

            return '<h1>Trung tâm hỗ trợ (Tickets)</h1>' +
                '<div class="panel">' +
                    '<div class="panel-head"><h3>Tạo yêu cầu hỗ trợ mới</h3></div>' +
                    '<form data-form="dash-new-ticket" style="display:grid;gap:12px;margin-bottom:28px">' +
                        '<input type="text" name="title" class="input" placeholder="Tiêu đề yêu cầu (vd: Hỗ trợ mở port 80/443 VPS-10)" required>' +
                        '<textarea name="content" class="textarea" placeholder="Mô tả chi tiết vấn đề, lỗi gặp phải hoặc câu hỏi cần giải đáp..." required rows="4"></textarea>' +
                        '<button type="submit" class="btn btn-solid" style="justify-self:start"><i class="bi bi-send-fill"></i> Gửi ticket hỗ trợ</button>' +
                    '</form>' +
                    '<div class="panel-head" style="margin-top:20px"><h3>Danh sách tickets của bạn (' + tickets.length + ')</h3></div>' +
                    list +
                '</div>';
        },

        renderTicketDetail(user, ticketId) {
            const ticket = DB.find('tickets', ticketId);
            if (!ticket || ticket.user_id !== user.id) {
                return (
                    '<div class="panel">' +
                        '<p style="color:#b91c1c"><i class="bi bi-exclamation-triangle"></i> Không tìm thấy ticket #' + ticketId + '</p>' +
                        '<a href="#/dashboard?view=tickets" class="btn btn-line btn-sm"><i class="bi bi-arrow-left"></i> Quay lại danh sách ticket</a>' +
                    '</div>'
                );
            }

            const replies = DB.filter('ticket_replies', r => r.ticket_id === ticket.id);
            const isClosed = ticket.status === 'closed';

            const statusBtn = isClosed
                ? '<button type="button" class="btn btn-line btn-sm" data-action="dash-reopen-ticket" data-id="' + ticket.id + '"><i class="bi bi-arrow-repeat"></i> Mở lại ticket</button>'
                : '<button type="button" class="btn btn-line btn-sm" style="color:#b91c1c;border-color:#fca5a5" data-action="dash-close-ticket" data-id="' + ticket.id + '"><i class="bi bi-check-circle"></i> Đóng ticket</button>';

            const repliesHTML = replies.map(r => {
                const isUser = r.user_id === user.id;
                const authorName = isUser ? 'Bạn' : (r.author_name || 'Kỹ thuật viên TáoVPS');
                const badge = isUser
                    ? '<span class="tag ok" style="font-size:.7rem">Khách hàng</span>'
                    : '<span class="tag info" style="font-size:.7rem;background:var(--accent);color:#fff">Kỹ thuật viên</span>';

                return (
                    '<div class="ticket-msg ' + (isUser ? 'user' : 'staff') + '">' +
                        '<div class="ticket-msg-head">' +
                            '<div class="ticket-author"><i class="bi ' + (isUser ? 'bi-person-circle' : 'bi-shield-check') + '"></i> ' + escapeHTML(authorName) + ' ' + badge + '</div>' +
                            '<div class="ticket-time">' + fmtDate(r.created_at) + '</div>' +
                        '</div>' +
                        '<div class="ticket-body">' + escapeHTML(r.content) + '</div>' +
                    '</div>'
                );
            }).join('');

            return (
                '<div>' +
                    '<div style="margin-bottom:16px">' +
                        '<a href="#/dashboard?view=tickets" class="btn btn-line btn-sm"><i class="bi bi-arrow-left"></i> Quay lại danh sách ticket</a>' +
                    '</div>' +
                    '<div class="panel">' +
                        '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;border-bottom:1px solid var(--line);padding-bottom:16px;margin-bottom:16px">' +
                            '<div>' +
                                '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">' +
                                    '<span style="font-size:.85rem;color:var(--muted);font-weight:600">Ticket #' + ticket.id + '</span>' +
                                    '<span class="tag ' + badgeFor(ticket.status) + '">' + statusLabel(ticket.status) + '</span>' +
                                '</div>' +
                                '<h2 style="font-size:1.4rem;font-weight:700;margin:0">' + escapeHTML(ticket.title) + '</h2>' +
                                '<div style="font-size:.82rem;color:var(--muted);margin-top:4px">Khởi tạo lúc ' + fmtDate(ticket.created_at) + '</div>' +
                            '</div>' +
                            statusBtn +
                        '</div>' +

                        '<div class="ticket-thread">' +
                            // First message
                            '<div class="ticket-msg user">' +
                                '<div class="ticket-msg-head">' +
                                    '<div class="ticket-author"><i class="bi bi-person-circle"></i> ' + escapeHTML(user.name) + ' <span class="tag ok" style="font-size:.7rem">Yêu cầu ban đầu</span></div>' +
                                    '<div class="ticket-time">' + fmtDate(ticket.created_at) + '</div>' +
                                '</div>' +
                                '<div class="ticket-body">' + escapeHTML(ticket.content) + '</div>' +
                            '</div>' +
                            repliesHTML +
                        '</div>' +

                        (!isClosed
                            ? '<div style="margin-top:24px;border-top:1px solid var(--line);padding-top:20px">' +
                                  '<h4 style="margin:0 0 12px;font-size:1rem"><i class="bi bi-reply-fill"></i> Gửi phản hồi tiếp theo</h4>' +
                                  '<form data-form="dash-reply-ticket">' +
                                      '<input type="hidden" name="ticket_id" value="' + ticket.id + '">' +
                                      '<textarea name="reply_content" class="textarea" placeholder="Nhập câu trả lời hoặc yêu cầu hỗ trợ thêm..." required rows="4" style="margin-bottom:12px"></textarea>' +
                                      '<button type="submit" class="btn btn-solid"><i class="bi bi-send-fill"></i> Gửi phản hồi</button>' +
                                  '</form>' +
                              '</div>'
                            : '<div style="background:var(--surface-2);border-radius:10px;padding:14px;text-align:center;color:var(--muted);font-size:.9rem;margin-top:20px"><i class="bi bi-lock-fill"></i> Ticket này đã đóng. Nhấn "Mở lại ticket" phía trên nếu cần tiếp tục hỗ trợ.</div>'
                        ) +
                    '</div>' +
                '</div>'
            );
        },

        renderProfile(user) {
            return '<h1>Thông tin cá nhân</h1>' +
                '<div class="panel">' +
                    '<form data-form="dash-update-profile">' +
                        '<div class="field"><label>Họ tên</label><input type="text" name="name" class="input" value="' + escapeHTML(user.name) + '" required></div>' +
                        '<div class="field"><label>Số điện thoại</label><input type="tel" name="phone" class="input" value="' + escapeHTML(user.phone || '') + '"></div>' +
                        '<div class="field"><label>Email</label><input type="email" value="' + escapeHTML(user.email) + '" class="input" disabled></div>' +
                        '<button class="btn btn-solid">Lưu thay đổi</button>' +
                    '</form>' +
                '</div>';
        },

        renderAdmin(user) {
            if (user.role !== 'admin') {
                return '<h1>Admin</h1><div class="panel"><p style="color:var(--muted)">Bạn không có quyền.</p></div>';
            }
            const users = DB.all('users');
            const orders = DB.all('orders');
            const servers = DB.all('servers');
            const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
            const userRows = users.map(u =>
                '<tr>' +
                '<td>#' + u.id + '</td>' +
                '<td>' + escapeHTML(u.name) + '<br><span style="color:var(--muted);font-size:.82rem">' + escapeHTML(u.email) + '</span></td>' +
                '<td><span class="tag ' + (u.role === 'admin' ? 'info' : 'muted') + '">' + u.role + '</span></td>' +
                '<td><span class="tag ' + (u.status === 'active' ? 'ok' : 'bad') + '">' + u.status + '</span></td>' +
                '<td>' + fmtVND(u.balance) + '</td>' +
                '<td>' + (u.status === 'active' ? '<button class="btn btn-line btn-sm" data-action="admin-toggle-user" data-id="' + u.id + '">Khoá</button>' : '<button class="btn btn-line btn-sm" data-action="admin-toggle-user" data-id="' + u.id + '">Mở</button>') + '</td>' +
                '</tr>'
            ).join('');
            return '<h1>Admin Panel</h1>' +
                '<div class="kpis">' +
                    '<div class="kpi"><div class="l">Tổng users</div><div class="v">' + users.length + '</div></div>' +
                    '<div class="kpi"><div class="l">Tổng orders</div><div class="v">' + orders.length + '</div></div>' +
                    '<div class="kpi"><div class="l">Servers active</div><div class="v">' + servers.filter(s => s.status === 'running').length + '</div></div>' +
                    '<div class="kpi"><div class="l">Doanh thu</div><div class="v">' + fmtVND(totalRevenue) + '</div></div>' +
                '</div>' +
                '<div class="panel">' +
                    '<div class="panel-head"><h3>Quản lý người dùng (' + users.length + ')</h3></div>' +
                    '<div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Tên / Email</th><th>Role</th><th>Status</th><th>Số dư</th><th></th></tr></thead><tbody>' + userRows + '</tbody></table></div>' +
                '</div>';
        },

        toggleUser(btn) {
            const id = Number(btn.dataset.id);
            const u = DB.find('users', id);
            if (!u) return;
            const next = u.status === 'active' ? 'locked' : 'active';
            DB.update('users', id, { status: next });
            Flash.show('Đã đổi trạng thái user #' + id + ' → ' + next, 'success');
            handleRoute();
        },

        reboot(btn) {
            Flash.show('Đã gửi lệnh reboot cho server #' + btn.dataset.id, 'success');
        },

        setWalletAmt(btn) {
            const amt = btn.dataset.amt;
            const inp = document.getElementById('wallet-amt-input');
            if (inp) {
                inp.value = amt;
                inp.focus();
            }
        },

        openVietQR() {
            const user = Session.current();
            if (!user) return;
            const inp = document.getElementById('wallet-amt-input');
            const amt = Math.max(20000, Number(inp ? inp.value : 200000));
            const transferCode = 'TáoVPS ' + user.id;
            const qrUrl = 'https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=' + amt + '&addInfo=' + encodeURIComponent(transferCode) + '&accountName=' + encodeURIComponent('CONG TY TNHH TáoVPS VIET NAM');

            const bodyHTML =
                '<div class="qr-modal-grid">' +
                    '<div class="qr-img-box">' +
                        '<img src="' + qrUrl + '" alt="VietQR Nap tien">' +
                        '<div style="font-size:.78rem;color:var(--muted);margin-top:8px"><i class="bi bi-shield-check"></i> Quét bằng app ngân hàng bất kỳ</div>' +
                    '</div>' +
                    '<div>' +
                        '<div class="bank-info-list">' +
                            '<div class="bank-info-item"><span>Ngân hàng</span><span class="val">MB Bank (Quân Đội)</span></div>' +
                            '<div class="bank-info-item"><span>Số tài khoản</span><div style="display:flex;align-items:center"><span class="val">0987654321</span><span class="copy-badge" onclick="copyText(\'0987654321\', \'Đã chép số tài khoản\')">Chép</span></div></div>' +
                            '<div class="bank-info-item"><span>Chủ tài khoản</span><span class="val" style="font-size:.82rem">CONG TY TNHH TáoVPS</span></div>' +
                            '<div class="bank-info-item"><span>Số tiền</span><div style="display:flex;align-items:center"><span class="val" style="color:var(--accent)">' + fmtVND(amt) + '</span><span class="copy-badge" onclick="copyText(\'' + amt + '\', \'Đã chép số tiền\')">Chép</span></div></div>' +
                            '<div class="bank-info-item"><span>Nội dung CK</span><div style="display:flex;align-items:center"><span class="val" style="color:#047857">' + transferCode + '</span><span class="copy-badge" onclick="copyText(\'' + transferCode + '\', \'Đã chép nội dung chuyển khoản\')">Chép</span></div></div>' +
                        '</div>' +
                        '<div style="margin-top:14px;background:var(--surface-2);padding:10px 12px;border-radius:10px;font-size:.82rem;color:var(--muted)">' +
                            '<i class="bi bi-info-circle-fill" style="color:var(--accent)"></i> Tiền sẽ tự động cộng vào ví sau 30-60 giây khi hệ thống nhận được chuyển khoản.' +
                        '</div>' +
                    '</div>' +
                '</div>';

            const footerHTML =
                '<button type="button" class="btn btn-line" onclick="Modal.close()">Đóng</button>' +
                '<button type="button" class="btn btn-solid" data-action="wallet-confirm-deposit" data-amt="' + amt + '"><i class="bi bi-check-circle"></i> Giả lập thanh toán thành công</button>';

            Modal.show({
                title: 'Nạp tiền vào ví qua VietQR',
                body: bodyHTML,
                footer: footerHTML,
                maxWidth: '680px'
            });
        },

        confirmDeposit(btn) {
            const amt = Number(btn.dataset.amt);
            const u = Session.current();
            try {
                DB.transaction((data) => {
                    const txId = (data.counters.transaction = (data.counters.transaction || 0) + 1);
                    const x = data.users.find(x => x.id === u.id);
                    x.balance += amt;
                    data.transactions.push({
                        id: txId, user_id: u.id, type: 'deposit',
                        amount: amt, balance_after: x.balance,
                        ref_id: null, created_at: new Date().toISOString(),
                        note: 'Nạp tiền VietQR MB Bank',
                    });
                });
                Modal.close();
                Flash.show('Nạp ' + fmtVND(amt) + ' thành công vào ví!', 'success');
                handleRoute();
            } catch (e) { Flash.show(e.message, 'danger'); }
        },

        deposit(btn) {
            const amt = Number(btn.dataset.amt);
            const u = Session.current();
            try {
                DB.transaction((data) => {
                    const txId = (data.counters.transaction = (data.counters.transaction || 0) + 1);
                    const x = data.users.find(x => x.id === u.id);
                    x.balance += amt;
                    data.transactions.push({
                        id: txId, user_id: u.id, type: 'deposit',
                        amount: amt, balance_after: x.balance,
                        ref_id: null, created_at: new Date().toISOString(),
                        note: 'Nạp tiền demo',
                    });
                });
                Flash.show('Nạp ' + fmtVND(amt) + ' thành công', 'success');
                handleRoute();
            } catch (e) { Flash.show(e.message, 'danger'); }
        },

        payInvoice(btn) {
            const id = Number(btn.dataset.id);
            const user = Session.current();
            const inv = DB.find('invoices', id);
            if (!inv) return Flash.show('Không tìm thấy hoá đơn #' + id, 'danger');
            if (inv.status === 'paid') return Flash.show('Hoá đơn này đã được thanh toán', 'info');

            if (user.balance < inv.amount) {
                Modal.close();
                Flash.show('Số dư không đủ (cần ' + fmtVND(inv.amount) + ', bạn có ' + fmtVND(user.balance) + '). Vui lòng nạp tiền vào ví!', 'danger');
                Router.go('/dashboard?view=wallet');
                return;
            }

            try {
                DB.transaction((data) => {
                    const txId = (data.counters.transaction = (data.counters.transaction || 0) + 1);
                    const u = data.users.find(x => x.id === user.id);
                    u.balance -= inv.amount;

                    const i = data.invoices.find(x => x.id === id);
                    if (i) i.status = 'paid';

                    if (i && i.order_id) {
                        const o = data.orders.find(x => x.id === i.order_id);
                        if (o) o.status = 'paid';
                    }

                    data.transactions.push({
                        id: txId, user_id: user.id, type: 'invoice_pay',
                        amount: -inv.amount, balance_after: u.balance,
                        ref_id: id, created_at: new Date().toISOString(),
                        note: 'Thanh toán hoá đơn #' + id,
                    });
                });
                Modal.close();
                Flash.show('Thanh toán thành công hoá đơn #' + id + ' (' + fmtVND(inv.amount) + ')', 'success');
                handleRoute();
            } catch (e) { Flash.show(e.message, 'danger'); }
        },

        viewInvoice(btn) {
            const id = Number(btn.dataset.id);
            const user = Session.current();
            const inv = DB.find('invoices', id);
            if (!inv) return Flash.show('Không tìm thấy hoá đơn #' + id, 'danger');

            const order = inv.order_id ? DB.find('orders', inv.order_id) : null;
            const plan = order ? DB.find('plans', order.plan_id) : null;
            const isUnpaid = inv.status === 'unpaid';

            const bodyHTML =
                '<div class="invoice-sheet">' +
                    '<div class="invoice-brand">' +
                        '<div>' +
                            '<h3 style="margin:0;font-size:1.15rem;font-weight:700">TáoVPS Web</h3>' +
                            '<div style="font-size:.8rem;color:var(--muted)">Hạ tầng Cloud VPS & Máy chủ tốc độ cao</div>' +
                        '</div>' +
                        '<div style="text-align:right">' +
                            '<div style="font-weight:700;font-size:1.1rem;color:var(--accent)">HOÁ ĐƠN ĐIỆN TỬ</div>' +
                            '<div style="font-family:ui-monospace,monospace;font-size:.85rem;color:var(--muted)">#HD-' + String(inv.id).padStart(6, '0') + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;font-size:.88rem">' +
                        '<div>' +
                            '<div style="color:var(--muted);margin-bottom:4px">Khách hàng:</div>' +
                            '<div style="font-weight:600">' + escapeHTML(user.name) + '</div>' +
                            '<div style="color:var(--muted)">' + escapeHTML(user.email) + '</div>' +
                        '</div>' +
                        '<div>' +
                            '<div style="color:var(--muted);margin-bottom:4px">Thông tin xuất:</div>' +
                            '<div>Ngày lập: <b>' + fmtDate(inv.issued_at) + '</b></div>' +
                            '<div>Hạn trả: <b>' + fmtShortDate(inv.due_at || inv.issued_at) + '</b></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="table-wrap" style="margin-bottom:18px">' +
                        '<table class="data-table" style="font-size:.9rem">' +
                            '<thead><tr><th>Mục thanh toán</th><th>Kỳ hạn</th><th>Thành tiền</th></tr></thead>' +
                            '<tbody>' +
                                '<tr>' +
                                    '<td><b>' + (plan ? escapeHTML(plan.name) : 'Dịch vụ Cloud VPS') + '</b>' + (order && order.hostname ? '<br><span style="color:var(--muted);font-size:.8rem">Host: ' + escapeHTML(order.hostname) + '</span>' : '') + '</td>' +
                                    '<td>' + (order ? order.cycle_months + ' tháng' : '1 tháng') + '</td>' +
                                    '<td style="font-weight:600">' + fmtVND(inv.amount) + '</td>' +
                                '</tr>' +
                            '</tbody>' +
                        '</table>' +
                    '</div>' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;background:var(--surface-2);padding:14px 18px;border-radius:10px">' +
                        '<div>Trạng thái: <span class="tag ' + badgeFor(inv.status) + '">' + statusLabel(inv.status) + '</span></div>' +
                        '<div style="font-size:1.15rem;font-weight:700">Tổng: ' + fmtVND(inv.amount) + '</div>' +
                    '</div>' +
                '</div>';

            const footerHTML =
                (isUnpaid
                    ? '<button type="button" class="btn btn-solid" data-action="dash-pay-invoice" data-id="' + inv.id + '"><i class="bi bi-wallet2"></i> Thanh toán ngay bằng ví (' + fmtVND(inv.amount) + ')</button>'
                    : '<button type="button" class="btn btn-line btn-sm" onclick="window.print()"><i class="bi bi-printer"></i> In hoá đơn</button>') +
                '<button type="button" class="btn btn-line" onclick="Modal.close()">Đóng</button>';

            Modal.show({
                title: 'Chi tiết hoá đơn #' + inv.id,
                body: bodyHTML,
                footer: footerHTML,
                maxWidth: '620px'
            });
        },

        newTicket(form) {
            const fd = new FormData(form);
            const u = Session.current();
            try {
                let newId = null;
                DB.transaction((data) => {
                    newId = (data.counters.ticket = (data.counters.ticket || 0) + 1);
                    data.tickets.push({
                        id: newId, user_id: u.id, title: fd.get('title'),
                        content: fd.get('content'), status: 'open',
                        created_at: new Date().toISOString(),
                    });
                });
                Flash.show('Ticket #' + newId + ' đã được gửi thành công!', 'success');
                Router.go('/dashboard?view=tickets&id=' + newId);
            } catch (e) { Flash.show(e.message, 'danger'); }
        },

        replyTicket(form) {
            const fd = new FormData(form);
            const ticketId = Number(fd.get('ticket_id'));
            const content = String(fd.get('reply_content') || '').trim();
            if (!content) return Flash.show('Vui lòng nhập nội dung', 'warning');

            const u = Session.current();
            try {
                DB.transaction((data) => {
                    const repId = (data.counters.reply = (data.counters.reply || 0) + 1);
                    data.ticket_replies.push({
                        id: repId,
                        ticket_id: ticketId,
                        user_id: u.id,
                        author_name: u.name,
                        is_staff: false,
                        content: content,
                        created_at: new Date().toISOString(),
                    });
                    const t = data.tickets.find(x => x.id === ticketId);
                    if (t && t.status === 'closed') t.status = 'open';
                });
                Flash.show('Đã gửi phản hồi thành công!', 'success');
                handleRoute();

                // Giả lập kỹ thuật viên phản hồi sau 1.5s
                setTimeout(() => {
                    try {
                        const existing = DB.filter('ticket_replies', r => r.ticket_id === ticketId && r.is_staff);
                        if (existing.length === 0) {
                            DB.transaction((data) => {
                                const repId = (data.counters.reply = (data.counters.reply || 0) + 1);
                                data.ticket_replies.push({
                                    id: repId,
                                    ticket_id: ticketId,
                                    user_id: 9999,
                                    author_name: 'Kỹ thuật viên - Hoàng Nam',
                                    is_staff: true,
                                    content: 'Chào bạn, bộ phận kỹ thuật đã tiếp nhận yêu cầu #' + ticketId + '. Kỹ thuật viên đang kiểm tra cấu hình trên node và sẽ xử lý hoàn tất cho bạn trong vòng 15-30 phút.',
                                    created_at: new Date().toISOString(),
                                });
                            });
                            if (DashboardPage.view === 'tickets' && DashboardPage.ticketId === ticketId) {
                                Flash.show('Kỹ thuật viên vừa phản hồi ticket của bạn', 'info');
                                handleRoute();
                            }
                        }
                    } catch (err) {}
                }, 1500);

            } catch (e) { Flash.show(e.message, 'danger'); }
        },

        closeTicket(btn) {
            const id = Number(btn.dataset.id);
            DB.update('tickets', id, { status: 'closed' });
            Flash.show('Ticket #' + id + ' đã được đóng', 'info');
            handleRoute();
        },

        reopenTicket(btn) {
            const id = Number(btn.dataset.id);
            DB.update('tickets', id, { status: 'open' });
            Flash.show('Ticket #' + id + ' đã được mở lại', 'success');
            handleRoute();
        },

        updateProfile(form) {
            const fd = new FormData(form);
            const u = Session.current();
            DB.update('users', u.id, { name: fd.get('name'), phone: fd.get('phone') });
            Flash.show('Đã cập nhật thông tin', 'success');
            handleRoute();
        },
    };

    Router.add('GET', '/dashboard', ({ query }) => DashboardPage.render(query));

    window.App = window.App || {};
    window.App['dash-reboot']          = (el) => DashboardPage.reboot(el);
    window.App['wallet-deposit']       = (el) => DashboardPage.deposit(el);
    window.App['wallet-set-amt']       = (el) => DashboardPage.setWalletAmt(el);
    window.App['wallet-open-qr']       = ()   => DashboardPage.openVietQR();
    window.App['wallet-confirm-deposit'] = (el) => DashboardPage.confirmDeposit(el);
    window.App['dash-new-ticket']      = (f)   => DashboardPage.newTicket(f);
    window.App['dash-reply-ticket']    = (f)   => DashboardPage.replyTicket(f);
    window.App['dash-close-ticket']    = (el) => DashboardPage.closeTicket(el);
    window.App['dash-reopen-ticket']   = (el) => DashboardPage.reopenTicket(el);
    window.App['dash-pay-invoice']     = (el) => DashboardPage.payInvoice(el);
    window.App['dash-view-invoice']    = (el) => DashboardPage.viewInvoice(el);
    window.App['dash-update-profile']  = (f)   => DashboardPage.updateProfile(f);
    window.App['admin-toggle-user']    = (el) => DashboardPage.toggleUser(el);
})();

function badgeFor(status) {
    if (!status) return 'muted';
    if (status === 'paid' || status === 'active' || status === 'running' || status === 'open') return 'ok';
    if (status === 'unpaid' || status === 'pending') return 'warn';
    if (status === 'cancelled' || status === 'stopped') return 'muted';
    if (status === 'locked' || status === 'closed') return 'bad';
    return 'muted';
}
function statusLabel(status) {
    return ({
        paid: 'Đã thanh toán', active: 'Hoạt động', running: 'Đang chạy', open: 'Mở',
        unpaid: 'Chưa thanh toán', pending: 'Đang xử lý',
        cancelled: 'Đã huỷ', stopped: 'Đã dừng', locked: 'Bị khoá', closed: 'Đã đóng',
    })[status] || status;
}