/* =========================================================
   admin/router.js — Hash router đơn giản cho Admin
========================================================= */
'use strict';

const AdminRouter = {
    routes: {},
    titles: {},
    hooks: [],

    add(path, title, handler) {
        this.routes[path] = handler;
        this.titles[path] = title;
    },

    onRender(hook) {
        if (typeof hook === 'function') this.hooks.push(hook);
    },

    resolve() {
        var h = window.location.hash || '#/dashboard';
        return h.slice(1).split('?')[0] || '/dashboard';
    },

    go(path) {
        window.location.hash = '#' + path;
    },

    render() {
        var path = this.resolve();
        var handler = this.routes[path] || this.routes['/dashboard'];
        var title = this.titles[path] || this.titles['/dashboard'] || 'Dashboard';

        document.title = title + ' · Admin · VPSSIEUTOC.VN';
        var titleEl = document.getElementById('adPageTitle');
        if (titleEl) titleEl.textContent = title;

        // Highlight nav
        document.querySelectorAll('#adNav .vm-nav-link').forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === '#' + path);
        });

        var box = document.getElementById('adContent');
        if (!box) return;

        try {
            box.innerHTML = handler ? handler() : '<div class="vm-empty">Trang không tồn tại.</div>';
        } catch (e) {
            console.error('[AdminRouter] render error:', e);
            box.innerHTML = '<div class="vm-empty" style="color:var(--vm-danger)">Lỗi render: ' +
                (e && e.message ? e.message : String(e)) + '</div>';
        }

        // Hooks
        this.hooks.forEach(function (h) { try { h(path); } catch (e) {} });
    },

    init() {
        var self = this;
        window.addEventListener('hashchange', function () { self.render(); });
        if (!window.location.hash) window.location.hash = '#/dashboard';
        this.render();
    },
};

window.AdminRouter = AdminRouter;