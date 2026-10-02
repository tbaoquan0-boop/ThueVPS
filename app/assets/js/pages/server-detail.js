/* =========================================================
   pages/server-detail.js — Chi tiết & Quản lý server
========================================================= */
'use strict';

(function () {
    function getServerId() {
        const hash = location.hash || '';
        const m = hash.match(/\/server\/(\d+)/);
        return m ? Number(m[1]) : null;
    }

    function render(query) {
        const user = Session.current();
        if (!user) {
            Flash.show('Vui lòng đăng nhập', 'warning');
            Router.go('/login');
            return renderLayout('');
        }

        const id = Number(query.params.id);
        const server = DB.find('servers', id);
        if (!server || server.user_id !== user.id) {
            Flash.show('Server không tồn tại', 'danger');
            Router.go('/dashboard?view=services');
            return renderLayout('');
        }

        const plan = DB.findWhere('plans', p => p.slug === server.plan_slug);
        const isRunning = server.status === 'running';
        const isStopped = server.status === 'stopped';
        const isRebooting = server.status === 'rebooting';

        // Stats giả lập ổn định theo id
        const seed = id * 9301 + 49297;
        const rnd = (offset) => ((seed + offset * 31) % 100) / 100;
        const cpu = isRunning ? Math.floor(15 + rnd(1) * 45) : 0;
        const ram = isRunning ? Math.floor(25 + rnd(2) * 35) : 0;
        const disk = Math.floor(20 + rnd(3) * 30);
        const net = isRunning ? Math.floor(10 + rnd(4) * 60) : 0;

        const statusColor = isRunning ? 'var(--c-dedicated)' : (isStopped ? '#ef4444' : 'var(--c-ryzen)');
        const statusText = isRunning ? 'Đang chạy' : (isStopped ? 'Đã dừng' : 'Đang khởi động...');
        const statusIcon = isRunning ? 'bi-circle-fill' : (isStopped ? 'bi-pause-circle-fill' : 'bi-arrow-repeat');

        const kpis =
            '<div class="kpi" style="border-color:color-mix(in srgb, ' + statusColor + ' 30%, var(--line))">' +
                '<div class="l">Trạng thái</div>' +
                '<div class="v" style="color:' + statusColor + ';font-size:1rem;display:flex;align-items:center;gap:6px">' +
                    '<i class="bi ' + statusIcon + '" style="font-size:.7rem"></i> ' + statusText +
                '</div>' +
            '</div>' +
            '<div class="kpi"><div class="l">Uptime</div><div class="v">' + (isRunning ? (Math.floor(20 + rnd(5) * 60) + ' ngày') : '0 ngày') + '</div></div>' +
            '<div class="kpi"><div class="l">IP Address</div><div class="v" style="font-family:ui-monospace,monospace;font-size:1.05rem">' + server.ip + '</div></div>' +
            '<div class="kpi"><div class="l">Hạn sử dụng</div><div class="v">' + fmtShortDate(server.due_at) + '</div></div>';

        const panelLeft =
            '<div class="panel reveal">' +
                '<div class="panel-head"><h3><i class="bi bi-cpu"></i> Tài nguyên thời gian thực</h3></div>' +
                '<div class="resource">' +
                    gauge('CPU', cpu, 100, 'cpu') +
                    gauge('RAM', ram, plan ? plan.ram_gb : server.ram, 'ram') +
                    gauge('Disk', disk, plan ? plan.disk_gb : server.disk, 'disk') +
                    gauge('Network', net, 1000, 'net') +
                '</div>' +
            '</div>' +
            '<div class="panel reveal">' +
                '<div class="panel-head"><h3><i class="bi bi-terminal"></i> Console & SSH</h3></div>' +
                '<p style="color:var(--muted);font-size:.88rem;margin-bottom:12px">Kết nối dòng lệnh bảo mật tới server:</p>' +
                '<div style="display:flex;align-items:center;gap:8px;background:var(--surface-2);padding:10px 14px;border-radius:10px;border:1px solid var(--line);margin-bottom:16px">' +
                    '<pre class="code" style="margin:0;background:transparent;padding:0;color:var(--ink);flex:1">ssh root@' + escapeHTML(server.ip) + '</pre>' +
                    '<button type="button" class="btn btn-line btn-sm" onclick="copyText(\'ssh root@' + escapeHTML(server.ip) + '\', \'Đã sao chép lệnh SSH\')"><i class="bi bi-clipboard"></i> Chép</button>' +
                '</div>' +
                '<button class="btn btn-solid btn-sm" data-action="server-console"><i class="bi bi-terminal-fill"></i> Mở Web Terminal</button>' +
            '</div>';

        // Action buttons state-dependent
        let actionButtons = '';
        if (isRunning) {
            actionButtons =
                '<button type="button" class="btn btn-line btn-sm" data-action="server-reboot"><i class="bi bi-arrow-repeat"></i> Khởi động lại</button>' +
                '<button type="button" class="btn btn-line btn-sm" data-action="server-stop"><i class="bi bi-stop-circle"></i> Tắt máy (Stop)</button>' +
                '<button type="button" class="btn btn-line btn-sm" data-action="server-backup"><i class="bi bi-cloud-arrow-up"></i> Backup ngay</button>' +
                '<button type="button" class="btn btn-line btn-sm" data-action="server-rebuild"><i class="bi bi-arrow-clockwise"></i> Cài lại OS</button>' +
                '<button type="button" class="btn btn-line btn-sm" style="color:#b91c1c;border-color:#fca5a5" data-action="server-delete"><i class="bi bi-trash"></i> Xoá</button>';
        } else if (isStopped) {
            actionButtons =
                '<button type="button" class="btn btn-solid btn-sm" data-action="server-start"><i class="bi bi-play-circle-fill"></i> Bật máy (Start)</button>' +
                '<button type="button" class="btn btn-line btn-sm" data-action="server-backup"><i class="bi bi-cloud-arrow-up"></i> Backup ngay</button>' +
                '<button type="button" class="btn btn-line btn-sm" data-action="server-rebuild"><i class="bi bi-arrow-clockwise"></i> Cài lại OS</button>' +
                '<button type="button" class="btn btn-line btn-sm" style="color:#b91c1c;border-color:#fca5a5" data-action="server-delete"><i class="bi bi-trash"></i> Xoá</button>';
        } else {
            actionButtons = '<button type="button" class="btn btn-line btn-sm" disabled><i class="bi bi-hourglass-split"></i> Đang xử lý lệnh...</button>';
        }

        const panelRight =
            '<div class="panel reveal">' +
                '<div class="panel-head"><h3><i class="bi bi-info-circle"></i> Cấu hình máy chủ</h3></div>' +
                '<div class="table-wrap"><table class="data-table">' +
                    '<tr><th>Hostname</th><td><b>' + escapeHTML(server.hostname) + '</b></td></tr>' +
                    '<tr><th>Hệ điều hành</th><td>' + escapeHTML(server.os_name) + '</td></tr>' +
                    '<tr><th>Gói dịch vụ</th><td>' + escapeHTML(plan ? plan.name : 'Cloud VPS') + '</td></tr>' +
                    '<tr><th>CPU</th><td>' + server.cpu + ' vCPU</td></tr>' +
                    '<tr><th>RAM</th><td>' + server.ram + ' GB</td></tr>' +
                    '<tr><th>SSD NVMe</th><td>' + server.disk + ' GB</td></tr>' +
                    '<tr><th>Khởi tạo</th><td>' + fmtDate(server.created_at) + '</td></tr>' +
                    '<tr><th>Mã đơn</th><td>#' + server.order_id + '</td></tr>' +
                '</table></div>' +
            '</div>' +
            '<div class="panel reveal">' +
                '<div class="panel-head"><h3><i class="bi bi-lightning-charge"></i> Quản trị thao tác</h3></div>' +
                '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
                    actionButtons +
                '</div>' +
            '</div>' +
            '<div class="panel reveal" style="border-color:color-mix(in srgb, var(--c-ryzen) 25%, var(--line))">' +
                '<div class="panel-head"><h3><i class="bi bi-arrow-counterclockwise"></i> Gia hạn thời gian</h3></div>' +
                '<p style="color:var(--muted);font-size:.88rem">Hạn đến <b>' + fmtShortDate(server.due_at) + '</b>. Gia hạn để duy trì IP tĩnh và toàn vẹn dữ liệu.</p>' +
                '<button type="button" class="btn btn-solid btn-sm" data-action="server-renew" data-id="' + server.id + '"><i class="bi bi-credit-card"></i> Gia hạn +1 tháng</button>' +
            '</div>';

        const html =
            '<div class="wrap dash">' +
                '<div class="reveal" style="margin-bottom:20px">' +
                    '<a href="#/dashboard?view=services" class="btn btn-line btn-sm"><i class="bi bi-arrow-left"></i> Quay lại dịch vụ</a>' +
                '</div>' +
                '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px">' +
                    '<h1 style="font-size:1.7rem;font-weight:700;letter-spacing:-0.03em;margin:0">' +
                        '<i class="bi bi-hdd-stack" style="color:var(--accent)"></i> ' + escapeHTML(server.hostname) +
                    '</h1>' +
                '</div>' +
                '<div class="kpis">' + kpis + '</div>' +
                '<div style="display:grid;grid-template-columns:1.35fr 1fr;gap:20px">' +
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

    // ===== Actual functional actions =====
    function start() {
        const id = getServerId();
        if (!id) return;
        DB.update('servers', id, { status: 'running' });
        Flash.show('Server đã khởi động thành công (running)!', 'success');
        handleRoute();
    }

    function stop() {
        const id = getServerId();
        if (!id) return;
        DB.update('servers', id, { status: 'stopped' });
        Flash.show('Server đã tắt máy (stopped).', 'warning');
        handleRoute();
    }

    function reboot() {
        const id = getServerId();
        if (!id) return;
        DB.update('servers', id, { status: 'rebooting' });
        Flash.show('Đang khởi động lại server...', 'info');
        handleRoute();

        setTimeout(() => {
            DB.update('servers', id, { status: 'running' });
            Flash.show('Server đã khởi động lại hoàn tất!', 'success');
            handleRoute();
        }, 1800);
    }

    function backup() {
        const id = getServerId();
        if (!id) return;
        const server = DB.find('servers', id);
        Flash.show('Đang tạo bản sao lưu snapshot...', 'info');
        setTimeout(() => {
            const bId = DB.nextId('backup');
            DB.insert('backups', {
                id: bId,
                server_id: id,
                user_id: server.user_id,
                size_mb: Math.floor((server.disk || 40) * 120),
                created_at: new Date().toISOString(),
            });
            Flash.show('Sao lưu snapshot server #' + server.hostname + ' hoàn tất!', 'success');
        }, 1200);
    }

    function rebuild() {
        const id = getServerId();
        if (!id) return;
        const server = DB.find('servers', id);
        const allOs = DB.all('os_images').filter(o => o.is_active);

        const optionsHTML = allOs.map(o =>
            '<option value="' + o.id + '">' + escapeHTML(o.name) + ' (' + escapeHTML(o.desc || o.family) + ')</option>'
        ).join('');

        const bodyHTML =
            '<div>' +
                '<p style="color:var(--muted);font-size:.9rem;margin-bottom:14px">Chọn hệ điều hành muốn cài đặt lại cho server <b>' + escapeHTML(server.hostname) + '</b>:</p>' +
                '<label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:6px">Hệ điều hành mới:</label>' +
                '<select id="rebuild-os-id" class="input" style="font-weight:600;margin-bottom:16px">' +
                    optionsHTML +
                '</select>' +
                '<div style="background:#fef2f2;border:1px solid #fecaca;padding:12px 14px;border-radius:10px;color:#991b1b;font-size:.85rem;line-height:1.5">' +
                    '<i class="bi bi-exclamation-triangle-fill"></i> <b>CẢNH BÁO QUAN TRỌNG:</b>' +
                    '<p style="margin:4px 0 0">Toàn bộ dữ liệu hiện có trên ổ đĩa sẽ bị xoá hoàn toàn và định dạng lại. Mật khẩu root mới sẽ được cấp và gửi đến email của bạn.</p>' +
                '</div>' +
            '</div>';

        const footerHTML =
            '<button type="button" class="btn btn-line" onclick="Modal.close()">Huỷ bỏ</button>' +
            '<button type="button" class="btn btn-solid" style="background:#b91c1c;border-color:#b91c1c;color:#fff" data-action="server-confirm-rebuild" data-id="' + id + '">' +
                '<i class="bi bi-arrow-clockwise"></i> Bắt đầu Rebuild' +
            '</button>';

        Modal.show({
            title: 'Cài lại hệ điều hành (Rebuild Server)',
            body: bodyHTML,
            footer: footerHTML,
            maxWidth: '560px'
        });
    }

    function confirmRebuild(btn) {
        const id = Number(btn.dataset.id);
        const select = document.getElementById('rebuild-os-id');
        const osId = select ? Number(select.value) : 1;
        const os = DB.find('os_images', osId);
        const osName = os ? os.name : 'Ubuntu 24.04 LTS';

        Modal.close();
        Flash.show('Đang tiến hành format ổ cứng và cài đặt ' + osName + '...', 'info');

        setTimeout(() => {
            DB.update('servers', id, { os_name: osName, status: 'running' });
            Flash.show('Rebuild hoàn tất! Server đã được cài ' + osName + '. Mật khẩu mới đã gửi tới email.', 'success');
            handleRoute();
        }, 1600);
    }

    function del() {
        if (!confirm('Xoá server vĩnh viễn? Toàn bộ dữ liệu sẽ mất và địa chỉ IP sẽ được thu hồi.')) return;
        const id = getServerId();
        if (!id) return;
        DB.transaction((d) => {
            const s = d.servers.find(x => x.id === id);
            if (s) {
                const ip = d.ip_pool.find(p => p.ip_address === s.ip);
                if (ip) ip.is_used = false;
                d.servers = d.servers.filter(x => x.id !== id);
            }
        });
        Flash.show('Server đã được xoá thành công', 'success');
        Router.go('/dashboard?view=services');
    }

    function renew(btn) {
        const id = Number(btn.dataset.id);
        const server = DB.find('servers', id);
        const plan = DB.findWhere('plans', p => p.slug === server.plan_slug);
        const price = DB.findWhere('plan_prices', pr => pr.plan_id === plan.id && pr.cycle_months === 1);
        if (!price) return Flash.show('Không tìm thấy giá gia hạn', 'danger');
        const user = Session.current();
        if (user.balance < price.price) {
            Flash.show('Số dư không đủ (cần ' + fmtVND(price.price) + ', bạn có ' + fmtVND(user.balance) + '). Vui lòng nạp tiền!', 'danger');
            Router.go('/dashboard?view=wallet');
            return;
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
            Flash.show('Gia hạn thành công +1 tháng cho server #' + server.hostname, 'success');
            handleRoute();
        } catch (e) { Flash.show(e.message, 'danger'); }
    }

    // ===== Web Terminal Console =====
    function openConsole() {
        const id = getServerId();
        if (!id) return;
        const server = DB.find('servers', id);
        if (!server) return;

        if (server.status === 'stopped') {
            Flash.show('Server đang tắt. Vui lòng bật máy trước khi mở terminal!', 'warning');
            return;
        }

        const bannerText =
            'Connected to ' + server.hostname + ' (' + server.ip + ')\n' +
            'Welcome to ' + (server.os_name || 'Ubuntu 24.04 LTS') + ' (GNU/Linux 6.8.0-31-generic x86_64)\n\n' +
            ' * Documentation:  https://help.ubuntu.com\n' +
            ' * Management:     https://taovps.vn\n' +
            ' * Support:        https://taovps.vn/#/dashboard?view=tickets\n\n' +
            ' System information:\n' +
            '  System load:   0.14, 0.08, 0.02\n' +
            '  Usage of /:    22.4% of ' + server.disk + 'GB\n' +
            '  Memory usage:  31% of ' + server.ram + 'GB\n' +
            '  IPv4 address:  ' + server.ip + '\n\n' +
            'Gõ "help" để xem danh sách các lệnh hỗ trợ trong web terminal.\n';

        const bodyHTML =
            '<div class="terminal-window">' +
                '<div class="terminal-topbar">' +
                    '<div class="terminal-dots">' +
                        '<span class="terminal-dot red" onclick="Modal.close()" style="cursor:pointer" title="Đóng"></span>' +
                        '<span class="terminal-dot yellow"></span>' +
                        '<span class="terminal-dot green"></span>' +
                    '</div>' +
                    '<div class="terminal-title">root@' + escapeHTML(server.hostname) + ':~ (ssh)</div>' +
                    '<div style="font-size:.72rem;color:#8b949e"><i class="bi bi-lock-fill" style="color:#27c93f"></i> 256-bit AES</div>' +
                '</div>' +
                '<div class="terminal-screen" id="term-screen">' +
                    '<div class="terminal-output" id="term-output">' + escapeHTML(bannerText) + '</div>' +
                    '<div class="terminal-line">' +
                        '<span class="terminal-prompt">root@' + escapeHTML(server.hostname) + ':~#</span>' +
                        '<input type="text" id="term-input" class="terminal-input" autocomplete="off" spellcheck="false" autofocus>' +
                    '</div>' +
                '</div>' +
            '</div>';

        const footerHTML =
            '<button type="button" class="btn btn-line btn-sm" onclick="Modal.close()">Đóng Terminal</button>' +
            '<button type="button" class="btn btn-line btn-sm" onclick="document.getElementById(\'term-input\').value=\'reboot\'; document.getElementById(\'term-input\').dispatchEvent(new KeyboardEvent(\'keydown\', {key: \'Enter\'}))"><i class="bi bi-arrow-repeat"></i> Reboot server</button>';

        Modal.show({
            title: 'Web Terminal — ' + server.hostname,
            body: bodyHTML,
            footer: footerHTML,
            maxWidth: '720px'
        });

        setTimeout(() => {
            const input = document.getElementById('term-input');
            const screen = document.getElementById('term-screen');
            const output = document.getElementById('term-output');
            if (!input) return;
            input.focus();

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const raw = input.value;
                    const cmd = raw.trim().toLowerCase();
                    input.value = '';

                    let response = '';
                    if (cmd === '') {
                        response = '';
                    } else if (cmd === 'help') {
                        response =
                            'Các lệnh terminal khả dụng:\n' +
                            '  help        - Hiển thị danh sách câu lệnh\n' +
                            '  uptime      - Xem thời gian máy chủ đã chạy & load trung bình\n' +
                            '  free -h     - Xem dung lượng RAM trống / đang dùng\n' +
                            '  df -h       - Xem dung lượng ổ cứng NVMe\n' +
                            '  ip a        - Xem địa chỉ IP và card mạng eth0\n' +
                            '  uname -a    - Xem thông tin nhân hệ điều hành Kernel Linux\n' +
                            '  whoami      - Kiểm tra tài khoản hiện tại (root)\n' +
                            '  reboot      - Gửi lệnh khởi động lại server\n' +
                            '  clear       - Xoá sạch màn hình terminal\n' +
                            '  exit        - Đóng cửa sổ web terminal';
                    } else if (cmd === 'uptime') {
                        response = ' 17:05:22 up 24 days,  3:14,  1 user,  load average: 0.12, 0.09, 0.04';
                    } else if (cmd === 'free' || cmd === 'free -h' || cmd === 'free -m') {
                        const totalRam = server.ram;
                        const usedRam = (totalRam * 0.32).toFixed(1);
                        const freeRam = (totalRam - usedRam).toFixed(1);
                        response =
                            '               total        used        free      shared  buff/cache   available\n' +
                            'Mem:           ' + totalRam + '.0Gi       ' + usedRam + 'Gi       ' + freeRam + 'Gi       120Mi       840Mi       ' + (freeRam * 0.9).toFixed(1) + 'Gi\n' +
                            'Swap:          2.0Gi       180Mi       1.8Gi';
                    } else if (cmd === 'df' || cmd === 'df -h') {
                        const totalDisk = server.disk;
                        const usedDisk = (totalDisk * 0.24).toFixed(1);
                        const availDisk = (totalDisk - usedDisk).toFixed(1);
                        response =
                            'Filesystem      Size  Used Avail Use% Mounted on\n' +
                            '/dev/nvme0n1p1   ' + totalDisk + 'G  ' + usedDisk + 'G  ' + availDisk + 'G  24% /\n' +
                            'tmpfs           ' + (server.ram / 2).toFixed(1) + 'G  1.2M  ' + (server.ram / 2).toFixed(1) + 'G   1% /run\n' +
                            '/dev/nvme0n1p15  105M  6.1M   99M   6% /boot/efi';
                    } else if (cmd === 'ip a' || cmd === 'ip' || cmd === 'ifconfig') {
                        response =
                            '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN\n' +
                            '    inet 127.0.0.1/8 scope host lo\n' +
                            '2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP\n' +
                            '    inet ' + server.ip + '/24 brd 10.0.1.255 scope global eth0\n' +
                            '    inet6 2405:4800:102:88::1/64 scope global dynamic';
                    } else if (cmd === 'uname' || cmd === 'uname -a') {
                        response = 'Linux ' + server.hostname + ' 6.8.0-31-generic #31-Ubuntu SMP PREEMPT_DYNAMIC Sat May 11 00:40:10 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux';
                    } else if (cmd === 'whoami') {
                        response = 'root';
                    } else if (cmd === 'reboot') {
                        response = 'Broadcast message from root@' + server.hostname + ':\nServer is going down for reboot NOW!';
                        output.textContent += '\nroot@' + server.hostname + ':~# ' + raw + '\n' + response + '\n';
                        setTimeout(() => {
                            Modal.close();
                            reboot();
                        }, 800);
                        return;
                    } else if (cmd === 'clear') {
                        output.textContent = '';
                        screen.scrollTop = 0;
                        return;
                    } else if (cmd === 'exit' || cmd === 'quit') {
                        Modal.close();
                        return;
                    } else {
                        response = 'bash: ' + cmd + ': command not found. Gõ "help" để xem danh sách lệnh.';
                    }

                    output.textContent += '\nroot@' + server.hostname + ':~# ' + raw + (response ? '\n' + response : '');
                    screen.scrollTop = screen.scrollHeight;
                }
            });
        }, 100);
    }

    Router.add('GET', '/server/:id', render);

    window.App = window.App || {};
    window.App['server-start']           = start;
    window.App['server-stop']            = stop;
    window.App['server-reboot']          = reboot;
    window.App['server-backup']          = backup;
    window.App['server-rebuild']         = rebuild;
    window.App['server-confirm-rebuild'] = confirmRebuild;
    window.App['server-delete']          = del;
    window.App['server-renew']           = renew;
    window.App['server-console']         = openConsole;
})();