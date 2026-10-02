/* =========================================================
   pages/home.js — Trang chủ với hero có hình động + reveal
========================================================================= */
'use strict';

(function () {
    const CATEGORY_INTRO = {
        cloud:     { tagline: 'Cloud VPS',     desc: 'Máy chủ ảo trên hạ tầng Intel Xeon + NVMe. Phù hợp web, API, mail server.' },
        ryzen:     { tagline: 'AMD Ryzen',     desc: 'Ryzen 9 7950X, xung nhịp cao, NVMe Gen4 — game server, bot, dev tools.' },
        highfreq:  { tagline: 'Xung nhịp cao', desc: 'Intel i9-13900K/14900K boost tới 6.0GHz. Low latency cho trading, livestream.' },
        gpu:       { tagline: 'GPU Server',    desc: 'RTX A4000/A5000 cho AI training, render Blender, inference quy mô lớn.' },
        dedicated: { tagline: 'Dedicated',     desc: 'Toàn quyền 1 server vật lý Xeon Gold, ECC RAM, RAID hardware.' },
    };

    // SVG server / cloud illustrations
    const ART = {
        server: '<svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<rect x="20" y="20" width="80" height="60" rx="8" fill="white" stroke="currentColor" stroke-width="1.5"/>' +
            '<rect x="28" y="32" width="64" height="12" rx="3" fill="currentColor" opacity=".15"/>' +
            '<rect x="28" y="48" width="64" height="12" rx="3" fill="currentColor" opacity=".15"/>' +
            '<circle cx="84" cy="38" r="2" fill="#10b981"/>' +
            '<circle cx="84" cy="54" r="2" fill="#10b981"/>' +
            '<rect x="20" y="14" width="80" height="6" rx="3" fill="currentColor" opacity=".25"/>' +
            '</svg>',
        cloud: '<svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M30 60 Q20 60 18 50 Q18 38 30 35 Q30 20 45 20 Q60 20 65 30 Q70 25 80 28 Q95 30 95 45 Q100 50 100 60 Q100 70 85 60 H30Z" fill="white" stroke="currentColor" stroke-width="1.5"/>' +
            '<circle cx="35" cy="35" r="2" fill="currentColor" opacity=".6"/>' +
            '<circle cx="75" cy="35" r="2" fill="currentColor" opacity=".6"/>' +
            '</svg>',
        chip: '<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<rect x="25" y="25" width="50" height="50" rx="8" fill="white" stroke="currentColor" stroke-width="1.5"/>' +
            '<rect x="35" y="35" width="30" height="30" rx="3" fill="currentColor" opacity=".2"/>' +
            '<rect x="10" y="35" width="12" height="3" rx="1.5" fill="currentColor" opacity=".5"/>' +
            '<rect x="10" y="50" width="12" height="3" rx="1.5" fill="currentColor" opacity=".5"/>' +
            '<rect x="10" y="65" width="12" height="3" rx="1.5" fill="currentColor" opacity=".5"/>' +
            '<rect x="78" y="35" width="12" height="3" rx="1.5" fill="currentColor" opacity=".5"/>' +
            '<rect x="78" y="50" width="12" height="3" rx="1.5" fill="currentColor" opacity=".5"/>' +
            '<rect x="78" y="65" width="12" height="3" rx="1.5" fill="currentColor" opacity=".5"/>' +
            '<rect x="35" y="10" width="3" height="12" rx="1.5" fill="currentColor" opacity=".5"/>' +
            '<rect x="50" y="10" width="3" height="12" rx="1.5" fill="currentColor" opacity=".5"/>' +
            '<rect x="65" y="10" width="3" height="12" rx="1.5" fill="currentColor" opacity=".5"/>' +
            '<rect x="35" y="78" width="3" height="12" rx="1.5" fill="currentColor" opacity=".5"/>' +
            '<rect x="50" y="78" width="3" height="12" rx="1.5" fill="currentColor" opacity=".5"/>' +
            '<rect x="65" y="78" width="3" height="12" rx="1.5" fill="currentColor" opacity=".5"/>' +
            '</svg>',
    };

    function render() {
        // Lấy 1 plan tiêu biểu cho mỗi category để demo trên trang chủ
        const allPlans = DB.all('plans').filter(p => p.is_active);
        const featured = [];
        ['cloud', 'ryzen', 'highfreq', 'gpu', 'dedicated'].forEach(cat => {
            const p = allPlans.find(p => p.category === cat);
            if (p) featured.push(p);
        });

        const html =
                // HERO
                '<section class="hero">' +
                    '<div class="hero-burst"></div>' +
                    // Floating illustrations
                    '<div class="hero-art server-1" style="color:var(--c-ryzen);width:120px">' + ART.server + '</div>' +
                    '<div class="hero-art server-2" style="color:var(--accent);width:140px">' + ART.cloud + '</div>' +
                    '<div class="hero-art server-3" style="color:var(--c-gpu);width:90px">' + ART.chip + '</div>' +

                    '<div class="wrap">' +
                        '<div class="hero-eyebrow">' +
                            '<span class="pulse"></span> Khuyến mãi tháng 10 — Giảm 10% đơn đầu' +
                        '</div>' +
                        '<h1>Cloud server <span class="accent">khởi tạo trong 60 giây</span></h1>' +
                        '<p>Hạ tầng NVMe SSD, network 10Gbps, uptime 99.99%. Từ Cloud đến GPU và Dedicated — phù hợp mọi cỡ dự án.</p>' +
                        '<div class="hero-cta">' +
                            '<a href="#/pricing" class="btn btn-solid btn-lg">Xem bảng giá <i class="bi bi-arrow-right"></i></a>' +
                            '<a href="#/register" class="btn btn-line btn-lg">Tạo tài khoản</a>' +
                        '</div>' +
                    '</div>' +
                '</section>' +

                // STRIP
                '<div class="wrap reveal">' +
                    '<div class="strip">' +
                        '<div class="strip-cell"><div class="v">12,000+</div><div class="l">Khách hàng</div></div>' +
                        '<div class="strip-cell"><div class="v">99.99%</div><div class="l">Uptime</div></div>' +
                        '<div class="strip-cell"><div class="v">24/7</div><div class="l">Hỗ trợ</div></div>' +
                        '<div class="strip-cell"><div class="v">60s</div><div class="l">Khởi tạo</div></div>' +
                    '</div>' +
                '</div>' +

                // CATEGORIES
                '<section class="sec">' +
                    '<div class="wrap">' +
                        '<div class="sec-head reveal">' +
                            '<span class="eyebrow">Sản phẩm</span>' +
                            '<h2>Chọn theo nhu cầu</h2>' +
                            '<p>Năm dòng sản phẩm, mỗi dòng một thế mạnh riêng.</p>' +
                        '</div>' +
                        '<div class="plans reveal-stagger">' +
                            featured.map((p, i) => planCard(p, i)).join('') +
                        '</div>' +
                        '<div style="text-align:center;margin-top:48px" class="reveal">' +
                            '<a href="#/pricing" class="btn btn-line">Xem tất cả <i class="bi bi-arrow-right"></i></a>' +
                        '</div>' +
                    '</div>' +
                '</section>' +

                // PILLARS
                '<section class="sec sec-tight" style="background:color-mix(in srgb, var(--surface) 60%, transparent);backdrop-filter:blur(10px)">' +
                    '<div class="wrap">' +
                        '<div class="sec-head reveal">' +
                            '<span class="eyebrow">Tại sao chọn chúng tôi</span>' +
                            '<h2>Vì sao hàng nghìn khách hàng tin tưởng</h2>' +
                        '</div>' +
                        '<div class="reveal-stagger" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:40px">' +
                            pillar('lightning', 'Tốc độ', 'CPU thế hệ mới, NVMe Gen4, network 10Gbps.') +
                            pillar('shield', 'Bảo mật', 'DDoS protection, snapshot tự động, backup hàng ngày.') +
                            pillar('people', 'Đồng hành', 'Đội ngũ kỹ thuật Việt Nam, phản hồi trong 5 phút.') +
                            pillar('arrow-counterclockwise', 'Linh hoạt', 'Nâng/hạ cấu hình bất kỳ lúc nào, không downtime.') +
                        '</div>' +
                    '</div>' +
                '</section>' +

                // CTA
                '<section class="sec sec-tight" style="padding-bottom:120px">' +
                    '<div class="wrap reveal" style="text-align:center;padding:60px 24px;background:linear-gradient(135deg, var(--ink) 0%, var(--ink-2) 100%);color:var(--bg);border-radius:var(--radius-xl);position:relative;overflow:hidden">' +
                        '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at top right, color-mix(in srgb, var(--accent) 25%, transparent) 0%, transparent 60%);pointer-events:none"></div>' +
                        '<div style="position:relative;z-index:1">' +
                            '<h2 style="color:inherit;font-size:clamp(1.6rem,3vw,2.2rem);font-weight:600;letter-spacing:-0.03em;margin:0 0 12px">Sẵn sàng bắt đầu?</h2>' +
                            '<p style="opacity:.7;margin:0 0 28px;font-size:1.02rem">Đăng ký miễn phí và nhận ngay 100.000đ vào ví.</p>' +
                            '<a href="#/register" class="btn btn-lg" style="background:var(--bg);color:var(--ink)">Tạo tài khoản miễn phí</a>' +
                        '</div>' +
                    '</div>' +
                '</section>';

        return renderLayout(html);
    }

    function pillar(icon, title, desc) {
        return (
            '<div>' +
                '<i class="bi bi-' + icon + '" style="font-size:1.4rem;color:var(--ink);display:inline-flex;width:44px;height:44px;background:var(--bg);border:1px solid color-mix(in srgb, var(--ink) 5%, transparent);border-radius:12px;align-items:center;justify-content:center"></i>' +
                '<h3 style="font-size:1.08rem;font-weight:600;margin:16px 0 6px;letter-spacing:-0.02em">' + escapeHTML(title) + '</h3>' +
                '<p style="color:var(--muted);font-size:.92rem;margin:0;line-height:1.55">' + escapeHTML(desc) + '</p>' +
            '</div>'
        );
    }

    function planCard(p, idx) {
        const mo = fromMonthly(p);
        const inner = (p.category === 'dedicated')
            ? '<div class="panel"><div class="panel-icon"><i class="bi bi-' + escapeHTML(p.icon || 'shield-shaded') + '"></i></div></div>' +
              '<div class="body">' + cardBody(p, mo) + '</div>'
            : cardBody(p, mo);
        return (
            '<div class="plan cat-' + escapeHTML(p.category) + '">' +
            inner +
            '</div>'
        );
    }

    function cardBody(p, mo) {
        const feats = (p.features || []).slice(0, 3).map(f => '<li>' + escapeHTML(f) + '</li>').join('');
        const priceTxt = (mo === Infinity) ? 'Liên hệ' : fmtVND(mo);
        return (
            '<div class="plan-head">' +
                '<div class="plan-icon"><i class="bi bi-' + escapeHTML(p.icon || 'cloud-fill') + '"></i></div>' +
                '<span class="plan-tag">' + escapeHTML((CATEGORY_INTRO[p.category] && CATEGORY_INTRO[p.category].tagline) || p.category) + '</span>' +
            '</div>' +
            '<h3 class="plan-name">' + escapeHTML(p.name) + '</h3>' +
            '<div class="plan-cpu">' + escapeHTML(p.cpu_type) + '</div>' +
            '<p class="plan-desc">' + escapeHTML(p.desc) + '</p>' +
            '<div class="plan-specs">' +
                '<div class="plan-spec"><span class="k">CPU</span><span class="v">' + p.cpu_cores + ' vCPU</span></div>' +
                '<div class="plan-spec"><span class="k">RAM</span><span class="v">' + p.ram_gb + ' GB</span></div>' +
                '<div class="plan-spec"><span class="k">Ổ cứng</span><span class="v">' + p.disk_gb + ' GB ' + escapeHTML(p.disk_type || '') + '</span></div>' +
                '<div class="plan-spec"><span class="k">Băng thông</span><span class="v">' + p.bandwidth_mbps + ' Mbps</span></div>' +
            '</div>' +
            '<ul class="plan-feats">' + feats + '</ul>' +
            '<div class="plan-foot">' +
                '<div class="plan-price">' +
                    '<span class="from">Từ</span>' +
                    '<span class="num">' + priceTxt + (mo === Infinity ? '' : '<span class="unit"> /tháng</span>') + '</span>' +
                '</div>' +
                '<a class="btn btn-line btn-sm" href="#/order?plan=' + encodeURIComponent(p.slug) + '">Đặt</a>' +
            '</div>'
        );
    }

    Router.add('GET', '/', render);
})();