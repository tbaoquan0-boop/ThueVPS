/* =========================================================
   pages/dashboard.js — Trang quản lý sau đăng nhập
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
                this.view === 'services'  ? this.renderServices(user) :
                this.view === 'invoices'  ? this.renderInvoices(user) :
                this.view === 'wallet'    ? this.renderWallet(user) :
                this.view === 'tickets'   ? this.renderTickets(user) :
                this.view === 'profile'   ? this.renderProfile(user) :
                                            this.renderOverview(user)
            );

            const sideItem = (view, icon, label) =>
                '<a href="#/dashboard?view=' + view + '"' + (this.view === view ? ' class="active"' : '') + '>' +
                '<i class="bi ' + icon + '"></i> ' + label + '</a>';

            const sidebar =
                '<aside class="dash-sidebar">' +
                sideItem('overview', 'bi-speedometer2', 'Tổng quan') +
                sideItem('services', 'bi-hdd-stack', 'Dịch vụ của tôi') +
                sideItem('invoices', 'bi-receipt', 'Hoá đơn') +
                sideItem('wallet', 'bi-wallet2', 'Ví & Nạp tiền') +
                sideItem('tickets', 'bi-chat-square-text', 'Hỗ trợ') +
                sideItem('profile', 'bi-person', 'Thông tin cá nhân') +
                '</aside>';

            const html =
                '<div class="container">' +
                    '<div class="dash-grid">' +
                        sidebar +
                        '<div>' + content + '</div>' +
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

            return (
                '<h2 style="margin-top:0">Xin chào, ' + escapeHTML(user.name) + '</h2>' +
                '<div class="kpi-grid">' +
                    '<div class="kpi"><div class="lbl">Số dư</div><div class="val">' + fmtVND(user.balance) + '</div></div>' +
                    '<div class="kpi success"><div class="lbl">Đơn hàng</div><div class="val">' + orders.length + '</div></div>' +
                    '<div class="kpi"><div class="lbl">Server đang chạy</div><div class="val">' + running + '</div></div>' +
                    '<div class="kpi danger"><div class="lbl">Hoá đơn chưa thanh toán</div><div class="val">' + unpaid + '</div></div>' +
                '</div>' +
                '<div class="card-surface">' +
                    '<div class="card-head"><h3>Hoạt động gần đây</h3></div>' +
                    (orders.length === 0
                        ? '<p style="color:var(--c-muted)">Bạn chưa có đơn hàng nào. <a href="#/pricing">Đặt dịch vụ đầu tiên</a></p>'
                        : this.renderRecentOrders(orders.slice(-5).reverse())) +
                '</div>'
            );
        },

        renderRecentOrders(orders) {
            const rows = orders.map(o => {
                const plan = DB.find('plans', o.plan_id);
                return '<tr>' +
                    '<td>#' + o.id + '</td>' +
                    '<td>' + escapeHTML(plan ? plan.name : '—') + '</td>' +
                    '<td>' + o.cycle_months + ' tháng</td>' +
                    '<td>' + fmtVND(o.total) + '</td>' +
                    '<td><span class="badge-status badge-' + badgeFor(o.status) + '">' + statusLabel(o.status) + '</span></td>' +
                    '<td>' + fmtShortDate(o.created_at) + '</td>' +
                    '</tr>';
            }).join('');
            return '<table class="data-table"><thead><tr><th>Mã</th><th>Gói</th><th>Chu kỳ</th><th>Tổng</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead><tbody>' + rows + '</tbody></table>';
        },

        renderServices(user) {
            const servers = DB.filter('servers', s => s.user_id === user.id);
            if (servers.length === 0) {
                return '<div class="card-surface"><h3>Dịch vụ của tôi</h3>' +
                       '<p style="color:var(--c-muted)">Bạn chưa có dịch vụ nào. <a href="#/pricing">Đặt ngay</a></p></div>';
            }
            const rows = servers.map(s => (
                '<tr>' +
                '<td>' + escapeHTML(s.hostname) + '</td>' +
                '<td>' + s.ip + '</td>' +
                '<td>' + s.cpu + 'C/' + s.ram + 'GB/' + s.disk + 'GB</td>' +
                '<td>' + escapeHTML(s.os_name) + '</td>' +
                '<td><span class="badge-status badge-' + badgeFor(s.status) + '">' + statusLabel(s.status) + '</span></td>' +
                '<td>' + fmtShortDate(s.due_at) + '</td>' +
                '<td><button class="btn btn-sm btn-outline" data-action="dash-reboot" data-id="' + s.id + '">Reboot</button></td>' +
                '</tr>'
            )).join('');
            return '<div class="card-surface"><div class="card-head"><h3>Dịch vụ của tôi</h3></div>' +
                   '<table class="data-table"><thead><tr><th>Hostname</th><th>IP</th><th>Cấu hình</th><th>OS</th><th>Trạng thái</th><th>Hết hạn</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
                   '</div>';
        },

        renderInvoices(user) {
            const invoices = DB.filter('invoices', i => i.user_id === user.id);
            if (invoices.length === 0) {
                return '<div class="card-surface"><h3>Hoá đơn</h3><p style="color:var(--c-muted)">Chưa có hoá đơn nào.</p></div>';
            }
            const rows = invoices.map(i => (
                '<tr>' +
                '<td>#' + i.id + '</td>' +
                '<td>#' + i.order_id + '</td>' +
                '<td>' + fmtVND(i.amount) + '</td>' +
                '<td><span class="badge-status badge-' + badgeFor(i.status) + '">' + statusLabel(i.status) + '</span></td>' +
                '<td>' + fmtShortDate(i.issued_at) + '</td>' +
                '</tr>'
            )).join('');
            return '<div class="card-surface"><div class="card-head"><h3>Hoá đơn</h3></div>' +
                   '<table class="data-table"><thead><tr><th>Mã</th><th>Đơn</th><th>Số tiền</th><th>Trạng thái</th><th>Ngày</th></tr></thead><tbody>' + rows + '</tbody></table>' +
                   '</div>';
        },

        renderWallet(user) {
            return '<div class="card-surface"><div class="card-head"><h3>Ví & Nạp tiền</h3></div>' +
                   '<div style="font-size:2rem;font-weight:800;color:var(--c-primary);margin-bottom:20px">' + fmtVND(user.balance) + '</div>' +
                   '<p style="color:var(--c-muted)">Số dư hiện tại trong tài khoản của bạn.</p>' +
                   '<div style="display:flex;gap:8px;margin-top:16px">' +
                       '<button class="btn btn-primary" data-action="wallet-deposit" data-amt="100000">+ 100.000đ</button>' +
                       '<button class="btn btn-primary" data-action="wallet-deposit" data-amt="500000">+ 500.000đ</button>' +
                       '<button class="btn btn-primary" data-action="wallet-deposit" data-amt="1000000">+ 1.000.000đ</button>' +
                   '</div>' +
                   '<hr style="margin:20px 0;border-color:var(--c-border)">' +
                   '<h4>Lịch sử giao dịch</h4>' +
                   this.renderTransactions(user) +
                   '</div>';
        },

        renderTransactions(user) {
            const txs = DB.filter('transactions', t => t.user_id === user.id).slice().reverse();
            if (txs.length === 0) return '<p style="color:var(--c-muted)">Chưa có giao dịch.</p>';
            const rows = txs.map(t => (
                '<tr>' +
                '<td>' + fmtDate(t.created_at) + '</td>' +
                '<td>' + escapeHTML(t.type) + '</td>' +
                '<td style="color:' + (t.amount < 0 ? 'var(--c-danger)' : 'var(--c-success)') + ';font-weight:600">' +
                    (t.amount > 0 ? '+' : '') + fmtVND(t.amount) + '</td>' +
                '<td>' + fmtVND(t.balance_after) + '</td>' +
                '</tr>'
            )).join('');
            return '<table class="data-table"><thead><tr><th>Thời gian</th><th>Loại</th><th>Số tiền</th><th>Số dư sau</th></tr></thead><tbody>' + rows + '</tbody></table>';
        },

        renderTickets(user) {
            const tickets = DB.filter('tickets', t => t.user_id === user.id).slice().reverse();
            const list = tickets.length === 0
                ? '<p style="color:var(--c-muted)">Chưa có ticket nào.</p>'
                : '<table class="data-table"><thead><tr><th>Mã</th><th>Tiêu đề</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead><tbody>' +
                    tickets.map(t => '<tr><td>#' + t.id + '</td><td>' + escapeHTML(t.title) + '</td><td>' + escapeHTML(t.status) + '</td><td>' + fmtShortDate(t.created_at) + '</td></tr>').join('') +
                  '</tbody></table>';
            return '<div class="card-surface"><div class="card-head"><h3>Hỗ trợ</h3></div>' +
                   '<form data-form="dash-new-ticket" style="display:grid;gap:10px;margin-bottom:20px">' +
                       '<input type="text" name="title" class="form-control" placeholder="Tiêu đề" required>' +
                       '<textarea name="content" class="form-control" rows="3" placeholder="Nội dung" required></textarea>' +
                       '<button class="btn btn-primary" style="justify-self:start">Gửi ticket</button>' +
                   '</form>' + list + '</div>';
        },

        renderProfile(user) {
            return '<div class="card-surface"><div class="card-head"><h3>Thông tin cá nhân</h3></div>' +
                   '<form data-form="dash-update-profile">' +
                       '<div class="form-group"><label>Họ tên</label><input type="text" name="name" class="form-control" value="' + escapeHTML(user.name) + '" required></div>' +
                       '<div class="form-group"><label>Số điện thoại</label><input type="tel" name="phone" class="form-control" value="' + escapeHTML(user.phone || '') + '"></div>' +
                       '<div class="form-group"><label>Email</label><input type="email" value="' + escapeHTML(user.email) + '" class="form-control" disabled></div>' +
                       '<button class="btn btn-primary">Lưu thay đổi</button>' +
                   '</form></div>';
        },

        reboot(btn) {
            const id = Number(btn.dataset.id);
            Flash.show('Đã gửi lệnh reboot cho server #' + id, 'success');
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
                    });
                });
                Flash.show('Nạp ' + fmtVND(amt) + ' thành công (demo)', 'success');
                handleRoute();
            } catch (e) {
                Flash.show(e.message, 'danger');
            }
        },

        newTicket(form) {
            const fd = new FormData(form);
            const u = Session.current();
            try {
                DB.transaction((data) => {
                    const id = (data.counters.ticket = (data.counters.ticket || 0) + 1);
                    data.tickets.push({
                        id, user_id: u.id,
                        title: fd.get('title'),
                        content: fd.get('content'),
                        status: 'open',
                        created_at: new Date().toISOString(),
                    });
                });
                Flash.show('Ticket đã được gửi', 'success');
                handleRoute();
            } catch (e) {
                Flash.show(e.message, 'danger');
            }
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
    window.App['dash-reboot']      = (el) => DashboardPage.reboot(el);
    window.App['wallet-deposit']   = (el) => DashboardPage.deposit(el);
    window.App['dash-new-ticket']  = (f)   => DashboardPage.newTicket(f);
    window.App['dash-update-profile'] = (f) => DashboardPage.updateProfile(f);
})();

function badgeFor(status) {
    if (!status) return 'cancel';
    if (status === 'paid' || status === 'active' || status === 'running') return 'active';
    if (status === 'unpaid' || status === 'pending') return 'pending';
    if (status === 'cancelled' || status === 'stopped') return 'cancel';
    if (status === 'locked') return 'locked';
    return 'pending';
}
function statusLabel(status) {
    return {
        paid: 'Đã thanh toán', active: 'Hoạt động', running: 'Đang chạy',
        unpaid: 'Chưa thanh toán', pending: 'Đang xử lý',
        cancelled: 'Đã huỷ', stopped: 'Đã dừng', locked: 'Bị khoá',
    }[status] || status;
}
