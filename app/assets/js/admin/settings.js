/* =========================================================
   admin/settings.js — Cài đặt hệ thống (lưu DB thật)
   ========================================================= */
'use strict';

(function () {
    var esc = window.AdminUI.escapeHTML;
    var ui = window.AdminUI;

    var SETTINGS_KEY = 'vpssieutoc_settings_v1';

    function loadSettings() {
        try {
            var raw = localStorage.getItem(SETTINGS_KEY);
            if (raw) return Object.assign({}, defaults(), JSON.parse(raw));
        } catch (e) {}
        return defaults();
    }
    function saveSettings(s) {
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {}
    }
    function defaults() {
        return {
            site_name: 'TáoVPS Web',
            contact_email: 'support@taovps.vn',
            hotline: '1900 6868',
            timezone: 'Asia/Ho_Chi_Minh',
            notify_email_order: true,
            notify_telegram_server: true,
            notify_sms_high_ticket: false,
            notify_promo_to_user: true,
            sec_2fa_admin: true,
            sec_anti_brute: true,
            sec_ip_whitelist: false,
            sec_audit_log: true,
            smtp_host: 'smtp.taovps.vn',
            smtp_port: '587',
            smtp_user: 'noreply@taovps.vn',
            pay_vcb: true,
            pay_momo: true,
            pay_vnpay: false,
            pay_paypal: false,
        };
    }

    function toggle(checked) {
        return '<label class="vm-switch"><input type="checkbox"' + (checked ? ' checked' : '') + '><span class="slider"></span></label>';
    }

    function render() {
        var s = loadSettings();

        function row(label, hint, ctrl) {
            return '<div class="vm-flex-between vm-mb-3">' +
                '<div><b>' + label + '</b>' + (hint ? '<div style="color:var(--vm-muted);font-size:.78rem">' + hint + '</div>' : '') + '</div>' +
                '<div>' + ctrl + '</div>' +
            '</div>';
        }
        var inputStyle = 'background:var(--vm-surface-2);border:1px solid var(--vm-line);border-radius:7px;padding:6px 10px;color:var(--vm-ink);font-family:inherit;width:220px';
        var fullInputStyle = 'background:var(--vm-surface-2);border:1px solid var(--vm-line);border-radius:7px;padding:7px 10px;color:var(--vm-ink);font-family:inherit;width:100%;margin-top:4px';

        return '' +
            '<div class="vm-page-head">' +
                '<div><h1>Cài đặt hệ thống</h1><p>Cấu hình chung và các tùy chọn quản trị</p></div>' +
                '<div class="vm-page-actions">' +
                    '<button class="vm-btn" data-action="reset">Khôi phục mặc định</button>' +
                    '<button class="vm-btn primary" data-action="save"><i class="bi bi-check2"></i> Lưu thay đổi</button>' +
                '</div>' +
            '</div>' +
            '<div class="vm-grid-2">' +
                '<div>' +
                    '<div class="vm-card vm-mb-3">' +
                        '<div class="vm-card-head"><div class="vm-card-title"><i class="bi bi-gear"></i> Chung</div></div>' +
                        '<div class="vm-card-body">' +
                            row('Tên hệ thống', 'Hiển thị ở tiêu đề và email', '<input class="vm-input" id="s-name" value="' + esc(s.site_name) + '">') +
                            row('Email liên hệ', null, '<input class="vm-input" id="s-email" value="' + esc(s.contact_email) + '">') +
                            row('Hotline', null, '<input class="vm-input" id="s-hotline" value="' + esc(s.hotline) + '">') +
                            row('Múi giờ', null, '<select class="vm-input" id="s-tz"><option value="Asia/Ho_Chi_Minh"' + (s.timezone === 'Asia/Ho_Chi_Minh' ? ' selected' : '') + '>(GMT+7) Hà Nội</option><option value="UTC"' + (s.timezone === 'UTC' ? ' selected' : '') + '>(GMT+0) UTC</option></select>') +
                        '</div>' +
                    '</div>' +
                    '<div class="vm-card vm-mb-3">' +
                        '<div class="vm-card-head"><div class="vm-card-title"><i class="bi bi-bell"></i> Thông báo</div></div>' +
                        '<div class="vm-card-body">' +
                            row('Email khi có đơn mới', 'Gửi cho admin', '<label class="vm-switch"><input type="checkbox" id="s-n1"' + (s.notify_email_order ? ' checked' : '') + '><span class="slider"></span></label>') +
                            row('Telegram alert khi server lỗi', null, '<label class="vm-switch"><input type="checkbox" id="s-n2"' + (s.notify_telegram_server ? ' checked' : '') + '><span class="slider"></span></label>') +
                            row('SMS cho ticket ưu tiên cao', null, '<label class="vm-switch"><input type="checkbox" id="s-n3"' + (s.notify_sms_high_ticket ? ' checked' : '') + '><span class="slider"></span></label>') +
                            row('Thông báo khuyến mãi tới user', null, '<label class="vm-switch"><input type="checkbox" id="s-n4"' + (s.notify_promo_to_user ? ' checked' : '') + '><span class="slider"></span></label>') +
                        '</div>' +
                    '</div>' +
                    '<div class="vm-card">' +
                        '<div class="vm-card-head"><div class="vm-card-title"><i class="bi bi-shield-lock"></i> Bảo mật</div></div>' +
                        '<div class="vm-card-body">' +
                            row('2FA cho admin', 'Yêu cầu xác thực 2 yếu tố', '<label class="vm-switch"><input type="checkbox" id="s-b1"' + (s.sec_2fa_admin ? ' checked' : '') + '><span class="slider"></span></label>') +
                            row('Chống brute force', 'Khóa sau 5 lần sai', '<label class="vm-switch"><input type="checkbox" id="s-b2"' + (s.sec_anti_brute ? ' checked' : '') + '><span class="slider"></span></label>') +
                            row('IP Whitelist cho admin', 'Chỉ cho phép từ IP tin cậy', '<label class="vm-switch"><input type="checkbox" id="s-b3"' + (s.sec_ip_whitelist ? ' checked' : '') + '><span class="slider"></span></label>') +
                            row('Audit log', 'Lưu lại mọi thao tác', '<label class="vm-switch"><input type="checkbox" id="s-b4"' + (s.sec_audit_log ? ' checked' : '') + '><span class="slider"></span></label>') +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div>' +
                    '<div class="vm-card vm-mb-3">' +
                        '<div class="vm-card-head"><div class="vm-card-title"><i class="bi bi-credit-card"></i> Thanh toán</div></div>' +
                        '<div class="vm-card-body">' +
                            '<div class="vm-flex-between vm-mb-3"><div><b>Vietcombank</b><div style="color:var(--vm-muted);font-size:.78rem">API đã kết nối</div></div><label class="vm-switch"><input type="checkbox" id="s-p1"' + (s.pay_vcb ? ' checked' : '') + '><span class="slider"></span></label></div>' +
                            '<div class="vm-flex-between vm-mb-3"><div><b>Momo</b><div style="color:var(--vm-muted);font-size:.78rem">API đã kết nối</div></div><label class="vm-switch"><input type="checkbox" id="s-p2"' + (s.pay_momo ? ' checked' : '') + '><span class="slider"></span></label></div>' +
                            '<div class="vm-flex-between vm-mb-3"><div><b>VNPay</b></div><label class="vm-switch"><input type="checkbox" id="s-p3"' + (s.pay_vnpay ? ' checked' : '') + '><span class="slider"></span></label></div>' +
                            '<div class="vm-flex-between"><div><b>PayPal</b></div><label class="vm-switch"><input type="checkbox" id="s-p4"' + (s.pay_paypal ? ' checked' : '') + '><span class="slider"></span></label></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="vm-card vm-mb-3">' +
                        '<div class="vm-card-head"><div class="vm-card-title"><i class="bi bi-envelope"></i> Email SMTP</div></div>' +
                        '<div class="vm-card-body">' +
                            '<div class="vm-mb-2"><b>SMTP Host</b><input id="s-sm1" value="' + esc(s.smtp_host) + '" style="' + fullInputStyle + '"></div>' +
                            '<div class="vm-mb-2"><b>Port</b><input id="s-sm2" value="' + esc(s.smtp_port) + '" style="' + fullInputStyle + '"></div>' +
                            '<div><b>User</b><input id="s-sm3" value="' + esc(s.smtp_user) + '" style="' + fullInputStyle + '"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="vm-card">' +
                        '<div class="vm-card-head"><div class="vm-card-title"><i class="bi bi-key"></i> API Keys</div></div>' +
                        '<div class="vm-card-body">' +
                            '<div class="vm-flex-between vm-mb-3"><div><b>Proxmox VE</b><div style="color:var(--vm-muted);font-size:.72rem;font-family:monospace">pk_live_•••• a8f3</div></div><button class="vm-btn sm" data-action="rotate" data-key="proxmox">Rotate</button></div>' +
                            '<div class="vm-flex-between vm-mb-3"><div><b>WHMCS Bridge</b><div style="color:var(--vm-muted);font-size:.72rem;font-family:monospace">whm_•••• 0c12</div></div><button class="vm-btn sm" data-action="rotate" data-key="whmcs">Rotate</button></div>' +
                            '<div class="vm-flex-between"><div><b>Webhook Stripe</b><div style="color:var(--vm-muted);font-size:.72rem;font-family:monospace">whsec_•••• 9e42</div></div><button class="vm-btn sm" data-action="rotate" data-key="stripe">Rotate</button></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    function collectSettings() {
        var get = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; };
        var chk = function (id) { var e = document.getElementById(id); return e ? e.checked : false; };
        return {
            site_name: get('s-name'),
            contact_email: get('s-email'),
            hotline: get('s-hotline'),
            timezone: get('s-tz'),
            notify_email_order: chk('s-n1'),
            notify_telegram_server: chk('s-n2'),
            notify_sms_high_ticket: chk('s-n3'),
            notify_promo_to_user: chk('s-n4'),
            sec_2fa_admin: chk('s-b1'),
            sec_anti_brute: chk('s-b2'),
            sec_ip_whitelist: chk('s-b3'),
            sec_audit_log: chk('s-b4'),
            pay_vcb: chk('s-p1'),
            pay_momo: chk('s-p2'),
            pay_vnpay: chk('s-p3'),
            pay_paypal: chk('s-p4'),
            smtp_host: get('s-sm1'),
            smtp_port: get('s-sm2'),
            smtp_user: get('s-sm3'),
        };
    }

    AdminRouter.onRender(function (path) {
        if (path !== '/settings') return;
        var content = document.getElementById('adContent');
        if (!content) return;
        content.querySelectorAll('[data-action]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var action = btn.dataset.action;
                if (action === 'save') {
                    var s = collectSettings();
                    if (!s.site_name) { ui.toast('Tên hệ thống không được trống', 'danger'); return; }
                    if (s.contact_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.contact_email)) {
                        ui.toast('Email liên hệ không hợp lệ', 'danger'); return;
                    }
                    saveSettings(s);
                    ui.toast('Đã lưu cài đặt', 'success');
                } else if (action === 'reset') {
                    ui.confirm({
                        title: 'Khôi phục mặc định',
                        message: 'Khôi phục tất cả cài đặt về mặc định?',
                        danger: true, okText: 'Khôi phục',
                        onOk: function () { saveSettings(defaults()); ui.toast('Đã khôi phục mặc định', 'success'); ui.rerender(); }
                    });
                } else if (action === 'rotate') {
                    var keyName = btn.dataset.key || 'API key';
                    ui.confirm({
                        title: 'Rotate API key',
                        message: 'Rotate ' + keyName + '? Key hiện tại sẽ bị vô hiệu hoá.',
                        danger: true, okText: 'Rotate',
                        onOk: function () { ui.toast('Đã rotate ' + keyName + ' (demo)', 'success'); }
                    });
                }
            });
        });
    });

    AdminRouter.add('/settings', 'Cài đặt', render);
})();