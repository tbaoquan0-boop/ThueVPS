/* =========================================================
   pages/order.js — Đặt dịch vụ (Không mất focus / giật lag)
========================================================= */
'use strict';

(function () {
    const OrderPage = {
        state: { planSlug: '', osId: null, cycle: 12, hostname: '', coupon: '' },

        quote() {
            const plan = DB.findWhere('plans', p => p.slug === this.state.planSlug);
            if (!plan) return null;
            const price = DB.findWhere('plan_prices', pr => pr.plan_id === plan.id && pr.cycle_months === this.state.cycle);
            if (!price) return null;
            let total = price.price;
            let discount = 0;
            let couponInfo = null;
            let couponError = null;
            if (this.state.coupon) {
                const cp = DB.findWhere('coupons', c => c.code === this.state.coupon.toUpperCase());
                if (!cp) couponError = 'Mã không tồn tại';
                else if (!cp.is_active) couponError = 'Mã đã bị vô hiệu';
                else if (cp.expires_at && new Date(cp.expires_at) < new Date()) couponError = 'Mã đã hết hạn';
                else if (cp.max_uses !== null && cp.used_count >= cp.max_uses) couponError = 'Mã đã hết lượt';
                else {
                    if (cp.type === 'percent') discount = Math.floor(total * cp.value / 100);
                    else discount = cp.value;
                    if (discount > total) discount = total;
                    total -= discount;
                    couponInfo = cp;
                }
            }
            return { plan, price, total, discount, couponInfo, couponError };
        },

        renderSummaryHTML() {
            const user = Session.current();
            const q = this.quote();
            if (!q) return '<div class="sum-line"><span>Vui lòng chọn cấu hình</span></div>';
            return (
                '<div class="sum-line"><span>' + escapeHTML(q.plan.name) + ' × ' + q.price.cycle_months + ' tháng</span><span>' + fmtVND(q.price.price) + '</span></div>' +
                (q.discount > 0
                    ? '<div class="sum-line" style="color:#047857;font-weight:500"><span><i class="bi bi-tag-fill"></i> Giảm (' + escapeHTML(this.state.coupon.toUpperCase()) + ')</span><span>-' + fmtVND(q.discount) + '</span></div>'
                    : '') +
                (q.couponError
                    ? '<div class="sum-line" style="color:#b91c1c;font-size:.85rem"><span><i class="bi bi-exclamation-triangle"></i> ' + escapeHTML(q.couponError) + '</span></div>'
                    : '') +
                (q.couponInfo && !q.couponError
                    ? '<div class="sum-line" style="color:#047857;font-size:.85rem"><span><i class="bi bi-check-circle-fill"></i> ' + escapeHTML(q.couponInfo.desc || 'Áp dụng thành công') + '</span></div>'
                    : '') +
                '<div class="sum-line total"><span>Tổng</span><span>' + fmtVND(q.total) + '</span></div>' +
                '<div class="sum-line" style="font-size:.82rem;color:var(--muted)"><span>Số dư ví</span><span>' + fmtVND(user ? user.balance : 0) + '</span></div>' +
                (user && q.total > user.balance
                    ? '<div class="sum-line" style="color:#b91c1c;font-size:.85rem"><span><i class="bi bi-exclamation-triangle"></i> Không đủ số dư (thiếu ' + fmtVND(q.total - user.balance) + ')</span></div>'
                    : '')
            );
        },

        _syncURL() {
            const usp = new URLSearchParams();
            if (this.state.planSlug) usp.set('plan', this.state.planSlug);
            if (this.state.osId) usp.set('os', this.state.osId);
            if (this.state.cycle) usp.set('cycle', this.state.cycle);
            if (this.state.hostname) usp.set('hostname', this.state.hostname);
            if (this.state.coupon) usp.set('coupon', this.state.coupon);
            const queryStr = usp.toString();
            const newUrl = '#/order' + (queryStr ? '?' + queryStr : '');
            window.history.replaceState(null, '', newUrl);
        },

        _updateSummaryDOM() {
            const box = document.getElementById('order-summary-box');
            if (box) box.innerHTML = this.renderSummaryHTML();
            const btn = document.getElementById('order-submit-btn');
            if (btn) {
                const q = this.quote();
                btn.textContent = 'Thanh toán ' + (q && q.total != null ? fmtVND(q.total) : '');
            }
            this._syncURL();
        },

        render(query) {
            const user = Session.current();
            if (!user) {
                Flash.show('Vui lòng đăng nhập để đặt hàng', 'warning');
                Router.go('/login');
                return renderLayout('<div class="wrap"></div>');
            }

            // Khởi tạo từ query hoặc default plan đầu tiên
            const allPlans = DB.all('plans').filter(p => p.is_active);
            this.state.planSlug = query.plan && allPlans.find(p => p.slug === query.plan) ? query.plan : (allPlans[0] ? allPlans[0].slug : '');
            this.state.osId    = query.os ? Number(query.os) : null;
            this.state.cycle   = query.cycle && [1,3,6,12,24,36].includes(Number(query.cycle)) ? Number(query.cycle) : 12;
            this.state.hostname = query.hostname || '';
            this.state.coupon  = query.coupon || '';

            const plan = DB.findWhere('plans', p => p.slug === this.state.planSlug);
            if (!plan) {
                Flash.show('Gói không tồn tại', 'danger');
                Router.go('/pricing');
                return renderLayout('<div class="wrap"></div>');
            }

            const planOptions = allPlans.map(p =>
                '<button type="button" class="pill ' + (p.slug === this.state.planSlug ? 'on' : '') + '" ' +
                'data-action="order-pick-plan" data-slug="' + escapeHTML(p.slug) + '">' +
                '<div class="t">' + escapeHTML(p.name) + '</div>' +
                '<div class="p">' + p.cpu_cores + 'C / ' + p.ram_gb + 'GB</div>' +
                '</button>'
            ).join('');

            const prices = DB.all('plan_prices').filter(pr => pr.plan_id === plan.id);
            const cycleOptions = prices.map(pr =>
                '<button type="button" class="pill ' + (pr.cycle_months === this.state.cycle ? 'on' : '') + '" ' +
                'data-action="order-pick-cycle" data-cycle="' + pr.cycle_months + '">' +
                '<div class="t">' + pr.cycle_months + ' tháng</div>' +
                '<div class="p">' + fmtVND(pr.price) + '</div>' +
                '</button>'
            ).join('');

            const allOs = DB.all('os_images').filter(o => o.is_active);
            const visibleOs = allOs.filter(o => plan.allow_windows || o.family !== 'windows');
            if (!this.state.osId && visibleOs.length) this.state.osId = visibleOs[0].id;

            const osOptions = visibleOs.map(o =>
                '<button type="button" class="pill ' + (o.id === this.state.osId ? 'on' : '') + '" ' +
                'data-action="order-pick-os" data-id="' + o.id + '">' +
                '<div class="t">' + escapeHTML(o.name) + '</div>' +
                (o.desc ? '<div class="p">' + escapeHTML(o.desc) + '</div>' : '') +
                '</button>'
            ).join('');

            const q = this.quote();
            const summary = this.renderSummaryHTML();

            const html =
                '<div class="wrap sec">' +
                    '<div class="sec-head" style="text-align:left;margin-bottom:32px">' +
                        '<span class="eyebrow" style="color:var(--accent);font-size:.82rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em">Đặt hàng</span>' +
                        '<h2 style="font-size:clamp(1.8rem,3.5vw,2.4rem);font-weight:600;letter-spacing:-0.03em;margin:8px 0 12px">Hoàn tất đơn hàng</h2>' +
                        '<p>Cấu hình và thanh toán — VPS khởi tạo trong 60 giây.</p>' +
                    '</div>' +
                    '<div class="order-grid">' +
                        '<div>' +
                            '<div class="panel">' +
                                '<div class="panel-head"><h3>1. Chọn gói</h3></div>' +
                                '<div class="options" id="order-plan-options">' + planOptions + '</div>' +
                            '</div>' +
                            '<div class="panel">' +
                                '<div class="panel-head"><h3>2. Hệ điều hành</h3></div>' +
                                '<div class="options" id="order-os-options">' + osOptions + '</div>' +
                            '</div>' +
                            '<div class="panel">' +
                                '<div class="panel-head"><h3>3. Chu kỳ thanh toán</h3></div>' +
                                '<div class="options" id="order-cycle-options">' + cycleOptions + '</div>' +
                            '</div>' +
                            '<div class="panel">' +
                                '<div class="panel-head"><h3>4. Hostname</h3></div>' +
                                '<input type="text" name="hostname" class="input" value="' + escapeHTML(this.state.hostname) + '" placeholder="vd: server.example.com" data-input="order-change-host" data-change="order-change-host" autocomplete="off">' +
                                '<p style="color:var(--muted);font-size:.82rem;margin:8px 0 0">Để trống sẽ tự động tạo.</p>' +
                            '</div>' +
                            '<div class="panel">' +
                                '<div class="panel-head"><h3>5. Mã giảm giá (tuỳ chọn)</h3></div>' +
                                '<div style="display:flex;gap:8px">' +
                                    '<input type="text" name="coupon" class="input" value="' + escapeHTML(this.state.coupon) + '" placeholder="VD: GIAM10" data-input="order-input-coupon" data-change="order-change-coupon" autocomplete="off" style="text-transform:uppercase">' +
                                    '<button type="button" class="btn btn-line" data-action="order-apply-coupon">Áp dụng</button>' +
                                '</div>' +
                                '<p style="color:var(--muted);font-size:.82rem;margin:8px 0 0">Thử: <b style="color:var(--ink)">GIAM10</b>, <b style="color:var(--ink)">WELCOME</b>, <b style="color:var(--ink)">STUDENT</b></p>' +
                            '</div>' +
                        '</div>' +
                        '<aside class="panel" style="position:sticky;top:90px">' +
                            '<div class="panel-head"><h3>Tóm tắt</h3></div>' +
                            '<div id="order-summary-box">' + summary + '</div>' +
                            '<button id="order-submit-btn" class="btn btn-solid btn-block btn-lg" style="margin-top:20px" data-action="order-submit">Thanh toán ' + (q && q.total != null ? fmtVND(q.total) : '') + '</button>' +
                            '<p style="font-size:.82rem;color:var(--muted);margin-top:12px;text-align:center">Bằng việc thanh toán, bạn đồng ý với điều khoản sử dụng.</p>' +
                        '</aside>' +
                    '</div>' +
                '</div>';

            return renderLayout(html);
        },

        pickPlan(el) {
            this.state.planSlug = el.dataset.slug;
            const plan = DB.findWhere('plans', p => p.slug === this.state.planSlug);
            if (!plan) return;

            // Highlight plan button
            document.querySelectorAll('[data-action="order-pick-plan"]').forEach(b => {
                b.classList.toggle('on', b.dataset.slug === this.state.planSlug);
            });

            // Refresh cycles
            const prices = DB.all('plan_prices').filter(pr => pr.plan_id === plan.id);
            const cycleBox = document.getElementById('order-cycle-options');
            if (cycleBox) {
                cycleBox.innerHTML = prices.map(pr =>
                    '<button type="button" class="pill ' + (pr.cycle_months === this.state.cycle ? 'on' : '') + '" ' +
                    'data-action="order-pick-cycle" data-cycle="' + pr.cycle_months + '">' +
                    '<div class="t">' + pr.cycle_months + ' tháng</div>' +
                    '<div class="p">' + fmtVND(pr.price) + '</div>' +
                    '</button>'
                ).join('');
            }

            // Refresh OS
            const allOs = DB.all('os_images').filter(o => o.is_active);
            const visibleOs = allOs.filter(o => plan.allow_windows || o.family !== 'windows');
            if (!visibleOs.find(o => o.id === this.state.osId)) {
                this.state.osId = visibleOs[0] ? visibleOs[0].id : null;
            }
            const osBox = document.getElementById('order-os-options');
            if (osBox) {
                osBox.innerHTML = visibleOs.map(o =>
                    '<button type="button" class="pill ' + (o.id === this.state.osId ? 'on' : '') + '" ' +
                    'data-action="order-pick-os" data-id="' + o.id + '">' +
                    '<div class="t">' + escapeHTML(o.name) + '</div>' +
                    (o.desc ? '<div class="p">' + escapeHTML(o.desc) + '</div>' : '') +
                    '</button>'
                ).join('');
            }

            this._updateSummaryDOM();
        },

        pickCycle(el) {
            this.state.cycle = Number(el.dataset.cycle);
            document.querySelectorAll('[data-action="order-pick-cycle"]').forEach(b => {
                b.classList.toggle('on', Number(b.dataset.cycle) === this.state.cycle);
            });
            this._updateSummaryDOM();
        },

        pickOs(el) {
            this.state.osId = Number(el.dataset.id);
            document.querySelectorAll('[data-action="order-pick-os"]').forEach(b => {
                b.classList.toggle('on', Number(b.dataset.id) === this.state.osId);
            });
            this._updateSummaryDOM();
        },

        changeHost(input) {
            this.state.hostname = input.value;
            this._syncURL();
        },

        inputCoupon(input) {
            this.state.coupon = input.value.trim().toUpperCase();
            this._updateSummaryDOM();
        },

        changeCoupon(input) {
            this.state.coupon = input.value.trim().toUpperCase();
            this._updateSummaryDOM();
        },

        applyCoupon() {
            const inp = document.querySelector('input[name="coupon"]');
            if (inp) this.state.coupon = inp.value.trim().toUpperCase();
            this._updateSummaryDOM();
            const q = this.quote();
            if (q && q.couponError) {
                Flash.show(q.couponError, 'danger');
            } else if (q && q.couponInfo) {
                Flash.show('Áp dụng mã ' + q.couponInfo.code + ' thành công (-' + fmtVND(q.discount) + ')', 'success');
            }
        },

        submit() {
            const user = Session.current();
            const q = this.quote();
            if (!q) return Flash.show('Cấu hình không hợp lệ', 'danger');
            if (q.couponError) return Flash.show(q.couponError, 'danger');
            if (user.balance < q.total) {
                Flash.show('Số dư không đủ (hiện có ' + fmtVND(user.balance) + ', cần ' + fmtVND(q.total) + ')', 'danger');
                return;
            }
            try {
                DB.transaction((data) => {
                    const orderId = (data.counters.order = (data.counters.order || 0) + 1);
                    const invoiceId = (data.counters.invoice = (data.counters.invoice || 0) + 1);
                    const txId = (data.counters.transaction = (data.counters.transaction || 0) + 1);
                    const serverId = (data.counters.server = (data.counters.server || 0) + 1);
                    const ipRow = data.ip_pool.find(p => !p.is_used);
                    if (!ipRow) throw new Error('Hết IP khả dụng');
                    ipRow.is_used = true;

                    const now = new Date().toISOString();
                    const due = addMonths(now, q.price.cycle_months);
                    const hostname = (this.state.hostname || ('vps-' + orderId + '.local')).toLowerCase().replace(/[^a-z0-9.-]/g, '');

                    data.orders.push({
                        id: orderId, user_id: user.id, plan_id: q.plan.id, os_id: this.state.osId,
                        cycle_months: q.price.cycle_months,
                        hostname: hostname,
                        coupon_code: q.couponInfo ? q.couponInfo.code : null,
                        total: q.total, status: 'paid', created_at: now,
                    });
                    data.invoices.push({
                        id: invoiceId, order_id: orderId, user_id: user.id,
                        amount: q.total, status: 'paid', issued_at: now, due_at: due,
                    });
                    data.transactions.push({
                        id: txId, user_id: user.id, type: 'order',
                        amount: -q.total, balance_after: user.balance - q.total,
                        ref_id: orderId, created_at: now,
                        note: 'Mua ' + q.plan.name,
                    });
                    const os = data.os_images.find(o => o.id === this.state.osId);
                    data.servers.push({
                        id: serverId, order_id: orderId, user_id: user.id,
                        hostname: hostname,
                        ip: ipRow.ip_address, plan_slug: q.plan.slug,
                        os_name: os ? os.name : 'Unknown',
                        cpu: q.plan.cpu_cores, ram: q.plan.ram_gb, disk: q.plan.disk_gb,
                        status: 'running', created_at: now, due_at: due,
                    });
                    if (q.couponInfo) q.couponInfo.used_count = (q.couponInfo.used_count || 0) + 1;
                    const u = data.users.find(x => x.id === user.id);
                    u.balance -= q.total;
                });
                Flash.show('Đặt hàng thành công! VPS #' + q.plan.name + ' đang được khởi tạo.', 'success');
                Router.go('/dashboard?view=services');
            } catch (e) { Flash.show(e.message, 'danger'); }
        },
    };

    Router.add('GET', '/order', ({ query }) => OrderPage.render(query));

    window.App = window.App || {};
    window.App['order-pick-plan']      = (el) => OrderPage.pickPlan(el);
    window.App['order-pick-cycle']     = (el) => OrderPage.pickCycle(el);
    window.App['order-pick-os']        = (el) => OrderPage.pickOs(el);
    window.App['order-change-host']    = (inp) => OrderPage.changeHost(inp);
    window.App['order-input-coupon']   = (inp) => OrderPage.inputCoupon(inp);
    window.App['order-change-coupon']  = (inp) => OrderPage.changeCoupon(inp);
    window.App['order-apply-coupon']   = () => OrderPage.applyCoupon();
    window.App['order-submit']         = () => OrderPage.submit();
})();