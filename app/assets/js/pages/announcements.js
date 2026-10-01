/* =========================================================
   pages/announcements.js — Trang thông báo
========================================================= */
'use strict';

(function () {
    function render() {
        const anns = DB.all('announcements')
            .slice()
            .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (new Date(b.created_at) - new Date(a.created_at)));

        const items = anns.map(a => {
            const tag = a.type === 'promo' ? { label: 'Khuyến mãi', color: 'ryzen' } :
                         a.type === 'release' ? { label: 'Ra mắt', color: 'accent' } :
                         a.type === 'maintenance' ? { label: 'Bảo trì', color: 'cyan' } :
                         { label: 'Thông báo', color: 'muted' };
            return (
                '<article class="ann-item" data-type="' + escapeHTML(a.type) + '">' +
                    '<div class="ann-head">' +
                        (a.pinned ? '<span class="tag tag-warn"><i class="bi bi-pin-fill"></i> Ghim</span>' : '') +
                        '<span class="tag" style="background:color-mix(in srgb, var(--c-' + tag.color + ') 14%, transparent);color:var(--c-' + tag.color + ')">' + tag.label + '</span>' +
                        '<span class="ann-date">' + fmtShortDate(a.created_at) + '</span>' +
                    '</div>' +
                    '<h3>' + escapeHTML(a.title) + '</h3>' +
                    '<div class="ann-body">' + a.body + '</div>' +
                '</article>'
            );
        }).join('');

        const html =
            '<section class="sec">' +
                '<div class="wrap">' +
                    '<div class="sec-head reveal">' +
                        '<span class="eyebrow">Cập nhật</span>' +
                        '<h2>Thông báo & Khuyến mãi</h2>' +
                        '<p>Tin tức mới nhất từ đội ngũ VPSSIEUTOC.VN.</p>' +
                    '</div>' +
                    '<div class="ann-list">' + items + '</div>' +
                '</div>' +
            '</section>';
        return renderLayout(html);
    }

    Router.add('GET', '/announcements', render);
})();