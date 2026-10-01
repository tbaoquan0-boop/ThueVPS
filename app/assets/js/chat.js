/* =========================================================
   chat.js — Chat widget góc phải (user ↔ admin)
   Lưu messages vào localStorage, key: vps_chat_v1
   Class prefix: vm- (tránh uBlock chặn theo "ad-", "chat-*")
   ========================================================= */
'use strict';

const CHAT_KEY = 'vps_chat_v1';

const ChatStore = {
    load() {
        try {
            return JSON.parse(localStorage.getItem(CHAT_KEY)) || { threads: {} };
        } catch (e) {
            return { threads: {} };
        }
    },
    save(data) {
        localStorage.setItem(CHAT_KEY, JSON.stringify(data));
    },
    getThread(userId) {
        const d = this.load();
        if (!d.threads[userId]) {
            d.threads[userId] = { messages: [], unread_admin: 0 };
        }
        return d.threads[userId];
    },
    push(userId, msg) {
        const d = this.load();
        if (!d.threads[userId]) d.threads[userId] = { messages: [], unread_admin: 0 };
        d.threads[userId].messages.push(msg);
        if (msg.from === 'user') d.threads[userId].unread_admin = (d.threads[userId].unread_admin || 0) + 1;
        this.save(d);
    },
    markRead(userId, by) {
        const d = this.load();
        if (!d.threads[userId]) return;
        if (by === 'admin') d.threads[userId].unread_admin = 0;
        else d.threads[userId].unread_user = 0;
        this.save(d);
    },
    listUsers() {
        const d = this.load();
        return Object.keys(d.threads).map(uid => {
            const t = d.threads[uid];
            const last = t.messages[t.messages.length - 1];
            const user = (window.DB && DB.find('users', Number(uid))) || null;
            return {
                userId: Number(uid),
                userName: user ? user.name : 'User #' + uid,
                userEmail: user ? user.email : '',
                lastMessage: last ? last.text : '',
                lastAt: last ? last.at : null,
                unread: t.unread_admin || 0,
                count: t.messages.length,
            };
        }).sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''));
    },
};

const ChatWidget = {
    open: false,
    el: null,

    ensure() {
        if (this.el) return this.el;
        const wrap = document.createElement('div');
        wrap.className = 'vm-widget';
        wrap.innerHTML =
            '<button class="vm-fab" id="cwFab" type="button" aria-label="Mở chat">' +
                '<i class="bi bi-chat-dots-fill"></i>' +
                '<span class="vm-fab-dot" id="cwFabDot" hidden></span>' +
            '</button>' +
            '<div class="vm-panel" id="cwPanel" hidden>' +
                '<div class="vm-head">' +
                    '<div class="vm-head-info">' +
                        '<div class="vm-avatar"><i class="bi bi-headset"></i></div>' +
                        '<div>' +
                            '<div class="vm-head-title">Hỗ trợ trực tuyến</div>' +
                            '<div class="vm-head-sub"><span class="vm-dot-on"></span> Đang hoạt động</div>' +
                        '</div>' +
                    '</div>' +
                    '<button class="vm-close" id="cwClose" type="button" aria-label="Đóng"><i class="bi bi-x-lg"></i></button>' +
                '</div>' +
                '<div class="vm-body" id="cwBody"></div>' +
                '<div class="vm-foot">' +
                    '<input type="text" id="cwInput" placeholder="Nhập tin nhắn…" maxlength="500">' +
                    '<button type="button" id="cwSend"><i class="bi bi-send-fill"></i></button>' +
                '</div>' +
                '<div class="vm-login-tip" id="cwLoginTip" hidden>' +
                    '<i class="bi bi-info-circle"></i> Vui lòng <a href="#/login">đăng nhập</a> để chat với admin.' +
                '</div>' +
            '</div>';
        document.body.appendChild(wrap);
        this.el = wrap;
        this._bind();
        return wrap;
    },

    _bind() {
        const fab = this.el.querySelector('#cwFab');
        const close = this.el.querySelector('#cwClose');
        const send = this.el.querySelector('#cwSend');
        const input = this.el.querySelector('#cwInput');
        fab.addEventListener('click', () => this.toggle());
        close.addEventListener('click', () => this.close());
        send.addEventListener('click', () => this._send());
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this._send();
            }
        });
        window.addEventListener('hashchange', () => this.refresh());
    },

    toggle() {
        if (this.open) this.close(); else this.openPanel();
    },

    openPanel() {
        this.ensure();
        this.el.querySelector('#cwPanel').hidden = false;
        this.open = true;
        this.refresh();
        setTimeout(() => this.el.querySelector('#cwInput').focus(), 50);
    },

    close() {
        if (!this.el) return;
        this.el.querySelector('#cwPanel').hidden = true;
        this.open = false;
    },

    refresh() {
        this.ensure();
        const user = Session.current();
        const tip = this.el.querySelector('#cwLoginTip');
        const input = this.el.querySelector('#cwInput');
        const sendBtn = this.el.querySelector('#cwSend');
        if (!user) {
            tip.hidden = false;
            input.disabled = true;
            sendBtn.disabled = true;
            input.placeholder = 'Đăng nhập để chat…';
        } else {
            tip.hidden = true;
            input.disabled = false;
            sendBtn.disabled = false;
            input.placeholder = 'Nhập tin nhắn…';
        }
        this._renderMessages();
        this._renderFabBadge();
    },

    _renderMessages() {
        const user = Session.current();
        const body = this.el.querySelector('#cwBody');
        if (!body) return;
        let messages = [];
        if (user) {
            const t = ChatStore.getThread(user.id);
            messages = t.messages;
            ChatStore.markRead(user.id, 'user');
        }
        if (!messages.length) {
            body.innerHTML =
                '<div class="vm-empty">' +
                    '<i class="bi bi-chat-square-dots"></i>' +
                    '<p>Xin chào! 👋<br>Hãy gửi câu hỏi, đội ngũ admin sẽ phản hồi trong ít phút.</p>' +
                '</div>';
            return;
        }
        body.innerHTML = messages.map(m => {
            const mine = user && m.from === 'user';
            return '<div class="vm-msg ' + (mine ? 'mine' : 'theirs') + '">' +
                '<div class="vm-bubble">' + escapeHTML(m.text) + '</div>' +
                '<div class="vm-time">' + escapeHTML(fmtChatTime(m.at)) + '</div>' +
            '</div>';
        }).join('');
        body.scrollTop = body.scrollHeight;
    },

    _renderFabBadge() {
        const user = Session.current();
        const dot = this.el && this.el.querySelector('#cwFabDot');
        if (!dot) return;
        if (!user) { dot.hidden = true; return; }
        const t = ChatStore.getThread(user.id);
        const unread = (t.messages || []).filter(m => m.from === 'admin' && !m.read).length;
        dot.hidden = !unread;
    },

    _send() {
        const user = Session.current();
        if (!user) {
            Flash.show('Vui lòng đăng nhập để chat với admin', 'info');
            return;
        }
        const input = this.el.querySelector('#cwInput');
        const text = (input.value || '').trim();
        if (!text) return;
        ChatStore.push(user.id, {
            from: 'user',
            text: text,
            at: new Date().toISOString(),
            read: false,
        });
        this._maybeAutoReply(user.id);
        input.value = '';
        this.refresh();
    },

    _maybeAutoReply(userId) {
        const t = ChatStore.getThread(userId);
        const fromAdmin = t.messages.filter(m => m.from === 'admin').length;
        if (fromAdmin > 0) return;
        setTimeout(() => {
            const cur = ChatStore.getThread(userId);
            const last = cur.messages[cur.messages.length - 1];
            if (last && last.from === 'user') {
                ChatStore.push(userId, {
                    from: 'admin',
                    text: 'Cảm ơn bạn đã liên hệ! Đội ngũ admin sẽ phản hồi trong ít phút. Vui lòng không chia sẻ mật khẩu.',
                    at: new Date().toISOString(),
                    read: false,
                });
                this.refresh();
            }
        }, 3500);
    },
};

function fmtChatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' ' +
        d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

window.ChatStore = ChatStore;
window.ChatWidget = ChatWidget;
window.fmtChatTime = fmtChatTime;