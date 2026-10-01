/* =========================================================
   pages/order.js — Đặt hàng
========================================================= */
'use strict';

(function () {
    const OrderPage = {
        state: { planSlug: null, osId: null, cycle: 12, hostname: '', coupon: '' },

        quote() {
            const plan = DB.findWhere('plans', p => p.slug === this.state.planSlug);
            if (!plan) return null;
            const price = DB.findWhere('plan_prices', pr => pr.plan_id === plan.id && pr.cycle_months === this.state.cycle);
            if (!price) return null;
            let total = price.price;
            let discount = 0;
            let couponInfo = null;
            if (this.state.coupon) {
                const cp = DB.findWhere('coupons', c => c.code === this.state.coupon && c.is_active);
                if (cp) {
                    if (cp.type === 'percent') discount = Math.floor(total * cp.value / 100);
                    else discount = cp.value;
                    if (discount > total) discount = total;
                    total -= discount;
                    couponInfo = cp;
                }
            }
            return { plan, price, total, discount, couponInfo };
        },

        render(query) {
            this.state.planSlug = query.plan || 'r1';
            this.state.osId    = Number(query.os) || null;
            this.state.cycle   = Number(query.cycle) || 12;
            this.state.hostname = query.hostname || '';
            this.state.coupon  = query.coupon || '';

            const user = Session.current();
            if (!user) {
                Flash.show('Vui lòng đăng nhập để đặt hàng', 'warning');
                Router.go('/login');
                return renderLayout('<div class="container" style="padding:60px 0"></div>');
            }

            const plan = DB.findWhere('plans', p => p.slug === this.state.planSlug);
            if (!plan) {
                Flash.show('Gói không tồn tại', 'danger');
                Router.go('/pricing');
                return renderLayout('<div class="container"></div>');
            }

            const plans = DB.all('plans').filter(p => p.is_active).sort((a, b) => a.sort_order - b.sort_order);
            const planOptions = plans.map(p =>
                '<button type="button" class="option-pill' + (p.slug === this.state.planSlug ? ' active' : '') + '" ' +
                'data-action="order-pick-plan" data-slug="' + escapeHTML(p.slug) + '">' +
                '<div class="t">' + escapeHTML(p.name) + '</div>' +
                '<div class="p">' + p.cpu_cores + 'C/' + p.ram_gb + 'GB/' + p.disk_gb + 'GB</div>' +
                '</button>'
            ).join('');

            const prices = DB.all('plan_prices').filter(pr => pr.plan_id === plan.id);
            const cycleOptions = prices.map(pr =>
                '<button type="button" class="option-pill' + (pr.cycle_months === this.state.cycle ? ' active' : '') + '" ' +
                'data-action="order-pick-cycle" data-cycle="' + pr.cycle_months + '">' +
                '<div class="t">' + pr.cycle_months + ' tháng</div>' +
                '<div class="p">' + fmtVND(pr.price) + '</div>' +
                '</button>'
            ).join('');

            let osOptions = '';
            const allOs = DB.all('os_images').filter(o => o.is_active);
            const visibleOs = allOs.filter(o => plan.allow_windows || o.family !== 'windows');
            osOptions = visibleOs.map(o =>
                '<button type="button" class="option-pill' + (o.id === this.state.osId ? ' active' : '') + '" ' +
                'data-action="order-pick-os" data-id="' + o.id + '">' +
                '<i class="bi bi-' + escapeHTML(o.icon) + '" style="font-size:1.4rem"></i>' +
                '<div class="t">' + escapeHTML(o.name) + '</div>' +
                '</button>'
            ).join('');
            if (!this.state.osId && visibleOs.length) this.state.osId = visibleOs[0].id;

            const q = this.quote();
            const summary = q ? (
                '<div class="summary-line"><span>' + escapeHTML(q.plan.name) + ' (' + q.price.cycle_months + ' tháng)</span>' +
                '<span>' + fmtVND(q.plan ? q.price.price : 0) + '</span></div>' +
                (q.discount > 0
                    ? '<div class="summary-line" style="color:var(--c-success)"><span>Giảm giá (' + escapeHTML(this.state.coupon) + ')</span><span>-' + fmtVND(q.discount) + '</span></div>'
                    : '') +
                '<div class="summary-line total"><span>Tổng cộng</span><span>' + fmtVND(q.total) + '</span></div>'
            ) : '<div class="summary-line"><span>Vui lòng chọn cấu hình</span></div>';

            const html =
                '<section class="section">' +
                    '<div class="container">' +
                        '<div class="section-head" style="text-align:left">' +
                            '<h2>Đặt dịch vụ</h2>' +
                            '<p>Cấu hình VPS theo nhu cầu của bạn</p>' +
                        '</div>' +
                        '<div class="order-grid">' +
                            '<div>' +
                                '<div class="card-surface" style="margin-bottom:20px">' +
                                    '<h3>1. Chọn gói</h3>' +
                                    '<div class="option-grid">' + planOptions + '</div>' +
                                '</div>' +
                                '<div class="card-surface" style="margin-bottom:20px">' +
                                    '<h3>2. Hệ điều hành</h3>' +
                                    '<div class="option-grid">' + osOptions + '</div>' +
                                '</div>' +
                                '<div class="card-surface" style="margin-bottom:20px">' +
                                    '<h3>3. Chu kỳ thanh toán</h3>' +
                                    '<div class="option-grid">' + cycleOptions + '</div>' +
                                '</div>' +
                                '<div class="card-surface" style="margin-bottom:20px">' +
                                    '<h3>4. Hostname (tuỳ chọn)</h3>' +
                                    '<input type="text" name="hostname" class="form-control" value="' + escapeHTML(this.state.hostname) + '" placeholder="vd: server.example.com" data-change="order-change-host">' +
                                '</div>' +
                                '<div class="card-surface">' +
                                    '<h3>5. Mã giảm giá</h3>' +
                                    '<div style="display:flex;gap:8px">' +
                                        '<input type="text" name="coupon" class="form-control" value="' + escapeHTML(this.state.coupon) + '" placeholder="VD: GIAM10">' +
                                        '<button class="btn btn-outline" data-action="order-apply-coupon">Áp dụng</button>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            '<aside class="card-surface" style="position:sticky;top:90px">' +
                                '<h3>Tóm tắt đơn hàng</h3>' +
                                summary +
                                '<button class="btn btn-primary" style="width:100%;margin-top:16px" data-action="order-submit">Thanh toán</button>' +
                                '<p style="font-size:.8rem;color:var(--c-muted);margin-top:10px;text-align:center">Bằng việc thanh toán, bạn đồng ý với điều khoản sử dụng.</p>' +
                            '</aside>' +
                        '</div>' +
                    '</div>' +
                '</section>';

            return renderLayout(html);
        },

        pickPlan(el) { this._updateQuery({ plan: el.dataset.slug }); },
        pickCycle(el) { this._updateQuery({ cycle: el.dataset.cycle }); },
        pickOs(el) { this._updateQuery({ os: el.dataset.id }); },
        changeHost(input) { this._updateQuery({ hostname: input.value }, false); },
        applyCoupon() {
            const v = document.querySelector('input[name="coupon"]').value.trim();
            this._updateQuery({ coupon: v });
        },

        _updateQuery(patch, reRender) {
            const q = Object.assign({}, Router.resolve().query, patch);
            const usp = new URLSearchParams();
            Object.entries(q).forEach(([k, v]) => { if (v !== '' && v != null) usp.set(k, v); });
            const qs = usp.toString();
            Router.go('/order' + (qs ? '?' + qs : ''));
        },

        submit() {
            const user = Session.current();
            const q = this.quote();
            if (!q) return Flash.show('Cấu hình không hợp lệ', 'danger');
            if (user.balance < q.total) {
                Flash.show('Số dư không đủ (hiện có ' + fmtVND(user.balance) + ')', 'danger');
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

                    data.orders.push({
                        id: orderId, user_id: user.id, plan_id: q.plan.id, os_id: this.state.osId,
                        cycle_months: q.price.cycle_months, hostname: this.state.hostname || ('vps-' + orderId + '.local'),
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
                    });
                    const os = data.os_images.find(o => o.id === this.state.osId);
                    data.servers.push({
                        id: serverId, order_id: orderId, user_id: user.id,
                        hostname: this.state.hostname || ('vps-' + orderId + '.local'),
                        ip: ipRow.ip_address, plan_slug: q.plan.slug, os_name: os ? os.name : 'Unknown',
                        cpu: q.plan.cpu_cores, ram: q.plan.ram_gb, disk: q.plan.disk_gb,
                        status: 'running', created_at: now, due_at: due,
                    });
                    if (q.couponInfo) q.couponInfo.used_count = (q.couponInfo.used_count || 0) + 1;
                    const u = data.users.find(x => x.id === user.id);
                    u.balance -= q.total;
                });
                Flash.show('Đặt hàng thành công! VPS đang được khởi tạo.', 'success');
                Router.go('/dashboard');
            } catch (e) {
                Flash.show(e.message, 'danger');
            }
        },
    };

    Router.add('GET', '/order', ({ query }) => OrderPage.render(query));

    window.App = window.App || {};
    window.App['order-pick-plan']   = (el) => OrderPage.pickPlan(el);
    window.App['order-pick-cycle']  = (el) => OrderPage.pickCycle(el);
    window.App['order-pick-os']     = (el) => OrderPage.pickOs(el);
    window.App['order-change-host'] = (inp) => OrderPage.changeHost(inp);
    window.App['order-apply-coupon'] = () => OrderPage.applyCoupon();
    window.App['order-submit']      = () => OrderPage.submit();
})();
