/* =========================================================
   pages/compare.js — So sánh VPS
========================================================= */
'use strict';

(function () {
    const ComparePage = {
        state: { ids: [] },

        render(query) {
            // Đọc danh sách id từ query
            const raw = (query.ids || '').split(',').filter(Boolean).map(Number).slice(0, 3);
            this.state.ids = raw.length ? raw : [1, 2, 4]; // mặc định

            const allPlans = DB.all('plans').filter(p => p.is_active);
            const selected = this.state.ids.map(id => allPlans.find(p => p.id === id)).filter(Boolean);

            // Đảm bảo đủ 3 slot
            while (selected.length < 3) {
                const next = allPlans.find(p => !selected.find(s => s && s.id === p.id));
                if (!next) break;
                selected.push(next);
                this.state.ids.push(next.id);
            }

            const picker = '<div class="compare-picker reveal-stagger">' +
                selected.map((p, i) => (
                    '<div class="compare-cell plan cat-' + escapeHTML(p.category) + '">' +
                        '<select class="select" data-action="compare-change" data-idx="' + i + '">' +
                            allPlans.map(opt => '<option value="' + opt.id + '"' + (opt.id === p.id ? ' selected' : '') + '>' + escapeHTML(opt.name) + ' — ' + escapeHTML(opt.cpu_type) + '</option>').join('') +
                        '</select>' +
                        '<div class="compare-price">' +
                            '<span class="num">' + fmtVND(fromMonthly(p) === Infinity ? 0 : fromMonthly(p)) + '</span>' +
                            '<span class="unit">/tháng</span>' +
                        '</div>' +
                    '</div>'
                )).join('') +
            '</div>';

            const rows = [
                { k: 'Loại',           v: p => p.category },
                { k: 'CPU',            v: p => p.cpu_type + ' · ' + p.cpu_cores + ' vCPU' },
                { k: 'RAM',            v: p => p.ram_gb + ' GB' },
                { k: 'Ổ cứng',         v: p => p.disk_gb + ' GB ' + p.disk_type },
                { k: 'Băng thông',     v: p => p.bandwidth_mbps + ' Mbps' },
                { k: 'IPv4',           v: p => p.ipv4_count + ' địa chỉ' },
                { k: 'Hỗ trợ Windows', v: p => p.allow_windows ? 'Có' : 'Không' },
                { k: 'Tính năng',      v: p => (p.features || []).join(', ') },
                { k: 'Giá từ',         v: p => fmtVND(fromMonthly(p)) + '/tháng' },
                { k: '',               v: p => '<a class="btn btn-line btn-sm" href="#/order?plan=' + p.slug + '">Đặt ' + escapeHTML(p.name) + '</a>' },
            ];

            const table = '<table class="data-table compare-table reveal">' +
                '<thead><tr><th></th>' +
                    selected.map(p => '<th class="compare-th" data-cat="' + escapeHTML(p.category) + '">' + escapeHTML(p.name) + '</th>').join('') +
                '</tr></thead><tbody>' +
                    rows.map(r => (
                        '<tr>' +
                            '<th>' + escapeHTML(r.k) + '</th>' +
                            selected.map(p => '<td>' + r.v(p) + '</td>').join('') +
                        '</tr>'
                    )).join('') +
                '</tbody></table>';

            const html =
                '<section class="sec">' +
                    '<div class="wrap">' +
                        '<div class="sec-head reveal">' +
                            '<span class="eyebrow">So sánh</span>' +
                            '<h2>Đặt cạnh nhau</h2>' +
                            '<p>Chọn tối đa 3 gói để so sánh chi tiết.</p>' +
                        '</div>' +
                        picker +
                        table +
                    '</div>' +
                '</section>';
            return renderLayout(html);
        },

        change(select) {
            const idx = Number(select.dataset.idx);
            const newId = Number(select.value);
            const ids = this.state.ids.slice();
            // Tránh trùng
            if (ids.indexOf(newId) >= 0) {
                Flash.show('Gói này đã được chọn', 'warning');
                select.value = ids[idx];
                return;
            }
            ids[idx] = newId;
            Router.go('/compare?ids=' + ids.join(','));
        },
    };

    Router.add('GET', '/compare', ({ query }) => ComparePage.render(query));

    window.App = window.App || {};
    window.App['compare-change'] = (el) => ComparePage.change(el);
})();