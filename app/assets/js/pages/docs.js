/* =========================================================
   pages/docs.js — Tài liệu
========================================================= */
'use strict';

(function () {
    function render() {
        const docs = DB.all('docs');
        const cats = [...new Set(docs.map(d => d.cat))];
        const catLabels = {
            'getting-started': 'Bắt đầu',
            'advanced':        'Nâng cao',
            'billing':         'Thanh toán',
            'api':             'API',
        };

        const sections = cats.map(cat => {
            const items = docs.filter(d => d.cat === cat);
            return (
                '<section class="doc-cat reveal">' +
                    '<h3 class="doc-cat-title">' + escapeHTML(catLabels[cat] || cat) + '</h3>' +
                    '<div class="doc-list">' +
                        items.map(d => (
                            '<a href="#/docs/' + d.id + '" class="doc-item">' +
                                '<i class="bi bi-file-earmark-text"></i>' +
                                '<div><div class="t">' + escapeHTML(d.title) + '</div>' +
                                '<div class="d">' + escapeHTML(d.body) + '</div></div>' +
                                '<i class="bi bi-arrow-right"></i>' +
                            '</a>'
                        )).join('') +
                    '</div>' +
                '</section>'
            );
        }).join('');

        const html =
            '<section class="sec">' +
                '<div class="wrap">' +
                    '<div class="sec-head reveal">' +
                        '<span class="eyebrow">Hướng dẫn</span>' +
                        '<h2>Tài liệu & API</h2>' +
                        '<p>Mọi thứ bạn cần để bắt đầu và vận hành VPS.</p>' +
                    '</div>' +
                    '<div class="doc-cats">' + sections + '</div>' +
                '</div>' +
            '</section>';
        return renderLayout(html);
    }

    function renderDetail(query) {
        const id = Number(query.params.id);
        const doc = DB.find('docs', id);
        if (!doc) { Router.go('/'); return render(); }

        const all = DB.all('docs');
        const idx = all.findIndex(d => d.id === id);
        const prev = idx > 0 ? all[idx - 1] : null;
        const next = idx < all.length - 1 ? all[idx + 1] : null;

        const html =
            '<section class="sec">' +
                '<div class="wrap" style="max-width:760px">' +
                    '<div class="reveal" style="margin-bottom:24px">' +
                        '<a href="#/docs" class="btn btn-line btn-sm"><i class="bi bi-arrow-left"></i> Quay lại</a>' +
                    '</div>' +
                    '<article class="doc-article reveal">' +
                        '<div class="eyebrow" style="color:var(--accent);font-size:.82rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em">' + escapeHTML(doc.cat) + '</div>' +
                        '<h1 style="font-size:1.9rem;font-weight:600;letter-spacing:-0.03em;margin:8px 0 16px">' + escapeHTML(doc.title) + '</h1>' +
                        '<div class="doc-content">' + doc.body + '</div>' +
                    '</article>' +
                    '<div class="doc-nav reveal" style="display:flex;justify-content:space-between;gap:16px;margin-top:40px">' +
                        (prev
                            ? '<a href="#/docs/' + prev.id + '" class="btn btn-line"><i class="bi bi-arrow-left"></i> ' + escapeHTML(prev.title) + '</a>'
                            : '<span></span>') +
                        (next
                            ? '<a href="#/docs/' + next.id + '" class="btn btn-line">' + escapeHTML(next.title) + ' <i class="bi bi-arrow-right"></i></a>'
                            : '<span></span>') +
                    '</div>' +
                '</div>' +
            '</section>';
        return renderLayout(html);
    }

    Router.add('GET', '/docs',       render);
    Router.add('GET', '/docs/:id',   renderDetail);
})();