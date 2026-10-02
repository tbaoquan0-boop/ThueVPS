/* =========================================================
   admin/dashboard.js — Tổng quan hệ thống (Interactive & Modern)
========================================================= */
'use strict';

(function () {
    var chartPeriod = '12m'; // '12m' or '7d'

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
            var pct = Math.max(3, Math.min(100, Math.round(v / max * 88)));
            return '<div class="vm-chart-col" title="' + labels[i] + ': ' + vnd(v) + '">' +
                '<div class="vm-chart-bar-wrap">' +
                    '<div class="vm-chart-tip">' + labels[i] + ': ' + vnd(v) + '</div>' +
                    '<div class="vm-chart-bar" style="height:' + pct + '%;"></div>' +
                '</div>' +
                '<div class="vm-chart-label">' + labels[i] + '</div>' +
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

        var totalRev = orders.filter(function (o) { return o.status === 'paid'; }).reduce(function (s, o) { return s + (o.total || 0); }, 0);
        var activeServers = servers.filter(function (s) { return s.status === 'running'; }).length;
        var openTickets = tickets.filter(function (t) { return t.status === 'open' || t.status === 'pending'; }).length;

        var rev = totalRev || 58000000;
        var usersCount = users.length || 1248;
        var svTotal = servers.length || 50;
        var svRunning = activeServers || 47;
        var tkOpen = openTickets || 6;

        // Chart data calculation
        var chartValues = [];
        var chartLabels = [];
        if (chartPeriod === '7d') {
            var days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
            chartLabels = days;
            chartValues = [4200000, 6800000, 5400000, 8900000, 11200000, 9500000, 12400000];
        } else {
            chartLabels = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
            chartValues = new Array(12).fill(0);
            orders.forEach(function (o) {
                if (o.created_at && o.status === 'paid') {
                    var m = new Date(o.created_at).getMonth();
                    if (!isNaN(m) && m >= 0 && m < 12) chartValues[m] += o.total || 0;
                }
            });
            if (chartValues.every(function (v) { return v === 0; })) {
                chartValues = [12,18,15,22,28,32,35,40,38,45,52,58].map(function (v) { return v * 1e6; });
            }
        }

        var planRows = plans.slice(0, 5).map(function (p) {
            return '<tr>' +
                '<td><b>' + escapeHTML(p.name) + '</b></td>' +
                '<td><span class="vm-badge muted">' + escapeHTML(p.category || 'cloud') + '</span></td>' +
                '<td>' + (p.cpu_cores || 2) + ' vCPU</td>' +
                '<td>' + (p.ram_gb || 2) + ' GB</td>' +
                '<td><b>' + vnd(p.price_monthly || (p.price || 89000)) + '</b></td>' +
            '</tr>';
        }).join('');

        // Dynamic activity feed
        var feedItems = [];
        var latestOrders = orders.slice().reverse().slice(0, 2);
        latestOrders.forEach(function (o) {
            var u = DB.find('users', o.user_id) || {};
            var pl = DB.find('plans', o.plan_id) || {};
            feedItems.push(
                '<div class="vm-feed-item">' +
                    '<div class="vm-feed-icon"><i class="bi bi-receipt"></i></div>' +
                    '<div class="vm-feed-text"><b>Đơn hàng #' + escapeHTML(String(o.id)) + '</b> (' + escapeHTML(u.name || 'Khách') + ')<div class="vm-feed-meta">' + (o.status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán') + ' · ' + escapeHTML(pl.name || 'Gói VPS') + ' · ' + vnd(o.total) + '</div></div>' +
                '</div>'
            );
        });

        var latestServers = servers.slice().reverse().slice(0, 2);
        latestServers.forEach(function (s) {
            feedItems.push(
                '<div class="vm-feed-item">' +
                    '<div class="vm-feed-icon" style="background:color-mix(in srgb,#10b981 14%,transparent);color:#10b981"><i class="bi bi-hdd-rack"></i></div>' +
                    '<div class="vm-feed-text">Server <b>' + escapeHTML(s.hostname) + '</b> đang hoạt động<div class="vm-feed-meta">IP: ' + escapeHTML(s.ip || '10.0.1.1') + ' · Region: ' + escapeHTML(s.region || 'HN-1') + '</div></div>' +
                '</div>'
            );
        });

        var latestTickets = tickets.slice().reverse().slice(0, 2);
        latestTickets.forEach(function (t) {
            feedItems.push(
                '<div class="vm-feed-item">' +
                    '<div class="vm-feed-icon" style="background:color-mix(in srgb,#ef4444 14%,transparent);color:#ef4444"><i class="bi bi-life-preserver"></i></div>' +
                    '<div class="vm-feed-text">Ticket <b>#' + escapeHTML(String(t.id)) + '</b> ' + escapeHTML(t.title || t.subject || 'Yêu cầu hỗ trợ') + '<div class="vm-feed-meta">Ưu tiên ' + escapeHTML(t.priority || 'medium') + ' · ' + escapeHTML(t.status || 'open') + '</div></div>' +
                '</div>'
            );
        });

        if (feedItems.length === 0) {
            feedItems.push('<div class="vm-feed-item"><div class="vm-feed-text" style="color:var(--vm-muted)">Chưa có hoạt động gần đây.</div></div>');
        }

        var is7d = chartPeriod === '7d';

        return '' +
            '<div class="vm-page-head">' +
                '<div><h1>Dashboard</h1><p>Tổng quan vận hành và sức khỏe hệ thống TáoVPS Web</p></div>' +
                '<div class="vm-page-actions">' +
                    '<a href="#/orders" class="vm-btn sm"><i class="bi bi-receipt"></i> Đơn hàng</a>' +
                    '<a href="#/servers" class="vm-btn sm primary"><i class="bi bi-hdd-rack"></i> Server nodes</a>' +
                '</div>' +
            '</div>' +

            '<div class="vm-kpi-grid">' +
                kpi('Doanh thu tháng', vnd(rev),
                    '<i class="bi bi-arrow-up-right"></i> +12.4% so với tháng trước', 'up',
                    'bi-wallet-fill', '#10b981') +
                kpi('Người dùng', fmt(usersCount),
                    '<i class="bi bi-arrow-up-right"></i> +34 đăng ký mới', 'up',
                    'bi-people-fill', '#3b82f6') +
                kpi('Server online', fmt(svRunning),
                    '<span style="color:var(--vm-muted)">/ ' + fmt(svTotal) + ' nodes</span>', '',
                    'bi-hdd-rack-fill', '#8b5cf6') +
                kpi('Ticket cần xử lý', fmt(tkOpen),
                    '<i class="bi bi-clock"></i> TB phản hồi 5 phút', '',
                    'bi-life-preserver', '#f59e0b') +
            '</div>' +

            '<div class="vm-grid-2">' +
                '<div class="vm-card">' +
                    '<div class="vm-card-head">' +
                        '<div class="vm-card-title"><i class="bi bi-graph-up"></i> ' + (is7d ? 'Doanh thu 7 ngày qua' : 'Doanh thu 12 tháng gần nhất') + '</div>' +
                        '<div class="vm-flex">' +
                            '<button class="vm-btn sm" id="adChart7d" style="' + (is7d ? 'background:var(--vm-accent);color:#fff;border-color:var(--vm-accent)' : '') + '">7 ngày</button>' +
                            '<button class="vm-btn sm" id="adChart12m" style="' + (!is7d ? 'background:var(--vm-accent);color:#fff;border-color:var(--vm-accent)' : '') + '">12 tháng</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="vm-card-body">' + barChart(chartValues, chartLabels) + '</div>' +
                '</div>' +
                '<div class="vm-card">' +
                    '<div class="vm-card-head"><div class="vm-card-title"><i class="bi bi-activity"></i> Hoạt động gần đây</div></div>' +
                    '<div class="vm-card-body"><div class="vm-feed">' + feedItems.join('') + '</div></div>' +
                '</div>' +
            '</div>' +

            '<div class="vm-grid-2">' +
                '<div class="vm-card">' +
                    '<div class="vm-card-head">' +
                        '<div class="vm-card-title"><i class="bi bi-box-seam"></i> Gói dịch vụ phổ biến</div>' +
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
                    '<div class="vm-card-head"><div class="vm-card-title"><i class="bi bi-shield-check"></i> Sức khỏe hạ tầng</div></div>' +
                    '<div class="vm-card-body">' +
                        '<div class="vm-flex-between vm-mb-2"><div><span class="vm-dot online"></span>API Gateway (Edge Cluster)</div><span class="vm-badge success">99.99%</span></div>' +
                        '<div class="vm-flex-between vm-mb-2"><div><span class="vm-dot online"></span>Database Master (Postgres)</div><span class="vm-badge success">Hoạt động tốt</span></div>' +
                        '<div class="vm-flex-between vm-mb-2"><div><span class="vm-dot online"></span>Ceph NVMe Storage Cluster</div><span class="vm-badge success">Độ trễ 0.4ms</span></div>' +
                        '<div class="vm-flex-between vm-mb-2"><div><span class="vm-dot warn"></span>Tự động sao lưu Snapshot</div><span class="vm-badge warn">Đang chạy (85%)</span></div>' +
                        '<div class="vm-flex-between vm-mb-2"><div><span class="vm-dot online"></span>Hạ tầng Mạng Viettel / VNPT</div><span class="vm-badge success">Băng thông 100Gbps</span></div>' +
                        '<div class="vm-flex-between"><div><span class="vm-dot online"></span>Hàng đợi gửi Email & SMS OTP</div><span class="vm-badge success">0 tồn đọng</span></div>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    AdminRouter.add('/dashboard', 'Dashboard', render);

    AdminRouter.onRender(function (path) {
        if (path !== '/dashboard') return;
        var btn7d = document.getElementById('adChart7d');
        var btn12m = document.getElementById('adChart12m');
        if (btn7d) {
            btn7d.addEventListener('click', function () {
                chartPeriod = '7d';
                AdminUI.rerender();
            });
        }
        if (btn12m) {
            btn12m.addEventListener('click', function () {
                chartPeriod = '12m';
                AdminUI.rerender();
            });
        }
    });
})();