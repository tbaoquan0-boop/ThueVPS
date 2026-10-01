/* =========================================================
   db.js — State layer (localStorage)
========================================================= */
'use strict';

const DB_KEY = 'vpssieutoc_db_v1';

const DEFAULT_DATA = {
    users: [
        { id: 1, name: 'Admin',      email: 'admin@vps.test', password: 'admin123', phone: '0900000000', role: 'admin',   status: 'active', balance: 0,           created_at: '2025-01-01' },
        { id: 2, name: 'Khách Demo', email: 'khach@vps.test', password: 'khach123', phone: '0911111111', role: 'customer', status: 'active', balance: 1_000_000,  created_at: '2025-03-01' },
    ],
    plans: [
        { id: 1, slug: 'r1', name: 'R1 — Khởi đầu',   cpu_cores: 2, ram_gb: 2,  disk_gb: 30,  bandwidth_mbps: 100, ipv4_count: 1, allow_windows: false, is_active: true, sort_order: 1, banner: 'r',    desc: 'Phù hợp website nhỏ, blog cá nhân, dev/test.' },
        { id: 2, slug: 'r2', name: 'R2 — Cơ bản',     cpu_cores: 2, ram_gb: 4,  disk_gb: 35,  bandwidth_mbps: 100, ipv4_count: 1, allow_windows: true,  is_active: true, sort_order: 2, banner: 'r',    desc: 'Phù hợp website vừa, API, mail server.' },
        { id: 3, slug: 'r3', name: 'R3 — Phổ thông',  cpu_cores: 4, ram_gb: 8,  disk_gb: 50,  bandwidth_mbps: 100, ipv4_count: 1, allow_windows: true,  is_active: true, sort_order: 3, banner: 'epyc', desc: 'Phù hợp web bán hàng, CRM, nhiều user.' },
        { id: 4, slug: 'r4', name: 'R4 — Nâng cao',   cpu_cores: 6, ram_gb: 12, disk_gb: 80,  bandwidth_mbps: 100, ipv4_count: 1, allow_windows: true,  is_active: true, sort_order: 4, banner: 'gold', desc: 'Phù hợp web lớn, e-commerce, game server.' },
        { id: 5, slug: 'r5', name: 'R5 — Cao cức',    cpu_cores: 8, ram_gb: 16, disk_gb: 100, bandwidth_mbps: 100, ipv4_count: 1, allow_windows: true,  is_active: true, sort_order: 5, banner: 'gold', desc: 'Phù hợp ứng dụng nặng, AI/ML, big data.' },
    ],
    plan_prices: [
        { plan_id: 1, cycle_months: 3,  price: 199_750 },
        { plan_id: 1, cycle_months: 6,  price: 399_500 },
        { plan_id: 1, cycle_months: 12, price: 799_000 },
        { plan_id: 1, cycle_months: 24, price: 1_518_000 },
        { plan_id: 1, cycle_months: 36, price: 2_157_000 },
        { plan_id: 2, cycle_months: 3,  price: 249_750 },
        { plan_id: 2, cycle_months: 6,  price: 499_500 },
        { plan_id: 2, cycle_months: 12, price: 999_000 },
        { plan_id: 2, cycle_months: 24, price: 1_898_000 },
        { plan_id: 2, cycle_months: 36, price: 2_697_000 },
        { plan_id: 3, cycle_months: 1,  price: 208_250 },
        { plan_id: 3, cycle_months: 6,  price: 1_249_500 },
        { plan_id: 3, cycle_months: 12, price: 2_499_000 },
        { plan_id: 3, cycle_months: 24, price: 4_748_000 },
        { plan_id: 3, cycle_months: 36, price: 6_747_000 },
        { plan_id: 4, cycle_months: 1,  price: 299_917 },
        { plan_id: 4, cycle_months: 6,  price: 1_799_500 },
        { plan_id: 4, cycle_months: 12, price: 3_599_000 },
        { plan_id: 4, cycle_months: 24, price: 6_838_000 },
        { plan_id: 4, cycle_months: 36, price: 9_717_000 },
        { plan_id: 5, cycle_months: 1,  price: 416_583 },
        { plan_id: 5, cycle_months: 6,  price: 2_499_500 },
        { plan_id: 5, cycle_months: 12, price: 4_999_000 },
        { plan_id: 5, cycle_months: 24, price: 8_998_000 },
        { plan_id: 5, cycle_months: 36, price: 13_497_000 },
    ],
    os_images: [
        { id: 1, name: 'Ubuntu 22.04 LTS',    family: 'linux',   is_active: true, icon: 'ubuntu' },
        { id: 2, name: 'Ubuntu 24.04 LTS',    family: 'linux',   is_active: true, icon: 'ubuntu' },
        { id: 3, name: 'Debian 12',           family: 'linux',   is_active: true, icon: 'debian' },
        { id: 4, name: 'AlmaLinux 9',         family: 'linux',   is_active: true, icon: 'linux'  },
        { id: 5, name: 'Windows Server 2019', family: 'windows', is_active: true, icon: 'windows'},
        { id: 6, name: 'Windows Server 2022', family: 'windows', is_active: true, icon: 'windows'},
    ],
    coupons: [
        { id: 1, code: 'GIAM10',  type: 'percent', value: 10,    max_uses: null, used_count: 0, expires_at: '2027-12-31', is_active: true },
        { id: 2, code: 'GIAM50K', type: 'fixed',   value: 50_000, max_uses: 20,   used_count: 0, expires_at: '2027-12-31', is_active: true },
    ],
    ip_pool: [],
    orders: [],
    invoices: [],
    transactions: [],
    servers: [],
    backups: [],
    tickets: [],
    ticket_replies: [],
    counters: { order: 0, invoice: 0, transaction: 0, server: 0, backup: 0, ticket: 0, reply: 0, ip: 0, user: 2 },
};

const DB = {
    load() {
        const raw = localStorage.getItem(DB_KEY);
        if (!raw) {
            const fresh = JSON.parse(JSON.stringify(DEFAULT_DATA));
            for (let i = 11; i <= 60; i++) {
                fresh.ip_pool.push({ id: ++fresh.counters.ip, ip_address: '10.10.0.' + i, is_used: false });
            }
            localStorage.setItem(DB_KEY, JSON.stringify(fresh));
            return fresh;
        }
        return JSON.parse(raw);
    },
    save(data) { localStorage.setItem(DB_KEY, JSON.stringify(data)); },
    reset() { localStorage.removeItem(DB_KEY); return DB.load(); },

    all(table)   { return DB.load()[table] || []; },
    find(table, id) { return DB.all(table).find(r => r.id === Number(id)); },
    findWhere(table, fn) { return DB.all(table).find(fn); },
    filter(table, fn) { return DB.all(table).filter(fn); },

    insert(table, row) {
        const data = DB.load();
        data[table].push(row);
        DB.save(data);
        return row;
    },
    update(table, id, patch) {
        const data = DB.load();
        const i = data[table].findIndex(r => r.id === Number(id));
        if (i < 0) return null;
        data[table][i] = Object.assign({}, data[table][i], patch);
        DB.save(data);
        return data[table][i];
    },
    remove(table, id) {
        const data = DB.load();
        const i = data[table].findIndex(r => r.id === Number(id));
        if (i < 0) return false;
        data[table].splice(i, 1);
        DB.save(data);
        return true;
    },

    nextId(counterKey) {
        const data = DB.load();
        data.counters[counterKey] = (data.counters[counterKey] || 0) + 1;
        DB.save(data);
        return data.counters[counterKey];
    },

    transaction(fn) {
        const before = localStorage.getItem(DB_KEY);
        try {
            const data = JSON.parse(before);
            const result = fn(data);
            DB.save(data);
            return result;
        } catch (e) {
            localStorage.setItem(DB_KEY, before);
            throw e;
        }
    },
};

const SESSION_KEY = 'vpssieutoc_session_v1';

const Session = {
    current() {
        const id = localStorage.getItem(SESSION_KEY);
        if (!id) return null;
        return DB.find('users', id);
    },
    login(email, password) {
        const user = DB.findWhere('users', u => u.email === email && u.password === password);
        if (!user) throw new Error('Email hoặc mật khẩu không đúng');
        if (user.status === 'locked') throw new Error('Tài khoản đã bị khoá');
        localStorage.setItem(SESSION_KEY, String(user.id));
        return user;
    },
    logout() { localStorage.removeItem(SESSION_KEY); },
    register({ name, email, password, phone }) {
        if (DB.findWhere('users', u => u.email === email)) {
            throw new Error('Email đã được sử dụng');
        }
        const newId = DB.nextId('user');
        const user = {
            id: newId,
            name, email, password, phone: phone || '',
            role: 'customer', status: 'active',
            balance: 0, created_at: new Date().toISOString(),
        };
        DB.insert('users', user);
        localStorage.setItem(SESSION_KEY, String(user.id));
        return user;
    },
};

window.DB = DB;
window.Session = Session;
