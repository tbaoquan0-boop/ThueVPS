/* =========================================================
   router.js — Hash router
========================================================= */
'use strict';

const Router = {
    routes: [],

    add(method, pattern, handler) {
        this.routes.push({ method, pattern, handler });
    },

    match(pathname) {
        for (const r of this.routes) {
            const re = new RegExp('^' + r.pattern.replace(/:[^/]+/g, '([^/]+)') + '$');
            const m = pathname.match(re);
            if (m) {
                const keys = (r.pattern.match(/:[^/]+/g) || []).map(k => k.slice(1));
                const params = {};
                keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
                return { handler: r.handler, params };
            }
        }
        return null;
    },

    render404() {
        document.getElementById('app').innerHTML = renderLayout(
            '<div class="container" style="padding:80px 0;text-align:center">' +
            '<h1 style="font-size:5rem;color:var(--c-primary);margin:0">404</h1>' +
            '<p style="font-size:1.2rem;color:var(--c-muted)">Trang không tồn tại</p>' +
            '<a href="#/" class="btn btn-primary" style="margin-top:20px">Về trang chủ</a>' +
            '</div>'
        );
        bindGlobalEvents();
    },

    go(path) {
        if (!path.startsWith('/')) path = '/' + path;
        if (window.location.hash !== '#' + path) {
            window.location.hash = '#' + path;
        } else {
            handleRoute();
        }
    },

    resolve() {
        const raw = (window.location.hash || '#/').slice(1);
        const [pathname, search] = raw.split('?');
        return {
            pathname: pathname || '/',
            query: Object.fromEntries(new URLSearchParams(search || '')),
        };
    },
};

function handleRoute() {
    const { pathname, query } = Router.resolve();
    const m = Router.match(pathname);
    const root = document.getElementById('app');
    if (!root) return;
    if (!m) { Router.render404(); return; }
    try {
        const html = m.handler({ params: m.params, query });
        root.innerHTML = html;
        bindGlobalEvents();
        window.scrollTo({ top: 0 });
    } catch (e) {
        console.error('Route error', e);
        root.innerHTML = renderLayout(
            '<div class="container" style="padding:60px 0">' +
            '<div class="card-surface"><h3>Đã có lỗi xảy ra</h3>' +
            '<pre style="color:var(--c-danger);white-space:pre-wrap">' +
            escapeHTML(e.stack || e.message) + '</pre></div></div>'
        );
        bindGlobalEvents();
    }
}

// ===== Global event bindings (delegated) =====
function bindGlobalEvents() {
    const app = document.getElementById('app');
    if (!app || app.__bound) return;
    app.__bound = true;

    app.addEventListener('click', (e) => {
        const t = e.target.closest('[data-action]');
        if (!t) return;
        const action = t.dataset.action;
        const handler = window.App && window.App[action];
        if (typeof handler === 'function') {
            e.preventDefault();
            handler(t, e);
        }
    });

    app.addEventListener('submit', (e) => {
        const form = e.target.closest('form[data-form]');
        if (!form) return;
        e.preventDefault();
        const action = form.dataset.form;
        const handler = window.App && window.App[action];
        if (typeof handler === 'function') {
            handler(form, e);
        }
    });

    app.addEventListener('change', (e) => {
        const sel = e.target.closest('[data-change]');
        if (!sel) return;
        const action = sel.dataset.change;
        const handler = window.App && window.App[action];
        if (typeof handler === 'function') handler(sel, e);
    });
}

// Theme + logout (top bar)
function bindHeader() {
    const darkBtn = document.getElementById('dark-toggle');
    if (darkBtn) {
        darkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const html = document.documentElement;
            const next = html.dataset.bsTheme === 'dark' ? 'light' : 'dark';
            html.dataset.bsTheme = next;
            localStorage.setItem('vps-theme', next);
        });
    }
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Session.logout();
            Flash.show('Đã đăng xuất', 'success');
            Router.go('/');
        });
    }
}

window.Router = Router;
window.handleRoute = handleRoute;
window.bindGlobalEvents = bindGlobalEvents;
window.bindHeader = bindHeader;
