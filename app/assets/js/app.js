/* =========================================================
   app.js — Entry point
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
    };

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
