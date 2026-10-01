/* =========================================================
   pages/home.js — Trang chủ
========================================================= */
'use strict';

(function () {
    function render() {
        const plans = DB.all('plans').filter(p => p.is_active).sort((a, b) => a.sort_order - b.sort_order);
        const planCards = plans.map(p => {
            const mo = fromMonthly(p);
            const prices = DB.all('plan_prices').filter(pr => pr.plan_id === p.id);
            const minCycle = Math.min.apply(null, prices.map(pr => pr.cycle_months));
            return (
                '<div class="plan-card">' +
                '<span class="banner ' + escapeHTML(p.banner || 'r') + '">' + escapeHTML(p.banner || 'r') + '</span>' +
                '<h3>' + escapeHTML(p.name) + '</h3>' +
                '<div class="spec"><span>CPU</span><span class="v">' + p.cpu_cores + ' vCPU</span></div>' +
                '<div class="spec"><span>RAM</span><span class="v">' + p.ram_gb + ' GB</span></div>' +
                '<div class="spec"><span>SSD</span><span class="v">' + p.disk_gb + ' GB</span></div>' +
                '<div class="spec"><span>Băng thông</span><span class="v">' + p.bandwidth_mbps + ' Mbps</span></div>' +
                '<div class="spec"><span>IPv4</span><span class="v">' + p.ipv4_count + '</span></div>' +
                '<div class="price"><span class="num">' + (mo === Infinity ? 'Liên hệ' : fmtVND(mo)) + '</span>' +
                (mo === Infinity ? '' : '<span class="unit">/tháng</span>') +
                '</div>' +
                '<p class="desc">' + escapeHTML(p.desc || '') + '</p>' +
                '<a class="btn btn-primary" style="width:100%" href="#/order?plan=' + encodeURIComponent(p.slug) + '">Đặt ngay</a>' +
                '</div>'
            );
        }).join('');

        const html =
            '<section class="hero">' +
                '<div class="container">' +
                    '<h1>Cloud VPS tốc độ cao<br><span class="grad">Khởi tạo trong 60 giây</span></h1>' +
                    '<p>Cung cấp giải pháp Cloud VPS, Hosting, Dedicated Server với hạ tầng hiện đại, uptime 99.99%, hỗ trợ 24/7.</p>' +
                    '<div class="cta-row">' +
                        '<a href="#/pricing" class="btn btn-primary btn-lg"><i class="bi bi-currency-dollar"></i> Xem bảng giá</a>' +
                        '<a href="#/register" class="btn btn-outline btn-lg"><i class="bi bi-person-plus"></i> Đăng ký miễn phí</a>' +
                    '</div>' +
                    '<div class="hero-stats">' +
                        '<div class="stat-card"><div class="stat-num">12,000+</div><div class="stat-lbl">Khách hàng</div></div>' +
                        '<div class="stat-card"><div class="stat-num">99.99%</div><div class="stat-lbl">Uptime</div></div>' +
                        '<div class="stat-card"><div class="stat-num">24/7</div><div class="stat-lbl">Hỗ trợ</div></div>' +
                        '<div class="stat-card"><div class="stat-num">60s</div><div class="stat-lbl">Khởi tạo</div></div>' +
                    '</div>' +
                '</div>' +
            '</section>' +

            '<section class="section">' +
                '<div class="container">' +
                    '<div class="section-head">' +
                        '<h2>Bảng giá nổi bật</h2>' +
                        '<p>Lựa chọn gói phù hợp với nhu cầu của bạn</p>' +
                    '</div>' +
                    '<div class="plan-grid">' + planCards + '</div>' +
                    '<div style="text-align:center;margin-top:30px">' +
                        '<a href="#/pricing" class="btn btn-outline">Xem tất cả gói <i class="bi bi-arrow-right"></i></a>' +
                    '</div>' +
                '</div>' +
            '</section>' +

            '<section class="section" style="background:var(--c-surface)">' +
                '<div class="container">' +
                    '<div class="section-head"><h2>Tại sao chọn VPSSIEUTOC.VN?</h2></div>' +
                    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px">' +
                        feat('bi-lightning-charge-fill', 'Tốc độ cao', 'CPU AMD Ryzen, NVMe SSD, network 10Gbps') +
                        feat('bi-shield-check', 'Bảo mật', 'DDoS protection, snapshot tự động, mã hoá') +
                        feat('bi-headset', 'Hỗ trợ 24/7', 'Đội ngũ kỹ thuật Việt Nam sẵn sàng hỗ trợ') +
                        feat('bi-cash-coin', 'Giá tốt nhất', 'Cam kết hoàn tiền 100% trong 7 ngày đầu') +
                    '</div>' +
                '</div>' +
            '</section>';

        return renderLayout(html);
    }

    function feat(icon, title, desc) {
        return (
            '<div class="card-surface">' +
                '<i class="bi ' + icon + '" style="font-size:2rem;color:var(--c-primary)"></i>' +
                '<h4 style="margin:14px 0 6px">' + escapeHTML(title) + '</h4>' +
                '<p style="color:var(--c-muted);margin:0;font-size:.92rem">' + escapeHTML(desc) + '</p>' +
            '</div>'
        );
    }

    Router.add('GET', '/', render);
})();
