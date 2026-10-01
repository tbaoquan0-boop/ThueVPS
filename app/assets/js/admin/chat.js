/* =========================================================
   admin/chat.js — Trang chat cho admin
   ========================================================= */
'use strict';

(function () {
    var currentUserId = null;

    function render() {
        var users = ChatStore.listUsers();
        var totalUnread = users.reduce(function (s, u) { return s + (u.unread || 0); }, 0);

        var list = users.length === 0
            ? '<div class="vm-empty" style="padding:30px"><i class="bi bi-chat-square-dots" style="font-size:1.5rem;display:block;margin-bottom:8px"></i>Chưa có cuộc trò chuyện nào.</div>'
            : users.map(function (u) {
                var isActive = String(u.userId) === String(currentUserId);
                var preview = u.lastMessage ? escapeHTML(u.lastMessage.slice(0, 60)) : '<i style="color:var(--vm-muted)">Chưa có tin nhắn</i>';
                var time = u.lastAt ? fmtChatTime(u.lastAt) : '';
                return '<div class="vm-chat-user ' + (isActive ? 'active' : '') + '" data-uid="' + u.userId + '">' +
                    '<div class="vm-chat-user-avatar">' + escapeHTML((u.userName || '?').charAt(0).toUpperCase()) + '</div>' +
                    '<div class="vm-chat-user-info">' +
                        '<div class="vm-chat-user-row">' +
                            '<span class="vm-chat-user-name">' + escapeHTML(u.userName) + '</span>' +
                            (u.unread ? '<span class="vm-chat-unread">' + u.unread + '</span>' : '') +
                        '</div>' +
                        '<div class="vm-chat-user-email">' + escapeHTML(u.userEmail) + '</div>' +
                        '<div class="vm-chat-user-preview">' + preview + '</div>' +
                        '<div class="vm-chat-user-time">' + escapeHTML(time) + '</div>' +
                    '</div>' +
                '</div>';
            }).join('');

        var conversation = currentUserId
            ? renderConversation(currentUserId)
            : '<div class="vm-chat-empty-conv">' +
                '<i class="bi bi-chat-square-text"></i>' +
                '<p>Chọn một cuộc trò chuyện bên trái để bắt đầu phản hồi.</p>' +
            '</div>';

        return '' +
            '<div class="vm-page-head">' +
                '<div>' +
                    '<h1>Trò chuyện với khách hàng</h1>' +
                    '<p>Phản hồi trực tiếp các cuộc hội thoại từ widget chat của khách.</p>' +
                '</div>' +
                '<div class="vm-page-actions">' +
                    '<div class="vm-kpi-label" style="color:var(--vm-muted)">Tin chưa đọc: <b style="color:var(--vm-danger)">' + totalUnread + '</b></div>' +
                '</div>' +
            '</div>' +
            '<div class="vm-chat-shell">' +
                '<aside class="vm-chat-sidebar">' +
                    '<div class="vm-chat-sidebar-head">' +
                        '<input type="text" placeholder="Tìm khách hàng…" id="adChatSearch">' +
                    '</div>' +
                    '<div class="vm-chat-user-list">' + list + '</div>' +
                '</aside>' +
                '<section class="vm-chat-main">' + conversation + '</section>' +
            '</div>';
    }

    function renderConversation(userId) {
        var user = DB.find('users', Number(userId));
        var thread = ChatStore.getThread(userId);
        var messages = thread.messages || [];

        var msgHtml = messages.length === 0
            ? '<div class="vm-chat-empty-conv" style="padding:30px"><i class="bi bi-chat-dots"></i><p>Chưa có tin nhắn.</p></div>'
            : messages.map(function (m) {
                var mine = m.from === 'admin';
                return '<div class="vm-chat-msg ' + (mine ? 'mine' : 'theirs') + '">' +
                    '<div class="vm-chat-bubble">' + escapeHTML(m.text) + '</div>' +
                    '<div class="vm-chat-time">' + escapeHTML(fmtChatTime(m.at)) + '</div>' +
                '</div>';
            }).join('');

        return '' +
            '<div class="vm-chat-conv-head">' +
                '<div class="vm-chat-user-avatar" style="width:40px;height:40px;font-size:1rem">' +
                    escapeHTML((user ? user.name : '?').charAt(0).toUpperCase()) +
                '</div>' +
                '<div>' +
                    '<div style="font-weight:600">' + escapeHTML(user ? user.name : 'User') + '</div>' +
                    '<div style="font-size:.75rem;color:var(--vm-muted)">' + escapeHTML(user ? user.email : '') + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="vm-chat-conv-body" id="adChatConvBody">' + msgHtml + '</div>' +
            '<div class="vm-chat-conv-foot">' +
                '<input type="text" id="adChatInput" placeholder="Nhập phản hồi…" maxlength="500">' +
                '<button class="vm-btn primary" id="adChatSend"><i class="bi bi-send-fill"></i> Gửi</button>' +
            '</div>';
    }

    function bindConv() {
        var sendBtn = document.getElementById('adChatSend');
        var input = document.getElementById('adChatInput');
        if (sendBtn && input && currentUserId) {
            var uid = currentUserId;
            var doSend = function () {
                var text = (input.value || '').trim();
                if (!text) return;
                ChatStore.push(uid, {
                    from: 'admin',
                    text: text,
                    at: new Date().toISOString(),
                    read: false,
                });
                input.value = '';
                if (window.AdminUI && AdminUI.rerender) AdminUI.rerender();
                else AdminRouter.render();
                setTimeout(scrollConvToBottom, 50);
            };
            sendBtn.addEventListener('click', doSend);
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    doSend();
                }
            });
            input.focus();
        }
        var list = document.querySelectorAll('.vm-chat-user');
        list.forEach(function (el) {
            el.addEventListener('click', function () {
                currentUserId = el.dataset.uid;
                ChatStore.markRead(currentUserId, 'admin');
                AdminRouter.render();
            });
        });
        var search = document.getElementById('adChatSearch');
        if (search) {
            search.addEventListener('input', function () {
                var q = (search.value || '').toLowerCase();
                document.querySelectorAll('.vm-chat-user').forEach(function (el) {
                    var name = el.querySelector('.vm-chat-user-name').textContent.toLowerCase();
                    var email = el.querySelector('.vm-chat-user-email').textContent.toLowerCase();
                    el.style.display = (name.indexOf(q) >= 0 || email.indexOf(q) >= 0) ? '' : 'none';
                });
            });
        }
        scrollConvToBottom();
    }

    function scrollConvToBottom() {
        var body = document.getElementById('adChatConvBody');
        if (body) body.scrollTop = body.scrollHeight;
    }

    AdminRouter.add('/chat', 'Trò chuyện', render);
    AdminRouter.onRender(function (path) {
        if (path === '/chat') {
            setTimeout(bindConv, 10);
        }
    });
})();
