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
            '<div class="wrap" style="padding:100px 20px;text-align:center">' +
            '<div style="font-size:5.5rem;font-weight:800;letter-spacing:-0.05em;background:linear-gradient(135deg,var(--accent),var(--c-ryzen));-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1;margin-bottom:12px">404</div>' +
            '<h2 style="font-size:1.6rem;font-weight:700;margin:0 0 10px">Không tìm thấy trang yêu cầu</h2>' +
            '<p style="color:var(--muted);max-width:480px;margin:0 auto 24px">Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển sang địa chỉ mới.</p>' +
            '<a href="#/" class="btn btn-solid"><i class="bi bi-house-door-fill"></i> Về trang chủ</a>' +
            '</div>'
        );
        bindGlobalEvents();
    },


    go(path, opts) {
        if (!path.startsWith('/')) path = '/' + path;
        const preserveScroll = opts && opts.preserveScroll;
        const newHash = '#' + path;
        if (window.location.hash !== newHash) {
            if (preserveScroll) {
                const y = window.scrollY, x = window.scrollX;
                window.history.replaceState({ preserveScroll: true, scrollX: x, scrollY: y }, '', newHash);
            } else {
                window.location.hash = newHash;
            }
        } else {
            if (preserveScroll) {
                window.history.replaceState({ preserveScroll: true, scrollX: window.scrollX, scrollY: window.scrollY }, '', newHash);
            }
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
    // Lưu scroll position trước khi render, restore sau để tránh giật khi re-render cùng route
    const savedY = window.scrollY;
    const savedX = window.scrollX;
    const skipScroll = window.history.state && window.history.state.preserveScroll;
    if (!m) { Router.render404(); return; }
    try {
        const html = m.handler({ params: m.params, query });
        root.innerHTML = html;
        bindGlobalEvents();
        if (!skipScroll) {
            window.scrollTo({ top: 0 });
        } else {
            window.scrollTo(savedX, savedY);
        }
    } catch (e) {
        console.error('Route error', e);
        root.innerHTML = renderLayout(
            '<div class="container" style="padding:60px 0">' +
            '<div class="card-surface"><h3>Đã có lỗi xảy ra</h3>' +
            '<pre style="color:var(--c-danger);white-space:pre-wrap">' +
            escapeHTML(e.stack || e.message) + '</pre></div></div>'
        );
        bindGlobalEvents();
        window.scrollTo({ top: 0 });
    }
}

// ===== Global event bindings (delegated) =====
function bindGlobalEvents() {
    if (document.__globalBound) return;
    document.__globalBound = true;

    document.addEventListener('click', (e) => {
        const t = e.target.closest('[data-action]');
        if (!t) return;
        const action = t.dataset.action;
        const handler = window.App && window.App[action];
        if (typeof handler === 'function') {
            e.preventDefault();
            handler(t, e);
        }
    });

    document.addEventListener('submit', (e) => {
        const form = e.target.closest('form[data-form]');
        if (!form) return;
        e.preventDefault();
        const action = form.dataset.form;
        const handler = window.App && window.App[action];
        if (typeof handler === 'function') {
            handler(form, e);
        }
    });

    document.addEventListener('change', (e) => {
        const sel = e.target.closest('[data-change]');
        if (!sel) return;
        const action = sel.dataset.change;
        const handler = window.App && window.App[action];
        if (typeof handler === 'function') handler(sel, e);
    });

    document.addEventListener('input', (e) => {
        const inp = e.target.closest('[data-input]');
        if (!inp) return;
        const action = inp.dataset.input;
        const handler = window.App && window.App[action];
        if (typeof handler === 'function') handler(inp, e);
    });
}


// Theme + logout + mobile nav
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

    // Mobile nav toggle
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = navLinks.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            navToggle.innerHTML = isOpen ? '<i class="bi bi-x-lg"></i>' : '<i class="bi bi-list"></i>';
        });

        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.innerHTML = '<i class="bi bi-list"></i>';
            });
        });

        if (!window.__closeNavHandler) {
            window.__closeNavHandler = (e) => {
                const toggle = document.getElementById('nav-toggle');
                const links = document.getElementById('nav-links');
                if (toggle && links && links.classList.contains('open')) {
                    if (!toggle.contains(e.target) && !links.contains(e.target)) {
                        links.classList.remove('open');
                        toggle.setAttribute('aria-expanded', 'false');
                        toggle.innerHTML = '<i class="bi bi-list"></i>';
                    }
                }
            };
            document.addEventListener('click', window.__closeNavHandler);
        }
    }

    // Active state highlighting
    if (navLinks) {
        const rawHash = window.location.hash || '#/';
        navLinks.querySelectorAll('a').forEach((a) => {
            const href = a.getAttribute('href');
            if (href === rawHash || (rawHash === '#/' && href === '#/')) {
                a.classList.add('active');
            } else if (href !== '#/' && rawHash.startsWith(href)) {
                a.classList.add('active');
            } else {
                a.classList.remove('active');
            }
        });
    }
}

// Handy route shortcuts/aliases
Router.add('GET', '/tickets', ({ query }) => {
    Router.go('/dashboard?view=tickets' + (query && query.id ? '&id=' + query.id : ''));
});
Router.add('GET', '/services', () => Router.go('/dashboard?view=services'));
Router.add('GET', '/invoices', () => Router.go('/dashboard?view=invoices'));
Router.add('GET', '/wallet',   () => Router.go('/dashboard?view=wallet'));
Router.add('GET', '/profile',  () => Router.go('/dashboard?view=profile'));

window.Router = Router;
window.handleRoute = handleRoute;
window.bindGlobalEvents = bindGlobalEvents;
window.bindHeader = bindHeader;

