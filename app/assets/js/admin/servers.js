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

    function getFiltered() {
        var q = (filters.q || '').toLowerCase();
        return DB.all('servers').filter(function (s) {
            if (filters.region !== 'all' && s.region !== filters.region) return false;
            if (filters.status !== 'all' && s.status !== filters.status) return false;
            if (q) {
                var hay = ((s.hostname || '') + ' ' + (s.ip || '') + ' ' + (s.owner_email || '')).toLowerCase();
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
                { name: 'owner_id', label: 'Owner (khách hàng)', type: 'select', value: server && server.owner_id, options: [{ value: '', label: '— Không có —' }].concat(users.filter(function (u) { return u.role === 'customer'; }).map(function (u) { return { value: u.id, label: u.name + ' (' + u.email + ')' }; })) },
                { name: 'cpu', label: 'CPU (%)', type: 'number', value: server ? server.cpu : 10 },
                { name: 'ram', label: 'RAM (%)', type: 'number', value: server ? server.ram : 10 },
            ],
            onSubmit: function (vals) {
                if (!vals.hostname) throw new Error('Hostname không được trống');
                if (isEdit) {
                    DB.update('servers', server.id, {
                        hostname: vals.hostname, ip: vals.ip || '',
                        plan_id: Number(vals.plan_id) || null,
                        region: vals.region, status: vals.status,
                        owner_id: vals.owner_id ? Number(vals.owner_id) : null,
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
                        owner_id: owner ? owner.id : null, owner_email: owner ? owner.email : '',
                        cpu: Number(vals.cpu) || 10, ram: Number(vals.ram) || 10,
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
            var plan = s.plan_name || (DB.find('plans', s.plan_id) || {}).name || ('Gói #' + s.plan_id);
            return '<tr>' +
                '<td><b>' + esc(s.hostname) + '</b>' +
                    '<div style="color:var(--vm-muted);font-size:.72rem;font-family:monospace">' + esc(s.ip || '') + '</div></td>' +
                '<td>' + esc(plan) + '</td>' +
                '<td><span class="vm-badge muted">' + esc(s.region || '') + '</span></td>' +
                '<td>' + dot(s.status) + statusTxt(s.status) + '</td>' +
                '<td>' + bar(s.cpu || 0) + '</td>' +
                '<td>' + bar(s.ram || 0) + '</td>' +
                '<td style="font-size:.78rem">' + esc(s.owner_email || '—') + '</td>' +
                '<td style="white-space:nowrap">' +
                    '<button class="vm-btn sm" data-action="console" data-id="' + s.id + '" title="Console"><i class="bi bi-terminal"></i></button> ' +
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
                    var fakeLog = '' +
                        '[' + new Date().toISOString() + '] Booting ' + sv.hostname + ' (' + sv.ip + ')...\n' +
                        '[ok] Network interface up\n' +
                        '[ok] Mounted /dev/vda1 -> /\n' +
                        '[ok] Started nginx.service\n' +
                        '[ok] Started sshd.service\n' +
                        '[ok] Reached target Multi-User System\n' +
                        'Welcome to Ubuntu 22.04 LTS\n' +
                        'root@' + sv.hostname + ':~# ▮';
                    var body = document.createElement('div');
                    body.innerHTML = '<pre style="background:#0c0e15;color:#a3e635;padding:14px;border-radius:8px;font-size:.78rem;line-height:1.5;max-height:340px;overflow:auto;font-family:ui-monospace,monospace;margin:0">' + esc(fakeLog) + '</pre>' +
                        '<div style="margin-top:12px;display:flex;gap:8px">' +
                            '<input class="ad-inp" placeholder="Gõ lệnh shell… (demo)" disabled>' +
                            '<button class="ad-btn" disabled>Send</button>' +
                        '</div>' +
                        '<div style="margin-top:8px;font-size:.78rem;color:var(--vm-muted)"><i class="bi bi-info-circle"></i> Console giả lập để demo UI. Tích hợp thực tế cần WebSocket + SSH.</div>';
                    ui.Modal({ title: 'Console · ' + sv.hostname, body: body, size: 'lg',
                        footer: '<button type="button" class="ad-btn" data-act="ok">Đóng</button>' });
                    var m = document.getElementById('adModalRoot').lastChild;
                    var okBtn = m.querySelector('[data-act=ok]');
                    if (okBtn) okBtn.addEventListener('click', function () { ui.closeModal(); });
                }
            });
        });
    });

    AdminRouter.add('/servers', 'Server', render);
})();