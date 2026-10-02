const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\154.0.4258.53\\msedge.exe';
const outDir = path.join(__dirname, '..', 'docs', 'img');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const screens = [
    { file: 'hinh_3_1_trang_chu.png', url: 'http://localhost:8085/index.html', width: 1280, height: 900 },
    { file: 'hinh_3_2_bang_gia.png', url: 'http://localhost:8085/index.html#/pricing', width: 1280, height: 900 },
    { file: 'hinh_3_3_so_sanh.png', url: 'http://localhost:8085/index.html#/compare', width: 1280, height: 900 },
    { file: 'hinh_3_4_cau_hinh_dat_hang.png', url: 'http://localhost:8085/index.html#/order?plan=cloud-s2', width: 1280, height: 950 },
    { file: 'hinh_3_5_thanh_toan_nap_vi.png', url: 'http://localhost:8085/index.html#/dashboard?view=wallet', width: 1280, height: 900 },
    { file: 'hinh_3_6_dashboard_khach.png', url: 'http://localhost:8085/index.html#/dashboard?view=services', width: 1280, height: 900 },
    { file: 'hinh_3_7_chi_tiet_may_chu.png', url: 'http://localhost:8085/index.html#/server?id=SV-1001', width: 1280, height: 950 },
    { file: 'hinh_3_8_ticket_ho_tro.png', url: 'http://localhost:8085/index.html#/dashboard?view=tickets', width: 1280, height: 900 },
    { file: 'hinh_3_9_admin_dashboard.png', url: 'http://localhost:8085/admin.html#/dashboard', width: 1280, height: 900 },
    { file: 'hinh_3_10_admin_servers.png', url: 'http://localhost:8085/admin.html#/servers', width: 1280, height: 900 },
    { file: 'hinh_3_11_admin_tickets.png', url: 'http://localhost:8085/admin.html#/tickets', width: 1280, height: 900 },
    { file: 'hinh_3_12_admin_finance.png', url: 'http://localhost:8085/admin.html#/finance', width: 1280, height: 900 },
];

for (const s of screens) {
    const outFile = path.join(outDir, s.file);
    const args = [
        '--headless',
        '--disable-gpu',
        `--window-size=${s.width},${s.height}`,
        `--screenshot=${outFile}`,
        s.url
    ];
    try {
        cp.execFileSync(edgePath, args, { stdio: 'ignore', timeout: 15000 });
        if (fs.existsSync(outFile)) {
            const sz = fs.statSync(outFile).size;
            console.log(`OK: ${s.file} (${Math.round(sz / 1024)} KB)`);
        } else {
            console.error(`Missing: ${s.file}`);
        }
    } catch (e) {
        console.error(`Error on ${s.file}: ${e.message}`);
    }
}
