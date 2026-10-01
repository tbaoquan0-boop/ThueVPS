/* =========================================================
   db.js — State layer (localStorage)
========================================================= */
'use strict';

const DB_KEY = 'vpssieutoc_db_v4';

const DEFAULT_DATA = {
    users: [
        { id: 1, name: 'Admin',      email: 'admin@vps.test',  password: 'admin123', phone: '0900000000', role: 'admin',   status: 'active', balance: 0,           created_at: '2025-01-01' },
        { id: 2, name: 'Khách Demo', email: 'khach@vps.test',  password: 'khach123', phone: '0911111111', role: 'customer', status: 'active', balance: 50_000_000, created_at: '2025-03-01' },
    ],
    plans: [
        // ===== Cloud VPS (Intel Xeon, NVMe, shared) =====
        { id: 1,  slug: 'cloud-s1',  name: 'Cloud S1',     cpu_cores: 2,  cpu_type: 'Intel Xeon E-2286G',  ram_gb: 2,  disk_gb: 40,   disk_type: 'NVMe SSD', bandwidth_mbps: 200,  ipv4_count: 1, allow_windows: false, category: 'cloud',    is_active: true, sort_order: 1,  icon: 'cloud-fill',          desc: 'Khởi đầu nhẹ nhàng cho blog, portfolio và các dự án cá nhân.', features: ['IPv4 riêng', 'Snapshot tự động', 'DDoS cơ bản'] },
        { id: 2,  slug: 'cloud-s2',  name: 'Cloud S2',     cpu_cores: 4,  cpu_type: 'Intel Xeon E-2388G',  ram_gb: 8,  disk_gb: 80,   disk_type: 'NVMe SSD', bandwidth_mbps: 300,  ipv4_count: 1, allow_windows: true,  category: 'cloud',    is_active: true, sort_order: 2,  icon: 'cloud-fill',          desc: 'Cân bằng cho web bán hàng, API và ứng dụng nội bộ.', features: ['Backup 7 ngày', 'Firewall nâng cao', 'Hỗ trợ 24/7'] },
        { id: 3,  slug: 'cloud-s3',  name: 'Cloud S3',     cpu_cores: 8,  cpu_type: 'Intel Xeon Gold 5317', ram_gb: 16, disk_gb: 160, disk_type: 'NVMe SSD', bandwidth_mbps: 500,  ipv4_count: 1, allow_windows: true,  category: 'cloud',    is_active: true, sort_order: 3,  icon: 'cloud-fill',          desc: 'Cho CRM, ERP, hệ thống nhiều người dùng, web traffic lớn.', features: ['Backup 14 ngày', 'Monitoring', 'API VIP'] },

        // ===== VPS AMD Ryzen 9 (tốc độ cao, gaming, dev) =====
        { id: 4,  slug: 'ryzen-r1',  name: 'Ryzen R1',     cpu_cores: 4,  cpu_type: 'AMD Ryzen 9 7950X',  ram_gb: 8,  disk_gb: 100,  disk_type: 'NVMe Gen4', bandwidth_mbps: 1000, ipv4_count: 1, allow_windows: true,  category: 'ryzen',    is_active: true, sort_order: 4,  icon: 'lightning-charge-fill', desc: 'Hiệu năng đơn nhân vượt trội cho game server, bot Discord, dev tools.', features: ['Boost 5.7GHz', 'Game panel', 'Anti-DDoS Pro'] },
        { id: 5,  slug: 'ryzen-r2',  name: 'Ryzen R2',     cpu_cores: 8,  cpu_type: 'AMD Ryzen 9 7950X',  ram_gb: 16, disk_gb: 200,  disk_type: 'NVMe Gen4', bandwidth_mbps: 1000, ipv4_count: 1, allow_windows: true,  category: 'ryzen',    is_active: true, sort_order: 5,  icon: 'lightning-charge-fill', desc: 'Sức mạnh cho trading bot, render Blender, CI/CD nặng.', features: ['2GB swap', 'Monitoring D3+', 'Free SSL wildcard'] },
        { id: 6,  slug: 'ryzen-r3',  name: 'Ryzen R3',     cpu_cores: 16, cpu_type: 'AMD Ryzen 9 7950X',  ram_gb: 32, disk_gb: 500,  disk_type: 'NVMe Gen4', bandwidth_mbps: 1000, ipv4_count: 1, allow_windows: true,  category: 'ryzen',    is_active: true, sort_order: 6,  icon: 'lightning-charge-fill', desc: 'Cho cluster game, render farm, data processing lớn.', features: ['Priority support', 'Private VLAN', 'Dedicated IPv6 /64'] },

        // ===== VPS Xung nhịp cao (5-6GHz cho đơn nhân) =====
        { id: 7,  slug: 'hf-h1',     name: 'HighFreq H1',  cpu_cores: 4,  cpu_type: 'Intel i9-13900K',     ram_gb: 8,  disk_gb: 80,   disk_type: 'NVMe SSD', bandwidth_mbps: 500,  ipv4_count: 1, allow_windows: true,  category: 'highfreq', is_active: true, sort_order: 7,  icon: 'speedometer2',         desc: 'Xung nhịp tới 5.8GHz, tối ưu cho đơn nhân — game, proxy, voice chat.', features: ['Single-core max', 'Low latency <1ms', 'Private network'] },
        { id: 8,  slug: 'hf-h2',     name: 'HighFreq H2',  cpu_cores: 8,  cpu_type: 'Intel i9-14900K',     ram_gb: 16, disk_gb: 120,  disk_type: 'NVMe SSD', bandwidth_mbps: 500,  ipv4_count: 1, allow_windows: true,  category: 'highfreq', is_active: true, sort_order: 8,  icon: 'speedometer2',         desc: 'Cho các tác vụ realtime, video call, livestream, MMO.', features: ['Boost 6.0GHz', 'Private VLAN', 'API VIP'] },
        { id: 9,  slug: 'hf-h3',     name: 'HighFreq H3',  cpu_cores: 12, cpu_type: 'Intel i9-14900KS',    ram_gb: 32, disk_gb: 240,  disk_type: 'NVMe Gen4', bandwidth_mbps: 1000, ipv4_count: 1, allow_windows: true,  category: 'highfreq', is_active: true, sort_order: 9,  icon: 'speedometer2',         desc: 'Đỉnh cao single-core, cho bot arbitrage, fintech, esports.', features: ['Boost 6.2GHz', 'Bypass DDoS', 'IPMI'] },

        // ===== VPS GPU (AI/ML, render, mining) =====
        { id: 10, slug: 'gpu-g1',    name: 'GPU G1',       cpu_cores: 8,  cpu_type: 'AMD EPYC 7402P',     ram_gb: 32, disk_gb: 200,  disk_type: 'NVMe SSD', bandwidth_mbps: 1000, ipv4_count: 1, allow_windows: true,  category: 'gpu',      is_active: true, sort_order: 10, icon: 'gpu-card',             desc: 'Card RTX A4000 — lý tưởng cho training mô hình AI cỡ vừa.', features: ['RTX A4000 16GB', 'CUDA + PyTorch', 'Jupyter ready'] },
        { id: 11, slug: 'gpu-g2',    name: 'GPU G2',       cpu_cores: 16, cpu_type: 'AMD EPYC 7543P',     ram_gb: 64, disk_gb: 500,  disk_type: 'NVMe Gen4', bandwidth_mbps: 1000, ipv4_count: 1, allow_windows: true,  category: 'gpu',      is_active: true, sort_order: 11, icon: 'gpu-card',             desc: 'RTX A5000 — render, inference, training ở quy mô lớn.', features: ['RTX A5000 24GB', '100% GPU bảo đảm', 'NVMe 7GB/s'] },
        { id: 12, slug: 'gpu-g3',    name: 'GPU G3',       cpu_cores: 24, cpu_type: 'AMD EPYC 9354P',     ram_gb: 128,disk_gb: 1000, disk_type: 'NVMe Gen4', bandwidth_mbps: 1000, ipv4_count: 1, allow_windows: true,  category: 'gpu',      is_active: true, sort_order: 12, icon: 'gpu-card',             desc: 'RTX A6000 48GB — LLM training, large-scale inference.', features: ['RTX A6000 48GB', 'Multi-GPU ready', 'PCIe 5.0'] },

        // ===== Dedicated Server (toàn quyền phần cứng) =====
        { id: 13, slug: 'dedi-d1',   name: 'Dedicated D1', cpu_cores: 16, cpu_type: 'Xeon Gold 6248R',     ram_gb: 64, disk_gb: 1000, disk_type: 'NVMe SSD',  bandwidth_mbps: 1000, ipv4_count: 1, allow_windows: true,  category: 'dedicated', is_active: true, sort_order: 13, icon: 'shield-shaded',       desc: 'Toàn quyền 1 server vật lý — yên tâm cho database lớn, e-commerce.', features: ['IPMI riêng', 'ECC RAM', 'RAID hardware'] },
        { id: 14, slug: 'dedi-d2',   name: 'Dedicated D2', cpu_cores: 32, cpu_type: 'EPYC 7543P',          ram_gb: 128,disk_gb: 2000, disk_type: 'NVMe Gen4', bandwidth_mbps: 1000, ipv4_count: 1, allow_windows: true,  category: 'dedicated', is_active: true, sort_order: 14, icon: 'shield-shaded',       desc: 'Cho cluster, virtualization, large DB, e-commerce lớn.', features: ['2 NVMe 1TB', 'IPMI', '10Gbps uplink'] },
    ],
    plan_prices: [
        // Cloud S1
        { plan_id: 1, cycle_months: 1,  price: 89_000 },
        { plan_id: 1, cycle_months: 3,  price: 249_000 },
        { plan_id: 1, cycle_months: 6,  price: 459_000 },
        { plan_id: 1, cycle_months: 12, price: 899_000 },
        { plan_id: 1, cycle_months: 24, price: 1_699_000 },
        { plan_id: 1, cycle_months: 36, price: 2_399_000 },
        // Cloud S2
        { plan_id: 2, cycle_months: 1,  price: 169_000 },
        { plan_id: 2, cycle_months: 3,  price: 479_000 },
        { plan_id: 2, cycle_months: 6,  price: 899_000 },
        { plan_id: 2, cycle_months: 12, price: 1_799_000 },
        { plan_id: 2, cycle_months: 24, price: 3_399_000 },
        { plan_id: 2, cycle_months: 36, price: 4_799_000 },
        // Cloud S3
        { plan_id: 3, cycle_months: 1,  price: 329_000 },
        { plan_id: 3, cycle_months: 3,  price: 949_000 },
        { plan_id: 3, cycle_months: 6,  price: 1_799_000 },
        { plan_id: 3, cycle_months: 12, price: 3_499_000 },
        { plan_id: 3, cycle_months: 24, price: 6_699_000 },
        { plan_id: 3, cycle_months: 36, price: 9_499_000 },
        // Ryzen R1
        { plan_id: 4, cycle_months: 1,  price: 259_000 },
        { plan_id: 4, cycle_months: 3,  price: 749_000 },
        { plan_id: 4, cycle_months: 6,  price: 1_449_000 },
        { plan_id: 4, cycle_months: 12, price: 2_799_000 },
        { plan_id: 4, cycle_months: 24, price: 5_299_000 },
        { plan_id: 4, cycle_months: 36, price: 7_499_000 },
        // Ryzen R2
        { plan_id: 5, cycle_months: 1,  price: 469_000 },
        { plan_id: 5, cycle_months: 3,  price: 1_349_000 },
        { plan_id: 5, cycle_months: 6,  price: 2_599_000 },
        { plan_id: 5, cycle_months: 12, price: 4_999_000 },
        { plan_id: 5, cycle_months: 24, price: 9_499_000 },
        { plan_id: 5, cycle_months: 36, price: 13_499_000 },
        // Ryzen R3
        { plan_id: 6, cycle_months: 1,  price: 859_000 },
        { plan_id: 6, cycle_months: 3,  price: 2_499_000 },
        { plan_id: 6, cycle_months: 6,  price: 4_799_000 },
        { plan_id: 6, cycle_months: 12, price: 9_299_000 },
        { plan_id: 6, cycle_months: 24, price: 17_699_000 },
        { plan_id: 6, cycle_months: 36, price: 24_999_000 },
        // HighFreq H1
        { plan_id: 7, cycle_months: 1,  price: 319_000 },
        { plan_id: 7, cycle_months: 3,  price: 919_000 },
        { plan_id: 7, cycle_months: 6,  price: 1_749_000 },
        { plan_id: 7, cycle_months: 12, price: 3_399_000 },
        { plan_id: 7, cycle_months: 24, price: 6_499_000 },
        { plan_id: 7, cycle_months: 36, price: 9_199_000 },
        // HighFreq H2
        { plan_id: 8, cycle_months: 1,  price: 549_000 },
        { plan_id: 8, cycle_months: 3,  price: 1_589_000 },
        { plan_id: 8, cycle_months: 6,  price: 2_999_000 },
        { plan_id: 8, cycle_months: 12, price: 5_899_000 },
        { plan_id: 8, cycle_months: 24, price: 11_199_000 },
        { plan_id: 8, cycle_months: 36, price: 15_799_000 },
        // HighFreq H3
        { plan_id: 9, cycle_months: 1,  price: 999_000 },
        { plan_id: 9, cycle_months: 3,  price: 2_899_000 },
        { plan_id: 9, cycle_months: 6,  price: 5_499_000 },
        { plan_id: 9, cycle_months: 12, price: 10_799_000 },
        { plan_id: 9, cycle_months: 24, price: 20_499_000 },
        { plan_id: 9, cycle_months: 36, price: 28_999_000 },
        // GPU G1
        { plan_id: 10, cycle_months: 1,  price: 2_490_000 },
        { plan_id: 10, cycle_months: 3,  price: 7_290_000 },
        { plan_id: 10, cycle_months: 6,  price: 14_290_000 },
        { plan_id: 10, cycle_months: 12, price: 27_900_000 },
        { plan_id: 10, cycle_months: 24, price: 52_900_000 },
        { plan_id: 10, cycle_months: 36, price: 74_900_000 },
        // GPU G2
        { plan_id: 11, cycle_months: 1,  price: 4_290_000 },
        { plan_id: 11, cycle_months: 3,  price: 12_590_000 },
        { plan_id: 11, cycle_months: 6,  price: 24_790_000 },
        { plan_id: 11, cycle_months: 12, price: 47_900_000 },
        { plan_id: 11, cycle_months: 24, price: 90_900_000 },
        { plan_id: 11, cycle_months: 36, price: 128_900_000 },
        // GPU G3
        { plan_id: 12, cycle_months: 1,  price: 7_900_000 },
        { plan_id: 12, cycle_months: 3,  price: 23_200_000 },
        { plan_id: 12, cycle_months: 6,  price: 45_500_000 },
        { plan_id: 12, cycle_months: 12, price: 88_900_000 },
        { plan_id: 12, cycle_months: 24, price: 168_900_000 },
        { plan_id: 12, cycle_months: 36, price: 238_900_000 },
        // Dedicated D1
        { plan_id: 13, cycle_months: 1,  price: 6_900_000 },
        { plan_id: 13, cycle_months: 3,  price: 20_200_000 },
        { plan_id: 13, cycle_months: 6,  price: 39_500_000 },
        { plan_id: 13, cycle_months: 12, price: 76_900_000 },
        { plan_id: 13, cycle_months: 24, price: 145_900_000 },
        { plan_id: 13, cycle_months: 36, price: 206_900_000 },
        // Dedicated D2
        { plan_id: 14, cycle_months: 1,  price: 12_900_000 },
        { plan_id: 14, cycle_months: 3,  price: 37_700_000 },
        { plan_id: 14, cycle_months: 6,  price: 73_900_000 },
        { plan_id: 14, cycle_months: 12, price: 143_900_000 },
        { plan_id: 14, cycle_months: 24, price: 273_900_000 },
        { plan_id: 14, cycle_months: 36, price: 387_900_000 },
    ],
    os_images: [
        { id: 1,  name: 'Ubuntu 22.04 LTS',       family: 'linux',   is_active: true, icon: 'ubuntu',  desc: 'Phổ biến nhất, tài liệu phong phú.' },
        { id: 2,  name: 'Ubuntu 24.04 LTS',       family: 'linux',   is_active: true, icon: 'ubuntu',  desc: 'Mới nhất, LTS đến 2029.' },
        { id: 3,  name: 'Debian 12',              family: 'linux',   is_active: true, icon: 'debian',  desc: 'Ổn định, phù hợp server production.' },
        { id: 4,  name: 'AlmaLinux 9',            family: 'linux',   is_active: false, icon: 'linux',   desc: 'Tạm ẩn.' },
        { id: 5,  name: 'CentOS Stream 9',        family: 'linux',   is_active: true, icon: 'linux',   desc: 'Tương thích RHEL.' },
        { id: 6,  name: 'Rocky Linux 9',          family: 'linux',   is_active: true, icon: 'linux',   desc: 'Downstream RHEL.' },
        { id: 7,  name: 'Fedora 40',              family: 'linux',   is_active: true, icon: 'linux',   desc: 'Cutting edge.' },
        { id: 8,  name: 'openSUSE Leap 15.6',     family: 'linux',   is_active: true, icon: 'linux',   desc: 'Doanh nghiệp.' },
        { id: 9,  name: 'Windows Server 2019',    family: 'windows', is_active: true, icon: 'windows', desc: 'Có sẵn license.' },
        { id: 10, name: 'Windows Server 2022',    family: 'windows', is_active: true, icon: 'windows', desc: 'Mới hơn, bảo mật tốt hơn.' },
        { id: 11, name: 'Custom ISO',             family: 'custom',  is_active: true, icon: 'disc',    desc: 'Upload ISO riêng của bạn.' },
    ],
    coupons: [
        { id: 1, code: 'GIAM10',  type: 'percent', value: 10,    max_uses: null, used_count: 0, expires_at: '2027-12-31', is_active: true,  desc: 'Giảm 10% tổng đơn hàng' },
        { id: 2, code: 'GIAM50K', type: 'fixed',   value: 50_000, max_uses: 20,   used_count: 0, expires_at: '2027-12-31', is_active: true,  desc: 'Giảm ngay 50.000đ' },
        { id: 3, code: 'WELCOME', type: 'percent', value: 15,    max_uses: 100,  used_count: 0, expires_at: '2027-06-30', is_active: true,  desc: 'Ưu đãi khách mới 15%' },
        { id: 4, code: 'STUDENT', type: 'percent', value: 20,    max_uses: 50,   used_count: 0, expires_at: '2027-12-31', is_active: true,  desc: 'Sinh viên được giảm 20%' },
    ],
    announcements: [
        { id: 1, title: 'Khuyến mãi tháng 10 — Giảm 10% đơn đầu', body: 'Sử dụng mã <b>GIAM10</b> để được giảm ngay 10% giá trị đơn hàng đầu tiên. Áp dụng đến hết 31/10/2026.', type: 'promo',  pinned: true,  created_at: '2026-09-30T10:00:00Z' },
        { id: 2, title: 'Ra mắt GPU G3 với RTX A6000 48GB',         body: 'Dòng GPU G3 trang bị RTX A6000 48GB VRAM — phù hợp training LLM cỡ lớn, multi-modal AI, large inference. Đặt trước được tặng 100.000đ vào ví.', type: 'release', pinned: true,  created_at: '2026-09-20T08:00:00Z' },
        { id: 3, title: 'Bảo trì hệ thống 25/09/2026',             body: 'Hệ thống sẽ bảo trì từ 02:00 — 04:00 sáng 25/09/2026. Trong thời gian này dashboard có thể gián đoạn ngắn. VPS vẫn hoạt động bình thường.', type: 'maintenance', pinned: false, created_at: '2026-09-18T09:00:00Z' },
        { id: 4, title: 'NVMe Gen4 mới cho AMD Ryzen',              body: 'Toàn bộ VPS AMD Ryzen đã được nâng cấp lên NVMe Gen4 tốc độ 7GB/s. Hiệu năng đĩa cứng tăng 2-3 lần so với thế hệ trước.', type: 'release', pinned: false, created_at: '2026-09-10T14:30:00Z' },
        { id: 5, title: 'Hỗ trợ IPv6 đầy đủ',                       body: 'Tất cả VPS mới đều được cấp 1 địa chỉ IPv4 + subnet IPv6 /64. Vui lòng vào panel server để xem chi tiết.', type: 'release', pinned: false, created_at: '2026-09-05T11:15:00Z' },
    ],
    docs: [
        { id: 1,  cat: 'getting-started', title: 'Bắt đầu với VPSSIEUTOC.VN',   body: 'Hướng dẫn từ đăng ký đến khởi tạo server đầu tiên trong vòng 5 phút.' },
        { id: 2,  cat: 'getting-started', title: 'Kết nối SSH vào VPS Linux',    body: 'Sử dụng ssh root@&lt;ip&gt; hoặc PuTTY trên Windows. Mật khẩu gửi qua email khi tạo.' },
        { id: 3,  cat: 'getting-started', title: 'Kết nối Remote Desktop Windows', body: 'Mở Remote Desktop Connection, nhập IP, đăng nhập với Administrator + mật khẩu nhận qua email.' },
        { id: 4,  cat: 'advanced',      title: 'Cài đặt LEMP (Linux + Nginx + MySQL + PHP)', body: 'Hướng dẫn chi tiết cài LEMP trên Ubuntu 22.04.' },
        { id: 5,  cat: 'advanced',      title: 'Sử dụng Docker trên VPS',     body: 'Cài Docker, Docker Compose và chạy container đầu tiên.' },
        { id: 6,  cat: 'advanced',      title: 'Cấu hình firewall UFW',       body: 'Mở/đóng port, whitelist IP, bảo vệ VPS khỏi scan.' },
        { id: 7,  cat: 'advanced',      title: 'Setup VPN WireGuard',          body: 'Tự host VPN cá nhân, bảo mật và nhanh.' },
        { id: 8,  cat: 'billing',       title: 'Phương thức thanh toán',      body: 'Hỗ trợ nạp qua ví nội bộ, chuyển khoản ngân hàng, ví MoMo/ZaloPay.' },
        { id: 9,  cat: 'billing',       title: 'Chính sách hoàn tiền',        body: 'Hoàn 100% trong 7 ngày đầu nếu chưa sử dụng quá 10% tài nguyên.' },
        { id: 10, cat: 'api',           title: 'API quản lý VPS',             body: 'Sử dụng REST API để tạo, xoá, restart server tự động. Xem tài liệu tại docs/api.' },
    ],
    ip_pool: [],
    orders: [],
    invoices: [],
    transactions: [],
    servers: [],
    backups: [],
    tickets: [],
    ticket_replies: [],
    counters: { order: 0, invoice: 0, transaction: 0, server: 0, backup: 0, ticket: 0, reply: 0, ip: 0, user: 2, announcement: 5, doc: 10 },
};

const DB = {
    load() {
        const raw = localStorage.getItem(DB_KEY);
        if (!raw) {
            const fresh = JSON.parse(JSON.stringify(DEFAULT_DATA));
            // Tạo 200 IP
            for (let i = 1; i <= 200; i++) {
                fresh.ip_pool.push({
                    id: ++fresh.counters.ip,
                    ip_address: '10.' + Math.floor(i / 256) + '.' + (Math.floor((i % 256) / 8)) + '.' + (i % 8 + 1),
                    is_used: false,
                });
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

const SESSION_KEY = 'vpssieutoc_session_v3';
const REMEMBER_KEY = 'vpssieutoc_remember';

const Session = {
    _remember() {
        try { return localStorage.getItem(REMEMBER_KEY) !== '0'; } catch (e) { return true; }
    },
    _store(key, val) {
        try { localStorage.setItem(key, val); } catch (e) {}
    },
    _remove(key) {
        try { localStorage.removeItem(key); } catch (e) {}
        try { sessionStorage.removeItem(key); } catch (e) {}
    },
    _read() {
        // Thử cả localStorage lẫn sessionStorage
        try { return localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY); }
        catch (e) { return null; }
    },
    current() {
        const id = Session._read();
        if (!id) return null;
        const u = DB.find('users', id);
        return u && u.status === 'active' ? u : null;
    },
    login(email, password) {
        const user = DB.findWhere('users', u => u.email === email && u.password === password);
        if (!user) throw new Error('Email hoặc mật khẩu không đúng');
        if (user.status === 'locked') throw new Error('Tài khoản đã bị khoá');
        Session._store(SESSION_KEY, String(user.id));
        try { sessionStorage.setItem(SESSION_KEY, String(user.id)); } catch (e) {}
        return user;
    },
    logout() { Session._remove(SESSION_KEY); },
    register({ name, email, password, phone }) {
        if (!name || !email || !password) throw new Error('Vui lòng điền đầy đủ thông tin');
        if (password.length < 6) throw new Error('Mật khẩu tối thiểu 6 ký tự');
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Email không hợp lệ');
        if (DB.findWhere('users', u => u.email === email)) throw new Error('Email đã được sử dụng');
        const newId = DB.nextId('user');
        const user = {
            id: newId,
            name, email, password, phone: phone || '',
            role: 'customer', status: 'active',
            balance: 100_000,
            created_at: new Date().toISOString(),
        };
        DB.insert('users', user);
        DB.insert('transactions', {
            id: DB.nextId('transaction'),
            user_id: newId, type: 'deposit',
            amount: 100_000, balance_after: 100_000,
            ref_id: null, created_at: new Date().toISOString(),
            note: 'Thưởng đăng ký mới',
        });
        Session._store(SESSION_KEY, String(user.id));
        try { sessionStorage.setItem(SESSION_KEY, String(user.id)); } catch (e) {}
        return user;
    },
};

window.DB = DB;
window.Session = Session;