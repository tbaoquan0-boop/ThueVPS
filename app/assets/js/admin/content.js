/* =========================================================
   admin/content.js — Quản lý nội dung (docs + announcements) - CRUD thật
   ========================================================= */
'use strict';

(function () {
    var esc = window.AdminUI.escapeHTML;
    var ui = window.AdminUI;

    var DOC_CATS = [
        { value: 'tutorial', label: 'Tutorial' },
        { value: 'guide', label: 'Guide' },
        { value: 'security', label: 'Security' },
        { value: 'api', label: 'API' },
        { value: 'billing', label: 'Billing' },
    ];
    var ANN_TYPES = [
        { value: 'promo', label: 'Khuyến mãi' },
        { value: 'maintenance', label: 'Bảo trì' },
        { value: 'product', label: 'Sản phẩm' },
        { value: 'info', label: 'Thông tin' },
    ];

    function seedDocs() {
        if (DB.all('docs').length > 0) return;
        [
            { title:'Hướng dẫn cài đặt Docker trên Ubuntu 22.04', category:'tutorial', views:1248, status:'published', body:'# Cài Docker\n\n```bash\ncurl -fsSL https://get.docker.com | sh\n```' },
            { title:'So sánh Cloud VPS và Ryzen VPS', category:'guide', views:842, status:'published', body:'Cloud VPS dùng Intel Xeon shared, Ryzen VPS dùng AMD Ryzen 9 dedicated core...' },
            { title:'Cấu hình firewall cơ bản', category:'security', views:521, status:'published', body:'Hướng dẫn dùng UFW mở/đóng port cơ bản.' },
            { title:'API reference — bản Beta', category:'api', views:204, status:'draft', body:'API docs...' },
        ].forEach(function (d) {
            var id = DB.all('docs').length ? Math.max.apply(null, DB.all('docs').map(function (x) { return x.id; })) + 1 : 1;
            DB.insert('docs', Object.assign({}, d, {
                id: id, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            }));
        });
    }

    function seedAnns() {
        if (DB.all('announcements').length > 0) return;
        [
            { title:'Khuyến mãi tháng 10 — Giảm 10% đơn đầu', type:'promo', status:'published', body:'Nhập mã WELCOME10 khi thanh toán...' },
            { title:'Bảo trì DC HCM-1 lúc 02:00 ngày 05/10', type:'maintenance', status:'published', body:'Khung giờ 02:00 - 04:00...' },
            { title:'Ra mắt GPU A5000 — bản Early Access', type:'product', status:'draft', body:'GPU G2 bản nâng cấp với NVIDIA A5000...' },
        ].forEach(function (a) {
            var id = DB.all('announcements').length ? Math.max.apply(null, DB.all('announcements').map(function (x) { return x.id; })) + 1 : 1;
            DB.insert('announcements', Object.assign({}, a, {
                id: id, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            }));
        });
    }

    function docForm(doc) {
        var isEdit = !!doc;
        ui.formModal({
            title: isEdit ? 'Sửa bài viết' : 'Viết bài mới',
            okText: isEdit ? 'Cập nhật' : 'Tạo',
            size: 'lg',
            fields: [
                { name: 'title', label: 'Tiêu đề', required: true, value: doc && doc.title, placeholder: 'Tiêu đề bài viết' },
                { name: 'category', label: 'Danh mục', type: 'select', value: doc && doc.category, options: DOC_CATS },
                { name: 'status', label: 'Trạng thái', type: 'select', value: doc ? doc.status : 'draft', options: [
                    { value: 'draft', label: 'Bản nháp' },
                    { value: 'published', label: 'Xuất bản' },
                ]},
                { name: 'body', label: 'Nội dung (hỗ trợ Markdown)', type: 'textarea', value: doc && doc.body, placeholder: 'Nội dung bài viết…' },
            ],
            onSubmit: function (vals) {
                if (!vals.title) throw new Error('Tiêu đề không được trống');
                if (isEdit) {
                    DB.update('docs', doc.id, {
                        title: vals.title, category: vals.category, status: vals.status, body: vals.body || '',
                        updated_at: new Date().toISOString(),
                    });
                    ui.toast('Đã cập nhật bài viết', 'success');
                } else {
                    var id = DB.all('docs').length ? Math.max.apply(null, DB.all('docs').map(function (x) { return x.id; })) + 1 : 1;
                    DB.insert('docs', {
                        id: id, title: vals.title, category: vals.category, status: vals.status, body: vals.body || '',
                        views: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
                    });
                    ui.toast('Đã tạo bài viết', 'success');
                }
                ui.rerender();
            }
        });
    }

    function annForm(ann) {
        var isEdit = !!ann;
        ui.formModal({
            title: isEdit ? 'Sửa thông báo' : 'Đăng thông báo',
            okText: isEdit ? 'Cập nhật' : 'Đăng',
            size: 'lg',
            fields: [
                { name: 'title', label: 'Tiêu đề', required: true, value: ann && ann.title, placeholder: 'Tiêu đề thông báo' },
                { name: 'type', label: 'Loại', type: 'select', value: ann ? ann.type : 'info', options: ANN_TYPES },
                { name: 'status', label: 'Trạng thái', type: 'select', value: ann ? ann.status : 'published', options: [
                    { value: 'draft', label: 'Ẩn' },
                    { value: 'published', label: 'Hiển thị' },
                ]},
                { name: 'body', label: 'Nội dung', type: 'textarea', value: ann && ann.body, placeholder: 'Nội dung thông báo…' },
            ],
            onSubmit: function (vals) {
                if (!vals.title) throw new Error('Tiêu đề không được trống');
                if (isEdit) {
                    DB.update('announcements', ann.id, {
                        title: vals.title, type: vals.type, status: vals.status, body: vals.body || '',
                        updated_at: new Date().toISOString(),
                    });
                    ui.toast('Đã cập nhật thông báo', 'success');
                } else {
                    var id = DB.all('announcements').length ? Math.max.apply(null, DB.all('announcements').map(function (x) { return x.id; })) + 1 : 1;
                    DB.insert('announcements', {
                        id: id, title: vals.title, type: vals.type, status: vals.status, body: vals.body || '',
                        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
                    });
                    ui.toast('Đã đăng thông báo', 'success');
                }
                ui.rerender();
            }
        });
    }

    function render() {
        seedDocs();
        seedAnns();
        var docs = DB.all('docs');
        var anns = DB.all('announcements');

        var docRows = docs.map(function (d) {
            var st = d.status === 'published'
                ? '<span class="vm-badge success">Xuất bản</span>'
                : '<span class="vm-badge muted">Bản nháp</span>';
            return '<tr>' +
                '<td><b>' + esc(d.title) + '</b>' +
                    '<div style="color:var(--vm-muted);font-size:.72rem">Cập nhật ' + esc(String(d.updated_at || '').slice(0, 10)) + '</div></td>' +
                '<td><span class="vm-badge muted">' + esc(d.category) + '</span></td>' +
                '<td>' + (d.views || 0).toLocaleString('vi-VN') + '</td>' +
                '<td>' + st + '</td>' +
                '<td style="white-space:nowrap">' +
                    '<button class="vm-btn sm" data-action="edit-doc" data-id="' + d.id + '" title="Sửa"><i class="bi bi-pencil"></i></button> ' +
                    (d.status === 'draft'
                        ? '<button class="vm-btn sm" data-action="publish-doc" data-id="' + d.id + '" title="Xuất bản" style="color:var(--vm-success)"><i class="bi bi-check2"></i></button>'
                        : '<button class="vm-btn sm" data-action="unpublish-doc" data-id="' + d.id + '" title="Hạ nháp"><i class="bi bi-eye-slash"></i></button>') +
                    '<button class="vm-btn sm danger" data-action="delete-doc" data-id="' + d.id + '" title="Xóa"><i class="bi bi-trash"></i></button>' +
                '</td>' +
            '</tr>';
        }).join('');

        var annRows = anns.map(function (a) {
            var st = a.status === 'published'
                ? '<span class="vm-badge success">Hiển thị</span>'
                : '<span class="vm-badge muted">Ẩn</span>';
            var typeMap = { promo:'Khuyến mãi', maintenance:'Bảo trì', product:'Sản phẩm', info:'Thông tin' };
            return '<tr>' +
                '<td><b>' + esc(a.title) + '</b>' +
                    '<div style="color:var(--vm-muted);font-size:.72rem">' + esc(String(a.updated_at || '').slice(0, 10)) + '</div></td>' +
                '<td><span class="vm-badge info">' + esc(typeMap[a.type] || a.type || '') + '</span></td>' +
                '<td>' + st + '</td>' +
                '<td style="white-space:nowrap">' +
                    '<button class="vm-btn sm" data-action="edit-ann" data-id="' + a.id + '" title="Sửa"><i class="bi bi-pencil"></i></button> ' +
                    (a.status === 'published'
                        ? '<button class="vm-btn sm" data-action="hide-ann" data-id="' + a.id + '" title="Ẩn"><i class="bi bi-eye-slash"></i></button>'
                        : '<button class="vm-btn sm" data-action="publish-ann" data-id="' + a.id + '" title="Hiển thị" style="color:var(--vm-success)"><i class="bi bi-check2"></i></button>') +
                    '<button class="vm-btn sm danger" data-action="delete-ann" data-id="' + a.id + '" title="Xóa"><i class="bi bi-trash"></i></button>' +
                '</td>' +
            '</tr>';
        }).join('');

        return '' +
            '<div class="vm-page-head">' +
                '<div><h1>Quản lý nội dung</h1><p>Tài liệu hướng dẫn và thông báo hệ thống</p></div>' +
            '</div>' +
            '<div class="vm-grid-2">' +
                '<div class="vm-card">' +
                    '<div class="vm-card-head">' +
                        '<div class="vm-card-title"><i class="bi bi-file-text"></i> Tài liệu (' + docs.length + ')</div>' +
                        '<button class="vm-btn sm primary" data-action="add-doc"><i class="bi bi-plus-lg"></i> Viết bài</button>' +
                    '</div>' +
                    '<div class="vm-card-body tight">' +
                        (docs.length === 0
                            ? '<div class="vm-empty">Chưa có bài viết.</div>'
                            : '<table class="vm-table">' +
                                '<thead><tr><th>Tiêu đề</th><th>Danh mục</th><th>Lượt xem</th><th>Trạng thái</th><th></th></tr></thead>' +
                                '<tbody>' + docRows + '</tbody>' +
                              '</table>') +
                    '</div>' +
                '</div>' +

                '<div class="vm-card">' +
                    '<div class="vm-card-head">' +
                        '<div class="vm-card-title"><i class="bi bi-megaphone"></i> Thông báo (' + anns.length + ')</div>' +
                        '<button class="vm-btn sm primary" data-action="add-ann"><i class="bi bi-plus-lg"></i> Đăng</button>' +
                    '</div>' +
                    '<div class="vm-card-body tight">' +
                        (anns.length === 0
                            ? '<div class="vm-empty">Chưa có thông báo.</div>'
                            : '<table class="vm-table">' +
                                '<thead><tr><th>Tiêu đề</th><th>Loại</th><th>Trạng thái</th><th></th></tr></thead>' +
                                '<tbody>' + annRows + '</tbody>' +
                              '</table>') +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    AdminRouter.onRender(function (path) {
        if (path !== '/content') return;
        var content = document.getElementById('adContent');
        if (!content) return;
        content.querySelectorAll('[data-action]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var action = btn.dataset.action;
                var id = btn.dataset.id ? Number(btn.dataset.id) : null;
                if (action === 'add-doc') docForm(null);
                else if (action === 'add-ann') annForm(null);
                else if (id) {
                    if (action === 'edit-doc') { var d = DB.find('docs', id); if (d) docForm(d); }
                    else if (action === 'edit-ann') { var a = DB.find('announcements', id); if (a) annForm(a); }
                    else if (action === 'publish-doc') { DB.update('docs', id, { status: 'published', updated_at: new Date().toISOString() }); ui.toast('Đã xuất bản', 'success'); ui.rerender(); }
                    else if (action === 'unpublish-doc') { DB.update('docs', id, { status: 'draft', updated_at: new Date().toISOString() }); ui.toast('Đã hạ nháp', 'warn'); ui.rerender(); }
                    else if (action === 'publish-ann') { DB.update('announcements', id, { status: 'published', updated_at: new Date().toISOString() }); ui.toast('Đã hiển thị thông báo', 'success'); ui.rerender(); }
                    else if (action === 'hide-ann') { DB.update('announcements', id, { status: 'draft', updated_at: new Date().toISOString() }); ui.toast('Đã ẩn thông báo', 'warn'); ui.rerender(); }
                    else if (action === 'delete-doc') {
                        ui.confirm({ title: 'Xóa bài viết', message: 'Xóa bài viết này?', danger: true, okText: 'Xóa',
                            onOk: function () { DB.remove('docs', id); ui.toast('Đã xóa', 'success'); ui.rerender(); }
                        });
                    }
                    else if (action === 'delete-ann') {
                        ui.confirm({ title: 'Xóa thông báo', message: 'Xóa thông báo này?', danger: true, okText: 'Xóa',
                            onOk: function () { DB.remove('announcements', id); ui.toast('Đã xóa', 'success'); ui.rerender(); }
                        });
                    }
                }
            });
        });
    });

    AdminRouter.add('/content', 'Nội dung', render);
})();