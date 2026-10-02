/* =========================================================
   admin/servers.js — Quản lý máy chủ (CRUD thật)
   ========================================================= */
'use strict';

(function () {
    var esc = window.AdminUI.escapeHTML;
    var ui = window.AdminUI;

    var filters = { q: '', region: 'all', status: 'all' };
    var REGIONS = ['HN-1', 'HN-2', 'HCM-1', 'HCM-2', 'DN-1'];

    function seedIfEmpty() {
        if (DB.all('servers').length > 0) return;
        var customers = DB.filter('users', function (u) { return u.role === 'customer' && u.status === 'active'; });
        var ownerPool = customers.length ? customers : DB.all('users');
        var samples = [
            { hostname:'cloud-s1-04',     plan:1, region:'HN-1', status:'running' },
            { hostname:'ryzen-r1-12',     plan:4, region:'HN-1', status:'running' },
            { hostname:'gpu-g2-03',       plan:11,region:'HCM-1',status:'running' },
            { hostname:'highfreq-h2-08',  plan:8, region:'HN-2', status:'warning' },
            { hostname:'dedi-d1-01',      plan:13,region:'HN-1', status:'running' },
            { hostname:'cloud-s3-09',     plan:3, region:'HCM-1',status:'stopped' },
            { hostname:'ryzen-r3-02',     plan:6, region:'HN-2', status:'running' },
        ];
        samples.forEach(function (s) {
            var id = DB.nextId ? (function () {
                var all = DB.all('servers');
                return all.length ? Math.max.apply(null, all.map(function (x) { return x.id; })) + 1 : 1;
            })() : Date.now();
            var owner = ownerPool[Math.floor(Math.random() * ownerPool.length)] || null;
            var plan = DB.find('plans', s.plan);
            DB.insert('servers', Object.assign({}, s, {
                id: id,
                ip: '10.' + Math.floor(Math.random() * 200) + '.' + Math.floor(Math.random() * 200) + '.' + (1 + Math.floor(Math.random() * 200)),
                owner_id: owner ? owner.id : null,
                owner_email: owner ? owner.email : '',
                cpu: Math.floor(Math.random() * 100), ram: Math.floor(Math.random() * 100),
                created_at: new Date().toISOString(),
                plan_name: plan ? plan.name : '',
            }));
        });
    }

    function dot(s) {
        if (s === 'running') return '<span class="vm-dot online"></span>';
        if (s === 'warning') return '<span class="vm-dot warn"></span>';
        if (s === 'stopped' || s === 'offline') return '<span class="vm-dot off"></span>';
        return '<span class="vm-dot"></span>';
    }
    function statusTxt(s) {
        return ({ running:'Running', warning:'Warning', stopped:'Stopped', offline:'Offline' })[s] || s;
    }
    function bar(v) {
        var cls = v < 60 ? '' : v < 85 ? 'warn' : 'danger';
        return '<div class="vm-progress ' + cls + '" style="width:120px"><i style="width:' + v + '%"></i></div>' +
            '<div style="font-size:.72rem;color:var(--vm-muted);margin-top:3px">' + v + '%</div>';
    }

    function getPlanName(s) {
        if (s.plan_name) return s.plan_name;
        if (s.plan_slug) {
            var pl = DB.findWhere('plans', function (p) { return p.slug === s.plan_slug; });
            if (pl) return pl.name;
            return s.plan_slug.toUpperCase();
        }
        if (s.plan_id) {
            var pl = DB.find('plans', s.plan_id);
            if (pl) return pl.name;
            return 'Gói #' + s.plan_id;
        }
        return 'Cloud VPS';
    }

    function getOwnerInfo(s) {
        var uid = s.user_id || s.owner_id;
        if (uid) {
            var u = DB.find('users', uid);
            if (u) return { id: u.id, name: u.name, email: u.email };
        }
        if (s.owner_email) {
            return { id: null, name: s.owner_email, email: s.owner_email };
        }
        return null;
    }

    function getFiltered() {
        var q = (filters.q || '').toLowerCase().trim();
        return DB.all('servers').filter(function (s) {
            if (filters.region !== 'all' && s.region && s.region !== filters.region) return false;
            if (filters.status !== 'all' && s.status !== filters.status) return false;
            if (q) {
                var owner = getOwnerInfo(s);
                var hay = ((s.hostname || '') + ' ' + (s.ip || '') + ' ' + (owner ? (owner.name + ' ' + owner.email) : '') + ' ' + getPlanName(s)).toLowerCase();
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        });
    }

    function serverForm(server) {
        var plans = DB.all('plans');
        var users = DB.all('users');
        var isEdit = !!server;
        ui.formModal({
            title: isEdit ? 'Sửa server ' + server.hostname : 'Cấp phát server mới',
            okText: isEdit ? 'Cập nhật' : 'Cấp phát',
            size: 'lg',
            fields: [
                { name: 'hostname', label: 'Hostname', required: true, value: server && server.hostname, placeholder: 'cloud-s1-04' },
                { name: 'ip', label: 'Địa chỉ IP', value: server && server.ip, placeholder: '10.0.1.4' },
                { name: 'plan_id', label: 'Gói', type: 'select', value: server && server.plan_id, options: plans.map(function (p) { return { value: p.id, label: p.name }; }) },
                { name: 'region', label: 'Region', type: 'select', value: server && server.region, options: REGIONS.map(function (r) { return { value: r, label: r }; }) },
                { name: 'status', label: 'Trạng thái', type: 'select', value: server ? server.status : 'running', options: [
                    { value: 'running', label: 'Running' },
                    { value: 'warning', label: 'Warning' },
                    { value: 'stopped', label: 'Stopped' },
                    { value: 'offline', label: 'Offline' },
                ]},
                { name: 'owner_id', label: 'Owner (khách hàng)', type: 'select', value: server && (server.owner_id || server.user_id), options: [{ value: '', label: '— Không có —' }].concat(users.filter(function (u) { return u.role === 'customer'; }).map(function (u) { return { value: u.id, label: u.name + ' (' + u.email + ')' }; })) },
                { name: 'cpu', label: 'CPU (vCPU / %)', type: 'number', value: server ? server.cpu : 2 },
                { name: 'ram', label: 'RAM (GB / %)', type: 'number', value: server ? server.ram : 4 },
            ],
            onSubmit: function (vals) {
                if (!vals.hostname) throw new Error('Hostname không được trống');
                if (isEdit) {
                    DB.update('servers', server.id, {
                        hostname: vals.hostname, ip: vals.ip || '',
                        plan_id: Number(vals.plan_id) || null,
                        region: vals.region, status: vals.status,
                        owner_id: vals.owner_id ? Number(vals.owner_id) : null,
                        user_id: vals.owner_id ? Number(vals.owner_id) : null,
                        cpu: Number(vals.cpu) || 0, ram: Number(vals.ram) || 0,
                    });
                    ui.toast('Đã cập nhật ' + vals.hostname, 'success');
                } else {
                    var id = DB.all('servers').length ? Math.max.apply(null, DB.all('servers').map(function (s) { return s.id; })) + 1 : 1;
                    var plan = DB.find('plans', Number(vals.plan_id));
                    var owner = vals.owner_id ? DB.find('users', Number(vals.owner_id)) : null;
                    DB.insert('servers', {
                        id: id,
                        hostname: vals.hostname, ip: vals.ip || ('10.' + Math.floor(Math.random() * 200) + '.0.1'),
                        plan_id: Number(vals.plan_id) || null, plan_name: plan ? plan.name : '',
                        region: vals.region, status: vals.status,
                        owner_id: owner ? owner.id : null, user_id: owner ? owner.id : null,
                        owner_email: owner ? owner.email : '',
                        cpu: Number(vals.cpu) || 2, ram: Number(vals.ram) || 4,
                        created_at: new Date().toISOString(),
                    });
                    ui.toast('Đã cấp phát ' + vals.hostname, 'success');
                }
                ui.rerender();
            }
        });
    }

    function render() {
        seedIfEmpty();
        var servers = getFiltered();
        var all = DB.all('servers');
        var total = all.length;
        var running = all.filter(function (s) { return s.status === 'running'; }).length;
        var warn = all.filter(function (s) { return s.status === 'warning'; }).length;
        var stopped = all.filter(function (s) { return s.status === 'stopped' || s.status === 'offline'; }).length;

        var rows = servers.map(function (s) {
            var plan = getPlanName(s);
            var owner = getOwnerInfo(s);
            var ownerDisplay = owner ? ('<b>' + esc(owner.name || '') + '</b><div style="color:var(--vm-muted);font-size:.72rem">' + esc(owner.email || '') + '</div>') : '<span class="vm-muted">—</span>';
            var cpuDisplay = (s.cpu != null && s.cpu <= 32) ? ('<b>' + s.cpu + ' vCPU</b>') : bar(s.cpu || 10);
            var ramDisplay = (s.ram != null && s.ram <= 64) ? ('<b>' + s.ram + ' GB RAM</b>') : bar(s.ram || 10);

            return '<tr>' +
                '<td><b>' + esc(s.hostname) + '</b>' +
                    '<div style="color:var(--vm-muted);font-size:.72rem;font-family:monospace">' + esc(s.ip || '') + '</div></td>' +
                '<td>' + esc(plan) + '</td>' +
                '<td><span class="vm-badge muted">' + esc(s.region || 'HN-1') + '</span></td>' +
                '<td>' + dot(s.status) + statusTxt(s.status) + '</td>' +
                '<td>' + cpuDisplay + '</td>' +
                '<td>' + ramDisplay + '</td>' +
                '<td style="font-size:.82rem">' + ownerDisplay + '</td>' +
                '<td style="white-space:nowrap">' +
                    '<button class="vm-btn sm" data-action="console" data-id="' + s.id + '" title="Web Console"><i class="bi bi-terminal"></i></button> ' +
                    (s.status === 'running'
                        ? '<button class="vm-btn sm" data-action="reboot" data-id="' + s.id + '" title="Reboot"><i class="bi bi-arrow-clockwise"></i></button> ' +
                          '<button class="vm-btn sm danger" data-action="stop" data-id="' + s.id + '" title="Stop"><i class="bi bi-power"></i></button>'
                        : '<button class="vm-btn sm" data-action="start" data-id="' + s.id + '" title="Start" style="color:var(--vm-success)"><i class="bi bi-play-fill"></i></button> ') +
                    '<button class="vm-btn sm" data-action="edit" data-id="' + s.id + '" title="Sửa"><i class="bi bi-pencil"></i></button> ' +
                    '<button class="vm-btn sm danger" data-action="delete" data-id="' + s.id + '" title="Terminate"><i class="bi bi-trash"></i></button>' +
                '</td>' +
            '</tr>';
        }).join('');

        return '' +
            '<div class="vm-page-head">' +
                '<div><h1>Server</h1><p>Theo dõi trạng thái và tài nguyên máy chủ</p></div>' +
                '<div class="vm-page-actions">' +
                    '<button class="vm-btn" data-action="reset-filter"><i class="bi bi-x-circle"></i> Reset</button>' +
                    '<button class="vm-btn" data-action="refresh"><i class="bi bi-arrow-clockwise"></i> Refresh</button>' +
                    '<button class="vm-btn primary" data-action="add"><i class="bi bi-plus-lg"></i> Cấp phát mới</button>' +
                '</div>' +
            '</div>' +
            '<div class="vm-kpi-grid">' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Tổng server</div></div><div class="vm-kpi-val">' + total + '</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Đang chạy</div></div><div class="vm-kpi-val" style="color:var(--vm-success)">' + running + '</div><div class="vm-kpi-sub">' + (total ? Math.round(running / total * 100) : 0) + '% online</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Cảnh báo</div></div><div class="vm-kpi-val" style="color:var(--vm-warn)">' + warn + '</div><div class="vm-kpi-sub">CPU/RAM cao</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Đã tắt</div></div><div class="vm-kpi-val" style="color:var(--vm-danger)">' + stopped + '</div></div>' +
            '</div>' +
            '<div class="vm-filterbar">' +
                '<input id="sv-q" placeholder="Tìm hostname, IP, owner…" value="' + esc(filters.q) + '">' +
                '<select id="sv-region">' +
                    '<option value="all">Tất cả region</option>' +
                    REGIONS.map(function (r) { return '<option value="' + r + '"' + (filters.region === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') +
                '</select>' +
                '<select id="sv-status">' +
                    '<option value="all">Tất cả trạng thái</option>' +
                    '<option value="running"' + (filters.status === 'running' ? ' selected' : '') + '>Running</option>' +
                    '<option value="warning"' + (filters.status === 'warning' ? ' selected' : '') + '>Warning</option>' +
                    '<option value="stopped"' + (filters.status === 'stopped' ? ' selected' : '') + '>Stopped</option>' +
                    '<option value="offline"' + (filters.status === 'offline' ? ' selected' : '') + '>Offline</option>' +
                '</select>' +
            '</div>' +
            '<div class="vm-card">' +
                '<div class="vm-card-body tight">' +
                    (servers.length === 0
                        ? '<div class="vm-empty">Không có server nào.</div>'
                        : '<table class="vm-table">' +
                            '<thead><tr><th>Hostname / IP</th><th>Gói</th><th>Region</th><th>Trạng thái</th><th>CPU</th><th>RAM</th><th>Owner</th><th></th></tr></thead>' +
                            '<tbody>' + rows + '</tbody>' +
                          '</table>') +
                '</div>' +
            '</div>';
    }

    AdminRouter.onRender(function (path) {
        if (path !== '/servers') return;
        var q = document.getElementById('sv-q');
        if (q) q.addEventListener('input', function () { filters.q = q.value; ui.rerender(); setTimeout(function () { var n = document.getElementById('sv-q'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 0); });
        var reg = document.getElementById('sv-region');
        if (reg) reg.addEventListener('change', function () { filters.region = reg.value; ui.rerender(); });
        var st = document.getElementById('sv-status');
        if (st) st.addEventListener('change', function () { filters.status = st.value; ui.rerender(); });

        var content = document.getElementById('adContent');
        if (!content) return;
        content.querySelectorAll('[data-action]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var action = btn.dataset.action;
                var id = btn.dataset.id ? Number(btn.dataset.id) : null;
                var sv = id ? DB.find('servers', id) : null;
                if (action === 'add') serverForm(null);
                else if (action === 'edit' && sv) serverForm(sv);
                else if (action === 'refresh') { ui.toast('Đã refresh', 'success'); ui.rerender(); }
                else if (action === 'reset-filter') { filters.q = ''; filters.region = 'all'; filters.status = 'all'; ui.rerender(); }
                else if (action === 'reboot' && sv) {
                    ui.confirm({ title: 'Reboot server', message: 'Khởi động lại ' + sv.hostname + '?', okText: 'Reboot',
                        onOk: function () {
                            DB.update('servers', sv.id, { status: 'running', cpu: Math.floor(Math.random() * 30), ram: Math.floor(Math.random() * 30) });
                            ui.toast('Đã reboot ' + sv.hostname, 'success'); ui.rerender();
                        }
                    });
                }
                else if (action === 'start' && sv) {
                    DB.update('servers', sv.id, { status: 'running' });
                    ui.toast('Đã start ' + sv.hostname, 'success'); ui.rerender();
                }
                else if (action === 'stop' && sv) {
                    ui.confirm({ title: 'Stop server', message: 'Tắt ' + sv.hostname + '?', danger: true, okText: 'Stop',
                        onOk: function () {
                            DB.update('servers', sv.id, { status: 'stopped', cpu: 0, ram: 0 });
                            ui.toast('Đã stop ' + sv.hostname, 'warn'); ui.rerender();
                        }
                    });
                }
                else if (action === 'delete' && sv) {
                    ui.confirm({ title: 'Terminate server', message: 'Xóa vĩnh viễn ' + sv.hostname + '? Dữ liệu sẽ mất.', danger: true, okText: 'Terminate',
                        onOk: function () {
                            DB.remove('servers', sv.id);
                            ui.toast('Đã terminate ' + sv.hostname, 'success'); ui.rerender();
                        }
                    });
                }
                else if (action === 'console' && sv) {
                    var fakeLog = [
                        '[' + new Date().toISOString() + '] Node: ' + sv.hostname + ' (' + (sv.ip || '10.0.1.1') + ')',
                        '[ok] Network interface eth0 up (1000 Mbps full duplex)',
                        '[ok] Mounted /dev/vda1 on / type ext4 (rw,relatime)',
                        '[ok] Started systemd-journald.service',
                        '[ok] Started OpenSSH Server Daemon',
                        '[ok] Started nginx.service - A high performance web server',
                        '[ok] Reached target Multi-User System',
                        'Welcome to Ubuntu 22.04.4 LTS (GNU/Linux 5.15.0-generic x86_64)',
                        'Type "help" to see available admin commands.',
                        'root@' + sv.hostname + ':~# '
                    ];
                    var body = document.createElement('div');
                    body.innerHTML = '<div style="background:#090b11;border:1px solid #1e293b;border-radius:10px;padding:16px;box-shadow:inset 0 2px 10px rgba(0,0,0,.5)">' +
                        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #1e293b">' +
                            '<span style="width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block"></span>' +
                            '<span style="width:10px;height:10px;border-radius:50%;background:#f59e0b;display:inline-block"></span>' +
                            '<span style="width:10px;height:10px;border-radius:50%;background:#10b981;display:inline-block"></span>' +
                            '<span style="margin-left:8px;font-size:.74rem;color:#64748b;font-family:monospace">SSH Root Console · ' + esc(sv.hostname) + '</span>' +
                        '</div>' +
                        '<pre id="adConsolePre" style="color:#4ade80;font-size:.8rem;line-height:1.55;max-height:280px;overflow-y:auto;font-family:ui-monospace,Menlo,Consolas,monospace;margin:0;white-space:pre-wrap">' + esc(fakeLog.join('\n')) + '</pre>' +
                        '<form id="adConsoleForm" style="margin-top:12px;display:flex;gap:8px">' +
                            '<span style="color:#60a5fa;font-family:monospace;font-size:.85rem;display:flex;align-items:center">#</span>' +
                            '<input class="ad-inp" id="adConsoleInp" placeholder="Nhập lệnh (help, uptime, free, df, top, reboot, clear)…" autocomplete="off" style="font-family:monospace;font-size:.85rem;background:#0f172a;color:#f8fafc;border-color:#334155">' +
                            '<button type="submit" class="ad-btn primary sm"><i class="bi bi-terminal"></i> Chạy</button>' +
                        '</form>' +
                    '</div>';

                    ui.Modal({ title: 'SSH Web Console · ' + sv.hostname, body: body, size: 'lg',
                        footer: '<button type="button" class="ad-btn" data-act="ok">Đóng Console</button>' });
                    var m = document.getElementById('adModalRoot').lastChild;
                    var okBtn = m.querySelector('[data-act=ok]');
                    if (okBtn) okBtn.addEventListener('click', function () { ui.closeModal(); });

                    var pre = m.querySelector('#adConsolePre');
                    var form = m.querySelector('#adConsoleForm');
                    var inp = m.querySelector('#adConsoleInp');
                    if (inp) setTimeout(function () { inp.focus(); }, 100);

                    if (form) {
                        form.addEventListener('submit', function (ev) {
                            ev.preventDefault();
                            var cmd = (inp.value || '').trim();
                            if (!cmd) return;
                            inp.value = '';
                            var out = '';
                            var lower = cmd.toLowerCase();
                            if (lower === 'help') {
                                out = 'Các lệnh khả dụng: help, uptime, free, df, top, reboot, ip, clear, exit';
                            } else if (lower === 'uptime') {
                                out = ' 17:20:00 up 42 days, 3:14, 1 user, load average: 0.12, 0.08, 0.05';
                            } else if (lower === 'free' || lower === 'free -m') {
                                out = '               total        used        free      shared  buff/cache   available\nMem:            ' + (sv.ram ? sv.ram * 1024 : 4096) + '        1280        2140          12         676        2816\nSwap:           2048           0        2048';
                            } else if (lower === 'df' || lower === 'df -h') {
                                out = 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/vda1        ' + (sv.disk || 40) + 'G  8.2G   30G  22% /\nnone            4.0K     0  4.0K   0% /sys/fs/cgroup\nudev            1.9G     0  1.9G   0% /dev';
                            } else if (lower === 'ip' || lower === 'ip a') {
                                out = '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500\n    inet ' + (sv.ip || '10.0.1.1') + '/24 brd 10.0.1.255 scope global eth0';
                            } else if (lower === 'top') {
                                out = 'Tasks: 104 total, 1 running, 103 sleeping\n%Cpu(s): 2.4 us, 1.1 sy, 0.0 ni, 96.5 id\nPID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n 812 root      20   0  712400  42100  18200 S   1.8   1.2   4:12.30 nginx\n1042 mysql     20   0 1482000 248000  28100 S   0.9   6.2  18:40.12 mysqld';
                            } else if (lower === 'clear') {
                                pre.textContent = 'root@' + sv.hostname + ':~# ';
                                return;
                            } else if (lower === 'reboot') {
                                out = 'Broadcast message from root@' + sv.hostname + ':\nThe system is going down for reboot NOW!';
                                DB.update('servers', sv.id, { status: 'running' });
                            } else {
                                out = 'bash: ' + cmd + ': command not found';
                            }
                            pre.textContent += cmd + '\n' + out + '\nroot@' + sv.hostname + ':~# ';
                            pre.scrollTop = pre.scrollHeight;
                        });
                    }
                }
            });
        });
    });

    AdminRouter.add('/servers', 'Server', render);
})();