/* =========================================================
   pages/pricing.js — Bảng giá + filter
========================================================= */
'use strict';

(function () {
    const PricingPage = {
        state: { cycle: 12 },

        render(query) {
            this.state.cycle = Number(query.cycle) || 12;
            const type = query.type || 'all';
            const plans = DB.all('plans').filter(p => p.is_active).sort((a, b) => a.sort_order - b.sort_order);
            const filtered = plans; // simple: show all

            const cycles = [1, 3, 6, 12, 24, 36];

            const cards = filtered.map((p, idx) => {
                const prices = DB.all('plan_prices').filter(pr => pr.plan_id === p.id);
                const match = prices.find(pr => pr.cycle_months === this.state.cycle);
                const price = match ? match.price : null;
                const mo = price ? Math.floor(price / this.state.cycle) : Infinity;
                return (
                    '<div class="plan-card' + (idx === 2 ? ' featured' : '') + '">' +
                    '<span class="banner ' + escapeHTML(p.banner || 'r') + '">' + escapeHTML((p.banner || 'r').toUpperCase()) + '</span>' +
                    '<h3>' + escapeHTML(p.name) + '</h3>' +
                    '<div class="spec"><span>CPU</span><span class="v">' + p.cpu_cores + ' vCPU</span></div>' +
                    '<div class="spec"><span>RAM</span><span class="v">' + p.ram_gb + ' GB</span></div>' +
                    '<div class="spec"><span>SSD</span><span class="v">' + p.disk_gb + ' GB</span></div>' +
                    '<div class="spec"><span>Băng thông</span><span class="v">' + p.bandwidth_mbps + ' Mbps</span></div>' +
                    '<div class="spec"><span>IPv4</span><span class="v">' + p.ipv4_count + '</span></div>' +
                    '<div class="spec"><span>Windows</span><span class="v">' + (p.allow_windows ? '<i class="bi bi-check-circle-fill" style="color:var(--c-success)"></i>' : '<i class="bi bi-x-circle-fill" style="color:var(--c-danger)"></i>') + '</span></div>' +
                    '<div class="price">' +
                        '<div style="font-size:.85rem;color:var(--c-muted)">Giá ' + this.state.cycle + ' tháng</div>' +
                        '<div><span class="num">' + (price != null ? fmtVND(price) : 'Liên hệ') + '</span></div>' +
                        (mo === Infinity ? '' : '<div class="unit">~ ' + fmtVND(mo) + '/tháng</div>') +
                    '</div>' +
                    '<p class="desc">' + escapeHTML(p.desc || '') + '</p>' +
                    '<a class="btn btn-primary" style="width:100%" href="#/order?plan=' + encodeURIComponent(p.slug) + '">Đặt ngay</a>' +
                    '</div>'
                );
            }).join('');

            const cyclePills = cycles.map(c => (
                '<button type="button" class="option-pill' + (c === this.state.cycle ? ' active' : '') + '" ' +
                'data-action="pricing-pick-cycle" data-cycle="' + c + '">' +
                c + ' tháng</button>'
            )).join('');

            const html =
                '<section class="section">' +
                    '<div class="container">' +
                        '<div class="section-head">' +
                            '<h2>Bảng giá Cloud VPS</h2>' +
                            '<p>Chọn chu kỳ thanh toán để xem giá tốt nhất</p>' +
                        '</div>' +
                        '<div style="margin-bottom:30px">' +
                            '<div style="font-weight:600;margin-bottom:8px">Chu kỳ thanh toán:</div>' +
                            '<div class="option-grid">' + cyclePills + '</div>' +
                        '</div>' +
                        '<div class="plan-grid">' + cards + '</div>' +
                    '</div>' +
                '</section>';

            return renderLayout(html);
        },

        pickCycle(el) {
            const c = Number(el.dataset.cycle);
            const { pathname } = Router.resolve();
            Router.go(pathname + '?cycle=' + c);
        },
    };

    Router.add('GET', '/pricing', ({ query }) => PricingPage.render(query));

    window.App = window.App || {};
    window.App['pricing-pick-cycle'] = (el) => PricingPage.pickCycle(el);
})();
