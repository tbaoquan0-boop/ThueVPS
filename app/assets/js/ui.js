/* =========================================================
   ui.js — Render helpers, layout, format
========================================================= */
'use strict';

const fmtVND = n => {
    if (n == null) return '0đ';
    return Number(n).toLocaleString('vi-VN') + 'đ';
};
const fmtDate = d => {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date)) return '—';
    return date.toLocaleDateString('vi-VN') + ' ' +
           date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};
const fmtShortDate = d => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('vi-VN');
};
const fmtNumber = n => Number(n).toLocaleString('vi-VN');

const escapeHTML = s => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

const today = () => new Date().toISOString().slice(0, 10);
const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + Number(months));
    return d.toISOString();
};
const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + Number(days));
    return d.toISOString();
};
const daysBetween = (a, b) => {
    const ms = new Date(b) - new Date(a);
    return Math.floor(ms / 86400000);
};

// Tính "từ Xđ/tháng" = price 12 tháng / 12
function fromMonthly(plan) {
    const prices = DB.all('plan_prices').filter(p => p.plan_id === plan.id);
    const p12 = prices.find(p => p.cycle_months === 12);
    if (!p12) return Infinity;
    return Math.floor(p12.price / 12);
}

const Flash = {
    show(message, type = 'info', timeout = 3500) {
        const area = document.getElementById('flash-area');
        if (!area) return;
        const id = 'flash-' + Date.now() + Math.floor(Math.random() * 999);
        const html =
            '<div id="' + id + '" class="flash-msg ' + escapeHTML(type) + '">' +
            '<span>' + message + '</span>' +
            '<button type="button" class="btn-close-x" data-id="' + id + '" ' +
                    'style="background:none;border:none;font-size:1.1rem;color:#6b7892;cursor:pointer">&times;</button>' +
            '</div>';
        area.insertAdjacentHTML('beforeend', html);
        const el = area.querySelector('#' + id);
        const closeBtn = el.querySelector('.btn-close-x');
        closeBtn.addEventListener('click', () => el.remove());
        setTimeout(() => { if (el) el.remove(); }, timeout);
    },
};

// ===== Layout =====
function renderLayout(content) {
    const user = Session.current();
    return [
        '<div class="topbar">',
        '  <div class="container d-flex justify-content-between align-items-center flex-wrap gap-2">',
        '    <div><span class="promo"><i class="bi bi-fire"></i> KHUYẾN MÃI:</span> Giảm 10% cho đơn hàng đầu tiên với mã <b>GIAM10</b></div>',
        '    <div class="d-flex gap-3 align-items-center">',
        '      <a href="#/docs"><i class="bi bi-book"></i> Tài liệu</a>',
        '      <a href="#/announcements"><i class="bi bi-megaphone"></i> Thông báo</a>',
        '      <a href="#" id="dark-toggle" title="Đổi giao diện"><i class="bi bi-moon-stars"></i></a>',
        '    </div>',
        '  </div>',
        '</div>',

        '<nav class="main-nav">',
        '  <div class="container nav-inner">',
        '    <a href="#/" class="brand">',
        '      <div class="brand-icon"><i class="bi bi-cloud-fill"></i></div>',
        '      <div class="brand-text"><div class="b1">VPSSIEUTOC.VN</div><div class="b2">CLOUD SERVER</div></div>',
        '    </a>',
        '    <ul class="nav-links">',
        '      <li><a href="#/">Trang chủ</a></li>',
        '      <li><a href="#/pricing">Bảng giá</a></li>',
        '      <li><a href="#/pricing?type=ryzen">VPS AMD Ryzen</a></li>',
        '      <li><a href="#/pricing?type=highfreq">VPS Xung nhịp cao</a></li>',
        '      <li><a href="#/pricing?type=gpu">VPS GPU</a></li>',
        '    </ul>',
        '    <div class="nav-actions">',
        user
            ? '<a href="#/dashboard" class="btn btn-ghost"><i class="bi bi-speedometer2"></i> ' + escapeHTML(user.name) + '</a>' +
              '<a href="#" id="btn-logout" class="btn btn-outline">Đăng xuất</a>'
            : '<a href="#/login" class="btn btn-ghost">Đăng nhập</a>' +
              '<a href="#/register" class="btn btn-primary">Đăng ký</a>',
        '    </div>',
        '  </div>',
        '</nav>',

        '<main>' + content + '</main>',

        '<footer class="site-footer">',
        '  <div class="container">',
        '    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:30px">',
        '      <div>',
        '        <h4>VPSSIEUTOC.VN</h4>',
        '        <p style="color:#94a3b8;font-size:.9rem">Dịch vụ Cloud VPS, Hosting, Dedicated Server hàng đầu Việt Nam.</p>',
        '      </div>',
        '      <div>',
        '        <h4>Sản phẩm</h4>',
        '        <a href="#/pricing">Cloud VPS</a>',
        '        <a href="#/pricing?type=highfreq">VPS Xung nhịp cao</a>',
        '        <a href="#/pricing?type=gpu">VPS GPU</a>',
        '        <a href="#/pricing?type=dediacted">Dedicated Server</a>',
        '      </div>',
        '      <div>',
        '        <h4>Hỗ trợ</h4>',
        '        <a href="#/docs">Tài liệu</a>',
        '        <a href="#/tickets">Tickets</a>',
        '        <a href="#/announcements">Thông báo</a>',
        '      </div>',
        '      <div>',
        '        <h4>Liên hệ</h4>',
        '        <a href="#">Hotline: 1900 6868</a>',
        '        <a href="#">Email: support@vpssieutoc.vn</a>',
        '      </div>',
        '    </div>',
        '    <div class="footer-bottom">© 2026 VPSSIEUTOC.VN — Bảo lưu mọi quyền.</div>',
        '  </div>',
        '</footer>',
    ].join('\n');
}

window.fmtVND = fmtVND;
window.fmtDate = fmtDate;
window.fmtShortDate = fmtShortDate;
window.fmtNumber = fmtNumber;
window.escapeHTML = escapeHTML;
window.today = today;
window.addMonths = addMonths;
window.addDays = addDays;
window.daysBetween = daysBetween;
window.fromMonthly = fromMonthly;
window.Flash = Flash;
window.renderLayout = renderLayout;
