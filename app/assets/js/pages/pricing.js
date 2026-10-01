/* =========================================================
   pages/pricing.js — SPA tab switch, no router reload
========================================================= */
'use strict';

(function () {
    var PP = {};

    PP.CATEGORIES = [
        { id: 'all',       label: 'Tất cả' },
        { id: 'cloud',     label: 'Cloud' },
        { id: 'ryzen',     label: 'Ryzen' },
        { id: 'highfreq',  label: 'Xung nhịp cao' },
        { id: 'gpu',       label: 'GPU' },
        { id: 'dedicated', label: 'Dedicated' },
    ];

    PP.CYCLES = [
        { months: 1,  label: '1 tháng',  save: null },
        { months: 3,  label: '3 tháng',  save: '−5%' },
        { months: 6,  label: '6 tháng',  save: '−12%' },
        { months: 12, label: '12 tháng', save: '−20%' },
        { months: 24, label: '24 tháng', save: '−30%' },
        { months: 36, label: '36 tháng', save: '−40%' },
    ];

    PP.INTRO = {
        all:       { tagline: 'Bảng giá đầy đủ',    desc: 'Tất cả các dòng sản phẩm — chọn gói phù hợp nhu cầu của bạn.' },
        cloud:     { tagline: 'Cloud VPS',          desc: 'Máy chủ ảo trên nền Intel Xeon + NVMe. Phù hợp web, API và staging.' },
        ryzen:     { tagline: 'AMD Ryzen',          desc: 'Ryzen 9 7950X, NVMe Gen4. Mạnh cho game server, bot và dev tools.' },
        highfreq:  { tagline: 'VPS xung nhịp cao',  desc: 'Intel i9-13900K/14900K boost 6.0GHz. Realtime, livestream, voice chat.' },
        gpu:       { tagline: 'GPU Server',          desc: 'RTX A4000 / A5000. AI training, render Blender, inference quy mô lớn.' },
        dedicated: { tagline: 'Dedicated Server',     desc: 'Toàn quyền 1 server vật lý Xeon Gold, ECC RAM, RAID hardware.' },
    };

    PP.state = { cycle: 1, cat: 'all' };

    PP.getPlans = function () {
        var cat = PP.state.cat;
        return DB.all('plans').filter(function (p) {
            return p.is_active && (cat === 'all' || p.category === cat);
        }).sort(function (a, b) { return a.sort_order - b.sort_order; });
    };

    PP.getAvailableCycles = function (plans) {
        var set = {};
        plans.forEach(function (p) {
            DB.all('plan_prices').filter(function (pr) { return pr.plan_id === p.id; }).forEach(function (pr) { set[pr.cycle_months] = true; });
        });
        return PP.CYCLES.filter(function (c) { return set[c.months]; });
    };

    PP.renderCard = function (p) {
        var prices = DB.all('plan_prices').filter(function (pr) { return pr.plan_id === p.id; });
        var match = prices.find(function (pr) { return pr.cycle_months === PP.state.cycle; });
        var price = match ? match.price : null;
        var feats = (p.features || []).slice(0, 3).map(function (f) { return '<li>' + escapeHTML(f) + '</li>'; }).join('');
        var tagline = PP.INTRO[p.category] ? PP.INTRO[p.category].tagline : p.category;
        var priceTxt = price != null ? fmtVND(price) : 'Liên hệ';
        var icon = p.icon || 'cloud-fill';
        var catClass = 'plan cat-' + escapeHTML(p.category);

        if (p.category === 'dedicated') {
            return '<div class="' + catClass + '">' +
                '<div class="panel"><div class="panel-icon"><i class="bi bi-' + icon + '"></i></div></div>' +
                '<div class="body">' +
                '<div class="plan-head"><div class="plan-icon"><i class="bi bi-' + icon + '"></i></div><span class="plan-tag">' + escapeHTML(tagline) + '</span></div>' +
                '<h3 class="plan-name">' + escapeHTML(p.name) + '</h3>' +
                '<div class="plan-cpu">' + escapeHTML(p.cpu_type) + '</div>' +
                '<p class="plan-desc">' + escapeHTML(p.desc) + '</p>' +
                '<div class="plan-specs"><div class="plan-spec"><span class="k">CPU</span><span class="v">' + p.cpu_cores + ' vCPU</span></div><div class="plan-spec"><span class="k">RAM</span><span class="v">' + p.ram_gb + ' GB</span></div><div class="plan-spec"><span class="k">Ổ cứng</span><span class="v">' + p.disk_gb + ' GB</span></div><div class="plan-spec"><span class="k">Băng thông</span><span class="v">' + p.bandwidth_mbps + ' Mbps</span></div></div>' +
                '<ul class="plan-feats">' + feats + '</ul>' +
                '<div class="plan-foot"><div class="plan-price"><span class="from">' + PP.state.cycle + ' tháng</span><span class="num">' + priceTxt + '</span></div><a class="btn btn-line btn-sm" href="#/order?plan=' + encodeURIComponent(p.slug) + '&cycle=' + PP.state.cycle + '">Đặt</a></div>' +
                '</div></div>';
        }

        return '<div class="' + catClass + '">' +
            '<div class="plan-head"><div class="plan-icon"><i class="bi bi-' + icon + '"></i></div><span class="plan-tag">' + escapeHTML(tagline) + '</span></div>' +
            '<h3 class="plan-name">' + escapeHTML(p.name) + '</h3>' +
            '<div class="plan-cpu">' + escapeHTML(p.cpu_type) + '</div>' +
            '<p class="plan-desc">' + escapeHTML(p.desc) + '</p>' +
            '<div class="plan-specs"><div class="plan-spec"><span class="k">CPU</span><span class="v">' + p.cpu_cores + ' vCPU</span></div><div class="plan-spec"><span class="k">RAM</span><span class="v">' + p.ram_gb + ' GB</span></div><div class="plan-spec"><span class="k">Ổ cứng</span><span class="v">' + p.disk_gb + ' GB</span></div><div class="plan-spec"><span class="k">Băng thông</span><span class="v">' + p.bandwidth_mbps + ' Mbps</span></div></div>' +
            '<ul class="plan-feats">' + feats + '</ul>' +
            '<div class="plan-foot"><div class="plan-price"><span class="from">' + PP.state.cycle + ' tháng</span><span class="num">' + priceTxt + '</span></div><a class="btn btn-line btn-sm" href="#/order?plan=' + encodeURIComponent(p.slug) + '&cycle=' + PP.state.cycle + '">Đặt</a></div>' +
            '</div>';
    };

    PP.render = function (query) {
        PP.state.cycle = Number(query.cycle) || 1;
        PP.state.cat   = query.cat || 'all';

        var tabs = PP.CATEGORIES.map(function (c) {
            var active = c.id === PP.state.cat ? ' active' : '';
            return '<button type="button" class="tab' + active + '" onclick="PricingPage.pickCat(this)" data-cat="' + c.id + '">' + escapeHTML(c.label) + '</button>';
        }).join('');

        var intro = PP.INTRO[PP.state.cat] || PP.INTRO.all;
        var plans = PP.getPlans();
        var availCycles = PP.getAvailableCycles(plans);

        var cyclePills = availCycles.map(function (c) {
            var active = c.months === PP.state.cycle ? ' active' : '';
            var save = c.save ? '<span class="save">' + c.save + '</span>' : '';
            return '<button type="button" class="cycle-pill' + active + '" onclick="PricingPage.pickCycle(this)" data-cycle="' + c.months + '">' + escapeHTML(c.label) + save + '</button>';
        }).join('');

        var cardsHtml = plans.map(PP.renderCard).join('');

        var html =
            '<section class="cat-hero">' +
                '<div class="wrap">' +
                    '<div class="label"><span class="dot"></span> ' + escapeHTML(intro.tagline) + '</div>' +
                    '<h2>' + escapeHTML(intro.tagline) + '</h2>' +
                    '<p>' + escapeHTML(intro.desc) + '</p>' +
                '</div>' +
            '</section>' +
            '<section class="sec" style="padding-top:0">' +
                '<div class="wrap">' +
                    '<div class="tabs reveal" id="pricing-tabs">' + tabs + '</div>' +
                    '<div class="cycle-bar reveal" id="pricing-cycles-bar">' +
                        '<span class="label">Thanh toán theo</span>' +
                        '<div class="cycle-options" id="pricing-cycles">' + cyclePills + '</div>' +
                        '<span class="hint-text"><span class="badge">TIP</span> Chu kỳ dài tiết kiệm hơn</span>' +
                    '</div>' +
                    '<div id="pricing-cards" style="transition:opacity .3s ease,transform .3s ease;opacity:1;transform:translateY(0)">' +
                        '<div class="plans pricing-plans" id="pricing-plans-grid">' + cardsHtml + '</div>' +
                    '</div>' +
                '</div>' +
            '</section>';

        return renderLayout(html);
    };

    PP.pickCat = function (el) {
        var cat = el.getAttribute('data-cat');
        PP.state.cat = cat;
        PP.state.cycle = 1;

        // Update tab buttons
        var tabs = document.querySelectorAll('.tab');
        tabs.forEach(function (t) {
            t.classList.toggle('active', t.getAttribute('data-cat') === cat);
        });

        PP._refreshCards();
    };

    PP.pickCycle = function (el) {
        var cycle = Number(el.getAttribute('data-cycle'));
        PP.state.cycle = cycle;

        var pills = document.querySelectorAll('.cycle-pill');
        pills.forEach(function (p) {
            p.classList.toggle('active', Number(p.getAttribute('data-cycle')) === cycle);
        });

        PP._refreshCards();
    };

    PP._refreshCards = function () {
        var plans = PP.getPlans();
        var availCycles = PP.getAvailableCycles(plans);
        var intro = PP.INTRO[PP.state.cat] || PP.INTRO.all;

        // Update hero intro
        var catHero = document.querySelector('.cat-hero');
        if (catHero) {
            catHero.querySelector('h2').textContent = intro.tagline;
            catHero.querySelector('p').textContent = intro.desc;
        }

        // Update cycle pills
        var cycleBox = document.getElementById('pricing-cycles');
        if (cycleBox) {
            cycleBox.innerHTML = availCycles.map(function (c) {
                var active = c.months === PP.state.cycle ? ' active' : '';
                var save = c.save ? '<span class="save">' + c.save + '</span>' : '';
                return '<button type="button" class="cycle-pill' + active + '" onclick="PricingPage.pickCycle(this)" data-cycle="' + c.months + '">' + escapeHTML(c.label) + save + '</button>';
            }).join('');
        }

        // Fade + update cards
        var cardsBox = document.getElementById('pricing-cards');
        var grid = document.getElementById('pricing-plans-grid');
        if (cardsBox) {
            cardsBox.style.opacity = '0';
            cardsBox.style.transform = 'translateY(6px)';
            setTimeout(function () {
                if (grid) {
                    grid.innerHTML = plans.map(PP.renderCard).join('');
                }
                cardsBox.style.opacity = '1';
                cardsBox.style.transform = 'translateY(0)';
            }, 120);
        }
    };

    Router.add('GET', '/pricing', function (data) { return PP.render(data.query); });

    window.PricingPage = PP;
})();
