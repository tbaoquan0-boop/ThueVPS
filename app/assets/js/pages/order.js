/* =========================================================
   pages/order.js — Đặt dịch vụ
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
            this.state.cycle   = query.cycle && [1,3,6,24,36].includes(Number(query.cycle)) ? Number(query.cycle) : 12;
            if (query.cycle === '12') this.state.cycle = 12;
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
            const osOptions = visibleOs.map(o =>
                '<button type="button" class="pill ' + (o.id === this.state.osId ? 'on' : '') + '" ' +
                'data-action="order-pick-os" data-id="' + o.id + '">' +
                '<div class="t">' + escapeHTML(o.name) + '</div>' +
                (o.desc ? '<div class="p">' + escapeHTML(o.desc) + '</div>' : '') +
                '</button>'
            ).join('');
            if (!this.state.osId && visibleOs.length) this.state.osId = visibleOs[0].id;

            const q = this.quote();
            const summary = q ? (
                    '<div class="sum-line"><span>' + escapeHTML(q.plan.name) + ' × ' + q.price.cycle_months + ' tháng</span><span>' + fmtVND(q.price.price) + '</span></div>' +
                    (q.discount > 0
                        ? '<div class="sum-line" style="color:#047857"><span><i class="bi bi-tag-fill"></i> Giảm (' + escapeHTML(this.state.coupon.toUpperCase()) + ')</span><span>-' + fmtVND(q.discount) + '</span></div>'
                        : '') +
                    (q.couponError
                        ? '<div class="sum-line" style="color:#b91c1c;font-size:.85rem"><span><i class="bi bi-exclamation-triangle"></i> ' + escapeHTML(q.couponError) + '</span></div>'
                        : '') +
                    '<div class="sum-line total"><span>Tổng</span><span>' + fmtVND(q.total) + '</span></div>' +
                    '<div class="sum-line" style="font-size:.82rem;color:var(--muted)"><span>Số dư ví</span><span>' + fmtVND(user.balance) + '</span></div>' +
                    (q.total > user.balance
                        ? '<div class="sum-line" style="color:#b91c1c;font-size:.85rem"><span><i class="bi bi-exclamation-triangle"></i> Không đủ số dư, thiếu ' + fmtVND(q.total - user.balance) + '</span></div>'
                        : '')
                ) : '<div class="sum-line"><span>Vui lòng chọn cấu hình</span></div>';

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
                                '<div class="options">' + planOptions + '</div>' +
                            '</div>' +
                            '<div class="panel">' +
                                '<div class="panel-head"><h3>2. Hệ điều hành</h3></div>' +
                                '<div class="options">' + osOptions + '</div>' +
                            '</div>' +
                            '<div class="panel">' +
                                '<div class="panel-head"><h3>3. Chu kỳ thanh toán</h3></div>' +
                                '<div class="options">' + cycleOptions + '</div>' +
                            '</div>' +
                            '<div class="panel">' +
                                '<div class="panel-head"><h3>4. Hostname</h3></div>' +
                                '<input type="text" name="hostname" class="input" value="' + escapeHTML(this.state.hostname) + '" placeholder="vd: server.example.com" data-change="order-change-host">' +
                                '<p style="color:var(--muted);font-size:.82rem;margin:8px 0 0">Để trống sẽ tự động tạo.</p>' +
                            '</div>' +
                            '<div class="panel">' +
                                '<div class="panel-head"><h3>5. Mã giảm giá (tuỳ chọn)</h3></div>' +
                                '<div style="display:flex;gap:8px">' +
                                    '<input type="text" name="coupon" class="input" value="' + escapeHTML(this.state.coupon) + '" placeholder="VD: GIAM10" data-change="order-change-coupon">' +
                                    '<button class="btn btn-line" data-action="order-apply-coupon">Áp dụng</button>' +
                                '</div>' +
                                '<p style="color:var(--muted);font-size:.82rem;margin:8px 0 0">Thử: <b style="color:var(--ink)">GIAM10</b>, <b style="color:var(--ink)">WELCOME</b>, <b style="color:var(--ink)">STUDENT</b></p>' +
                            '</div>' +
                        '</div>' +
                        '<aside class="panel" style="position:sticky;top:90px">' +
                            '<div class="panel-head"><h3>Tóm tắt</h3></div>' +
                            summary +
                            '<button class="btn btn-solid btn-block btn-lg" style="margin-top:20px" data-action="order-submit">Thanh toán ' + (q && q.total != null ? fmtVND(q.total) : '') + '</button>' +
                            '<p style="font-size:.82rem;color:var(--muted);margin-top:12px;text-align:center">Bằng việc thanh toán, bạn đồng ý với điều khoản sử dụng.</p>' +
                        '</aside>' +
                    '</div>' +
                '</div>';

            return renderLayout(html);
        },

        pickPlan(el)   { this._updateQuery({ plan: el.dataset.slug }); },
        pickCycle(el)  { this._updateQuery({ cycle: el.dataset.cycle }); },
        pickOs(el)     { this._updateQuery({ os: el.dataset.id }); },
        changeHost(input) { this._updateQuery({ hostname: input.value }, false); },
        changeCoupon(input) { this._updateQuery({ coupon: input.value }, false); },
        applyCoupon() {
            const v = document.querySelector('input[name="coupon"]').value.trim();
            this._updateQuery({ coupon: v });
        },

        _updateQuery(patch, navigate) {
            if (navigate === false) {
                Object.assign(this.state, patch);
                handleRoute();
                return;
            }
            const q = Object.assign({}, Router.resolve().query, patch);
            const usp = new URLSearchParams();
            Object.entries(q).forEach(([k, v]) => { if (v !== '' && v != null) usp.set(k, v); });
            Object.assign(this.state, patch);
            Router.go('/order?' + usp.toString(), { preserveScroll: true });
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
    window.App['order-change-coupon']  = (inp) => OrderPage.changeCoupon(inp);
    window.App['order-apply-coupon']   = () => OrderPage.applyCoupon();
    window.App['order-submit']         = () => OrderPage.submit();
})();