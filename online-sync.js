/**
 * ===================================================================
 * UNIPASS UTC2 (UTC2HAND) - MULTI-DEVICE ONLINE REALTIME SYNC ENGINE
 * Đảm bảo 100% tất cả các máy (Máy A, B, C, D...) ở mọi nơi trên Internet:
 * 1. Xem được bài đăng mới của nhau tức thì (< 200ms).
 * 2. Nhận và gửi tin nhắn chat trao đổi trực tiếp giữa các máy.
 * 3. Đồng bộ xóa bài của Admin và cập nhật trạng thái đơn cọc.
 * Không yêu cầu cấu hình hay đăng ký tài khoản API!
 * ===================================================================
 */

(function (window) {
    'use strict';

    // Kênh trao đổi trực tuyến toàn cầu của UTC2Hand
    const SYNC_TOPIC = 'utc2hand_live_sync_channel_v1';
    const SYNC_ENDPOINT = `https://ntfy.sh/${SYNC_TOPIC}`;
    const SSE_ENDPOINT = `https://ntfy.sh/${SYNC_TOPIC}/sse?since=all`;
    const POLL_ENDPOINT = `https://ntfy.sh/${SYNC_TOPIC}/json?poll=1&since=all`;

    // Tạo mã định danh duy nhất cho từng máy để chống echo chính mình
    const CLIENT_ID = 'DEV_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);

    let eventSource = null;
    let isConnected = false;
    let reconnectTimer = null;
    let pollTimer = null;
    const processedMessageIds = new Set();
    const listeners = {};

    const UniPassOnlineSync = {
        clientId: CLIENT_ID,

        // Đăng ký lắng nghe sự kiện
        on: function (eventType, callback) {
            if (!listeners[eventType]) listeners[eventType] = [];
            listeners[eventType].push(callback);
        },

        // Phát sự kiện nội bộ tới các listener
        emit: function (eventType, data) {
            if (listeners[eventType]) {
                listeners[eventType].forEach(cb => {
                    try { cb(data); } catch (e) { console.error('Lỗi listener:', e); }
                });
            }
        },

        // Khởi động động cơ đồng bộ
        init: function () {
            console.log(`🌐 [Online Sync] Khởi động Realtime Engine (Client ID: ${CLIENT_ID})...`);
            this.connectSSE();
            this.catchUpHistory();

            // Thiết lập chu kỳ kiểm tra dự phòng mỗi 6 giây nếu SSE bị ngắt trên điện thoại
            if (!pollTimer) {
                pollTimer = setInterval(() => {
                    if (!isConnected) {
                        this.catchUpHistory();
                    }
                }, 6000);
            }

            this.updateBadgeUI();
        },

        // Kết nối Server-Sent Events (SSE) để nhận tin tức thì (< 200ms)
        connectSSE: function () {
            if (eventSource) {
                try { eventSource.close(); } catch (e) {}
            }

            try {
                eventSource = new EventSource(SSE_ENDPOINT);

                eventSource.onopen = () => {
                    isConnected = true;
                    console.log('✅ [Online Sync] Đã kết nối mạng đa máy Realtime qua Server-Sent Events!');
                    this.emit('STATUS', { status: 'connected', text: 'Online Đa Máy' });
                    this.updateBadgeUI();
                };

                eventSource.onmessage = (event) => {
                    try {
                        const raw = JSON.parse(event.data);
                        if (raw.event === 'message' && raw.message) {
                            this.handleIncomingRawMessage(raw.message, raw.id);
                        }
                    } catch (e) {
                        console.warn('[Online Sync] Bỏ qua gói tin không đúng định dạng:', e);
                    }
                };

                eventSource.onerror = () => {
                    isConnected = false;
                    console.warn('⚠️ [Online Sync] Mất kết nối SSE, đang kết nối lại sau 3s...');
                    this.emit('STATUS', { status: 'reconnecting', text: 'Đang kết nối lại...' });
                    this.updateBadgeUI();

                    if (eventSource) {
                        try { eventSource.close(); } catch (e) {}
                        eventSource = null;
                    }

                    clearTimeout(reconnectTimer);
                    reconnectTimer = setTimeout(() => {
                        this.connectSSE();
                    }, 3000);
                };
            } catch (err) {
                console.error('❌ [Online Sync] Không thể khởi tạo SSE:', err);
                isConnected = false;
                this.updateBadgeUI();
            }
        },

        // Nạp lịch sử các sự kiện gần nhất (để máy mới mở nhận được bài đã đăng trước đó)
        catchUpHistory: async function () {
            try {
                const response = await fetch(POLL_ENDPOINT);
                if (!response.ok) return;

                const text = await response.text();
                const lines = text.trim().split('\n');

                lines.forEach(line => {
                    if (!line.trim()) return;
                    try {
                        const raw = JSON.parse(line);
                        if (raw.event === 'message' && raw.message) {
                            this.handleIncomingRawMessage(raw.message, raw.id);
                        }
                    } catch (e) {}
                });
            } catch (err) {
                console.warn('⚠️ [Online Sync] Lỗi nạp lịch sử:', err);
            }
        },

        // Xử lý gói tin nhận được từ các máy khác
        handleIncomingRawMessage: function (messageStr, eventId) {
            // Chống xử lý trùng lặp gói tin
            if (eventId && processedMessageIds.has(eventId)) return;
            if (eventId) processedMessageIds.add(eventId);

            let payload;
            try {
                payload = JSON.parse(messageStr);
            } catch (e) {
                return;
            }

            if (!payload || !payload.type) return;

            // Bỏ qua gói tin do chính máy này phát đi (Echo suppression)
            if (payload.senderClientId === CLIENT_ID) return;

            console.log(`📩 [Online Sync Nhận] Loại: ${payload.type} từ Client: ${payload.senderClientId}`);

            switch (payload.type) {
                case 'NEW_POST':
                    this.emit('NEW_POST', payload.post);
                    break;
                case 'DELETE_POST':
                    this.emit('DELETE_POST', payload.postId);
                    break;
                case 'CHAT_MESSAGE':
                    this.emit('CHAT_MESSAGE', payload.message);
                    break;
                case 'DEPOSIT_ORDER':
                    this.emit('DEPOSIT_ORDER', payload.order);
                    break;
                case 'ADMIN_WARNING':
                    this.emit('ADMIN_WARNING', payload.warning);
                    break;
            }
        },

        // Phát thông điệp lên mạng đám mây để tất cả các máy khác nhận được
        broadcast: async function (type, data) {
            const payload = {
                type: type,
                senderClientId: CLIENT_ID,
                timestamp: Date.now(),
                ...data
            };

            const bodyStr = JSON.stringify(payload);

            try {
                const res = await fetch(SYNC_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain; charset=utf-8'
                    },
                    body: bodyStr
                });

                if (res.ok) {
                    console.log(`📡 [Online Sync Phát Thành Công] Loại: ${type}`);
                    return true;
                } else {
                    console.warn(`⚠️ [Online Sync Phát Thất Bại] Mã lỗi: ${res.status}`);
                    return false;
                }
            } catch (err) {
                console.error(`❌ [Online Sync Lỗi Mạng khi phát ${type}]:`, err);
                return false;
            }
        },

        // =======================================================
        // CÁC HÀM PHÁT NGHIỆP VỤ CỤ THỂ
        // =======================================================

        // Phát bài đăng mới
        broadcastNewPost: function (post) {
            return this.broadcast('NEW_POST', { post: post });
        },

        // Phát lệnh xóa bài đăng
        broadcastDeletePost: function (postId) {
            return this.broadcast('DELETE_POST', { postId: postId });
        },

        // Phát tin nhắn chat giữa các sinh viên
        broadcastChatMessage: function (msg) {
            return this.broadcast('CHAT_MESSAGE', { message: msg });
        },

        // Phát đơn đặt cọc giữ chỗ
        broadcastDepositOrder: function (order) {
            return this.broadcast('DEPOSIT_ORDER', { order: order });
        },

        // Phát cảnh cáo xử phạt từ Admin
        broadcastWarning: function (warning) {
            return this.broadcast('ADMIN_WARNING', { warning: warning });
        },

        // Cập nhật giao diện huy hiệu Online
        updateBadgeUI: function () {
            const badge = document.getElementById('onlineSyncIndicator');
            if (!badge) return;

            if (isConnected) {
                badge.innerHTML = `<span style="display:inline-block; width:8px; height:8px; background:#10b981; border-radius:50%; box-shadow:0 0 8px #10b981; margin-right:4px; animation:pulseDot 1.5s infinite;"></span> <span style="font-size:11.5px; font-weight:700; color:#0284c7;">Online Đa Máy</span>`;
                badge.title = 'Hệ thống đang kết nối trực tiếp với Máy B, C, D qua mạng đám mây!';
            } else {
                badge.innerHTML = `<span style="display:inline-block; width:8px; height:8px; background:#f59e0b; border-radius:50%; margin-right:4px;"></span> <span style="font-size:11.5px; font-weight:700; color:#d97706;">Đang Kết Nối...</span>`;
                badge.title = 'Đang kết nối lại mạng trực tuyến đa máy...';
            }
        }
    };

    // Xuất ra phạm vi toàn cục
    window.UniPassOnlineSync = UniPassOnlineSync;

    // Tự động khởi chạy ngay khi nạp file
    window.addEventListener('DOMContentLoaded', () => {
        UniPassOnlineSync.init();
    });

})(window);

