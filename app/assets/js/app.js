/* =========================================================
   app.js — Entry point + scroll reveal
========================================================= */
'use strict';

(function () {
    // Theme
    const savedTheme = localStorage.getItem('vps-theme');
    if (savedTheme) document.documentElement.dataset.bsTheme = savedTheme;

    // Bind header handlers after first render
    const origBindGlobalEvents = window.bindGlobalEvents;
    window.bindGlobalEvents = function () {
        origBindGlobalEvents();
        window.bindHeader();
        initReveal();
    };

    // Scroll reveal — dùng IntersectionObserver
    function initReveal() {
        if (!('IntersectionObserver' in window)) {
            // Fallback: hiện hết
            document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => el.classList.add('in'));
            return;
        }
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

        document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => {
            if (el.classList.contains('in')) return;
            obs.observe(el);
        });
    }
    window.initReveal = initReveal;

    // Re-init khi hash đổi
    window.addEventListener('hashchange', () => {
        // reset các reveal để animate lại khi chuyển trang
        setTimeout(initReveal, 50);
    });

    // Router
    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('DOMContentLoaded', () => {
        if (!window.location.hash) window.location.hash = '#/';
        handleRoute();
    });
    if (document.readyState !== 'loading') {
        if (!window.location.hash) window.location.hash = '#/';
        handleRoute();
    }
})();
