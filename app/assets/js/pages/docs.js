/* =========================================================
   pages/docs.js — Tài liệu
========================================================= */
'use strict';

(function () {
    function render() {
        const docs = DB.all('docs');
        const cats = [...new Set(docs.map(d => d.cat))];
        const catLabels = {
            'getting-started': 'Bắt đầu',
            'advanced':        'Nâng cao',
            'billing':         'Thanh toán',
            'api':             'API',
        };

        const sections = cats.map(cat => {
            const items = docs.filter(d => d.cat === cat);
            return (
                '<section class="doc-cat reveal">' +
                    '<h3 class="doc-cat-title">' + escapeHTML(catLabels[cat] || cat) + '</h3>' +
                    '<div class="doc-list">' +
                        items.map(d => (
                            '<a href="#/docs/' + d.id + '" class="doc-item">' +
                                '<i class="bi bi-file-earmark-text"></i>' +
                                '<div><div class="t">' + escapeHTML(d.title) + '</div>' +
                                '<div class="d">' + escapeHTML(d.body) + '</div></div>' +
                                '<i class="bi bi-arrow-right"></i>' +
                            '</a>'
                        )).join('') +
                    '</div>' +
                '</section>'
            );
        }).join('');

        const html =
            '<section class="sec">' +
                '<div class="wrap">' +
                    '<div class="sec-head reveal">' +
                        '<span class="eyebrow">Hướng dẫn</span>' +
                        '<h2>Tài liệu & API</h2>' +
                        '<p>Mọi thứ bạn cần để bắt đầu và vận hành VPS.</p>' +
                    '</div>' +
                    '<div class="doc-cats">' + sections + '</div>' +
                '</div>' +
            '</section>';
        return renderLayout(html);
    }

    const DOC_CONTENT = {
        1: [
            '<p>Chào mừng bạn đến với <b>TáoVPS Web</b>. Nền tảng điện toán đám mây cung cấp máy chủ ảo (Cloud VPS) hiệu năng cao, sử dụng 100% ổ cứng NVMe Gen4 U.2, bộ nhớ RAM DDR5 và đường truyền mạng 10Gbps trong nước & quốc tế.</p>',
            '<div class="doc-callout tip"><i class="bi bi-lightning-charge-fill"></i><div><b>Thời gian khởi tạo siêu tốc:</b> Toàn bộ quy trình từ thanh toán đến cấp phát IP và gửi mật khẩu quản trị diễn ra tự động chỉ trong <b>60 giây</b>.</div></div>',
            '<h2>Quy trình khởi tạo máy chủ đầu tiên</h2>',
            '<div class="doc-step"><div class="doc-step-num">1</div><div class="doc-step-body"><h3>Đăng ký tài khoản & nạp ví</h3><p>Truy cập vào trang <a href="#/register" style="color:var(--accent)">Đăng ký</a> để tạo tài khoản miễn phí. Bạn được nhận ngay 100.000đ vào ví thử nghiệm. Để đặt các gói cấu hình cao hơn, vào mục <b>Ví & Nạp tiền</b> để quét mã VietQR tự động 24/7.</p></div></div>',
            '<div class="doc-step"><div class="doc-step-num">2</div><div class="doc-step-body"><h3>Lựa chọn dòng máy chủ phù hợp</h3><p>Hệ thống chia làm 5 dòng sản phẩm chính:</p><ul><li><b>Cloud VPS:</b> Hạ tầng Intel Xeon v4, tiết kiệm chi phí, phù hợp website, blog, API vừa và nhỏ.</li><li><b>AMD Ryzen:</b> Sử dụng chip AMD Ryzen 9 7950X xung nhịp 4.5GHz - 5.7GHz, lý tưởng cho Game server, Tool tự động, bot.</li><li><b>Xung nhịp cao (High-Frequency):</b> Intel Core i9-14900K boost 6.0GHz cho các tác vụ cần độ trễ thấp như tài chính, render, compile code.</li><li><b>GPU Server:</b> Tích hợp card đồ họa RTX A4000/A5000 cho AI/Deep Learning, giả lập Android (Nox, LDPlayer).</li><li><b>Dedicated Server:</b> Thuê trọn vẹn phần cứng vật lý máy chủ riêng biệt.</li></ul></div></div>',
            '<div class="doc-step"><div class="doc-step-num">3</div><div class="doc-step-body"><h3>Chọn hệ điều hành và đặt tên máy (Hostname)</h3><p>Tại trang đặt hàng, bạn có thể chọn các bản phân phối Linux thông dụng (Ubuntu 22.04 LTS, Ubuntu 24.04, Debian 12, Rocky Linux 9, AlmaLinux 9) hoặc Windows Server (2019, 2022 Datacenter Edition có bản quyền dùng thử).</p></div></div>',
            '<div class="doc-step"><div class="doc-step-num">4</div><div class="doc-step-body"><h3>Nhận thông tin truy cập</h3><p>Sau khi hệ thống khởi tạo hoàn tất, bạn sẽ nhận được địa chỉ IPv4 tĩnh, tài khoản quản trị <code>root</code> / <code>Administrator</code> và mật khẩu gửi qua email đăng ký.</p></div></div>',
            '<h2>Kiểm tra kết nối ban đầu</h2>',
            '<p>Sau khi nhận được IP, bạn có thể mở Terminal hoặc Command Prompt để kiểm tra độ trễ mạng:</p>',
            '<pre class="code">ping 103.170.122.45</pre>',
            '<p>Độ trễ trung bình từ các nhà mạng Viettel, VNPT, FPT tới cụm máy chủ TP.HCM / Hà Nội thường chỉ từ <b>1ms - 5ms</b>.</p>'
        ].join('\n'),

        2: [
            '<p>SSH (Secure Shell) là giao thức tiêu chuẩn mã hóa giúp bạn quản trị máy chủ Linux từ xa qua giao diện dòng lệnh. Hướng dẫn này giúp bạn kết nối SSH an toàn và thiết lập xác thực bằng khóa bảo mật (SSH Key).</p>',
            '<h2>1. Kết nối cơ bản bằng mật khẩu</h2>',
            '<p>Mở ứng dụng <b>Terminal</b> (trên macOS/Linux) hoặc <b>PowerShell / Windows Terminal</b> (trên Windows 10/11), gõ lệnh sau:</p>',
            '<pre class="code">ssh root@&lt;IP_SERVER_CUA_BAN&gt;</pre>',
            '<p>Ví dụ cụ thể:</p>',
            '<pre class="code">ssh root@103.170.122.45</pre>',
            '<p>Khi kết nối lần đầu, hệ thống sẽ hỏi xác thực vân tay máy chủ (Fingerprint):</p>',
            '<pre class="code">The authenticity of host \'103.170.122.45\' can\'t be established.\nED25519 key fingerprint is SHA256:7uK...\nAre you sure you want to continue connecting (yes/no/[fingerprint])?</pre>',
            '<p>Nhập <code>yes</code> rồi nhấn <b>Enter</b>. Sau đó nhập mật khẩu root được gửi qua email (lưu ý: khi gõ mật khẩu trên Linux, màn hình sẽ không hiển thị ký tự vì lý do an toàn).</p>',
            '<h2>2. Sử dụng SSH Key (Khuyến nghị bảo mật tuyệt đối)</h2>',
            '<p>Đăng nhập bằng SSH Key an toàn hơn nhiều so với mật khẩu và chống lại 100% các cuộc tấn công dò quét Brute-force.</p>',
            '<h3>Tạo cặp khóa trên máy tính cá nhân:</h3>',
            '<pre class="code">ssh-keygen -t ed25519 -C "admin@taovps.vn"</pre>',
            '<p>Nhấn Enter 3 lần để lưu khóa tại <code>~/.ssh/id_ed25519</code> mà không cần passphrase.</p>',
            '<h3>Sao chép khóa công khai (Public Key) lên VPS:</h3>',
            '<pre class="code">ssh-copy-id -i ~/.ssh/id_ed25519.pub root@103.170.122.45</pre>',
            '<p>Từ bây giờ, bạn có thể đăng nhập tức thì chỉ với lệnh <code>ssh root@103.170.122.45</code> mà không cần gõ mật khẩu.</p>',
            '<div class="doc-callout warn"><i class="bi bi-shield-lock-fill"></i><div><b>Mẹo bảo mật nâng cao:</b> Bạn có thể đổi cổng SSH mặc định từ 22 sang một cổng bất kỳ (ví dụ <code>2222</code>) trong tệp <code>/etc/ssh/sshd_config</code> để loại bỏ các bot quét mạng tự động.</div></div>'
        ].join('\n'),

        3: [
            '<p>Với các gói VPS cài đặt Windows Server, bạn có thể điều khiển toàn diện giao diện đồ họa (GUI) thông qua giao thức Remote Desktop Protocol (RDP - Port 3389).</p>',
            '<h2>1. Kết nối từ máy tính Windows</h2>',
            '<ol>',
            '<li>Nhấn tổ hợp phím <code>Windows + R</code>, gõ <code>mstsc</code> và nhấn <b>Enter</b> để mở công cụ <b>Remote Desktop Connection</b>.</li>',
            '<li>Tại ô <b>Computer</b>: Nhập địa chỉ IP của VPS (ví dụ <code>103.170.122.45</code>).</li>',
            '<li>Nhấn nút <b>Connect</b>.</li>',
            '<li>Tại cửa sổ đăng nhập Windows Security:<ul><li><b>Username:</b> <code>Administrator</code></li><li><b>Password:</b> Mật khẩu quản trị nhận được qua email khi tạo VPS.</li></ul></li>',
            '<li>Nếu xuất hiện cảnh báo chứng chỉ <i>"The identity of the remote computer cannot be verified"</i>, tích chọn <i>"Don\'t ask me again"</i> và bấm <b>Yes</b>.</li>',
            '</ol>',
            '<h2>2. Kết nối từ máy Mac (macOS)</h2>',
            '<p>Trên máy tính Apple Mac, bạn tải ứng dụng miễn phí <b>Microsoft Remote Desktop</b> từ Mac App Store:</p>',
            '<ul><li>Mở app, bấm vào dấu <b>+</b> chọn <b>Add PC</b>.</li><li>Nhập <b>PC name</b> là địa chỉ IP của máy chủ.</li><li>Chọn <b>User Account</b>: Chọn "Add User Account..." và điền User: <code>Administrator</code> kèm Password.</li><li>Nhấn <b>Add</b> và click đúp vào biểu tượng PC để vào màn hình desktop.</li></ul>',
            '<div class="doc-callout tip"><i class="bi bi-speedometer2"></i><div><b>Tối ưu mượt mà:</b> Tại tab <b>Display</b> trong Remote Desktop, hãy chọn độ sâu màu <i>High Color (16 bit)</i> nếu đường truyền mạng của bạn chậm để thao tác chuột mượt mà hơn.</div></div>'
        ].join('\n'),

        4: [
            '<p>LEMP stack (Linux, Nginx, MySQL, PHP) là bộ phần mềm mã nguồn mở phổ biến nhất hiện nay để triển khai website hiệu năng cao như WordPress, Laravel, Node.js proxy, API server.</p>',
            '<h2>Bước 1: Cập nhật hệ điều hành</h2>',
            '<pre class="code">sudo apt update && sudo apt upgrade -y</pre>',
            '<h2>Bước 2: Cài đặt Web Server Nginx</h2>',
            '<pre class="code">sudo apt install nginx -y\nsudo systemctl enable --now nginx</pre>',
            '<p>Kiểm tra trạng thái Nginx: <code>sudo systemctl status nginx</code>. Mở trình duyệt và truy cập <code>http://&lt;IP_CỦA_BẠN&gt;</code>, bạn sẽ thấy trang chào mừng <i>"Welcome to nginx!"</i>.</p>',
            '<h2>Bước 3: Cài đặt MySQL Database</h2>',
            '<pre class="code">sudo apt install mysql-server -y\nsudo mysql_secure_installation</pre>',
            '<p>Thiết lập mật khẩu quản trị root cho cơ sở dữ liệu và chọn loại bỏ các tài khoản kiểm thử ẩn danh.</p>',
            '<h2>Bước 4: Cài đặt PHP 8.2 & PHP-FPM</h2>',
            '<pre class="code">sudo apt install php-fpm php-mysql php-curl php-gd php-mbstring php-xml php-zip -y</pre>',
            '<h2>Bước 5: Cấu hình Virtual Host và chứng chỉ SSL miễn phí</h2>',
            '<p>Cấu hình tệp máy chủ ảo tại <code>/etc/nginx/sites-available/default</code>, sau đó chạy lệnh cài đặt SSL tự động gia hạn với Let\'s Encrypt:</p>',
            '<pre class="code">sudo apt install certbot python3-certbot-nginx -y\nsudo certbot --nginx -d example.com -d www.example.com</pre>'
        ].join('\n'),

        5: [
            '<p>Docker giúp đóng gói và chạy các ứng dụng trong các container độc lập, nhất quán từ môi trường phát triển đến máy chủ sản xuất.</p>',
            '<h2>1. Cài đặt Docker Engine bản mới nhất</h2>',
            '<p>Sử dụng script cài đặt chính thức từ Docker:</p>',
            '<pre class="code">curl -fsSL https://get.docker.com -o get-docker.sh\nsudo sh get-docker.sh</pre>',
            '<h2>2. Phân quyền chạy Docker không cần sudo</h2>',
            '<pre class="code">sudo usermod -aG docker $USER\nnewgrp docker</pre>',
            '<h2>3. Chạy thử container đầu tiên</h2>',
            '<pre class="code">docker run -d -p 80:80 --name test-nginx nginx:alpine</pre>',
            '<p>Kiểm tra danh sách các container đang hoạt động:</p>',
            '<pre class="code">docker ps</pre>',
            '<h2>4. Ví dụ Docker Compose cho ứng dụng Web</h2>',
            '<p>Tạo tệp <code>docker-compose.yml</code>:</p>',
            '<pre class="code">version: \'3.8\'\nservices:\n  web:\n    image: nginx:alpine\n    ports:\n      - "80:80"\n    restart: always\n  db:\n    image: mariadb:10.11\n    environment:\n      MYSQL_ROOT_PASSWORD: secret_password\n      MYSQL_DATABASE: app_db\n    volumes:\n      - db_data:/var/lib/mysql\n    restart: always\n\nvolumes:\n  db_data:</pre>',
            '<p>Khởi chạy toàn bộ hệ thống ở chế độ ngầm:</p>',
            '<pre class="code">docker compose up -d</pre>'
        ].join('\n'),

        6: [
            '<p>UFW (Uncomplicated Firewall) là công cụ quản lý tường lửa mặc định trên Ubuntu, giúp chặn các lượt quét cổng trái phép và bảo vệ an toàn cho máy chủ.</p>',
            '<h2>1. Đặt chính sách phòng thủ mặc định</h2>',
            '<p>Chặn toàn bộ các kết nối từ bên ngoài vào, chỉ cho phép kết nối do máy chủ chủ động gửi đi:</p>',
            '<pre class="code">sudo ufw default deny incoming\nsudo ufw default allow outgoing</pre>',
            '<h2>2. Mở các cổng dịch vụ cần thiết</h2>',
            '<div class="doc-callout warn"><i class="bi bi-exclamation-triangle-fill"></i><div><b>CỰC KỲ QUAN TRỌNG:</b> Luôn mở cổng SSH trước khi bật tường lửa để tránh bị khóa ngoài máy chủ!</div></div>',
            '<pre class="code">sudo ufw allow 22/tcp comment \'SSH\'\nsudo ufw allow 80/tcp comment \'HTTP\'\nsudo ufw allow 443/tcp comment \'HTTPS\'</pre>',
            '<h2>3. Bật tường lửa và kiểm tra trạng thái</h2>',
            '<pre class="code">sudo ufw enable\nsudo ufw status verbose</pre>',
            '<p>Hệ thống sẽ hiển thị danh sách các cổng đang mở kèm ghi chú chi tiết.</p>'
        ].join('\n'),

        7: [
            '<p>WireGuard là giao thức VPN thế hệ mới với hiệu năng vượt trội, độ trễ cực thấp và mã hóa hiện đại hơn OpenVPN và IPsec.</p>',
            '<h2>1. Cài đặt tự động bằng script</h2>',
            '<pre class="code">wget https://git.io/wireguard -O wireguard-install.sh\nsudo bash wireguard-install.sh</pre>',
            '<p>Script sẽ tự động nhận diện IP công cộng, chọn cổng kết nối ngẫu nhiên và cấu hình IPv4/IPv6 chuyển tiếp.</p>',
            '<h2>2. Kết nối từ điện thoại hoặc máy tính</h2>',
            '<p>Sau khi thêm client mới, script sẽ in ra một mã QR ngay trên terminal. Bạn chỉ cần mở app <b>WireGuard</b> trên iOS/Android, bấm dấu <b>+</b> và quét mã QR để kích hoạt VPN ngay lập tức.</p>'
        ].join('\n'),

        8: [
            '<p>TáoVPS Web hỗ trợ đa dạng phương thức nạp tiền và thanh toán tự động, phục vụ 24/7 không kể ngày lễ Tết.</p>',
            '<h2>1. Chuyển khoản ngân hàng VietQR (Khuyên dùng)</h2>',
            '<ul><li>Quét mã QR qua ứng dụng ngân hàng bất kỳ (Vietcombank, MB, Techcombank, VPBank, TPBank...).</li><li>Hệ thống khớp nội dung chuyển khoản tự động và <b>cộng tiền vào ví chỉ sau 15 - 30 giây</b>.</li><li>Không thu bất kỳ khoản phí giao dịch nào.</li></ul>',
            '<h2>2. Thẻ thanh toán quốc tế</h2>',
            '<p>Hỗ trợ thẻ Visa, MasterCard, JCB phát hành bởi các ngân hàng trong nước và quốc tế qua cổng thanh toán bảo mật 3D-Secure.</p>',
            '<h2>3. Hóa đơn giá trị gia tăng (VAT)</h2>',
            '<p>Nếu doanh nghiệp của bạn cần xuất hóa đơn tài chính VAT (10%), vui lòng cập nhật thông tin công ty và mã số thuế tại mục <b>Tài khoản cá nhân</b> hoặc liên hệ qua Ticket hỗ trợ để nhận hóa đơn điện tử trong 24 giờ làm việc.</p>'
        ].join('\n'),

        9: [
            '<p>Chúng tôi cam kết mang lại sự an tâm tuyệt đối cho khách hàng với chính sách hoàn tiền minh bạch và rõ ràng.</p>',
            '<h2>1. Điều kiện hoàn tiền 100%</h2>',
            '<ul><li>Yêu cầu được gửi trong vòng <b>7 ngày đầu tiên</b> kể từ ngày đơn hàng máy chủ được kích hoạt.</li><li>Máy chủ không đáp ứng được cam kết về thông số kỹ thuật (uptime, tốc độ mạng, phần cứng NVMe).</li><li>Khách hàng chưa tiêu thụ quá 10% lưu lượng băng thông của gói cước.</li></ul>',
            '<h2>2. Các trường hợp từ chối hoàn tiền</h2>',
            '<ul><li>Máy chủ bị nhà mạng hoặc hệ thống giám sát phát hiện phát tán mã độc, tấn công từ chối dịch vụ (DDoS), gửi email spam hàng loạt, hoặc đào tiền ảo (Crypto mining).</li><li>Địa chỉ IP bị các tổ chức an ninh mạng quốc tế (Spamhaus, Talos, CleanTalk) đưa vào danh sách đen do hoạt động của khách hàng.</li></ul>',
            '<h2>3. Cách thức nhận tiền hoàn</h2>',
            '<p>Gửi Ticket hỗ trợ tới phòng Kế toán. Số tiền sẽ được hoàn trả về số dư Ví nội bộ (ngay lập tức) hoặc chuyển khoản về tài khoản ngân hàng chính chủ của quý khách trong vòng 3 - 5 ngày làm việc.</p>'
        ].join('\n'),

        10: [
            '<p>TáoVPS Web cung cấp bộ RESTful API đầy đủ tính năng giúp các lập trình viên và doanh nghiệp tự động hóa việc khởi tạo, cấu hình và quản trị hạ tầng đám mây.</p>',
            '<h2>1. Thông tin chung</h2>',
            '<ul><li><b>Base URL:</b> <code>https://api.taovps.vn/v1</code></li><li><b>Định dạng dữ liệu:</b> <code>application/json</code></li><li><b>Xác thực (Authentication):</b> Gửi kèm API Token trong Header <code>Authorization: Bearer &lt;YOUR_API_TOKEN&gt;</code></li></ul>',
            '<h2>2. Các Endpoint phổ biến</h2>',
            '<h3>Lấy danh sách máy chủ của bạn:</h3>',
            '<pre class="code">curl -X GET "https://api.taovps.vn/v1/servers" \\\n  -H "Authorization: Bearer YOUR_TOKEN_HERE"</pre>',
            '<h3>Khởi động lại (Reboot) máy chủ:</h3>',
            '<pre class="code">curl -X POST "https://api.taovps.vn/v1/servers/101/restart" \\\n  -H "Authorization: Bearer YOUR_TOKEN_HERE"</pre>',
            '<h3>Tạo snapshot sao lưu tức thì:</h3>',
            '<pre class="code">curl -X POST "https://api.taovps.vn/v1/servers/101/snapshots" \\\n  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"name": "Backup-Truoc-Khi-Update"}\'</pre>'
        ].join('\n')
    };

    function renderDetail(query) {
        const id = Number(query.params.id);
        const doc = DB.find('docs', id);
        if (!doc) { Router.go('/'); return render(); }

        const all = DB.all('docs');
        const idx = all.findIndex(d => d.id === id);
        const prev = idx > 0 ? all[idx - 1] : null;
        const next = idx < all.length - 1 ? all[idx + 1] : null;

        const catLabels = {
            'getting-started': 'Bắt đầu',
            'advanced':        'Nâng cao',
            'billing':         'Thanh toán',
            'api':             'API',
        };

        const bodyContent = DOC_CONTENT[id] || (
            '<p style="font-size:1.05rem;line-height:1.7">' + escapeHTML(doc.body) + '</p>' +
            '<div class="doc-callout tip"><i class="bi bi-info-circle-fill"></i><div>Tài liệu chi tiết đang được cập nhật thêm các hướng dẫn nâng cao và video minh họa.</div></div>'
        );

        const html =
            '<section class="sec">' +
                '<div class="wrap" style="max-width:820px">' +
                    '<div class="reveal" style="margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">' +
                        '<a href="#/docs" class="btn btn-line btn-sm"><i class="bi bi-arrow-left"></i> Danh sách tài liệu</a>' +
                        '<div style="font-size:.85rem;color:var(--muted)">' +
                            '<a href="#/docs" style="color:var(--accent)">Tài liệu</a> / <span>' + escapeHTML(catLabels[doc.cat] || doc.cat) + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<article class="doc-article reveal">' +
                        '<div class="eyebrow" style="color:var(--accent);font-size:.82rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em">' + escapeHTML(catLabels[doc.cat] || doc.cat) + '</div>' +
                        '<h1 style="font-size: clamp(1.6rem, 3.5vw, 2.2rem);font-weight:600;letter-spacing:-0.03em;margin:8px 0 12px">' + escapeHTML(doc.title) + '</h1>' +
                        '<div style="display:flex;align-items:center;gap:16px;color:var(--muted);font-size:.84rem;margin-bottom:28px;padding-bottom:18px;border-bottom:1px solid var(--line)">' +
                            '<span><i class="bi bi-clock"></i> 3-5 phút đọc</span>' +
                            '<span><i class="bi bi-check-circle"></i> Đã kiểm duyệt kỹ thuật</span>' +
                        '</div>' +
                        '<div class="doc-content">' + bodyContent + '</div>' +
                    '</article>' +
                    '<div class="doc-nav reveal" style="display:flex;justify-content:space-between;gap:16px;margin-top:40px;flex-wrap:wrap">' +
                        (prev
                            ? '<a href="#/docs/' + prev.id + '" class="btn btn-line btn-sm"><i class="bi bi-arrow-left"></i> ' + escapeHTML(prev.title) + '</a>'
                            : '<span></span>') +
                        (next
                            ? '<a href="#/docs/' + next.id + '" class="btn btn-line btn-sm">' + escapeHTML(next.title) + ' <i class="bi bi-arrow-right"></i></a>'
                            : '<span></span>') +
                    '</div>' +
                '</div>' +
            '</section>';
        return renderLayout(html);
    }

    Router.add('GET', '/docs',       render);
    Router.add('GET', '/docs/:id',   renderDetail);
})();