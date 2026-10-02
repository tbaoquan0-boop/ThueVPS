/* =========================================================
   admin/plans.js — Quản lý gói dịch vụ (CRUD thật)
   ========================================================= */
'use strict';

(function () {
    var esc = window.AdminUI.escapeHTML;
    var ui = window.AdminUI;

    function vnd(n) { return (n || 0).toLocaleString('vi-VN') + '₫'; }

    var filters = { q: '', category: 'all', status: 'all' };

    var CATEGORIES = [
        { value: 'cloud', label: 'Cloud VPS' },
        { value: 'ryzen', label: 'Ryzen VPS' },
        { value: 'highfreq', label: 'High Frequency' },
        { value: 'gpu', label: 'GPU VPS' },
        { value: 'dedicated', label: 'Dedicated Server' },
    ];

    function getFiltered() {
        return DB.all('plans').filter(function (p) {
            if (filters.category !== 'all' && p.category !== filters.category) return false;
            if (filters.status === 'active' && !p.is_active) return false;
            if (filters.status === 'inactive' && p.is_active) return false;
            if (filters.q) {
                var hay = ((p.name || '') + ' ' + (p.cpu_type || '') + ' ' + (p.slug || '')).toLowerCase();
                if (hay.indexOf(filters.q.toLowerCase()) === -1) return false;
            }
            return true;
        });
    }

    function planForm(plan) {
        var isEdit = !!plan;
        var existingPrices = isEdit ? DB.filter('plan_prices', function (pr) { return pr.plan_id === plan.id; }) : [];
        var priceMap = {};
        [1, 3, 6, 12, 24, 36].forEach(function (m) { priceMap[m] = ''; });
        existingPrices.forEach(function (pr) { priceMap[pr.cycle_months] = pr.price; });

        var form = document.createElement('form');
        form.className = 'ad-form';
        form.innerHTML =
            '<div class="ad-row"><label>Tên gói *</label><input class="ad-inp" name="name" required value="' + esc(plan && plan.name) + '" placeholder="Cloud S1"></div>' +
            '<div class="ad-row"><label>Slug</label><input class="ad-inp" name="slug" value="' + esc(plan && plan.slug) + '" placeholder="cloud-s1"></div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">' +
                '<div class="ad-row"><label>Danh mục</label><select class="ad-inp" name="category">' +
                    CATEGORIES.map(function (c) {
                        return '<option value="' + c.value + '"' + ((plan && plan.category === c.value) ? ' selected' : '') + '>' + esc(c.label) + '</option>';
                    }).join('') +
                '</select></div>' +
                '<div class="ad-row"><label>Loại CPU</label><input class="ad-inp" name="cpu_type" value="' + esc(plan && plan.cpu_type) + '" placeholder="Intel Xeon"></div>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">' +
                '<div class="ad-row"><label>vCPU cores</label><input class="ad-inp" type="number" min="1" name="cpu_cores" value="' + (plan ? plan.cpu_cores : 2) + '"></div>' +
                '<div class="ad-row"><label>RAM (GB)</label><input class="ad-inp" type="number" min="1" name="ram_gb" value="' + (plan ? plan.ram_gb : 2) + '"></div>' +
                '<div class="ad-row"><label>Disk (GB)</label><input class="ad-inp" type="number" min="10" name="disk_gb" value="' + (plan ? plan.disk_gb : 40) + '"></div>' +
                '<div class="ad-row"><label>Bandwidth (Mbps)</label><input class="ad-inp" type="number" min="0" name="bandwidth_mbps" value="' + (plan ? plan.bandwidth_mbps : 200) + '"></div>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">' +
                '<div class="ad-row"><label>Loại disk</label><input class="ad-inp" name="disk_type" value="' + esc(plan && plan.disk_type) + '" placeholder="NVMe SSD"></div>' +
                '<div class="ad-row"><label>Số IPv4</label><input class="ad-inp" type="number" min="0" name="ipv4_count" value="' + (plan ? (plan.ipv4_count || 1) : 1) + '"></div>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">' +
                '<div class="ad-row"><label>Cho phép Windows?</label><select class="ad-inp" name="allow_windows"><option value="false"' + (plan && plan.allow_windows ? '' : ' selected') + '>Không</option><option value="true"' + (plan && plan.allow_windows ? ' selected' : '') + '>Có</option></select></div>' +
                '<div class="ad-row"><label>Trạng thái</label><select class="ad-inp" name="is_active"><option value="true"' + (!plan || plan.is_active ? ' selected' : '') + '>Đang bán</option><option value="false"' + (plan && !plan.is_active ? ' selected' : '') + '>Tạm tắt</option></select></div>' +
            '</div>' +
            '<div class="ad-row"><label>Mô tả ngắn</label><textarea class="ad-inp" name="desc" rows="2">' + esc(plan && plan.desc) + '</textarea></div>' +
            '<div class="ad-row"><label>Bảng giá (₫ theo chu kỳ tháng)</label>' +
                '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">' +
                    [1, 3, 6, 12, 24, 36].map(function (m) {
                        return '<div class="ad-row"><label style="margin-bottom:4px">' + m + ' tháng</label><input class="ad-inp" type="number" min="0" name="price_' + m + '" value="' + esc(priceMap[m]) + '" placeholder="0"></div>';
                    }).join('') +
                '</div>' +
            '</div>';

        var footer = '<button type="button" class="ad-btn" data-act="cancel">Huỷ</button><button type="submit" class="ad-btn primary">' + (isEdit ? 'Cập nhật' : 'Tạo gói') + '</button>';
        var m = ui.Modal({ title: isEdit ? 'Sửa gói dịch vụ' : 'Thêm gói dịch vụ', body: form, footer: footer, size: 'lg' });
        m.querySelector('[data-act=cancel]').addEventListener('click', function () { ui.closeModal(); });
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            try {
                var data = {};
                new FormData(form).forEach(function (v, k) { data[k] = v; });
                if (!data.name) throw new Error('Tên gói không được trống');
                var patch = {
                    name: data.name, slug: data.slug || '',
                    category: data.category, cpu_type: data.cpu_type,
                    cpu_cores: Number(data.cpu_cores) || 1,
                    ram_gb: Number(data.ram_gb) || 1,
                    disk_gb: Number(data.disk_gb) || 10,
                    bandwidth_mbps: Number(data.bandwidth_mbps) || 0,
                    disk_type: data.disk_type, ipv4_count: Number(data.ipv4_count) || 0,
                    allow_windows: data.allow_windows === 'true',
                    is_active: data.is_active === 'true',
                    desc: data.desc,
                    icon: (plan && plan.icon) || 'cloud-fill',
                    sort_order: plan ? plan.sort_order : 99,
                };
                var pid;
                if (isEdit) {
                    DB.update('plans', plan.id, patch);
                    pid = plan.id;
                    // Xóa price cũ
                    DB.transaction(function (data) {
                        data.plan_prices = data.plan_prices.filter(function (pr) { return pr.plan_id !== pid; });
                    });
                } else {
                    pid = DB.nextId ? (DB.all('plans').length ? Math.max.apply(null, DB.all('plans').map(function (p) { return p.id; })) + 1 : 1) : Date.now();
                    patch.id = pid; patch.features = [];
                    DB.insert('plans', patch);
                }
                [1, 3, 6, 12, 24, 36].forEach(function (m) {
                    var v = data['price_' + m];
                    if (v && Number(v) > 0) {
                        DB.insert('plan_prices', { plan_id: pid, cycle_months: m, price: Number(v) });
                    }
                });
                ui.toast(isEdit ? 'Đã cập nhật ' + patch.name : 'Đã tạo ' + patch.name, 'success');
                ui.closeModal();
                ui.rerender();
            } catch (err) {
                ui.toast(err.message || String(err), 'danger');
            }
        });
        setTimeout(function () { var f = form.querySelector('input[name=name]'); if (f) f.focus(); }, 50);
    }

    function render() {
        var plans = getFiltered();
        var prices = DB.all('plan_prices');
        var all = DB.all('plans');
        var activeCount = all.filter(function (p) { return p.is_active; }).length;

        var rows = plans.map(function (p) {
            var planPrices = prices.filter(function (pr) { return pr.plan_id === p.id; });
            var minPrice = planPrices.length ? Math.min.apply(null, planPrices.map(function (pr) { return pr.price; })) : 0;
            var initial = (p.name || '?').charAt(0).toUpperCase();
            return '<tr>' +
                '<td><div class="vm-flex">' +
                    '<div class="vm-avatar" style="background:linear-gradient(135deg,var(--vm-accent),#8b5cf6);width:32px;height:32px;font-size:.7rem">' + esc(initial) + '</div>' +
                    '<div><b>' + esc(p.name) + '</b>' +
                        '<div style="color:var(--vm-muted);font-size:.75rem">' + esc(p.cpu_type || '') + '</div>' +
                    '</div>' +
                '</div></td>' +
                '<td><span class="vm-badge info">' + esc(p.category || '—') + '</span></td>' +
                '<td>' + (p.cpu_cores || 0) + ' vCPU / ' + (p.ram_gb || 0) + ' GB</td>' +
                '<td>' + (p.disk_gb || 0) + ' GB ' + esc(p.disk_type || '') + '</td>' +
                '<td><b>' + vnd(minPrice) + '</b></td>' +
                '<td>' + (p.is_active
                    ? '<span class="vm-badge success"><i class="bi bi-check2"></i> Active</span>'
                    : '<span class="vm-badge muted">Tắt</span>') + '</td>' +
                '<td style="white-space:nowrap">' +
                    '<button class="vm-btn sm" data-action="edit" data-id="' + p.id + '" title="Sửa"><i class="bi bi-pencil"></i></button> ' +
                    '<button class="vm-btn sm" data-action="toggle" data-id="' + p.id + '" title="' + (p.is_active ? 'Tắt' : 'Bật') + '"><i class="bi bi-' + (p.is_active ? 'pause' : 'play') + '"></i></button> ' +
                    '<button class="vm-btn sm danger" data-action="delete" data-id="' + p.id + '" title="Xóa"><i class="bi bi-trash"></i></button>' +
                '</td>' +
            '</tr>';
        }).join('');

        return '' +
            '<div class="vm-page-head">' +
                '<div><h1>Gói dịch vụ</h1><p>Quản lý các gói VPS, GPU, Dedicated và bảng giá</p></div>' +
                '<div class="vm-page-actions">' +
                    '<button class="vm-btn" data-action="reset-filter"><i class="bi bi-x-circle"></i> Reset</button>' +
                    '<button class="vm-btn primary" data-action="add"><i class="bi bi-plus-lg"></i> Thêm gói</button>' +
                '</div>' +
            '</div>' +
            '<div class="vm-kpi-grid">' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Tổng gói</div></div><div class="vm-kpi-val">' + all.length + '</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Đang bán</div></div><div class="vm-kpi-val">' + activeCount + '</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Danh mục</div></div><div class="vm-kpi-val">' + new Set(all.map(function (p) { return p.category; })).size + '</div></div>' +
                '<div class="vm-kpi"><div class="vm-kpi-head"><div class="vm-kpi-label">Bảng giá</div></div><div class="vm-kpi-val">' + DB.all('plan_prices').length + '</div></div>' +
            '</div>' +
            '<div class="vm-filterbar">' +
                '<input id="plan-q" placeholder="Tìm theo tên, CPU, slug…" value="' + esc(filters.q) + '">' +
                '<select id="plan-cat">' +
                    '<option value="all"' + (filters.category === 'all' ? ' selected' : '') + '>Tất cả danh mục</option>' +
                    CATEGORIES.map(function (c) { return '<option value="' + c.value + '"' + (filters.category === c.value ? ' selected' : '') + '>' + esc(c.label) + '</option>'; }).join('') +
                '</select>' +
                '<select id="plan-status">' +
                    '<option value="all">Tất cả trạng thái</option>' +
                    '<option value="active"' + (filters.status === 'active' ? ' selected' : '') + '>Đang bán</option>' +
                    '<option value="inactive"' + (filters.status === 'inactive' ? ' selected' : '') + '>Tạm tắt</option>' +
                '</select>' +
            '</div>' +
            '<div class="vm-card">' +
                '<div class="vm-card-body tight">' +
                    (plans.length === 0
                        ? '<div class="vm-empty">Không có gói nào khớp bộ lọc.</div>'
                        : '<table class="vm-table">' +
                            '<thead><tr><th>Gói</th><th>Danh mục</th><th>CPU / RAM</th><th>Ổ cứng</th><th>Giá từ</th><th>Trạng thái</th><th></th></tr></thead>' +
                            '<tbody>' + rows + '</tbody>' +
                          '</table>') +
                '</div>' +
            '</div>' +
            '<div style="margin-top:12px;color:var(--vm-muted);font-size:.8rem">Hiển thị <b>' + plans.length + '</b> / ' + all.length + ' gói</div>';
    }

    AdminRouter.onRender(function (path) {
        if (path !== '/plans') return;
        var q = document.getElementById('plan-q');
        if (q) q.addEventListener('input', function () { filters.q = q.value; ui.rerender(); setTimeout(function () { var n = document.getElementById('plan-q'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 0); });
        var cat = document.getElementById('plan-cat');
        if (cat) cat.addEventListener('change', function () { filters.category = cat.value; ui.rerender(); });
        var st = document.getElementById('plan-status');
        if (st) st.addEventListener('change', function () { filters.status = st.value; ui.rerender(); });

        var content = document.getElementById('adContent');
        if (!content) return;
        content.querySelectorAll('[data-action]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var action = btn.dataset.action;
                var id = btn.dataset.id ? Number(btn.dataset.id) : null;
                var plan = id ? DB.find('plans', id) : null;
                if (action === 'add') planForm(null);
                else if (action === 'edit' && plan) planForm(plan);
                else if (action === 'toggle' && plan) {
                    DB.update('plans', plan.id, { is_active: !plan.is_active });
                    ui.toast(plan.is_active ? 'Đã tắt ' + plan.name : 'Đã bật ' + plan.name, 'success');
                    ui.rerender();
                }
                else if (action === 'delete' && plan) {
                    ui.confirm({
                        title: 'Xóa gói dịch vụ',
                        message: 'Xóa "' + plan.name + '"? Tất cả bảng giá liên quan cũng sẽ bị xóa.',
                        danger: true, okText: 'Xóa',
                        onOk: function () {
                            DB.remove('plans', plan.id);
                            DB.transaction(function (d) { d.plan_prices = d.plan_prices.filter(function (pr) { return pr.plan_id !== plan.id; }); });
                            ui.toast('Đã xóa ' + plan.name, 'success');
                            ui.rerender();
                        }
                    });
                }
                else if (action === 'reset-filter') {
                    filters.q = ''; filters.category = 'all'; filters.status = 'all';
                    ui.rerender();
                }
            });
        });
    });

    AdminRouter.add('/plans', 'Gói dịch vụ', render);
})();