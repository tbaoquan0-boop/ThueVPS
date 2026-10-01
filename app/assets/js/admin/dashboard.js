/* =========================================================
   admin/dashboard.js — Tổng quan hệ thống
========================================================= */
'use strict';

(function () {
    function fmt(n) { return (n || 0).toLocaleString('vi-VN'); }
    function vnd(n) { return (n || 0).toLocaleString('vi-VN') + '₫'; }

    function kpi(label, val, sub, subCls, icon, color) {
        return '<div class="vm-kpi">' +
            '<div class="vm-kpi-head">' +
                '<div class="vm-kpi-label">' + label + '</div>' +
                '<div class="vm-kpi-icon" style="background:color-mix(in srgb,' + color + ' 14%,transparent);color:' + color + '">' +
                    '<i class="bi ' + icon + '"></i>' +
                '</div>' +
            '</div>' +
            '<div class="vm-kpi-val">' + val + '</div>' +
            (sub ? '<div class="vm-kpi-sub ' + (subCls || '') + '">' + sub + '</div>' : '') +
        '</div>';
    }

    function barChart(values, labels) {
        var max = Math.max.apply(null, values) || 1;
        var bars = values.map(function (v, i) {
            var h = Math.max(2, Math.round(v / max * 80));
            return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">' +
                '<div style="width:100%;background:linear-gradient(180deg,var(--vm-accent),color-mix(in srgb,var(--vm-accent) 60%,transparent));height:' + h + '%;border-radius:6px 6px 0 0"></div>' +
                '<div style="font-size:.7rem;color:var(--vm-muted)">' + labels[i] + '</div>' +
            '</div>';
        }).join('');
        return '<div class="vm-chart"><div class="vm-chart-row">' + bars + '</div></div>';
    }

    function render() {
        var plans = DB.all('plans');
        var users = DB.all('users');
        var orders = DB.all('orders');
        var servers = DB.all('servers');
        var tickets = DB.all('tickets');

        var totalRev = orders.reduce(function (s, o) { return s + (o.total || 0); }, 0);
        var activeServers = servers.filter(function (s) { return s.status === 'running'; }).length;
        var openTickets = tickets.filter(function (t) { return t.status === 'open'; }).length;

        // Demo numbers khi data rỗng
        var rev = totalRev || 58_000_000;
        var usersCount = users.length || 1248;
        var svTotal = servers.length || 50;
        var svRunning = activeServers || 47;
        var tkOpen = openTickets || 6;

        // Doanh thu 12 tháng — demo nếu không có data
        var months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
        var revByMonth = new Array(12).fill(0);
        orders.forEach(function (o) {
            if (o.created_at) {
                var m = new Date(o.created_at).getMonth();
                if (!isNaN(m)) revByMonth[m] += o.total || 0;
            }
        });
        if (revByMonth.every(function (v) { return v === 0; })) {
            revByMonth = [12,18,15,22,28,32,35,40,38,45,52,58].map(function (v) { return v * 1e6; });
        }

        var planRows = plans.slice(0, 5).map(function (p) {
            return '<tr>' +
                '<td><b>' + escapeHTML(p.name) + '</b></td>' +
                '<td><span class="vm-badge muted">' + escapeHTML(p.category) + '</span></td>' +
                '<td>' + p.cpu_cores + ' vCPU</td>' +
                '<td>' + p.ram_gb + ' GB</td>' +
                '<td><b>' + vnd(p.price_monthly || 0) + '</b></td>' +
            '</tr>';
        }).join('');

        return '' +
            '<div class="vm-page-head">' +
                '<div><h1>Dashboard</h1><p>Tổng quan hoạt động của hệ thống</p></div>' +
            '</div>' +

            '<div class="vm-kpi-grid">' +
                kpi('Doanh thu tháng', vnd(rev),
                    '<i class="bi bi-arrow-up-right"></i> +12.4% so với tháng trước', 'up',
                    'bi-wallet-fill', '#10b981') +
                kpi('Người dùng', fmt(usersCount),
                    '<i class="bi bi-arrow-up-right"></i> +34 mới tuần này', 'up',
                    'bi-people-fill', '#3b82f6') +
                kpi('Server đang chạy', fmt(svRunning),
                    '<span style="color:var(--vm-muted)">/ ' + fmt(svTotal) + ' tổng</span>', '',
                    'bi-hdd-rack-fill', '#8b5cf6') +
                kpi('Ticket mở', fmt(tkOpen),
                    '<i class="bi bi-clock"></i> TB phản hồi 5 phút', '',
                    'bi-life-preserver', '#f59e0b') +
            '</div>' +

            '<div class="vm-grid-2">' +
                '<div class="vm-card">' +
                    '<div class="vm-card-head">' +
                        '<div class="vm-card-title">Doanh thu 12 tháng gần nhất</div>' +
                        '<div class="vm-flex">' +
                            '<button class="vm-btn sm">7 ngày</button>' +
                            '<button class="vm-btn sm" style="background:var(--vm-accent);color:#fff;border-color:var(--vm-accent)">12 tháng</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="vm-card-body">' + barChart(revByMonth, months) + '</div>' +
                '</div>' +
                '<div class="vm-card">' +
                    '<div class="vm-card-head"><div class="vm-card-title">Hoạt động gần đây</div></div>' +
                    '<div class="vm-card-body"><div class="vm-feed">' +
                        '<div class="vm-feed-item">' +
                            '<div class="vm-feed-icon"><i class="bi bi-receipt"></i></div>' +
                            '<div class="vm-feed-text"><b>Đơn hàng #ORD-2841</b> đã thanh toán<div class="vm-feed-meta">2 phút trước · Cloud S2 · 1 tháng</div></div>' +
                        '</div>' +
                        '<div class="vm-feed-item">' +
                            '<div class="vm-feed-icon" style="background:color-mix(in srgb,#f59e0b 14%,transparent);color:#f59e0b"><i class="bi bi-person-plus"></i></div>' +
                            '<div class="vm-feed-text"><b>Nguyễn Văn A</b> vừa đăng ký<div class="vm-feed-meta">7 phút trước</div></div>' +
                        '</div>' +
                        '<div class="vm-feed-item">' +
                            '<div class="vm-feed-icon" style="background:color-mix(in srgb,#10b981 14%,transparent);color:#10b981"><i class="bi bi-hdd-rack"></i></div>' +
                            '<div class="vm-feed-text">Server <b>ryzen-r3-08</b> được khởi tạo<div class="vm-feed-meta">14 phút trước · Hà Nội DC</div></div>' +
                        '</div>' +
                        '<div class="vm-feed-item">' +
                            '<div class="vm-feed-icon" style="background:color-mix(in srgb,#ef4444 14%,transparent);color:#ef4444"><i class="bi bi-life-preserver"></i></div>' +
                            '<div class="vm-feed-text">Ticket <b>#TKT-339</b> mới<div class="vm-feed-meta">23 phút trước · Ưu tiên cao</div></div>' +
                        '</div>' +
                        '<div class="vm-feed-item">' +
                            '<div class="vm-feed-icon"><i class="bi bi-cash-stack"></i></div>' +
                            '<div class="vm-feed-text">Nạp <b>5.000.000₫</b> ví user <b>tranb@example.com</b><div class="vm-feed-meta">35 phút trước</div></div>' +
                        '</div>' +
                    '</div></div>' +
                '</div>' +
            '</div>' +

            '<div class="vm-grid-2">' +
                '<div class="vm-card">' +
                    '<div class="vm-card-head">' +
                        '<div class="vm-card-title">Gói dịch vụ phổ biến</div>' +
                        '<a href="#/plans" class="vm-btn sm">Xem tất cả</a>' +
                    '</div>' +
                    '<div class="vm-card-body tight">' +
                        '<table class="vm-table">' +
                            '<thead><tr><th>Gói</th><th>Danh mục</th><th>CPU</th><th>RAM</th><th>Giá/tháng</th></tr></thead>' +
                            '<tbody>' + planRows + '</tbody>' +
                        '</table>' +
                    '</div>' +
                '</div>' +
                '<div class="vm-card">' +
                    '<div class="vm-card-head"><div class="vm-card-title">Sức khỏe hệ thống</div></div>' +
                    '<div class="vm-card-body">' +
                        '<div class="vm-flex-between vm-mb-2"><div><span class="vm-dot online"></span>API Gateway</div><span class="vm-badge success">99.99%</span></div>' +
                        '<div class="vm-flex-between vm-mb-2"><div><span class="vm-dot online"></span>Database</div><span class="vm-badge success">OK</span></div>' +
                        '<div class="vm-flex-between vm-mb-2"><div><span class="vm-dot online"></span>Storage Cluster</div><span class="vm-badge success">OK</span></div>' +
                        '<div class="vm-flex-between vm-mb-2"><div><span class="vm-dot warn"></span>Backup job</div><span class="vm-badge warn">Đang chạy</span></div>' +
                        '<div class="vm-flex-between vm-mb-2"><div><span class="vm-dot online"></span>CDN</div><span class="vm-badge success">OK</span></div>' +
                        '<div class="vm-flex-between"><div><span class="vm-dot online"></span>Mail queue</div><span class="vm-badge success">0 pending</span></div>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    AdminRouter.add('/dashboard', 'Dashboard', render);
})();