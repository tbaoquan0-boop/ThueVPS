/* =========================================================
   admin/ui.js — Helpers: escapeHTML, Modal, toast, rerender
   ========================================================= */
'use strict';

(function () {
    function escapeHTML(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    var stack = [];
    function ensureRoot() {
        var root = document.getElementById('adModalRoot');
        if (!root) {
            root = document.createElement('div');
            root.id = 'adModalRoot';
            document.body.appendChild(root);
        }
        return root;
    }
    function closeTop() {
        var root = ensureRoot();
        var last = stack.pop();
        if (last) {
            last.el.remove();
            document.body.style.overflow = last.overflow || '';
        }
        if (stack.length === 0 && !document.getElementById('adToastRoot')) {
            // keep root
        }
    }
    function Modal(opts) {
        // opts: { title, body, footer, size, onClose }
        var root = ensureRoot();
        var prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        var size = opts.size || 'md'; // sm, md, lg
        var widths = { sm: 420, md: 560, lg: 760 };
        var el = document.createElement('div');
        el.className = 'ad-modal-backdrop';
        el.innerHTML = '' +
            '<div class="ad-modal" style="max-width:' + widths[size] + 'px">' +
                '<div class="ad-modal-head">' +
                    '<div class="ad-modal-title">' + escapeHTML(opts.title || '') + '</div>' +
                    '<button type="button" class="ad-modal-close" aria-label="Đóng">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body">' + (typeof opts.body === 'string' ? opts.body : '') + '</div>' +
                (opts.footer ? '<div class="ad-modal-foot">' + opts.footer + '</div>' : '') +
            '</div>';
        root.appendChild(el);
        var entry = { el: el, overflow: prevOverflow, onClose: opts.onClose };
        stack.push(entry);

        el.querySelector('.ad-modal-close').addEventListener('click', function () {
            closeTop();
            if (opts.onClose) opts.onClose();
        });
        el.addEventListener('click', function (e) {
            if (e.target === el) { closeTop(); if (opts.onClose) opts.onClose(); }
        });
        var escFn = function (ev) { if (ev.key === 'Escape') { closeTop(); document.removeEventListener('keydown', escFn); if (opts.onClose) opts.onClose(); } };
        document.addEventListener('keydown', escFn);

        // Mount node form if provided as DOM
        if (opts.body && typeof opts.body !== 'string') {
            var body = el.querySelector('.ad-modal-body');
            body.innerHTML = '';
            body.appendChild(opts.body);
        }
        return el;
    }

    function confirmModal(opts) {
        // opts: { title, message, danger, okText, cancelText, onOk }
        var body = document.createElement('div');
        body.innerHTML = '<p style="margin:0;font-size:.95rem;line-height:1.55">' + escapeHTML(opts.message || '') + '</p>';
        var yesCls = opts.danger ? 'ad-btn danger' : 'ad-btn primary';
        var footer = '' +
            '<button type="button" class="ad-btn" data-act="cancel">' + escapeHTML(opts.cancelText || 'Huỷ') + '</button>' +
            '<button type="button" class="' + yesCls + '" data-act="ok">' + escapeHTML(opts.okText || 'Đồng ý') + '</button>';
        var m = Modal({ title: opts.title || 'Xác nhận', body: body, footer: footer });
        m.querySelector('[data-act=cancel]').addEventListener('click', function () { closeTop(); });
        m.querySelector('[data-act=ok]').addEventListener('click', function () {
            closeTop();
            if (opts.onOk) opts.onOk();
        });
    }

    function toast(msg, kind) {
        var root = document.getElementById('adToastRoot');
        if (!root) {
            root = document.createElement('div');
            root.id = 'adToastRoot';
            root.className = 'ad-toast-root';
            document.body.appendChild(root);
        }
        var el = document.createElement('div');
        el.className = 'ad-toast ' + (kind || '');
        el.textContent = msg;
        root.appendChild(el);
        setTimeout(function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 250); }, 2400);
    }

    function rerender() {
        if (window.AdminRouter) AdminRouter.render();
    }

    function formModal(opts) {
        // opts: { title, fields: [{name,label,type,value,placeholder,required,options}], onSubmit(values) }
        var form = document.createElement('form');
        form.className = 'ad-form';
        form.innerHTML = opts.fields.map(function (f) {
            var id = 'f_' + f.name;
            var req = f.required ? ' required' : '';
            var val = f.value == null ? '' : String(f.value);
            var input;
            if (f.type === 'textarea') {
                input = '<textarea name="' + f.name + '" id="' + id + '" class="ad-inp"' + req + ' placeholder="' + escapeHTML(f.placeholder || '') + '">' + escapeHTML(val) + '</textarea>';
            } else if (f.type === 'select') {
                input = '<select name="' + f.name + '" id="' + id + '" class="ad-inp"' + req + '>' +
                    (f.options || []).map(function (o) {
                        var ov = String(o.value), ot = String(o.label);
                        return '<option value="' + escapeHTML(ov) + '"' + (ov === val ? ' selected' : '') + '>' + escapeHTML(ot) + '</option>';
                    }).join('') + '</select>';
            } else {
                input = '<input type="' + escapeHTML(f.type || 'text') + '" name="' + f.name + '" id="' + id + '" class="ad-inp" value="' + escapeHTML(val) + '"' + req + ' placeholder="' + escapeHTML(f.placeholder || '') + '">';
            }
            return '<div class="ad-row">' +
                '<label for="' + id + '">' + escapeHTML(f.label) + (f.required ? ' <span style="color:var(--vm-danger)">*</span>' : '') + '</label>' +
                input +
                (f.hint ? '<div class="ad-hint">' + escapeHTML(f.hint) + '</div>' : '') +
            '</div>';
        }).join('');
        var footer = '' +
            '<button type="button" class="ad-btn" data-act="cancel">Huỷ</button>' +
            '<button type="submit" class="ad-btn primary">' + escapeHTML(opts.okText || 'Lưu') + '</button>';
        var m = Modal({ title: opts.title || 'Form', body: form, footer: footer, size: opts.size || 'md' });
        m.querySelector('[data-act=cancel]').addEventListener('click', function () { closeTop(); });
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var values = {};
            opts.fields.forEach(function (f) {
                values[f.name] = form.elements[f.name].value;
            });
            try {
                if (opts.onSubmit) opts.onSubmit(values);
            } catch (err) {
                toast(err.message || String(err), 'danger');
                return;
            }
            closeTop();
        });
        // Focus first input
        setTimeout(function () {
            var first = form.querySelector('input, select, textarea');
            if (first) first.focus();
        }, 50);
        return m;
    }

    window.AdminUI = {
        escapeHTML: escapeHTML,
        Modal: Modal,
        closeModal: closeTop,
        confirm: confirmModal,
        toast: toast,
        rerender: rerender,
        formModal: formModal,
    };
    // Backwards compat for dashboard.js (uses global escapeHTML)
    window.escapeHTML = escapeHTML;
})();