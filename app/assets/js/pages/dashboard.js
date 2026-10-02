/* =========================================================
   pages/dashboard.js — Dashboard sau đăng nhập
========================================================= */
'use strict';

(function () {
    const DashboardPage = {
        view: 'overview',

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
            const unpaid = invoices.filter(i => i.status === 'unpaid').length;
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
            return '<table class="data-table"><thead><tr><th>Mã</th><th>Gói</th><th>Chu kỳ</th><th>Tổng</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead><tbody>' + rows + '</tbody></table>';
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
                '<td><a href="#/server/' + s.id + '" style="color:var(--accent);font-weight:500">' + escapeHTML(s.hostname) + '</a></td>' +
                '<td>' + s.ip + '</td>' +
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
                   '<table class="data-table"><thead><tr><th>Hostname</th><th>IP</th><th>Cấu hình</th><th>OS</th><th>Trạng thái</th><th>Hết hạn</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
                   '</div>';
        },

        renderInvoices(user) {
            const invoices = DB.filter('invoices', i => i.user_id === user.id).reverse();
            if (invoices.length === 0) {
                return '<h1>Hoá đơn</h1><div class="panel"><p style="color:var(--muted)">Chưa có hoá đơn.</p></div>';
            }
            const rows = invoices.map(i => (
                '<tr>' +
                '<td>#' + i.id + '</td>' +
                '<td>#' + i.order_id + '</td>' +
                '<td>' + fmtVND(i.amount) + '</td>' +
                '<td><span class="tag ' + badgeFor(i.status) + '">' + statusLabel(i.status) + '</span></td>' +
                '<td>' + fmtShortDate(i.issued_at) + '</td>' +
                '</tr>'
            )).join('');
            return '<h1>Hoá đơn</h1>' +
                   '<div class="panel"><table class="data-table"><thead><tr><th>Mã</th><th>Đơn</th><th>Số tiền</th><th>Trạng thái</th><th>Ngày</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
        },

        renderWallet(user) {
            return '<h1>Ví & Nạp tiền</h1>' +
                '<div class="panel">' +
                    '<div class="panel-head"><h3>Số dư khả dụng</h3></div>' +
                    '<div style="font-size:2.4rem;font-weight:600;letter-spacing:-0.02em;margin:8px 0 8px">' + fmtVND(user.balance) + '</div>' +
                    '<p style="color:var(--muted);font-size:.88rem;margin:0 0 20px">Dùng để thanh toán đơn hàng và gia hạn dịch vụ.</p>' +
                    '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
                        '<button class="btn btn-line" data-action="wallet-deposit" data-amt="100000">+ 100.000đ</button>' +
                        '<button class="btn btn-line" data-action="wallet-deposit" data-amt="500000">+ 500.000đ</button>' +
                        '<button class="btn btn-line" data-action="wallet-deposit" data-amt="2000000">+ 2.000.000đ</button>' +
                        '<button class="btn btn-solid" data-action="wallet-deposit" data-amt="10000000">+ 10.000.000đ</button>' +
                    '</div>' +
                '</div>' +
                '<div class="panel">' +
                    '<div class="panel-head"><h3>Lịch sử giao dịch</h3></div>' +
                    this.transactionsTable(user) +
                '</div>';
        },

        transactionsTable(user) {
            const txs = DB.filter('transactions', t => t.user_id === user.id).slice().reverse();
            if (txs.length === 0) return '<p style="color:var(--muted)">Chưa có giao dịch.</p>';
            const rows = txs.map(t => (
                '<tr>' +
                '<td>' + fmtDate(t.created_at) + '</td>' +
                '<td>' + escapeHTML(t.type) + (t.note ? '<br><span style="color:var(--muted);font-size:.82rem">' + escapeHTML(t.note) + '</span>' : '') + '</td>' +
                '<td style="color:' + (t.amount < 0 ? '#b91c1c' : '#047857') + ';font-weight:500">' +
                    (t.amount > 0 ? '+' : '') + fmtVND(t.amount) + '</td>' +
                '<td>' + fmtVND(t.balance_after) + '</td>' +
                '</tr>'
            )).join('');
            return '<table class="data-table"><thead><tr><th>Thời gian</th><th>Loại</th><th>Số tiền</th><th>Số dư sau</th></tr></thead><tbody>' + rows + '</tbody></table>';
        },

        renderTickets(user) {
            const tickets = DB.filter('tickets', t => t.user_id === user.id).slice().reverse();
            const list = tickets.length === 0
                ? '<p style="color:var(--muted)">Chưa có ticket.</p>'
                : '<table class="data-table"><thead><tr><th>Mã</th><th>Tiêu đề</th><th>Trạng thái</th><th>Ngày</th></tr></thead><tbody>' +
                    tickets.map(t => '<tr><td>#' + t.id + '</td><td>' + escapeHTML(t.title) + '</td><td>' + escapeHTML(t.status) + '</td><td>' + fmtShortDate(t.created_at) + '</td></tr>').join('') +
                  '</tbody></table>';
            return '<h1>Hỗ trợ</h1>' +
                '<div class="panel">' +
                    '<form data-form="dash-new-ticket" style="display:grid;gap:12px;margin-bottom:24px">' +
                        '<input type="text" name="title" class="input" placeholder="Tiêu đề" required>' +
                        '<textarea name="content" class="textarea" placeholder="Mô tả chi tiết vấn đề..." required></textarea>' +
                        '<button class="btn btn-solid" style="justify-self:start">Gửi ticket</button>' +
                    '</form>' +
                    list +
                '</div>';
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
            const tickets = DB.all('tickets');
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
                    '<table class="data-table"><thead><tr><th>ID</th><th>Tên / Email</th><th>Role</th><th>Status</th><th>Số dư</th><th></th></tr></thead><tbody>' + userRows + '</tbody></table>' +
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

        newTicket(form) {
            const fd = new FormData(form);
            const u = Session.current();
            try {
                DB.transaction((data) => {
                    const id = (data.counters.ticket = (data.counters.ticket || 0) + 1);
                    data.tickets.push({
                        id, user_id: u.id, title: fd.get('title'),
                        content: fd.get('content'), status: 'open',
                        created_at: new Date().toISOString(),
                    });
                });
                Flash.show('Ticket đã được gửi', 'success');
                handleRoute();
            } catch (e) { Flash.show(e.message, 'danger'); }
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
    window.App['dash-new-ticket']      = (f)   => DashboardPage.newTicket(f);
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