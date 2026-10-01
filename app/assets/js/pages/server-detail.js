/* =========================================================
   pages/server-detail.js — Chi tiết 1 server
========================================================= */
'use strict';

(function () {
    function render(query) {
        const user = Session.current();
        if (!user) { Flash.show('Vui lòng đăng nhập', 'warning'); Router.go('/login'); return renderLayout(''); }

        const id = Number(query.params.id);
        const server = DB.find('servers', id);
        if (!server || server.user_id !== user.id) {
            Flash.show('Server không tồn tại', 'danger');
            Router.go('/dashboard?view=services');
            return renderLayout('');
        }

        const plan = DB.findWhere('plans', p => p.slug === server.plan_slug);
        const order = DB.find('orders', server.order_id);

        // Tạo stats giả lập (random nhưng ổn định theo id)
        const seed = id * 9301 + 49297;
        const rnd = (offset) => ((seed + offset * 31) % 100) / 100;
        const cpu = Math.floor(15 + rnd(1) * 50);
        const ram = Math.floor(30 + rnd(2) * 40);
        const disk = Math.floor(20 + rnd(3) * 30);
        const net = Math.floor(10 + rnd(4) * 60);

        const actions =
            '<div class="kpi" style="border-color:color-mix(in srgb, var(--c-dedicated) 25%, var(--line))">' +
                    '<div class="l">Status</div>' +
                    '<div class="v" style="color:var(--c-dedicated);font-size:1rem"><i class="bi bi-circle-fill" style="font-size:.6rem"></i> Đang chạy</div>' +
                '</div>' +
                '<div class="kpi"><div class="l">Uptime</div><div class="v">' + Math.floor(20 + rnd(5) * 60) + ' ngày</div></div>' +
                '<div class="kpi"><div class="l">IP</div><div class="v" style="font-family:ui-monospace,monospace;font-size:1.05rem">' + server.ip + '</div></div>' +
                '<div class="kpi"><div class="l">Hết hạn</div><div class="v">' + fmtShortDate(server.due_at) + '</div></div>';

        const panelLeft =
            '<div class="panel reveal">' +
                    '<div class="panel-head"><h3><i class="bi bi-cpu"></i> Tài nguyên</h3></div>' +
                    '<div class="resource">' +
                        gauge('CPU', cpu, plan ? plan.cpu_cores * 100 : 100, 'cpu') +
                        gauge('RAM', ram, plan ? plan.ram_gb : 32, 'ram') +
                        gauge('Disk', disk, plan ? plan.disk_gb : 200, 'disk') +
                        gauge('Network', net, 1000, 'net') +
                    '</div>' +
                '</div>' +
                '<div class="panel reveal">' +
                    '<div class="panel-head"><h3><i class="bi bi-terminal"></i> Console</h3></div>' +
                    '<p style="color:var(--muted);font-size:.88rem;margin-bottom:12px">Kết nối SSH tới server của bạn:</p>' +
                    '<pre class="code">' + escapeHTML('ssh root@' + server.ip) + '</pre>' +
                    '<p style="color:var(--muted);font-size:.88rem;margin:16px 0 8px">Hoặc dùng nút bên dưới để mở web terminal (giả lập).</p>' +
                    '<button class="btn btn-line btn-sm" data-action="server-console">Mở web terminal</button>' +
                '</div>';

        const panelRight =
            '<div class="panel reveal">' +
                    '<div class="panel-head"><h3><i class="bi bi-info-circle"></i> Thông tin</h3></div>' +
                    '<table class="data-table">' +
                        '<tr><th>Hostname</th><td>' + escapeHTML(server.hostname) + '</td></tr>' +
                        '<tr><th>OS</th><td>' + escapeHTML(server.os_name) + '</td></tr>' +
                        '<tr><th>Plan</th><td>' + escapeHTML(plan ? plan.name : '—') + '</td></tr>' +
                        '<tr><th>CPU</th><td>' + server.cpu + ' vCPU</td></tr>' +
                        '<tr><th>RAM</th><td>' + server.ram + ' GB</td></tr>' +
                        '<tr><th>Disk</th><td>' + server.disk + ' GB</td></tr>' +
                        '<tr><th>Tạo lúc</th><td>' + fmtDate(server.created_at) + '</td></tr>' +
                        '<tr><th>Đơn hàng</th><td>#' + server.order_id + '</td></tr>' +
                    '</table>' +
                '</div>' +
                '<div class="panel reveal">' +
                    '<div class="panel-head"><h3><i class="bi bi-lightning"></i> Hành động</h3></div>' +
                    '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
                        '<button class="btn btn-line btn-sm" data-action="server-reboot">Restart</button>' +
                        '<button class="btn btn-line btn-sm" data-action="server-stop">Stop</button>' +
                        '<button class="btn btn-line btn-sm" data-action="server-backup">Backup ngay</button>' +
                        '<button class="btn btn-line btn-sm" data-action="server-rebuild">Rebuild</button>' +
                        '<button class="btn btn-line btn-sm" style="color:#b91c1c;border-color:#fca5a5" data-action="server-delete">Xoá</button>' +
                    '</div>' +
                '</div>' +
                '<div class="panel reveal" style="border-color:color-mix(in srgb, var(--c-ryzen) 25%, var(--line))">' +
                    '<div class="panel-head"><h3><i class="bi bi-arrow-counterclockwise"></i> Gia hạn</h3></div>' +
                    '<p style="color:var(--muted);font-size:.88rem">Đến <b>' + fmtShortDate(server.due_at) + '</b>. Gia hạn sớm để giữ nguyên IP và cấu hình.</p>' +
                    '<button class="btn btn-solid btn-sm" data-action="server-renew" data-id="' + server.id + '">Gia hạn +1 tháng</button>' +
                '</div>';

        const html =
            '<div class="wrap dash">' +
                '<div class="reveal" style="margin-bottom:20px">' +
                    '<a href="#/dashboard?view=services" class="btn btn-line btn-sm"><i class="bi bi-arrow-left"></i> Quay lại dịch vụ</a>' +
                '</div>' +
                '<h1 style="font-size:1.7rem;font-weight:600;letter-spacing:-0.03em;margin:0 0 24px">' +
                    '<i class="bi bi-hdd-stack" style="color:var(--accent)"></i> ' + escapeHTML(server.hostname) +
                '</h1>' +
                '<div class="kpis">' + actions + '</div>' +
                '<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:20px">' +
                    panelLeft +
                    '<div>' + panelRight + '</div>' +
                '</div>' +
            '</div>';
        return renderLayout(html);
    }

    function gauge(label, used, total, kind) {
        const pct = Math.min(100, Math.round((used / total) * 100));
        return (
            '<div class="gauge">' +
                '<div class="gauge-head"><span>' + label + '</span><span><b>' + used + '</b><span style="color:var(--muted);font-weight:400"> / ' + total + (kind === 'net' ? ' Mbps' : (kind === 'ram' || kind === 'disk' ? ' GB' : '%')) + '</span></span></div>' +
                '<div class="gauge-bar"><div class="gauge-fill ' + kind + '" style="width:' + pct + '%"></div></div>' +
            '</div>'
        );
    }

    // Actions
    function reboot() { Flash.show('Đã gửi lệnh reboot', 'success'); handleRoute();
    }
    function stop()   { Flash.show('Đã gửi lệnh stop', 'success'); handleRoute(); }
    function backup() { Flash.show('Đang tạo backup...', 'success'); setTimeout(() => { Flash.show('Backup hoàn tất', 'success'); }, 1500); }
    function rebuild() {
        if (!confirm('Rebuild sẽ xoá toàn bộ dữ liệu. Tiếp tục?')) return;
        Flash.show('Đang rebuild...', 'success');
    }
    function del() {
        if (!confirm('Xoá server vĩnh viễn? Toàn bộ dữ liệu sẽ mất.')) return;
        const id = Number(location.hash.match(/\/server\/(\d+)/)[1]);
        DB.transaction((d) => {
            const s = d.servers.find(x => x.id === id);
            if (s) {
                const ip = d.ip_pool.find(p => p.ip_address === s.ip);
                if (ip) ip.is_used = false;
                d.servers = d.servers.filter(x => x.id !== id);
            }
        });
        Flash.show('Server đã được xoá', 'success');
        Router.go('/dashboard?view=services');
    }
    function renew(btn) {
        const id = Number(btn.dataset.id);
        const server = DB.find('servers', id);
        const plan = DB.findWhere('plans', p => p.slug === server.plan_slug);
        const price = DB.findWhere('plan_prices', pr => pr.plan_id === plan.id && pr.cycle_months === 1);
        if (!price) return Flash.show('Không tìm thấy giá', 'danger');
        const user = Session.current();
        if (user.balance < price.price) {
            return Flash.show('Số dư không đủ (cần ' + fmtVND(price.price) + ')', 'danger');
        }
        try {
            DB.transaction((d) => {
                const orderId = (d.counters.order = (d.counters.order || 0) + 1);
                const invId = (d.counters.invoice = (d.counters.invoice || 0) + 1);
                const txId = (d.counters.transaction = (d.counters.transaction || 0) + 1);
                const now = new Date().toISOString();
                d.orders.push({ id: orderId, user_id: user.id, plan_id: plan.id, os_id: null, cycle_months: 1, hostname: 'renewal', coupon_code: null, total: price.price, status: 'paid', created_at: now, kind: 'renewal' });
                d.invoices.push({ id: invId, order_id: orderId, user_id: user.id, amount: price.price, status: 'paid', issued_at: now, due_at: now });
                d.transactions.push({ id: txId, user_id: user.id, type: 'renewal', amount: -price.price, balance_after: user.balance - price.price, ref_id: orderId, created_at: now });
                const u = d.users.find(x => x.id === user.id);
                u.balance -= price.price;
                const s = d.servers.find(x => x.id === id);
                s.due_at = addMonths(s.due_at, 1);
            });
            Flash.show('Gia hạn thành công +1 tháng', 'success');
            handleRoute();
        } catch (e) { Flash.show(e.message, 'danger'); }
    }
    function console() {
        Flash.show('Web terminal đang mở (giả lập)', 'info');
    }

    Router.add('GET', '/server/:id', render);

    window.App = window.App || {};
    window.App['server-reboot']  = reboot;
    window.App['server-stop']    = stop;
    window.App['server-backup']  = backup;
    window.App['server-rebuild'] = rebuild;
    window.App['server-delete']  = del;
    window.App['server-renew']   = renew;
    window.App['server-console'] = console;
})();