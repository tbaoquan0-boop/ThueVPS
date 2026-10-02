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

const Modal = {
    show({ title, body, footer = '', maxWidth = '580px' }) {
        Modal.close();
        const overlay = document.createElement('div');
        overlay.id = 'app-modal-overlay';
        overlay.className = 'modal-overlay';
        overlay.innerHTML =
            '<div class="modal-card" style="max-width:' + maxWidth + '">' +
                '<div class="modal-header">' +
                    '<h3 style="margin:0;font-size:1.15rem;font-weight:600">' + title + '</h3>' +
                    '<button type="button" class="btn-close-modal" aria-label="Đóng" style="background:none;border:none;font-size:1.4rem;color:var(--muted);cursor:pointer;line-height:1" onclick="Modal.close()">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' + body + '</div>' +
                (footer ? '<div class="modal-footer">' + footer + '</div>' : '') +
            '</div>';
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) Modal.close();
        });
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
    },
    close() {
        const el = document.getElementById('app-modal-overlay');
        if (el) el.remove();
        document.body.style.overflow = '';
    }
};

const copyText = (text, msg) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            Flash.show(msg || ('Đã sao chép: ' + text), 'success');
        }).catch(() => {
            Flash.show('Đã sao chép: ' + text, 'info');
        });
    } else {
        Flash.show('Đã sao chép: ' + text, 'info');
    }
};


// ===== Layout =====
function renderLayout(content) {
    const user = Session.current();
    return [
        '<div class="topbar">',
        '  <div class="wrap" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">',
        '    <div><span class="promo">Khuyến mãi:</span> Giảm 10% cho đơn hàng đầu tiên với mã <b style="color:var(--ink)">GIAM10</b></div>',
        '    <div style="display:flex;gap:16px;align-items:center">',
        '      <a href="#/docs">Tài liệu</a>',
        '      <a href="#/announcements">Thông báo</a>',
        '      <a href="#" id="dark-toggle" title="Đổi giao diện">Sáng/Tối</a>',
        '    </div>',
        '  </div>',
        '</div>',

        '<nav class="nav">',
        '  <div class="wrap nav-inner">',
        '    <a href="#/" class="brand">',
        '      <div class="brand-mark"><i class="bi bi-cloud-fill"></i></div>',
        '      <span>TáoVPS Web</span>',
        '    </a>',
        '    <ul class="nav-links" id="nav-links">',
        '      <li><a href="#/">Trang chủ</a></li>',
        '      <li><a href="#/pricing">Cloud VPS</a></li>',
        '      <li><a href="#/pricing?cat=ryzen">AMD Ryzen</a></li>',
        '      <li><a href="#/pricing?cat=highfreq">Xung nhịp cao</a></li>',
        '      <li><a href="#/pricing?cat=gpu">GPU Server</a></li>',
        '      <li><a href="#/pricing?cat=dedicated">Dedicated</a></li>',
        '    </ul>',
        '    <div class="nav-actions">',
        user
            ? '<a href="#/dashboard" class="btn btn-ghost btn-sm">' + escapeHTML(user.name) + '</a>' +
              '<a href="#" id="btn-logout" class="btn btn-line btn-sm">Đăng xuất</a>'
            : '<a href="#/login" class="btn btn-ghost btn-sm">Đăng nhập</a>' +
              '<a href="#/register" class="btn btn-solid btn-sm">Đăng ký</a>',
        '      <button type="button" class="nav-toggle" id="nav-toggle" aria-label="Menu" aria-expanded="false">',
        '        <i class="bi bi-list"></i>',
        '      </button>',
        '    </div>',
        '  </div>',
        '</nav>',

        '<main>' + content + '</main>',

        '<footer class="foot">',
        '  <div class="wrap">',
        '    <div class="foot-grid">',
        '      <div class="foot-brand">',
        '        <h4 style="display:flex;align-items:center;gap:8px"><span class="brand-mark" style="width:24px;height:24px;font-size:.85rem"><i class="bi bi-cloud-fill"></i></span> TáoVPS Web</h4>',
        '        <p>Dịch vụ Cloud VPS, Hosting, Dedicated Server hàng đầu Việt Nam. Hạ tầng NVMe, network 10Gbps, uptime 99.99%.</p>',
        '      </div>',
        '      <div>',
        '        <h4>Sản phẩm</h4>',
        '        <a href="#/pricing">Cloud VPS</a>',
        '        <a href="#/pricing?cat=ryzen">AMD Ryzen</a>',
        '        <a href="#/pricing?cat=highfreq">Xung nhịp cao</a>',
        '        <a href="#/pricing?cat=gpu">GPU Server</a>',
        '        <a href="#/pricing?cat=dedicated">Dedicated</a>',
        '        <a href="#/compare">So sánh gói</a>',
        '      </div>',
        '      <div>',
        '        <h4>Hỗ trợ</h4>',
        '        <a href="#/docs">Tài liệu</a>',
        '        <a href="#/dashboard?view=tickets">Tickets hỗ trợ</a>',
        '        <a href="#/announcements">Thông báo</a>',
        '      </div>',
        '      <div>',
        '        <h4>Liên hệ</h4>',
        '        <a href="tel:19006868"><i class="bi bi-telephone"></i> Hotline: 1900 6868</a>',
        '        <a href="mailto:support@taovps.vn"><i class="bi bi-envelope"></i> support@taovps.vn</a>',
        '      </div>',
        '    </div>',
        '    <div class="foot-bottom">© 2026 TáoVPS Web</div>',
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
window.Modal = Modal;
window.copyText = copyText;

