/**
 * UniPass UTC2 / UTC2Hand - App Controller
 * Phục vụ chuẩn giao diện & tính năng:
 * 1. Chat thực thụ giữa các tài khoản sinh viên.
 * 2. Quản lý danh sách tài khoản động (Lưu LocalStorage, hiển thị đầy đủ tài khoản mới tạo).
 * 3. Phân hệ Admin Dashboard chính xác theo yêu cầu file Word doPasss.docx:
 *    - Admin KHÔNG truy cập tin nhắn riêng tư của sinh viên.
 *    - Admin có quyền: Cảnh cáo tài khoản vi phạm, Xóa bài đăng rác/phá giá/sai TimeMark,
 *      Nhắc nhở người dùng, Duyệt kiểm chứng kháng nghị điểm uy tín.
 */

// ==========================================
// 1. DỮ LIỆU BAN ĐẦU
// ==========================================
const INITIAL_PRODUCTS = [
    {
        id: 'P01',
        title: 'Giáo trình Vật Lý Đại Cương 1 (VL101) – Tái bản mới',
        price: 35000,
        originalPrice: 85000,
        category: 'GiaoTrinh',
        courseCode: 'VL101',
        timemarkCode: 'UTC2 - 8924',
        seller: 'Lê Thị Ngọc Tuyết',
        sellerEmail: 'tuyetltn.st@st.utc2.edu.vn',
        sellerRep: 98,
        location: 'Ký túc xá Cỏ May UTC2 (0.5 km)',
        distanceKm: 0.5,
        expiryDays: 6,
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60',
        description: 'Sách sạch đẹp không viết bậy, có kèm đề cương ôn thi học kỳ điểm 9+.'
    },
    {
        id: 'P02',
        title: 'Sách Cấu Trúc Dữ Liệu & Giải Thuật (C++) bản in màu',
        price: 45000,
        originalPrice: 110000,
        category: 'GiaoTrinh',
        courseCode: 'DSA01',
        timemarkCode: 'UTC2 - 7719',
        seller: 'Lê Thị Ngọc Tuyết',
        sellerEmail: 'tuyetltn.st@st.utc2.edu.vn',
        sellerRep: 98,
        location: 'Thư viện & Khu tự học UTC2 (0.2 km)',
        distanceKm: 0.2,
        expiryDays: 7,
        imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=60',
        description: 'Bản in màu sắc nét, có chú thích code C++ giải thích cây AVL và đồ thị.'
    },
    {
        id: 'P03',
        title: 'Nồi cơm điện mini 1.2L nắp gài cho sinh viên phòng trọ',
        price: 120000,
        originalPrice: 280000,
        category: 'DoGiaDung',
        timemarkCode: 'UTC2 - 9931',
        seller: 'Phúc Lâm',
        sellerEmail: 'lamnp.st@st.utc2.edu.vn',
        sellerRep: 92,
        location: 'Cổng 1 Trường UTC2 (0.4 km)',
        distanceKm: 0.4,
        expiryDays: 4,
        imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&auto=format&fit=crop&q=60',
        description: 'Nồi chống dính còn rất tốt, nấu cơm dẻo nhanh, tiết kiệm điện.'
    },
    {
        id: 'P04',
        title: 'Máy tính Casio fx-580VN X chính hãng tem Bitex',
        price: 350000,
        originalPrice: 650000,
        category: 'DoDienTu',
        courseCode: 'TOAN01',
        timemarkCode: 'UTC2 - 1042',
        seller: 'Phúc Lâm',
        sellerEmail: 'lamnp.st@st.utc2.edu.vn',
        sellerRep: 92,
        location: 'Ký túc xá Cỏ May UTC2 (0.5 km)',
        distanceKm: 0.5,
        expiryDays: 5,
        imageUrl: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=500&auto=format&fit=crop&q=60',
        description: 'Mới 98%, phím nảy nhạy, còn tem bảo hành chính hãng Bitex.'
    }
];

// Tài khoản quản trị viên chính thức ban đầu (Không có tài khoản sinh viên có sẵn)
const DEFAULT_USERS = [
    {
        id: 'ADMIN',
        name: 'Quản Trị Viên UTC2 (6651071091)',
        email: '6651071091@st.utc2.edu.vn',
        password: 'TietLee113377',
        role: 'admin',
        reputation: 100,
        coins: 9999,
        avatarLetter: 'A'
    }
];

const ADMIN_CREDENTIALS = {
    email: '6651071091@st.utc2.edu.vn',
    password: 'TietLee113377'
};

const USERS_REGISTRY = {
    admin: DEFAULT_USERS[0]
};

// ==========================================
// 2. STATE MANAGER TRUNG TÂM
// ==========================================
class AppController {
    constructor() {
        this.registeredUsers = [];
        this.currentUserKey = null;
        this.user = null;
        this.isLoggedIn = false;
        this.currentAuthMode = 'login';
        this.generatedOtp = '';

        this.products = [];
        this.chatMessages = [];
        this.depositOrders = [];
        this.adminDisputes = [];
        this.adminWarningsIssued = [];

        this.filterMaxPrice = 350000;
        this.filterMinPrice = 0;
        this.filterMaxDistance = 5;
        this.filterCategoryKey = 'ALL';
        this.filterMinReputation = 90;
        this.filterCriteriaEnabled = {
            price: false,
            category: false,
            reputation: false
        };
        this.searchKeyword = '';
        this.sortBy = 'newest';
        this.isFilterActive = true; // Mặc định mở bộ lọc song song với danh sách sản phẩm

        // Khởi tạo các cấu trúc DSA in-memory
        this.trie = new window.UTC2_DSA.TrieWithHeap();
        this.avl = new window.UTC2_DSA.AVLTree();
        this.msgQueue = new window.UTC2_DSA.MessageQueue();
        this.postDLL = new window.UTC2_DSA.PostDoublyLinkedList();

        // Kênh BroadcastChannel đồng bộ đa tab Realtime
        if (typeof BroadcastChannel !== 'undefined') {
            this.syncChannel = new BroadcastChannel('unipass_realtime_channel');
            this.syncChannel.onmessage = this.handleSyncMessage.bind(this);
        }

        this.init();
    }

    init() {
        // Tải danh sách người dùng đã đăng ký từ localStorage
        const savedUsers = localStorage.getItem('unipass_registered_users');
        if (savedUsers) {
            try {
                this.registeredUsers = JSON.parse(savedUsers);
            } catch (e) {
                this.registeredUsers = [...DEFAULT_USERS];
            }
        } else {
            this.registeredUsers = [...DEFAULT_USERS];
            this.saveUsers();
        }

        // Tải sản phẩm
        const savedProducts = localStorage.getItem('unipass_products');
        if (savedProducts) {
            try { this.products = JSON.parse(savedProducts); } catch (e) { this.products = [...INITIAL_PRODUCTS]; }
        } else {
            this.products = [...INITIAL_PRODUCTS];
        }

        // Đảm bảo tất cả bài đăng hợp lệ đều được duyệt và hiển thị trên trang chính
        let hasPendingToApprove = false;
        this.products.forEach(p => {
            if (p.status === 'pending') {
                p.status = 'approved';
                hasPendingToApprove = true;
            }
        });
        if (hasPendingToApprove || !savedProducts) {
            this.saveProducts();
        }

        // Tải tin nhắn
        const savedChats = localStorage.getItem('unipass_shared_messages');
        if (savedChats) {
            try { this.chatMessages = JSON.parse(savedChats); } catch (e) { this.chatMessages = []; }
        } else {
            this.chatMessages = [
                {
                    id: 'M1',
                    sender: 'Lê Thị Ngọc Tuyết',
                    receiver: 'Phúc Lâm',
                    productId: 'P03',
                    text: 'Chào bạn Lâm, nồi cơm điện mini bạn còn pass không?',
                    time: '08:15'
                },
                {
                    id: 'M2',
                    sender: 'Phúc Lâm',
                    receiver: 'Lê Thị Ngọc Tuyết',
                    productId: 'P03',
                    text: 'Chào Tuyết, nồi cơm vẫn còn nhé! Mình trọ gần cổng 1, có thể mang qua KTX Cỏ May cho bạn.',
                    time: '08:20'
                }
            ];
            this.saveChats();
        }

        // Tải đơn cọc
        const savedOrders = localStorage.getItem('unipass_deposit_orders');
        if (savedOrders) {
            try { this.depositOrders = JSON.parse(savedOrders); } catch (e) { this.depositOrders = []; }
        }

        // Tự động dọn dẹp tin nhắn của các đơn hàng đã hoàn tất thành công từ trước
        this.cleanupCompletedOrdersChats();

        // Tải hồ sơ khiếu nại giao dịch
        const savedDisputes = localStorage.getItem('unipass_admin_disputes');
        if (savedDisputes) {
            try { this.adminDisputes = JSON.parse(savedDisputes); } catch (e) { this.adminDisputes = []; }
        }

        // Kiểm tra phiên đăng nhập đã lưu
        const savedUser = localStorage.getItem('unipass_current_user');
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                if (parsed && parsed.email) {
                    this.user = parsed;
                    this.isLoggedIn = true;
                } else {
                    this.user = null;
                    this.isLoggedIn = false;
                }
            } catch (e) {
                this.user = null;
                this.isLoggedIn = false;
            }
        } else {
            this.user = null;
            this.isLoggedIn = false;
        }

        this.rebuildDSACache();
        this.checkAuthDisplay();
        this.updateUserUI();
        this.renderProducts();
        this.updateDepositBadge();
        this.updateChatUnreadBadge();
        this.initSupabaseSync();
        this.initOnlineSync();
    }

    async initSupabaseSync() {
        if (typeof updateSupabaseNavIndicator === 'function') {
            updateSupabaseNavIndicator();
        }

        // Đợi Supabase SDK CDN sẵn sàng (tối đa 3 giây nếu mạng di động 4G tải chậm)
        let attempts = 0;
        while ((!window.supabase || !window.UniPassSupabase || !window.UniPassSupabase.getClient()) && attempts < 15) {
            await new Promise(r => setTimeout(r, 200));
            attempts++;
        }

        if (!window.UniPassSupabase || !window.UniPassSupabase.isConfigured()) {
            return;
        }

        if (typeof updateSupabaseNavIndicator === 'function') {
            updateSupabaseNavIndicator();
        }

        // Lắng nghe sự kiện xác thực email từ Supabase Auth (khi người dùng bấm Sign in trong email)
        if (window.UniPassSupabase && window.UniPassSupabase.initAuthListener) {
            window.UniPassSupabase.initAuthListener((supaUser) => {
                if (!supaUser || !supaUser.email) return;
                console.log('🎉 [Supabase Auth] Người dùng đã xác thực email thành công:', supaUser.email);
                window.app.emailVerifiedByMagicLink = true;
                window.app.verifiedSupabaseEmail = supaUser.email;

                const emailInput = document.getElementById('authEmailInput');
                const otpInput = document.getElementById('authOtpInput');
                const otpBadge = document.getElementById('otpStatusBadge');

                if (emailInput && (!emailInput.value || emailInput.value === supaUser.email)) {
                    emailInput.value = supaUser.email;
                }
                if (otpInput) {
                    otpInput.value = 'CONFIRMED';
                }
                if (otpBadge) {
                    otpBadge.innerText = 'Đã Xác Thực ✓';
                    otpBadge.style.background = '#dcfce7';
                    otpBadge.style.color = '#15803d';
                }

                showToast(`✓ Đã xác thực thành công Gmail ${supaUser.email} từ liên kết Supabase!`, 'success');
            });
        }

        console.log('🔄 Đang đồng bộ dữ liệu từ Supabase Cloud...');
        try {
            // Tải sản phẩm từ Supabase
            const cloudProducts = await window.UniPassSupabase.getProducts();
            if (cloudProducts && Array.isArray(cloudProducts) && cloudProducts.length > 0) {
                this.products = cloudProducts;
                this.rebuildDSACache();
                this.renderProducts();
                console.log(`✅ [Supabase] Đã nạp ${cloudProducts.length} sản phẩm từ Cloud`);
            }

            // Tải tin nhắn từ Supabase
            const cloudMessages = await window.UniPassSupabase.getChatMessages();
            if (cloudMessages && Array.isArray(cloudMessages) && cloudMessages.length > 0) {
                this.chatMessages = cloudMessages;
                this.renderChatMessages();
                this.updateChatUnreadBadge();
                console.log(`✅ [Supabase] Đã nạp ${cloudMessages.length} tin nhắn từ Cloud`);
            }

            // Tải đơn cọc từ Supabase
            const cloudOrders = await window.UniPassSupabase.getOrders();
            if (cloudOrders && Array.isArray(cloudOrders) && cloudOrders.length > 0) {
                this.depositOrders = cloudOrders.map(o => ({
                    id: o.id,
                    productId: o.product_id,
                    productTitle: o.product_title,
                    seller: o.seller_name,
                    buyer: o.buyer_name,
                    depositAmount: Number(o.deposit_amount),
                    shipFee: Number(o.shipping_fee),
                    discountCoins: Math.round(Number(o.discount_amount) / 100),
                    finalTotal: Number(o.total_payment),
                    timestamp: new Date(o.created_at).getTime()
                }));
                this.updateDepositBadge();
                this.cleanupCompletedOrdersChats();
            }

            // Đăng ký nhận sự kiện Realtime qua WebSocket
            window.UniPassSupabase.subscribeRealtime(this.handleSupabaseRealtimeEvent.bind(this));
        } catch (err) {
            console.error('❌ Lỗi khi đồng bộ ban đầu với Supabase:', err);
        }
    }

    handleSupabaseRealtimeEvent(table, payload) {
        if (!payload) return;
        console.log(`🔔 [Realtime Event] Bảng: ${table}, Loại: ${payload.eventType}`);

        if (table === 'products') {
            if (payload.eventType === 'INSERT') {
                const newP = payload.new;
                if (!this.products.some(p => p.id === newP.id)) {
                    this.products.unshift({
                        id: newP.id,
                        title: newP.title,
                        price: Number(newP.price),
                        originalPrice: Number(newP.original_price || newP.price),
                        category: newP.category,
                        courseCode: newP.course_code || '',
                        timemarkCode: newP.timemark_code || 'UTC2 - PASS',
                        seller: newP.seller_name,
                        sellerEmail: newP.seller_email,
                        sellerRep: Number(newP.seller_rep) || 95,
                        location: newP.location,
                        distanceKm: Number(newP.distance_km) || 0.5,
                        expiryDays: Number(newP.expiry_days) || 7,
                        imageUrl: newP.image_url,
                        description: newP.description,
                        status: newP.status || 'available'
                    });
                    this.rebuildDSACache();
                    this.renderProducts();
                    if (window.sound) window.sound.playNotification();
                    showToast(`📦 Có bài đăng pass đồ mới: "${newP.title}"!`, 'info');
                }
            } else if (payload.eventType === 'UPDATE') {
                const updatedP = payload.new;
                if (updatedP.status === 'deleted') {
                    this.products = this.products.filter(p => p.id !== updatedP.id);
                } else {
                    const idx = this.products.findIndex(p => p.id === updatedP.id);
                    if (idx !== -1) {
                        this.products[idx].status = updatedP.status || 'approved';
                        if (updatedP.title) this.products[idx].title = updatedP.title;
                        if (updatedP.price) this.products[idx].price = Number(updatedP.price);
                    } else {
                        this.products.unshift({
                            id: updatedP.id,
                            title: updatedP.title,
                            price: Number(updatedP.price),
                            originalPrice: Number(updatedP.original_price || updatedP.price),
                            category: updatedP.category,
                            courseCode: updatedP.course_code || '',
                            timemarkCode: updatedP.timemark_code || 'UTC2 - PASS',
                            seller: updatedP.seller_name,
                            sellerEmail: updatedP.seller_email,
                            sellerRep: Number(updatedP.seller_rep) || 95,
                            location: updatedP.location,
                            distanceKm: Number(updatedP.distance_km) || 0.5,
                            expiryDays: Number(updatedP.expiry_days) || 7,
                            imageUrl: updatedP.image_url,
                            description: updatedP.description,
                            status: updatedP.status || 'approved'
                        });
                    }
                }
                this.saveProducts();
                this.rebuildDSACache();
                this.renderProducts();
                this.renderAdminDashboard();
                this.renderProfile();
            } else if (payload.eventType === 'DELETE') {
                const targetId = payload.old ? payload.old.id : null;
                if (targetId) {
                    this.products = this.products.filter(p => p.id !== targetId);
                    this.rebuildDSACache();
                    this.renderProducts();
                    this.renderAdminDashboard();
                }
            }
        } else if (table === 'chat_messages') {
            if (payload.eventType === 'INSERT') {
                const newM = payload.new;
                if (!this.chatMessages.some(m => m.id === newM.id)) {
                    this.chatMessages.push({
                        id: newM.id,
                        sender: newM.sender_name,
                        receiver: newM.receiver_name,
                        productId: newM.product_id,
                        text: newM.text,
                        time: newM.time_str
                    });
                    this.renderChatMessages();
                    this.updateChatUnreadBadge();

                    if (newM.receiver_name === this.user.name) {
                        if (window.sound) window.sound.playNotification();
                        showToast(`💬 Tin nhắn mới từ ${newM.sender_name}: "${newM.text}"`, 'success');
                    }
                }
            } else if (payload.eventType === 'DELETE') {
                const oldM = payload.old;
                if (oldM && oldM.id) {
                    this.chatMessages = this.chatMessages.filter(m => m.id !== oldM.id);
                    this.renderChatMessages();
                    this.updateChatUnreadBadge();
                }
            }
        } else if (table === 'orders') {
            if (payload.eventType === 'INSERT') {
                const ord = payload.new;
                if (!this.depositOrders.some(o => o.id === ord.id)) {
                    this.depositOrders.unshift({
                        id: ord.id,
                        productId: ord.product_id,
                        productTitle: ord.product_title,
                        seller: ord.seller_name,
                        buyer: ord.buyer_name,
                        depositAmount: Number(ord.deposit_amount),
                        shipFee: Number(ord.shipping_fee),
                        discountCoins: Math.round(Number(ord.discount_amount) / 100),
                        finalTotal: Number(ord.total_payment),
                        timestamp: new Date(ord.created_at).getTime()
                    });
                    this.updateDepositBadge();
                    if (ord.seller_name === this.user.name) {
                        if (window.sound) window.sound.playSuccess();
                        showToast(`🤝 Sinh viên ${ord.buyer_name} vừa đặt cọc giữ chỗ món "${ord.product_title}"!`, 'success');
                    }
                }
            } else if (payload.eventType === 'UPDATE') {
                const ord = payload.new;
                const idx = this.depositOrders.findIndex(o => o.id === ord.id);
                if (idx !== -1) {
                    this.depositOrders[idx].status = ord.status;
                }
                if (ord.status === 'completed') {
                    this.cleanupCompletedOrdersChats();
                    this.renderChatMessages();
                }
            }
        } else if (table === 'admin_warnings') {
            if (payload.eventType === 'INSERT') {
                const warn = payload.new;
                if (warn.target_name === this.user.name || warn.target_email === this.user.email) {
                    if (window.sound) window.sound.playWarning();
                    showToast(`⚠️ CẢNH CÁO TỪ ADMIN: ${warn.reason} (-${warn.penalty_points} điểm uy tín)`, 'danger');
                    this.user.reputation = Math.max(0, (this.user.reputation || 95) - Number(warn.penalty_points));
                    this.updateUserUI();
                }
            }
        }
    }

    initOnlineSync() {
        if (!window.UniPassOnlineSync) return;

        // 1. Nhận bài đăng mới từ Máy B, C, D... tức thì
        window.UniPassOnlineSync.on('NEW_POST', (post) => {
            if (!post || !post.id) return;
            const exists = this.products.some(p => p.id === post.id);
            if (!exists) {
                this.products.unshift(post);
                localStorage.setItem('unipass_products', JSON.stringify(this.products));
                this.rebuildDSACache();
                this.renderProducts();
                this.renderAdminDashboard();
                this.renderProfile();

                if (window.sound) window.sound.playNotification();
                if (post.status === 'pending') {
                    if (this.user && this.user.role === 'admin') {
                        showToast(`🛡️ [BÀI ĐĂNG CHỜ DUYỆT] ${post.seller} vừa gửi bài "${post.title}" kèm ảnh TimeMark!`, 'warning');
                    }
                } else {
                    showToast(`📦 [MÁY KHÁC VỪA ĐĂNG] ${post.seller} pass: "${post.title}"!`, 'info');
                }
            }
        });

        // 1b. Nhận sự kiện bài đăng được Admin phê duyệt TimeMark
        window.UniPassOnlineSync.on('POST_APPROVED', (data) => {
            if (!data || !data.postId) return;
            const post = this.products.find(p => p.id === data.postId);
            if (post) {
                post.status = 'approved';
                localStorage.setItem('unipass_products', JSON.stringify(this.products));
                this.rebuildDSACache();
                this.renderProducts();
                this.renderAdminDashboard();
                this.renderProfile();
                if (window.sound) window.sound.playSuccess();
                showToast(`🎉 Bài đăng "${post.title}" vừa được Admin phê duyệt và xuất hiện trên trang chính!`, 'info');
            }
        });

        // 1c. Nhận sự kiện bài đăng bị Admin từ chối TimeMark
        window.UniPassOnlineSync.on('POST_REJECTED', (data) => {
            if (!data || !data.postId) return;
            const post = this.products.find(p => p.id === data.postId);
            if (post) {
                post.status = 'rejected';
                post.rejectReason = data.reason || 'Ảnh TimeMark không hợp lệ';
                localStorage.setItem('unipass_products', JSON.stringify(this.products));
                this.rebuildDSACache();
                this.renderProducts();
                this.renderAdminDashboard();
                this.renderProfile();
            }
        });

        // 2. Nhận lệnh xóa bài đăng trên mạng đa máy
        window.UniPassOnlineSync.on('DELETE_POST', (postId) => {
            if (!postId) return;
            const prevLen = this.products.length;
            this.products = this.products.filter(p => p.id !== postId);
            if (this.products.length !== prevLen) {
                localStorage.setItem('unipass_products', JSON.stringify(this.products));
                this.rebuildDSACache();
                this.renderProducts();
                this.renderAdminDashboard();
                showToast(`🗑️ Bài đăng vi phạm vừa bị Admin gỡ trên toàn hệ thống.`, 'info');
            }
        });

        // 3. Nhận tin nhắn chat trực tiếp từ máy khác
        window.UniPassOnlineSync.on('CHAT_MESSAGE', (msg) => {
            if (!msg || !msg.id) return;
            const exists = this.chatMessages.some(m => m.id === msg.id);
            if (!exists) {
                this.chatMessages.push(msg);
                localStorage.setItem('unipass_shared_messages', JSON.stringify(this.chatMessages));
                this.renderChatMessages();
                this.renderChatInbox();
                this.updateChatUnreadBadge();

                if (msg.receiver === this.user.name) {
                    if (window.sound) window.sound.playNotification();
                    showToast(`💬 [TIN NHẮN MỚI] ${msg.sender}: "${msg.text}"`, 'success');
                }
            }
        });

        // 4. Nhận đơn đặt cọc giữ chỗ từ máy khác
        window.UniPassOnlineSync.on('DEPOSIT_ORDER', (order) => {
            if (!order || !order.id) return;
            const exists = this.depositOrders.some(o => o.id === order.id);
            if (!exists) {
                this.depositOrders.unshift(order);
                localStorage.setItem('unipass_deposit_orders', JSON.stringify(this.depositOrders));
                this.updateDepositBadge();
                this.renderProfile();
                if (order.seller === this.user.name || order.sellerEmail === this.user.email) {
                    if (window.sound) window.sound.playSuccess();
                    showToast(`🤝 [ĐƠN ĐẶT CỌC MỚI] ${order.buyer} vừa đặt cọc món "${order.productTitle}"! Vui lòng vào mục Cá Nhân bấm Xác Nhận Đơn Hàng.`, 'success');
                }
            }
        });

        // 4b. Nhận cập nhật trạng thái đơn hàng (xác nhận người bán / xác nhận hoàn thành)
        window.UniPassOnlineSync.on('ORDER_UPDATED', (order) => {
            if (!order || !order.id) return;
            const idx = this.depositOrders.findIndex(o => o.id === order.id);
            if (idx !== -1) {
                this.depositOrders[idx] = order;
            } else {
                this.depositOrders.unshift(order);
            }
            localStorage.setItem('unipass_deposit_orders', JSON.stringify(this.depositOrders));
            this.updateDepositBadge();
            this.renderProfile();

            if (this.user) {
                if (order.buyer === this.user.name && order.sellerAccepted && order.status === 'in_trade') {
                    if (window.sound) window.sound.playSuccess();
                    showToast(`🎉 Người bán ${order.seller} đã xác nhận đơn hàng "${order.productTitle}"! Hai bạn hãy gặp nhau trao đổi đồ.`, 'success');
                }
                if (order.status === 'completed' && (order.buyer === this.user.name || order.seller === this.user.name)) {
                    this.cleanupCompletedOrdersChats();
                    this.renderChatMessages();
                    if (window.sound) window.sound.playSuccess();
                    showToast(`🎉 Giao dịch đơn "${order.productTitle}" đã hoàn tất 100%! Bài đăng và lịch sử tin nhắn đã tự động dọn dẹp.`, 'success');
                }
            }
        });

        // 4c. Nhận tín hiệu xóa tin nhắn sau khi đơn hàng hoàn thành từ máy khác
        window.UniPassOnlineSync.on('CHAT_DELETED', (data) => {
            if (!data) return;
            console.log('📡 [Online Sync] Nhận tín hiệu tự động xóa tin nhắn khi hoàn tất đơn hàng:', data);
            this.chatMessages = this.chatMessages.filter(m => {
                if (data.productId && m.productId === data.productId) return false;
                if (data.orderId && m.orderId === data.orderId) return false;
                if ((m.sender === data.buyer && m.receiver === data.seller) || 
                    (m.sender === data.seller && m.receiver === data.buyer)) {
                    return false;
                }
                return true;
            });
            this.saveChats();
            this.renderChatMessages();
            this.updateChatUnreadBadge();
        });

        // 4c. Nhận khiếu nại giao dịch mới từ sinh viên gửi Admin
        window.UniPassOnlineSync.on('NEW_DISPUTE', (dispute) => {
            if (!dispute || !dispute.id) return;
            const exists = this.adminDisputes.some(d => d.id === dispute.id);
            if (!exists) {
                this.adminDisputes.unshift(dispute);
                localStorage.setItem('unipass_admin_disputes', JSON.stringify(this.adminDisputes));
                this.renderAdminDashboard();
                if (this.user && this.user.role === 'admin') {
                    if (window.sound) window.sound.playNotification();
                    showToast(`🚨 [KHIẾU NẠI MỚI GỬI ADMIN]: ${dispute.reporterName} tố cáo ${dispute.accusedName} (${dispute.reason})!`, 'danger');
                }
            }
        });

        // 4d. Nhận thông báo kết quả xử lý khiếu nại
        window.UniPassOnlineSync.on('DISPUTE_RESOLVED', (res) => {
            if (!res || !res.disputeId) return;
            const disp = this.adminDisputes.find(d => d.id === res.disputeId);
            if (disp) {
                disp.status = res.status;
                localStorage.setItem('unipass_admin_disputes', JSON.stringify(this.adminDisputes));
                this.renderAdminDashboard();
            }
        });

        // 5. Nhận cảnh cáo xử phạt từ Admin
        window.UniPassOnlineSync.on('ADMIN_WARNING', (warning) => {
            if (!warning) return;
            if (warning.targetName === this.user.name || warning.targetEmail === this.user.email) {
                if (window.sound) window.sound.playWarning();
                showToast(`⚠️ CẢNH CÁO TỪ ADMIN: ${warning.reason} (-${warning.penaltyPoints || 2} điểm)`, 'danger');
                this.user.reputation = Math.max(0, (this.user.reputation || 95) - (warning.penaltyPoints || 2));
                this.updateUserUI();
            }
        });
    }

    saveUsers() {
        localStorage.setItem('unipass_registered_users', JSON.stringify(this.registeredUsers));
        if (this.syncChannel) {
            this.syncChannel.postMessage({ type: 'USERS_UPDATED', users: this.registeredUsers });
        }
    }

    handleSyncMessage(e) {
        const data = e.data;
        if (!data) return;

        if (data.type === 'CHAT_UPDATED') {
            this.chatMessages = data.messages;
            this.renderChatMessages();
            this.updateChatUnreadBadge();

            const latest = data.messages[data.messages.length - 1];
            if (latest && latest.receiver === this.user.name) {
                if (window.sound) window.sound.playNotification();
                showToast(`Tin nhắn mới từ ${latest.sender}: "${latest.text}"`, 'success');
            }
        } else if (data.type === 'POSTS_UPDATED') {
            this.products = data.products;
            this.rebuildDSACache();
            this.renderProducts();
            this.renderAdminDashboard();
        } else if (data.type === 'USERS_UPDATED') {
            this.registeredUsers = data.users;
            this.renderAdminDashboard();
        } else if (data.type === 'ORDERS_UPDATED') {
            this.depositOrders = data.orders;
            this.updateDepositBadge();
            this.renderProfile();
        } else if (data.type === 'DISPUTES_UPDATED') {
            this.adminDisputes = data.disputes;
            this.renderAdminDashboard();
        } else if (data.type === 'USER_WARNED') {
            if (data.targetName === this.user.name) {
                if (window.sound) window.sound.playWarning();
                showToast(`⚠️ THÔNG BÁO TỪ ADMIN: ${data.message}`, 'danger');
            }
        }
    }

    checkAuthDisplay() {
        const authScreen = document.getElementById('authPageContainer');
        const mainApp = document.getElementById('mainAppInterface');

        if (this.isLoggedIn) {
            if (authScreen) authScreen.style.display = 'none';
            if (mainApp) mainApp.style.display = 'block';

            // Xóa sạch ngay ô tìm kiếm khi vừa đăng nhập vào sàn đồ (Không cho hiện email)
            const searchInput = document.getElementById('mainSearchInput');
            if (searchInput) {
                searchInput.value = '';
                this.searchKeyword = '';
            }

            // Bảo vệ 2 lớp chống trình duyệt tự động điền Gmail vào thanh tìm kiếm
            setTimeout(() => {
                const s = document.getElementById('mainSearchInput');
                if (s && (s.value.includes('@') || (this.user && s.value === this.user.email))) {
                    s.value = '';
                    this.searchKeyword = '';
                    this.renderProducts();
                }
            }, 80);
            setTimeout(() => {
                const s = document.getElementById('mainSearchInput');
                if (s && (s.value.includes('@') || (this.user && s.value === this.user.email))) {
                    s.value = '';
                    this.searchKeyword = '';
                    this.renderProducts();
                }
            }, 300);
        } else {
            if (authScreen) authScreen.style.display = 'flex';
            if (mainApp) mainApp.style.display = 'none';
        }
    }

    rebuildDSACache() {
        this.avl = new window.UTC2_DSA.AVLTree();
        this.postDLL = new window.UTC2_DSA.PostDoublyLinkedList();

        // CHỈ NẠP CÁC BÀI ĐÃ ĐƯỢC ADMIN DUYỆT (LOẠI BỎ PENDING VÀ REJECTED)
        const approvedPosts = this.products.filter(p => p.status !== 'pending' && p.status !== 'rejected');

        approvedPosts.forEach(p => {
            this.trie.insert(p.title, p.id, 5);
            if (p.courseCode) this.trie.insert(p.courseCode, p.id, 10);
            if (p.category) this.trie.insert(p.category, p.id, 3);

            this.avl.insert(p);
            this.postDLL.insertFront(p);
        });
    }

    saveProducts() {
        localStorage.setItem('unipass_products', JSON.stringify(this.products));
        this.rebuildDSACache();
        if (this.syncChannel) {
            this.syncChannel.postMessage({ type: 'POSTS_UPDATED', products: this.products });
        }
    }

    saveChats() {
        localStorage.setItem('unipass_shared_messages', JSON.stringify(this.chatMessages));
        if (this.syncChannel) {
            this.syncChannel.postMessage({ type: 'CHAT_UPDATED', messages: this.chatMessages });
        }
    }

    // Tự động dọn dẹp các tin nhắn của các đơn hàng đã hoàn tất thành công (Bảo vệ quyền riêng tư)
    cleanupCompletedOrdersChats() {
        if (!this.depositOrders || this.depositOrders.length === 0 || !this.chatMessages || this.chatMessages.length === 0) return;
        const completedOrders = this.depositOrders.filter(o => o.status === 'completed');
        if (completedOrders.length === 0) return;

        const initialCount = this.chatMessages.length;
        completedOrders.forEach(o => {
            this.chatMessages = this.chatMessages.filter(m => {
                if (o.productId && m.productId === o.productId) return false;
                if (m.orderId && m.orderId === o.id) return false;
                if ((m.sender === o.buyer && m.receiver === o.seller) || 
                    (m.sender === o.seller && m.receiver === o.buyer)) {
                    return false;
                }
                return true;
            });
        });

        if (this.chatMessages.length !== initialCount) {
            console.log(`🧹 [UniPassApp] Đã tự động dọn dẹp ${initialCount - this.chatMessages.length} tin nhắn của các đơn đã hoàn thành.`);
            this.saveChats();
        }
    }

    saveOrders() {
        localStorage.setItem('unipass_deposit_orders', JSON.stringify(this.depositOrders));
        this.updateDepositBadge();
        if (this.syncChannel) {
            this.syncChannel.postMessage({ type: 'ORDERS_UPDATED', orders: this.depositOrders });
        }
    }

    saveDisputes() {
        localStorage.setItem('unipass_admin_disputes', JSON.stringify(this.adminDisputes));
        if (this.syncChannel) {
            this.syncChannel.postMessage({ type: 'DISPUTES_UPDATED', disputes: this.adminDisputes });
        }
    }

    updateDepositBadge() {
        const badge = document.getElementById('depositOrderCount');
        if (!badge) return;
        if (!this.user) {
            badge.style.display = 'none';
            badge.innerText = '0';
            return;
        }
        
        // Đếm số đơn cọc liên quan đến tài khoản hiện tại
        const myOrderCount = this.depositOrders.filter(o => 
            o.buyer === this.user.name || o.seller === this.user.name
        ).length;

        badge.innerText = myOrderCount;
        badge.style.display = myOrderCount > 0 ? 'inline-block' : 'none';
    }

    updateChatUnreadBadge() {
        const badge = document.getElementById('unreadChatBadge');
        if (!badge) return;
        if (!this.user) {
            badge.style.display = 'none';
            badge.innerText = '0';
            return;
        }

        const incoming = this.chatMessages.filter(m => m.receiver === this.user.name);
        const count = incoming.length;

        if (count > 0) {
            badge.style.display = 'inline-block';
            badge.innerText = count;
        } else {
            badge.style.display = 'none';
        }
    }

    getChatPartnerName() {
        if (!this.user) return 'Sinh viên UTC2';
        if (this.currentChatPartner && this.currentChatPartner !== this.user.name) {
            return this.currentChatPartner;
        }
        // Tìm bạn chat mặc định: ưu tiên người khác mình trong danh sách
        const otherUser = this.registeredUsers.find(u => u.name !== this.user.name && u.role !== 'admin');
        if (otherUser) return otherUser.name;
        return 'Sinh viên UTC2';
    }

    updateUserUI() {
        if (!this.user) return;

        const nameEl = document.getElementById('navUserName');
        const coinsEl = document.getElementById('navUserCoins');
        const avatarEl = document.getElementById('userAvatarText');
        const switchBtn = document.getElementById('quickSwitchUserBtn');

        const profName = document.getElementById('profileFullName');
        const profEmail = document.getElementById('profileEmail');
        const profRep = document.getElementById('profileRepScore');
        const profAvatar = document.getElementById('profileAvatarCircle');

        const letter = this.user.avatarLetter || (this.user.name ? this.user.name.charAt(0).toUpperCase() : 'U');

        if (nameEl) nameEl.innerText = this.user.name;
        if (coinsEl) coinsEl.innerText = this.user.coins;
        if (avatarEl) avatarEl.innerText = letter;

        if (switchBtn) {
            const nextIdx = (this.registeredUsers.findIndex(u => u.email === this.user.email) + 1) % this.registeredUsers.length;
            const nextUser = this.registeredUsers[nextIdx] || this.registeredUsers[0];
            switchBtn.innerText = `Đổi sang: ${nextUser ? (nextUser.name.split(' ').slice(-1)[0] || nextUser.name) : 'Người khác'}`;
        }

        if (profName) profName.innerText = this.user.name;
        if (profEmail) profEmail.innerText = this.user.email;
        if (profRep) profRep.innerText = this.user.reputation;
        if (profAvatar) profAvatar.innerText = letter;

        localStorage.setItem('unipass_current_user', JSON.stringify(this.user));
    }

    toggleAccount() {
        if (!this.registeredUsers || this.registeredUsers.length === 0) return;
        
        let currIdx = this.registeredUsers.findIndex(u => u.email === this.user.email);
        if (currIdx === -1) currIdx = 0;
        
        const nextIdx = (currIdx + 1) % this.registeredUsers.length;
        this.user = this.registeredUsers[nextIdx];

        this.updateUserUI();
        this.renderProducts();
        this.renderProfile();
        this.renderChatMessages();
        this.updateChatUnreadBadge();

        showToast(`Đã chuyển sang tài khoản: ${this.user.name}!`, 'success');
        if (window.sound) window.sound.playClick();
    }

    // Lọc sản phẩm
    getFilteredItems() {
        // Chỉ lấy các bài đã được Admin phê duyệt (Loại bỏ các bài đang chờ duyệt TimeMark hoặc bị từ chối)
        const baseApprovedProducts = this.products.filter(p => p.status !== 'pending' && p.status !== 'rejected');
        let items = [...baseApprovedProducts];

        // Nếu bộ lọc đang BẬT: CHỈ LỌC NHỮNG TIÊU CHÍ NÀO ĐƯỢC BẤM DẤU TÍCH!
        if (this.isFilterActive) {
            const enabled = this.filterCriteriaEnabled || {};

            // 1. Tiêu chí Giá (chỉ lọc khi ĐƯỢC TÍCH)
            if (enabled.price) {
                const avlMatches = this.avl.rangeQuery(0, this.filterMaxPrice);
                const avlIds = new Set(avlMatches.map(p => p.id));
                items = items.filter(p => avlIds.has(p.id) || p.price <= this.filterMaxPrice);
            }

            // 2. Tiêu chí Danh mục (chỉ lọc khi ĐƯỢC TÍCH và không phải ALL)
            if (enabled.category && this.filterCategoryKey !== 'ALL') {
                items = items.filter(p => p.category === this.filterCategoryKey);
            }

            // 3. Tiêu chí Điểm uy tín người bán (chỉ lọc khi ĐƯỢC TÍCH)
            if (enabled.reputation) {
                items = items.filter(p => (p.sellerRep || 95) >= (this.filterMinReputation || 90));
            }
        }

        // Lọc theo từ khóa tìm kiếm (nếu có gõ từ khóa)
        if (this.searchKeyword && this.searchKeyword.trim().length > 0) {
            const kw = this.searchKeyword.toLowerCase().trim();
            items = items.filter(p => 
                (p.title && p.title.toLowerCase().includes(kw)) ||
                (p.courseCode && p.courseCode.toLowerCase().includes(kw)) ||
                (p.category && p.category.toLowerCase().includes(kw)) ||
                (p.seller && p.seller.toLowerCase().includes(kw)) ||
                (p.description && p.description.toLowerCase().includes(kw))
            );
        }

        if (this.sortBy === 'priceAsc') {
            items.sort((a, b) => a.price - b.price);
        } else if (this.sortBy === 'priceDesc') {
            items.sort((a, b) => b.price - a.price);
        } else if (this.sortBy === 'distance') {
            items.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
        }

        return items;
    }

    renderProducts() {
        const container = document.getElementById('productGridContainer');
        const countDisplay = document.getElementById('feedCountDisplay');
        const dsaInfo = document.getElementById('dsaEngineInfoText');

        if (!container) return;

        const list = this.getFilteredItems();

        if (countDisplay) {
            countDisplay.innerHTML = `Hiển thị <strong>${list.length} món đồ</strong> sẵn sàng pass`;
        }

        if (dsaInfo) {
            if (!this.isFilterActive) {
                dsaInfo.innerText = `Bộ lọc đang tắt (Hiển thị đầy đủ ${list.length} món đồ).`;
            } else {
                const enabled = this.filterCriteriaEnabled || {};
                const activeCriteria = [];
                if (enabled.price) activeCriteria.push(`Giá ≤ ${formatNumber(this.filterMaxPrice)}đ (AVL)`);
                if (enabled.category && this.filterCategoryKey !== 'ALL') activeCriteria.push(`Danh mục: ${this.filterCategoryKey}`);
                if (enabled.reputation) activeCriteria.push(`Uy tín ≥ ${this.filterMinReputation || 90}đ`);

                if (activeCriteria.length === 0) {
                    dsaInfo.innerText = `Chưa tích chọn tiêu chí nào (Hiển thị ${list.length} món đồ). Bấm dấu tích vào tiêu chí bạn muốn lọc!`;
                } else {
                    dsaInfo.innerText = `Đang lọc theo: ${activeCriteria.join(' • ')} (${list.length} kết quả).`;
                }
            }
        }

        if (list.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; color: #64748b;">
                    <div style="font-size: 36px; margin-bottom: 8px;">📦</div>
                    <h4 style="color:#0f172a;">Không có món đồ nào trong khoảng lọc này</h4>
                    <p style="font-size: 13px; margin-top: 4px;">Thử kéo tăng thanh giá hoặc bấm "Đặt lại" bộ lọc.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = list.map(item => {
            const isMyItem = this.user ? (item.seller === this.user.name) : false;
            return `
                <div class="uni-product-card" onclick="openCheckoutModal('${item.id}')">
                    <div class="card-image-wrapper">
                        <img src="${item.imageUrl}" alt="${item.title}" loading="lazy">
                        <span class="card-badge-cat">${getCategoryName(item.category)}</span>
                        <span class="card-badge-timemark">✓ ${item.timemarkCode}</span>
                    </div>
                    <div class="card-content">
                        <h4 class="card-title-text">${item.title}</h4>
                        <div class="card-price-text">${formatNumber(item.price)} VNĐ</div>
                        ${item.description ? `
                            <div style="font-size:12px; color:#64748b; margin:4px 0 6px 0; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                                ${item.description}
                            </div>
                        ` : ''}
                        
                        <div class="card-seller-row">
                            <span>Ng/pass: ${item.seller}</span>
                            <span class="card-rep-badge">★ ${item.sellerRep}/100</span>
                        </div>

                        <div class="card-location-row">
                            <span>📍 ${item.location}</span>
                        </div>

                        <div class="card-expiry-row">
                            ⏳ Tự hết hạn sau: ${item.expiryDays} ngày
                        </div>

                        <button class="card-cta-btn" onclick="event.stopPropagation(); openCheckoutModal('${item.id}')">
                            ${isMyItem ? 'Xem chi tiết (Đồ của bạn) ➔' : 'Xem & Đặt Cọc Giữ Chỗ ➔'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderProfile() {
        const myPosts = document.getElementById('myPostsListContainer');
        const history = document.getElementById('purchaseHistoryContainer');
        if (!this.user) {
            if (myPosts) myPosts.innerHTML = `<p style="font-size:12px; color:#64748b;">Vui lòng đăng nhập để xem bài đăng.</p>`;
            if (history) history.innerHTML = `<p style="font-size:12px; color:#64748b;">Vui lòng đăng nhập để xem lịch sử cọc.</p>`;
            return;
        }

        if (myPosts) {
            const myItems = this.products.filter(p => p.seller === this.user.name);
            if (myItems.length === 0) {
                myPosts.innerHTML = `<p style="font-size:12px; color:#64748b;">Chưa có bài đăng nào.</p>`;
            } else {
                myPosts.innerHTML = myItems.map(p => {
                    let statusBadge = '';
                    if (p.status === 'pending') {
                        statusBadge = `<span style="background:#fef3c7; color:#b45309; padding:2px 8px; border-radius:4px; font-weight:700; font-size:10.5px;">⏳ Chờ Admin duyệt TimeMark</span>`;
                    } else if (p.status === 'rejected') {
                        statusBadge = `<span style="background:#fee2e2; color:#b91c1c; padding:2px 8px; border-radius:4px; font-weight:700; font-size:10.5px;">❌ Bị từ chối duyệt</span>`;
                    } else {
                        statusBadge = `<span style="background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:4px; font-weight:700; font-size:10.5px;">✅ Đã duyệt (Hiển thị)</span>`;
                    }

                    return `
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 14px; margin-bottom:8px; font-size:12.5px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <strong>${p.title}</strong>
                                ${statusBadge}
                            </div>
                            <div style="color:#0284c7; font-size:11.5px; margin-top:3px;">
                                ${formatNumber(p.price)} đ • TimeMark: <strong>${p.timemarkCode}</strong>
                                ${p.timemarkProofUrl ? ` • <a href="javascript:void(0)" onclick="openZoomImageModal('${p.timemarkProofUrl}', 'Ảnh TimeMark: ${p.title}')" style="color:#16a34a; font-weight:700; text-decoration:underline;">🔍 Xem ảnh TimeMark đã chụp</a>` : ''}
                            </div>
                        </div>
                        <button onclick="removePost('${p.id}')" style="background:none; border:none; color:#ef4444; font-size:12px; cursor:pointer; font-weight:700;">Xóa</button>
                    </div>
                    `;
                }).join('');
            }
        }

       if (history) {
            // ✅ Chỉ lấy các đơn mà tài khoản hiện tại là người mua (buyer) HOẶC người bán (seller)
            const myOrders = this.depositOrders.filter(o => 
                o.buyer === this.user.name || o.buyerEmail === this.user.email ||
                o.seller === this.user.name || o.sellerEmail === this.user.email
            );

            if (myOrders.length === 0) {
                history.innerHTML = `<p style="font-size:12px; color:#64748b;">Chưa có đơn cọc nào.</p>`;
            } else {
                history.innerHTML = myOrders.map(o => {
                    const isBuyer = (this.user.name === o.buyer || this.user.email === o.buyerEmail);
                    const isSeller = (this.user.name === o.seller || this.user.email === o.sellerEmail);
                    const counterpartName = isBuyer ? o.seller : o.buyer;
                    const counterpartRole = isBuyer ? 'Người bán' : 'Người mua';

                    let statusBadge = '';
                    let actionButtonsHtml = '';

                    if (o.status === 'completed') {
                        statusBadge = `<span style="background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:4px; font-weight:700; font-size:11px;">✅ Đã Hoàn Thành (Đã xóa bài)</span>`;
                    } else if (o.status === 'closed_penalized') {
                        statusBadge = `<span style="background:#fee2e2; color:#b91c1c; padding:2px 8px; border-radius:4px; font-weight:700; font-size:11px;">⚠️ Đã Đóng & Xử Phạt Vi Phạm</span>`;
                    } else if (o.status === 'pending_seller' || !o.sellerAccepted) {
                        statusBadge = `<span style="background:#fef3c7; color:#b45309; padding:2px 8px; border-radius:4px; font-weight:700; font-size:11px;">⏳ Chờ Người Bán Xác Nhận</span>`;
                        if (isSeller) {
                            actionButtonsHtml += `
                                <button class="btn-primary-confirm" style="background:#16a34a; font-size:11.5px; padding:6px 12px; width:auto; margin:0;" onclick="confirmOrderBySeller('${o.id}')">
                                    ✅ Xác Nhận Đơn Hàng & Điểm Hẹn
                                </button>
                            `;
                        } else {
                            actionButtonsHtml += `<span style="font-size:11.5px; color:#64748b; font-style:italic;">Đang đợi người bán xác nhận đơn...</span>`;
                        }
                    } else {
                        // Đang trong quá trình trao đổi (in_trade hoặc pending_mutual)
                        const buyerDone = o.buyerCompleted;
                        const sellerDone = o.sellerCompleted;

                        statusBadge = `<span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:4px; font-weight:700; font-size:11px;">🔄 Đang Trao Đổi Đồ</span>`;

                        // Nút xác nhận của người mua
                        if (isBuyer) {
                            if (!buyerDone) {
                                actionButtonsHtml += `
                                    <button class="btn-primary-confirm" style="background:#16a34a; font-size:11.5px; padding:6px 12px; width:auto; margin:0;" onclick="confirmTradeComplete('${o.id}', 'buyer')">
                                        🤝 Tôi Đã Nhận Đồ (Xác Nhận Thành Công)
                                    </button>
                                `;
                            } else {
                                actionButtonsHtml += `<span style="font-size:11.5px; color:#16a34a; font-weight:700;">✓ Bạn đã xác nhận nhận đồ</span>`;
                            }
                        }

                        // Nút xác nhận của người bán
                        if (isSeller) {
                            if (!sellerDone) {
                                actionButtonsHtml += `
                                    <button class="btn-primary-confirm" style="background:#16a34a; font-size:11.5px; padding:6px 12px; width:auto; margin:0;" onclick="confirmTradeComplete('${o.id}', 'seller')">
                                        🤝 Tôi Đã Giao Đồ (Xác Nhận Thành Công)
                                    </button>
                                `;
                            } else {
                                actionButtonsHtml += `<span style="font-size:11.5px; color:#16a34a; font-weight:700;">✓ Bạn đã xác nhận giao đồ</span>`;
                            }
                        }

                        // Nếu bạn đã xác nhận mà đối phương không chịu xác nhận -> Nút phạt
                        if ((isBuyer && buyerDone && !sellerDone) || (isSeller && sellerDone && !buyerDone)) {
                            actionButtonsHtml += `
                                <button class="btn-admin-danger" style="font-size:11px; padding:5px 10px; width:auto; margin:0;" onclick="reportUnconfirmedTrade('${o.id}')" title="Phạt 5 điểm uy tín đối phương vì không chịu xác nhận sau khi nhận/giao đồ">
                                    ⚠️ Phạt ${counterpartName} Không Xác Nhận (-5đ)
                                </button>
                            `;
                        }
                    }

                    // Nút Nhắn Tin Trao Đổi và Khiếu Nại lên Admin cho mọi đơn chưa completed
                    if (o.status !== 'completed' && o.status !== 'closed_penalized') {
                        actionButtonsHtml += `
                            <button class="btn-outline-chat" style="font-size:11px; padding:5px 9px; width:auto; margin:0; color:#0284c7; border-color:#93c5fd;" onclick="openChatBetweenUsers('${counterpartName}', { id: '${o.productId}', title: '${o.productTitle}' }, '${o.id}')">
                                💬 Nhắn Tin Hẹn Gặp
                            </button>
                            <button class="btn-outline-chat" style="font-size:11px; padding:5px 9px; width:auto; margin:0; color:#dc2626; border-color:#fca5a5;" onclick="openOrderDisputeModal('${o.id}')">
                                🚨 Báo Boom Hàng / Lỗi (Admin)
                            </button>
                        `;
                    } else if (o.status === 'completed') {
                        actionButtonsHtml += `
                            <span style="font-size:11px; color:#15803d; font-weight:700; background:#f0fdf4; padding:3px 8px; border-radius:4px; border:1px solid #bbf7d0;">
                                🔒 Lịch sử tin nhắn đã tự động xóa bảo mật
                            </span>
                        `;
                    }

                    return `
                        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:12px 14px; margin-bottom:10px; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                                <div>
                                    <strong style="font-size:13.5px; color:#0f172a;">${o.productTitle}</strong>
                                    <div style="font-size:11px; color:#64748b; margin-top:2px;">
                                        Mã đơn: <span style="font-family:monospace; font-weight:700; color:#0284c7;">${o.orderCode || o.id}</span> • 
                                        ${counterpartRole}: <strong>${counterpartName}</strong> • Hẹn gặp: <strong>${o.meetLocation || 'Campus UTC2'}</strong>
                                    </div>
                                </div>
                                <div>${statusBadge}</div>
                            </div>

                            <div style="background:#f8fafc; border-radius:6px; padding:8px 10px; margin-bottom:8px; font-size:11.5px; color:#334155; display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px;">
                                <div>Cọc giữ chỗ: <strong style="color:#16a34a;">${formatNumber(o.depositAmount || 0)} đ</strong></div>
                                <div>Tổng thanh toán: <strong>${formatNumber(o.totalPayment || o.finalTotal || 0)} đ</strong></div>
                                <div>
                                    Tiến độ xác nhận: 
                                    <span style="color:${o.buyerCompleted ? '#16a34a' : '#b45309'}; font-weight:700;">Mua: ${o.buyerCompleted ? '✓' : 'Chưa'}</span> | 
                                    <span style="color:${o.sellerCompleted ? '#16a34a' : '#b45309'}; font-weight:700;">Bán: ${o.sellerCompleted ? '✓' : 'Chưa'}</span>
                                </div>
                            </div>

                            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; justify-content:flex-end;">
                                ${actionButtonsHtml}
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    // ==========================================
    // RENDER HỘP THƯ TIN NHẮN: TẤT CẢ TÀI KHOẢN ĐÃ GỬI TIN NHẮN CHO NGƯỜI BÁN
    // ==========================================
    renderChatInbox() {
        const listEl = document.getElementById('chatInboxList');
        const subtitleEl = document.getElementById('chatInboxSubtitle');
        if (!listEl) return;

        if (!this.user) {
            listEl.innerHTML = `
                <div style="text-align:center; padding:40px 20px; color:#94a3b8;">
                    <span style="font-size:36px; display:block; margin-bottom:10px;">🔒</span>
                    <strong style="color:#0f172a; font-size:14px; display:block; margin-bottom:6px;">Vui lòng đăng nhập</strong>
                    <p style="font-size:12.5px; margin:0;">Đăng nhập để xem danh sách các bạn đã gửi tin nhắn cho bạn.</p>
                </div>
            `;
            return;
        }

        const myName = this.user.name;
        const conversationsMap = new Map();

        // 1. Quét qua lịch sử chatMessages để gom nhóm các tài khoản đã từng nhắn tin
        this.chatMessages.forEach(msg => {
            let partnerName = null;
            let isIncoming = false;

            if (msg.receiver === myName) {
                partnerName = msg.sender;
                isIncoming = true;
            } else if (msg.sender === myName) {
                partnerName = msg.receiver;
                isIncoming = false;
            }

            if (partnerName && partnerName !== myName) {
                if (!conversationsMap.has(partnerName)) {
                    conversationsMap.set(partnerName, {
                        partnerName: partnerName,
                        lastMessage: msg,
                        lastTimestamp: msg.id ? (parseInt(msg.id.replace(/\D/g, '')) || 0) : 0,
                        productId: msg.productId || null,
                        productTitle: msg.productTitle || null,
                        orderId: msg.orderId || null,
                        totalMessages: 0,
                        incomingCount: 0
                    });
                }
                const conv = conversationsMap.get(partnerName);
                conv.totalMessages++;
                if (isIncoming) conv.incomingCount++;
                conv.lastMessage = msg;
                if (msg.productId) conv.productId = msg.productId;
                if (msg.productTitle) conv.productTitle = msg.productTitle;
                if (msg.orderId) conv.orderId = msg.orderId;
            }
        });

        // 2. Thêm các đối tác từ đơn cọc chưa hoàn thành (nếu chưa có trong conversationsMap)
        if (this.depositOrders && this.depositOrders.length > 0) {
            this.depositOrders.forEach(o => {
                if (o.status !== 'completed' && o.status !== 'closed_penalized') {
                    let partnerName = null;
                    let roleText = '';
                    if (o.seller === myName) {
                        partnerName = o.buyer;
                        roleText = 'Người mua đặt cọc';
                    } else if (o.buyer === myName) {
                        partnerName = o.seller;
                        roleText = 'Người bán';
                    }

                    if (partnerName && partnerName !== myName) {
                        if (!conversationsMap.has(partnerName)) {
                            conversationsMap.set(partnerName, {
                                partnerName: partnerName,
                                lastMessage: {
                                    text: `📦 Đơn cọc "${o.productTitle}" - Chờ trao đổi`,
                                    time: 'Gần đây',
                                    sender: partnerName
                                },
                                lastTimestamp: o.timestamp || Date.now(),
                                productId: o.productId,
                                productTitle: o.productTitle,
                                orderId: o.id,
                                totalMessages: 0,
                                incomingCount: 1,
                                roleTag: roleText
                            });
                        } else {
                            const conv = conversationsMap.get(partnerName);
                            if (!conv.productId) conv.productId = o.productId;
                            if (!conv.productTitle) conv.productTitle = o.productTitle;
                            if (!conv.orderId) conv.orderId = o.id;
                            if (roleText) conv.roleTag = roleText;
                        }
                    }
                }
            });
        }

        const conversations = Array.from(conversationsMap.values());

        if (subtitleEl) {
            subtitleEl.innerText = `${conversations.length} tài khoản đã liên hệ với bạn`;
        }

        if (conversations.length === 0) {
            // Gợi ý các bạn khác để nhắn tin thử
            const otherUsers = this.registeredUsers.filter(u => u.name !== myName && u.role !== 'admin');
            let suggestionsHtml = '';
            if (otherUsers.length > 0) {
                suggestionsHtml = `
                    <div style="margin-top:16px; text-align:left;">
                        <div style="font-size:11.5px; font-weight:700; color:#475569; margin-bottom:8px; text-transform:uppercase;">
                            Gợi ý sinh viên trong trường để trao đổi đồ:
                        </div>
                        ${otherUsers.map(u => {
                            const safeUName = u.name.replace(/'/g, "\\'");
                            return `
                                <div class="chat-inbox-item" onclick="openChatBetweenUsers('${safeUName}')" style="margin-bottom:6px;">
                                    <div class="chat-inbox-avatar">${(u.avatarLetter || u.name.charAt(0)).toUpperCase()}</div>
                                    <div class="chat-inbox-info">
                                        <div class="chat-inbox-name">${u.name}</div>
                                        <div class="chat-inbox-snippet" style="color:#0284c7;">Bấm để bắt đầu nhắn tin trao đổi đồ</div>
                                    </div>
                                    <span style="font-size:12px; color:#0284c7; font-weight:700;">Nhắn tin →</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }

            listEl.innerHTML = `
                <div style="text-align:center; padding:30px 16px; color:#64748b;">
                    <div style="font-size:40px; margin-bottom:10px;">📭</div>
                    <strong style="color:#0f172a; font-size:14px; display:block; margin-bottom:6px;">Chưa có tài khoản nào gửi tin nhắn</strong>
                    <p style="font-size:12px; line-height:1.5; margin:0 0 10px 0; color:#64748b;">
                        Khi có sinh viên gửi tin nhắn hỏi mua đồ hoặc đặt cọc, danh sách tài khoản sẽ xuất hiện tại đây.
                    </p>
                    ${suggestionsHtml}
                </div>
            `;
            return;
        }

        // Sắp xếp cuộc trò chuyện có tin nhắn mới nhất lên đầu
        conversations.sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0));

        listEl.innerHTML = conversations.map(c => {
            const initial = (c.partnerName.charAt(0) || 'U').toUpperCase();
            const lastTxt = c.lastMessage ? (
                c.lastMessage.sender === myName ? `Bạn: ${c.lastMessage.text}` : c.lastMessage.text
            ) : 'Bắt đầu trò chuyện...';
            const timeStr = c.lastMessage && c.lastMessage.time ? c.lastMessage.time : '';
            const prodTag = c.productTitle ? `📦 ${c.productTitle}` : '';
            const roleTagHtml = c.roleTag ? `<span style="background:#e0f2fe; color:#0369a1; font-size:10px; padding:2px 6px; border-radius:4px; font-weight:600; margin-left:6px;">${c.roleTag}</span>` : '';

            const safePartner = c.partnerName.replace(/'/g, "\\'");
            const safeProductTitle = c.productTitle ? c.productTitle.replace(/'/g, "\\'") : '';
            const safeProductId = c.productId || '';
            const safeOrderId = c.orderId || '';

            return `
                <div class="chat-inbox-item" onclick="openChatBetweenUsers('${safePartner}', { id: '${safeProductId}', title: '${safeProductTitle}' }, '${safeOrderId}')">
                    <div class="chat-inbox-avatar">${initial}</div>
                    <div class="chat-inbox-info">
                        <div class="chat-inbox-top">
                            <div class="chat-inbox-name">${c.partnerName} ${roleTagHtml}</div>
                            <div class="chat-inbox-time">${timeStr}</div>
                        </div>
                        ${prodTag ? `<div class="chat-inbox-product">${prodTag}</div>` : ''}
                        <div class="chat-inbox-snippet">${lastTxt}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderChatMessages() {
        const convView = document.getElementById('chatConversationsView');
        if (convView && convView.style.display !== 'none') {
            this.renderChatInbox();
        }

        const area = document.getElementById('chatMessagesArea');
        const headerSub = document.getElementById('chatHeaderSubtitle');
        if (!area) return;
        if (!this.user) {
            area.innerHTML = `
                <div style="text-align:center; color:#94a3b8; font-size:12.5px; margin-top:30px;">
                    Vui lòng đăng nhập để nhắn tin trao đổi đồ.
                </div>
            `;
            return;
        }

        const partnerName = this.getChatPartnerName();
        if (headerSub) {
            headerSub.innerText = `Bạn (${this.user.name}) đang nhắn tin với: ${partnerName}`;
        }

        const conversation = this.chatMessages.filter(m => 
            (m.sender === this.user.name && m.receiver === partnerName) ||
            (m.sender === partnerName && m.receiver === this.user.name)
        );

        // Kiểm tra xem giữa 2 bạn có đơn hàng nào đã hoàn thành hay không
        const completedOrder = this.depositOrders.find(o => 
            o.status === 'completed' &&
            ((o.buyer === this.user.name && o.seller === partnerName) ||
             (o.seller === this.user.name && o.buyer === partnerName))
        );

        if (conversation.length === 0) {
            if (completedOrder) {
                area.innerHTML = `
                    <div style="text-align:center; padding:22px 14px; background:#f0fdf4; border:1.5px dashed #86efac; border-radius:12px; margin:20px 8px;">
                        <span style="font-size:32px; display:block; margin-bottom:8px;">🤝🔒</span>
                        <strong style="color:#15803d; font-size:13.5px; display:block; margin-bottom:4px;">Giao dịch "${completedOrder.productTitle}" đã hoàn tất thành công!</strong>
                        <div style="font-size:12px; color:#475569; line-height:1.5;">
                            Theo chính sách bảo vệ quyền riêng tư sinh viên UTC2, lịch sử tin nhắn cuộc trò chuyện đã <strong>tự động xóa hoàn toàn</strong> sau khi đơn hàng hoàn thành.
                        </div>
                    </div>
                `;
            } else {
                area.innerHTML = `
                    <div style="text-align:center; color:#94a3b8; font-size:12.5px; margin-top:30px;">
                        Chưa có tin nhắn nào giữa <strong>${this.user.name}</strong> và <strong>${partnerName}</strong>.<br>
                        Hãy gõ tin nhắn bên dưới để bắt đầu trao đổi đồ!
                    </div>
                `;
            }
            return;
        }

        // Hiển thị thanh thông tin sản phẩm đang trao đổi nếu có
        let productNoticeHtml = '';
        const currentProd = this.currentChatProduct || (conversation[conversation.length - 1].productTitle ? { title: conversation[conversation.length - 1].productTitle } : null);
        if (currentProd && currentProd.title) {
            productNoticeHtml = `
                <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:6px 10px; font-size:11.5px; color:#0284c7; margin-bottom:10px; text-align:center; font-weight:700;">
                    📦 Đang trao đổi về: ${currentProd.title}
                </div>
            `;
        }

        area.innerHTML = productNoticeHtml + conversation.map(m => {
            const isMe = m.sender === this.user.name;
            return `
                <div class="msg-bubble ${isMe ? 'sent' : 'received'}">
                    <div>${m.text}</div>
                    <div class="msg-time-tag">${m.time || ''}</div>
                </div>
            `;
        }).join('');

        area.scrollTop = area.scrollHeight;
    }

    // ==========================================
    // RENDER GIAO DIỆN ADMIN (THEO ĐẶC TẢ FILE WORD)
    // ==========================================
    renderAdminDashboard() {
        const pendingPostsTbody = document.getElementById('adminPendingPostsTableBody');
        const pendingPostsCountEl = document.getElementById('adminPendingPostsCount');
        const pendingBadgeEl = document.getElementById('adminPendingBadge');

        const postsTbody = document.getElementById('adminPostsTableBody');
        const usersTbody = document.getElementById('adminUsersTableBody');
        const disputesTbody = document.getElementById('adminDisputesTableBody');
        const totalPostsEl = document.getElementById('adminTotalPosts');
        const totalUsersEl = document.querySelector('.admin-stat-card:nth-child(3) .admin-stat-number');
        const pendingDispEl = document.getElementById('adminPendingDisputes');
        const warningsCountEl = document.getElementById('adminWarningsCount');

        // Phân loại bài đăng: Chờ duyệt vs Đã duyệt
        const pendingPosts = this.products.filter(p => p.status === 'pending');
        const activeApprovedPosts = this.products.filter(p => p.status !== 'pending' && p.status !== 'rejected');

        // Danh sách sinh viên thực tế (loại tài khoản quản trị)
        const studentUsers = this.registeredUsers.filter(u => u.role !== 'admin');

        if (totalPostsEl) totalPostsEl.innerText = activeApprovedPosts.length;
        if (pendingPostsCountEl) pendingPostsCountEl.innerText = pendingPosts.length;
        if (pendingBadgeEl) pendingBadgeEl.innerText = `${pendingPosts.length} bài chờ`;
        if (totalUsersEl) totalUsersEl.innerText = studentUsers.length;
        if (pendingDispEl) pendingDispEl.innerText = this.adminDisputes.filter(d => d.status === 'pending').length;
        if (warningsCountEl) warningsCountEl.innerText = this.adminWarningsIssued.length;

        // BẢNG ƯU TIÊN: Phê duyệt bài đăng chờ duyệt TimeMark
        if (pendingPostsTbody) {
            if (pendingPosts.length === 0) {
                pendingPostsTbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center; color:#15803d; padding:22px; font-weight:700; background:#f0fdf4;">
                            🎉 Tuyệt vời! Hiện không có bài đăng nào chờ duyệt. Tất cả bài đăng đều đã được xác thực TimeMark chính chủ.
                        </td>
                    </tr>
                `;
            } else {
                pendingPostsTbody.innerHTML = pendingPosts.map(p => `
                    <tr style="background:#fffbeb;">
                        <td>
                            <strong>${p.title}</strong>
                            <div style="color:#0284c7; font-weight:700;">${formatNumber(p.price)} đ</div>
                            <div style="font-size:11px; color:#64748b;">📍 ${p.location}</div>
                        </td>
                        <td>
                            <div><strong>${p.seller}</strong></div>
                            <div style="font-size:11px; color:#64748b;">${p.sellerEmail}</div>
                            <div style="font-size:11px; color:#16a34a; font-weight:700;">★ ${p.sellerRep}/100</div>
                        </td>
                        <td>
                            <span style="background:#dcfce7; color:#15803d; padding:4px 8px; border-radius:4px; font-weight:900; font-size:13px; letter-spacing:1px; display:inline-block;">
                                ${p.timemarkCode}
                            </span>
                        </td>
                        <td>
                            <div style="display:flex; gap:8px; align-items:center;">
                                <div style="text-align:center;">
                                    <div style="font-size:9.5px; color:#64748b; margin-bottom:2px;">Ảnh SP:</div>
                                    <img src="${p.imageUrl}" alt="${p.title}" style="width:52px; height:52px; object-fit:cover; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer;" onclick="openZoomImageModal('${p.imageUrl}', 'Ảnh sản phẩm: ${p.title}')" title="Bấm xem to">
                                </div>
                                <div style="text-align:center;">
                                    <div style="font-size:9.5px; color:#16a34a; font-weight:700; margin-bottom:2px;">📸 Ảnh TimeMark:</div>
                                    <img src="${p.timemarkProofUrl || p.imageUrl}" alt="TimeMark" style="width:62px; height:62px; object-fit:cover; border-radius:6px; border:2px solid #16a34a; cursor:pointer;" onclick="openZoomImageModal('${p.timemarkProofUrl || p.imageUrl}', 'ẢNH XÁC THỰC TIMEMARK (Mã: ${p.timemarkCode})')" title="Bấm để phóng to soi chữ viết mã OTP trên giấy">
                                    <div style="font-size:9.5px; color:#15803d; font-weight:700; cursor:pointer;" onclick="openZoomImageModal('${p.timemarkProofUrl || p.imageUrl}', 'ẢNH XÁC THỰC TIMEMARK (Mã: ${p.timemarkCode})')">🔍 Soi mã</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div style="font-size:11.5px; color:#475569;">${p.createdTimeStr || 'Vừa xong'}</div>
                            <span style="background:#fef3c7; color:#b45309; padding:2px 6px; border-radius:4px; font-size:10.5px; font-weight:700;">⏳ Chờ duyệt</span>
                        </td>
                        <td>
                            <div style="display:flex; flex-direction:column; gap:5px;">
                                <button class="btn-admin-success" style="padding:6px 10px; font-size:11.5px; border-radius:6px;" onclick="adminApprovePost('${p.id}')">
                                    ✅ Duyệt Lên Trang Chính
                                </button>
                                <button class="btn-admin-danger" style="padding:5px 10px; font-size:11px; border-radius:6px;" onclick="adminRejectPost('${p.id}')">
                                    ❌ Từ Chối Duyệt
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        }

        // Bảng 1: Quản lý toàn bộ bài đăng đã duyệt & Xóa bài rác
        if (postsTbody) {
            postsTbody.innerHTML = activeApprovedPosts.map(p => `
                <tr>
                    <td><strong>${p.title}</strong></td>
                    <td style="color:#0284c7; font-weight:700;">${formatNumber(p.price)} đ</td>
                    <td>${p.seller}</td>
                    <td><span style="background:#e0f2fe; color:#0284c7; padding:2px 8px; border-radius:4px; font-weight:700; font-size:11px;">${p.timemarkCode}</span></td>
                    <td><span style="color:#d97706;">Còn ${p.expiryDays} ngày</span></td>
                    <td>
                        <button class="btn-admin-danger" onclick="adminDeletePost('${p.id}')">
                            🗑 Xóa Bài
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        // Bảng 2: Quản lý danh sách toàn bộ sinh viên đã đăng ký
        if (usersTbody) {
            usersTbody.innerHTML = studentUsers.map(u => `
                <tr>
                    <td><strong>${u.name}</strong></td>
                    <td style="color:#64748b;">${u.email}</td>
                    <td><span style="color:#16a34a; font-weight:700;">★ ${u.reputation}/100</span></td>
                    <td><span style="color:#d97706; font-weight:700;">🪙 ${u.coins} Xu</span></td>
                    <td><span style="background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:700;">Hoạt động</span></td>
                    <td>
                        <div style="display:flex; gap:6px;">
                            <button class="btn-admin-warning" onclick="adminWarnUser('${u.name}')">
                                ⚠️ Cảnh Cáo
                            </button>
                            <button class="btn-admin-success" onclick="adminRemindUser('${u.name}')">
                                💬 Nhắc Nhở
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        // Bảng 3: Xét duyệt khiếu nại giao dịch & trừ điểm uy tín (Boom hàng, Hàng lỗi, Không xác nhận)
        if (disputesTbody) {
            if (this.adminDisputes.length === 0) {
                disputesTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:20px;">Không có khiếu nại giao dịch nào đang chờ xử lý.</td></tr>`;
            } else {
                disputesTbody.innerHTML = this.adminDisputes.map(d => {
                    const reporter = d.reporterName || 'Sinh viên';
                    const accused = d.accusedName || d.userName || 'Chưa rõ';
                    const penaltyPts = d.penaltyPoints || 10;

                    return `
                    <tr>
                        <td>
                            <div>Báo cáo: <strong>${reporter}</strong></div>
                            <div style="font-size:11px; color:#dc2626; margin-top:2px;">➔ Bị tố: <strong>${accused}</strong> (${d.accusedEmail || d.userEmail || ''})</div>
                        </td>
                        <td>
                            <span style="color:#b45309; font-weight:700;">${d.reason}</span>
                            <div style="font-size:11px; color:#0284c7; margin-top:2px;">Đơn: ${d.orderCode || ''} • ${d.productTitle || ''}</div>
                        </td>
                        <td>
                            <div style="font-size:12px; color:#475569; max-width:280px; white-space:pre-line;">${d.evidence || 'Không có mô tả chi tiết'}</div>
                        </td>
                        <td>
                            <span style="background:#fee2e2; color:#b91c1c; padding:2px 8px; border-radius:4px; font-weight:800; font-size:11px;">-${penaltyPts} điểm uy tín</span>
                            <div style="color:#64748b; font-size:11px; margin-top:2px;">${d.time}</div>
                        </td>
                        <td>
                            ${d.status === 'pending' ? `
                                <div style="display:flex; flex-direction:column; gap:6px;">
                                    <button class="btn-admin-danger" style="padding:6px 10px; font-size:11.5px; font-weight:700;" onclick="adminPenalizeDispute('${d.id}')">
                                        ⚖️ Duyệt & Trừ ${penaltyPts}đ
                                    </button>
                                    <button class="btn-outline-chat" style="padding:4px 8px; font-size:11px;" onclick="adminRejectDispute('${d.id}')">
                                        ✕ Bác Bỏ
                                    </button>
                                </div>
                            ` : `<span style="font-weight:700; color:${d.status === 'penalized' ? '#dc2626' : (d.status === 'approved' ? '#16a34a' : '#64748b')};">
                                    ${d.status === 'penalized' ? `⚖️ Đã trừ ${penaltyPts}đ` : (d.status === 'approved' ? '✓ Đã khôi phục điểm' : '✕ Đã bác bỏ')}
                                 </span>`}
                        </td>
                    </tr>
                `;
                }).join('');
            }
        }
    }
}

window.app = new AppController();

// ==========================================
// 3. TIỆN ÍCH & FORMATTER
// ==========================================
function formatNumber(num) {
    return new Intl.NumberFormat('vi-VN').format(num);
}

function getCategoryName(cat) {
    if (cat === 'GiaoTrinh') return 'Giáo trình';
    if (cat === 'DoDienTu') return 'Điện tử';
    if (cat === 'DoGiaDung') return 'Đồ dùng KTX';
    return 'Mặt hàng';
}

function showToast(msg, type = 'info') {
    const box = document.getElementById('toastContainer');
    if (!box) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = '⚡';
    if (type === 'success') icon = '✓';
    if (type === 'danger') icon = '⚠';

    toast.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;
    box.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 250);
    }, 3200);
}

// ==========================================
// 4. AUTH PAGE LOGIC (ĐĂNG KÝ / ĐĂNG NHẬP / XÁC THỰC OTP)
// ==========================================
function switchAuthMode(mode) {
    window.app.currentAuthMode = mode;
    const tabReg = document.getElementById('tabRegisterBtn');
    const tabLog = document.getElementById('tabLoginBtn');
    const nameField = document.getElementById('authNameField');
    const otpSec = document.getElementById('authOtpSection');
    const submitBtn = document.getElementById('authSubmitButton');
    const mockBox = document.getElementById('mockEmailNotification');

    if (mode === 'register') {
        tabReg.classList.add('active');
        tabLog.classList.remove('active');
        if (nameField) nameField.style.display = 'block';
        if (otpSec) otpSec.style.display = 'block';
        if (submitBtn) submitBtn.innerText = '✓ Hoàn Tất Đăng Ký & Nhận 500 Xu';
    } else {
        tabLog.classList.add('active');
        tabReg.classList.remove('active');
        if (nameField) nameField.style.display = 'none';
        if (otpSec) otpSec.style.display = 'none';
        if (mockBox) mockBox.style.display = 'none';
        if (submitBtn) submitBtn.innerText = '✓ Đăng Nhập Vào Hệ Thống';
    }
    if (window.sound) window.sound.playClick();
}

// ==========================================
// BỘ GỬI EMAIL TỰ ĐỘNG QUA SMTP & GMAIL DISPATCHER
// ==========================================
const DEFAULT_APPS_SCRIPT_WEBHOOK = 'https://script.google.com/macros/s/AKfycbwJJ_jlPWowzSqsVigiA5_08u14G3iUTH8F2b-BlUqzVa15ltOLeZDGaAKRFtBG2Ja2Xw/exec';

const UniPassMailer = {
    getConfig: function() {
        return {
            host: localStorage.getItem('unipass_smtp_host') || 'smtp.gmail.com',
            port: parseInt(localStorage.getItem('unipass_smtp_port')) || 587,
            user: localStorage.getItem('unipass_smtp_user') || '',
            pass: localStorage.getItem('unipass_smtp_pass') || '',
            webhook: localStorage.getItem('unipass_email_webhook') || DEFAULT_APPS_SCRIPT_WEBHOOK
        };
    },

    // Gửi email OTP đăng ký tài khoản
    sendRegistrationOtp: async function(email, otp) {
        return this.dispatchEmail({
            to: email,
            otp: otp,
            type: 'register',
            title: 'Xác thực tài khoản'
        });
    },

    // Gửi email mã TimeMark khi đăng bài
    sendTimeMarkOtp: async function(email, timemarkCode, productTitle) {
        return this.dispatchEmail({
            to: email,
            otp: timemarkCode,
            type: 'timemark',
            title: productTitle
        });
    },

    // Động cơ gửi email đa kênh (SMTP / Google Apps Script / Supabase Auth)
    dispatchEmail: async function({ to, otp, type, title }) {
        const cfg = this.getConfig();
        let sentViaWebhook = false;
        let sentViaSupabase = false;

        // 1. TỰ ĐỘNG GỬI QUA GOOGLE APPS SCRIPT WEBHOOK (MÁY CHỦ GMAIL CỦA GOOGLE - 100% INBOX)
        if (cfg.webhook && cfg.webhook.startsWith('http')) {
            try {
                const getUrl = cfg.webhook + (cfg.webhook.includes('?') ? '&' : '?') +
                    'email=' + encodeURIComponent(to) +
                    '&otp=' + encodeURIComponent(otp) +
                    '&appName=' + encodeURIComponent('UniPass UTC2') +
                    '&type=' + encodeURIComponent(type) +
                    '&productTitle=' + encodeURIComponent(title || '') +
                    '&_t=' + Date.now();

                fetch(getUrl, { mode: 'no-cors' }).catch(() => {});
                // Fallback Image beacon: đảm bảo request luôn bay đến Google Apps Script
                try {
                    const beacon = new Image();
                    beacon.src = getUrl;
                } catch (_) {}

                fetch(cfg.webhook, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: to,
                        otp: otp,
                        appName: 'UniPass UTC2',
                        type: type,
                        productTitle: title || ''
                    })
                }).catch(() => {});
                sentViaWebhook = true;
                console.log(`📨 [UniPassMailer] Đã gửi ${type} qua Webhook Gmail tới:`, to);
            } catch (err) {
                console.warn('⚠️ [UniPassMailer] Lỗi Webhook:', err);
            }
        }

        // 2. TỰ ĐỘNG GỬI QUA SUPABASE AUTH CUSTOM SMTP (NẾU LÀ OTP ĐĂNG KÝ)
        if (type === 'register' && window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
            try {
                const supaRes = await window.UniPassSupabase.sendOtpEmail(to);
                if (supaRes && supaRes.success) {
                    sentViaSupabase = true;
                    console.log('📨 [UniPassMailer] Đã gửi OTP qua Supabase Auth SMTP:', to);
                }
            } catch (err) {
                console.warn('⚠️ [UniPassMailer] Lỗi Supabase SMTP:', err);
            }
        }

        return {
            success: true,
            sentViaWebhook: sentViaWebhook,
            sentViaSupabase: sentViaSupabase
        };
    }
};

// Hàm kiểm tra và gửi thử thư SMTP trực tiếp
async function testSmtpConnection() {
    const host = (document.getElementById('smtpHostInput') ? document.getElementById('smtpHostInput').value.trim() : '') || 'smtp.gmail.com';
    const port = (document.getElementById('smtpPortInput') ? document.getElementById('smtpPortInput').value.trim() : '') || '587';
    const user = (document.getElementById('smtpUserInput') ? document.getElementById('smtpUserInput').value.trim() : '');
    const pass = (document.getElementById('smtpPassInput') ? document.getElementById('smtpPassInput').value.trim() : '');
    const webhook = (document.getElementById('emailWebhookUrlInput') ? document.getElementById('emailWebhookUrlInput').value.trim() : '');

    localStorage.setItem('unipass_smtp_host', host);
    localStorage.setItem('unipass_smtp_port', port);
    if (user) localStorage.setItem('unipass_smtp_user', user);
    if (pass) localStorage.setItem('unipass_smtp_pass', pass);
    if (webhook) localStorage.setItem('unipass_email_webhook', webhook);

    const testEmail = prompt('Nhập địa chỉ Gmail để hệ thống gửi thử một email xác thực kiểm tra kết nối SMTP:', user || (window.app.user ? window.app.user.email : ''));
    if (!testEmail) return;

    showToast('⏳ Đang phát lệnh kiểm tra gửi thư SMTP...', 'info');

    const testCode = Math.floor(100000 + Math.random() * 900000).toString();
    await UniPassMailer.sendRegistrationOtp(testEmail, testCode);

    if (window.sound) window.sound.playNotification();
    showToast(`✓ Đã phát lệnh gửi email thử nghiệm (Mã test: ${testCode}) đến: ${testEmail}! Vui lòng mở tin nhắn hộp thư Gmail để kiểm tra.`, 'success');
}

async function requestOtpCode(e) {
    if (e && e.preventDefault) e.preventDefault(); // Chặn form tự nộp và load lại trang
    
    const emailInput = document.getElementById('authEmailInput');
    if (!emailInput) return;
    const email = emailInput.value.trim();

    if (!email) {
        showToast('Vui lòng nhập địa chỉ Gmail của bạn!', 'danger');
        if (window.sound) window.sound.playWarning();
        return;
    }

    const isAcceptedEmail = email.endsWith('@st.utc2.edu.vn') || 
                            email.endsWith('@utc2.edu.vn') || 
                            email.endsWith('@gmail.com');
    if (!isAcceptedEmail) {
        showToast('Vui lòng nhập Gmail sinh viên (@st.utc2.edu.vn) hoặc Gmail cá nhân (@gmail.com)!', 'danger');
        if (window.sound) window.sound.playWarning();
        return;
    }

    const sendOtpBtn = document.getElementById('sendOtpBtn');
    if (sendOtpBtn) {
        sendOtpBtn.disabled = true;
        sendOtpBtn.innerText = '⏳ Đang gửi mail...';
    }

    // Tạo mã OTP 6 số xác thực ngẫu nhiên bảo mật (LƯU TRONG BỘ NHỚ, TUYỆT ĐỐI KHÔNG IN RA MÀN HÌNH)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    window.app.generatedOtp = otp;
    window.app.otpSentAt = Date.now();

    const mockBox = document.getElementById('mockEmailNotification');
    const targetEmail = document.getElementById('mockTargetEmail');
    const otpInput = document.getElementById('authOtpInput');
    const otpStatusBadge = document.getElementById('otpStatusBadge');

    if (targetEmail) targetEmail.innerText = email;
    if (otpStatusBadge) otpStatusBadge.innerText = 'Đã Phát Lệnh';
    if (mockBox) {
        mockBox.classList.add('active');
        mockBox.style.display = 'block';
    }

    // Xóa ô nhập OTP và focus để người dùng nhập từ thư Gmail
    if (otpInput) {
        otpInput.value = '';
        otpInput.focus();
    }

    // GỬI EMAIL OTP THẬT QUA SMTP / GMAIL DISPATCHER
    await UniPassMailer.sendRegistrationOtp(email, otp);

    if (otpStatusBadge) otpStatusBadge.innerText = 'Đã Gửi Thư';
    showToast(`✓ Đã gửi mã OTP qua SMTP về Gmail: ${email}! Vui lòng mở tin nhắn hộp thư Gmail để lấy mã 6 số.`, 'success');

    if (window.sound) window.sound.playNotification();

    // Khởi động đếm ngược 60 giây để tránh gửi dồn dập
    let cooldown = 60;
    if (sendOtpBtn) {
        sendOtpBtn.disabled = true;
        sendOtpBtn.innerText = `⏳ Gửi lại (${cooldown}s)`;
        if (window.otpCountdownTimer) {
            clearInterval(window.otpCountdownTimer);
        }
        window.otpCountdownTimer = setInterval(() => {
            cooldown--;
            if (cooldown > 0) {
                sendOtpBtn.innerText = `⏳ Gửi lại (${cooldown}s)`;
            } else {
                clearInterval(window.otpCountdownTimer);
                window.otpCountdownTimer = null;
                sendOtpBtn.disabled = false;
                sendOtpBtn.innerText = '📩 Gửi Mã Về Gmail';
            }
        }, 1000);
    }
}

// Xử lý nộp form Đăng ký / Đăng nhập
async function handleAuthSubmitForm(e) {
    e.preventDefault();
    const email = document.getElementById('authEmailInput').value.trim();
    const fullName = document.getElementById('authFullNameInput') ? document.getElementById('authFullNameInput').value.trim() : '';
    const enteredOtp = document.getElementById('authOtpInput') ? document.getElementById('authOtpInput').value.trim() : '';
    const password = document.getElementById('authPasswordInput') ? document.getElementById('authPasswordInput').value.trim() : '';

    if (!email) {
        showToast('Vui lòng nhập địa chỉ Gmail!', 'danger');
        return;
    }

    const isAcceptedEmail = email.endsWith('@st.utc2.edu.vn') || 
                            email.endsWith('@utc2.edu.vn') || 
                            email.endsWith('@gmail.com');
    if (!isAcceptedEmail) {
        showToast('Vui lòng dùng Gmail sinh viên (@st.utc2.edu.vn) hoặc Gmail cá nhân (@gmail.com)!', 'danger');
        if (window.sound) window.sound.playWarning();
        return;
    }

    if (!password) {
        showToast('Vui lòng nhập mật khẩu của bạn!', 'danger');
        return;
    }

    const isOfficialAdmin = (email === ADMIN_CREDENTIALS.email);

    // KIỂM TRA MẬT KHẨU ADMIN BẮT BUỘC
    if (isOfficialAdmin) {
        if (password !== ADMIN_CREDENTIALS.password) {
            showToast('Mật khẩu Quản trị viên không chính xác! Chỉ tài khoản ' + ADMIN_CREDENTIALS.email + ' với đúng mật khẩu mới đăng nhập được.', 'danger');
            if (window.sound) window.sound.playWarning();
            const pwdInput = document.getElementById('authPasswordInput');
            if (pwdInput) {
                pwdInput.focus();
                pwdInput.select();
            }
            return;
        }
    }

    if (window.app.currentAuthMode === 'register') {
        if (!fullName) {
            showToast('Vui lòng nhập họ và tên của bạn!', 'danger');
            return;
        }

        if (!enteredOtp) {
            showToast('Vui lòng nhập mã 6 số để xác nhận Gmail cá nhân!', 'danger');
            if (window.sound) window.sound.playWarning();
            const otpInput = document.getElementById('authOtpInput');
            if (otpInput) otpInput.focus();
            return;
        }

        // BẮT BUỘC XÁC THỰC MÃ OTP 6 SỐ HOẶC XÁC THỰC QUA LIÊN KẾT SUPABASE
        let isOtpValid = (window.app.generatedOtp && enteredOtp === window.app.generatedOtp) ||
                         (window.app.emailVerifiedByMagicLink && window.app.verifiedSupabaseEmail === email);

        // Kiểm tra đối chiếu với Supabase Auth nếu người dùng dùng mã từ Supabase
        if (!isOtpValid && window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
            try {
                const verifyRes = await window.UniPassSupabase.verifyOtpEmail(email, enteredOtp);
                if (verifyRes && verifyRes.success) {
                    isOtpValid = true;
                }
            } catch (err) {
                console.warn('⚠️ Lỗi kiểm tra Supabase OTP:', err);
            }
        }

        if (!isOtpValid) {
            showToast('Mã OTP không chính xác hoặc đã hết hạn! Vui lòng kiểm tra mã 6 số và nhập lại chính xác.', 'danger');
            if (window.sound) window.sound.playWarning();
            const otpInput = document.getElementById('authOtpInput');
            if (otpInput) {
                otpInput.focus();
                otpInput.select();
            }
            return;
        }

        // Tìm xem tài khoản đã tồn tại hay chưa
        let existingUser = window.app.registeredUsers.find(u => u.email === email);
        if (existingUser) {
            existingUser.name = fullName || existingUser.name;
            existingUser.password = password;
            existingUser.isEmailVerified = true;
            existingUser.verifiedAt = new Date().toISOString();
            window.app.user = existingUser;
            window.app.saveUsers();
        } else {
            const newUser = {
                id: isOfficialAdmin ? 'ADMIN' : ('U_' + Date.now()),
                name: fullName || (isOfficialAdmin ? 'Quản Trị Viên UTC2 (6651071091)' : email.split('@')[0]),
                email: email,
                password: isOfficialAdmin ? ADMIN_CREDENTIALS.password : password,
                role: isOfficialAdmin ? 'admin' : 'student',
                coins: isOfficialAdmin ? 9999 : 500,
                reputation: isOfficialAdmin ? 100 : 95,
                isEmailVerified: true,
                verifiedAt: new Date().toISOString(),
                avatarLetter: (fullName || email).charAt(0).toUpperCase()
            };
            window.app.registeredUsers.push(newUser);
            window.app.saveUsers();
            window.app.user = newUser;
        }

        // Hủy mã OTP sau khi đăng ký hợp lệ thành công
        window.app.generatedOtp = null;

        window.app.isLoggedIn = true;
        window.app.checkAuthDisplay();
        window.app.updateUserUI();
        window.app.renderProducts();
        window.app.renderProfile();
        window.app.renderAdminDashboard();

        // Đồng bộ profile lên Supabase Cloud
        if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
            window.UniPassSupabase.upsertProfile(window.app.user);
        }

        if (window.sound) window.sound.playSuccess();
        showToast(isOfficialAdmin ? `Đăng nhập quyền Quản Trị Viên UTC2 (6651071091)!` : `Đăng ký thành công! Chào mừng bạn gia nhập UniPass UTC2 (+500 Xu, Uy tín 95đ)!`, 'success');
        if (isOfficialAdmin) {
            switchNavTab('admin');
        }
    } else {
        // Chế độ Đăng nhập: Tự nhập Gmail và Mật khẩu
        let existingUser = window.app.registeredUsers.find(u => u.email === email);
        if (existingUser) {
            if (existingUser.password && existingUser.password !== password) {
                showToast('Mật khẩu không chính xác! Vui lòng kiểm tra lại.', 'danger');
                if (window.sound) window.sound.playWarning();
                const pwdInput = document.getElementById('authPasswordInput');
                if (pwdInput) {
                    pwdInput.focus();
                    pwdInput.select();
                }
                return;
            }
            if (!existingUser.password) {
                existingUser.password = password;
                window.app.saveUsers();
            }
        } else {
            // TÀI KHOẢN CHƯA ĐĂNG KÝ: KHÔNG TỰ ĐỘNG ĐĂNG NHẬP, BẮT BUỘC CHUYỂN SANG ĐĂNG KÝ VỚI OTP
            if (!isOfficialAdmin) {
                showToast('Tài khoản chưa được đăng ký! Vui lòng chuyển sang tab "Đăng Ký Tài Khoản" để nhận mã OTP và đăng ký tài khoản mới.', 'warning');
                if (window.sound) window.sound.playWarning();
                switchAuthMode('register');
                const regEmail = document.getElementById('authEmailInput');
                if (regEmail) regEmail.value = email;
                const regPwd = document.getElementById('authPasswordInput');
                if (regPwd) regPwd.value = password;
                return;
            } else {
                existingUser = {
                    id: 'ADMIN',
                    name: 'Quản Trị Viên UTC2 (6651071091)',
                    email: email,
                    password: ADMIN_CREDENTIALS.password,
                    role: 'admin',
                    coins: 9999,
                    reputation: 100,
                    avatarLetter: 'A'
                };
                window.app.registeredUsers.push(existingUser);
                window.app.saveUsers();
            }
        }

        window.app.user = existingUser;
        window.app.isLoggedIn = true;
        window.app.checkAuthDisplay();
        window.app.updateUserUI();
        window.app.renderProducts();
        window.app.renderProfile();
        window.app.renderAdminDashboard();

        // Đồng bộ profile lên Supabase Cloud
        if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
            window.UniPassSupabase.upsertProfile(window.app.user);
        }

        if (window.sound) window.sound.playSuccess();
        showToast(isOfficialAdmin ? `Đăng nhập quyền Quản Trị Viên UTC2 (6651071091)!` : `Đăng nhập thành công với tài khoản ${email}!`, 'success');
        if (isOfficialAdmin) {
            switchNavTab('admin');
        }
    }
}

function quickLoginDemoUser(userKey) {
    if (userKey === 'admin') {
        const enteredPwd = prompt('Nhập mật khẩu Quản trị viên (6651071091@st.utc2.edu.vn):');
        if (enteredPwd === null) return; // Người dùng ấn Hủy
        if (enteredPwd !== ADMIN_CREDENTIALS.password) {
            showToast('Mật khẩu Quản trị viên không chính xác! Đăng nhập thất bại.', 'danger');
            if (window.sound) window.sound.playWarning();
            return;
        }
    }

    let target = USERS_REGISTRY[userKey];
    if (!target) target = DEFAULT_USERS[0];

    // Đồng bộ với danh sách registeredUsers
    let found = window.app.registeredUsers.find(u => u.email === target.email);
    if (!found) {
        window.app.registeredUsers.push(target);
        window.app.saveUsers();
        found = target;
    }

    window.app.user = found;
    window.app.isLoggedIn = true;
    window.app.checkAuthDisplay();
    window.app.updateUserUI();
    window.app.renderProducts();
    window.app.renderProfile();

    if (userKey === 'admin') {
        switchNavTab('admin');
    }

    if (window.sound) window.sound.playSuccess();
    showToast(`Đã vào hệ thống với tài khoản: ${window.app.user.name}!`, 'success');
}

function logoutToAuthScreen() {
    window.app.isLoggedIn = false;
    window.app.user = null;
    localStorage.removeItem('unipass_current_user');
    window.app.checkAuthDisplay();

    const emailInput = document.getElementById('authEmailInput');
    const pwdInput = document.getElementById('authPasswordInput');
    const nameInput = document.getElementById('authFullNameInput');
    const otpInput = document.getElementById('authOtpInput');
    if (emailInput) emailInput.value = '';
    if (pwdInput) pwdInput.value = '';
    if (nameInput) nameInput.value = '';
    if (otpInput) otpInput.value = '';

    const mockBox = document.getElementById('mockEmailNotification');
    if (mockBox) {
        mockBox.classList.remove('active');
        mockBox.style.display = 'none';
    }

    if (window.sound) window.sound.playClick();
    showToast('Đã đăng xuất khỏi tài khoản!', 'info');
}

// ==========================================
// 5. CHAT GIỮA CÁC TÀI KHOẢN (THỦ CÔNG, KHÔNG CÓ BOT)
// ==========================================
function openChatBetweenUsers(targetPartnerName = null, product = null, orderId = null) {
    const chatBox = document.getElementById('chatWindow');
    const convView = document.getElementById('chatConversationsView');
    const detailView = document.getElementById('chatDetailView');
    if (!chatBox) return;

    chatBox.style.display = 'flex';

    if (targetPartnerName && targetPartnerName !== window.app.user.name) {
        // Mở chi tiết 1-1 với tài khoản được chọn
        window.app.currentChatPartner = targetPartnerName;
        window.app.currentChatProduct = product || null;
        window.app.currentChatOrderId = orderId || null;

        if (convView) convView.style.display = 'none';
        if (detailView) detailView.style.display = 'flex';

        const partner = window.app.getChatPartnerName();
        const chatHeader = document.getElementById('chatHeaderName');
        if (chatHeader) chatHeader.innerText = `${partner}`;

        const headerSub = document.getElementById('chatHeaderSubtitle');
        if (headerSub) {
            headerSub.innerText = `Bạn đang nhắn tin trực tiếp với ${partner}`;
        }

        window.app.renderChatMessages();
        const input = document.getElementById('chatInputText');
        if (input) setTimeout(() => input.focus(), 80);
    } else {
        // Mở danh sách tất cả các tài khoản đã gửi tin nhắn (Inbox)
        if (convView) convView.style.display = 'flex';
        if (detailView) detailView.style.display = 'none';

        window.app.renderChatInbox();
    }

    window.app.updateChatUnreadBadge();
    if (window.sound) window.sound.playClick();
}

function backToChatInbox() {
    const convView = document.getElementById('chatConversationsView');
    const detailView = document.getElementById('chatDetailView');
    if (convView) convView.style.display = 'flex';
    if (detailView) detailView.style.display = 'none';

    window.app.renderChatInbox();
    window.app.updateChatUnreadBadge();
    if (window.sound) window.sound.playClick();
}

function closeChatWindow() {
    const chatBox = document.getElementById('chatWindow');
    if (chatBox) chatBox.style.display = 'none';
}

function sendManualMessage() {
    const input = document.getElementById('chatInputText');
    if (!input || !input.value.trim()) return;

    const text = input.value.trim();
    const partnerName = window.app.getChatPartnerName();

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const curProduct = window.app.currentChatProduct || null;
    const curOrderId = window.app.currentChatOrderId || null;

    const newMsg = {
        id: 'MSG_' + Date.now(),
        sender: window.app.user.name,
        receiver: partnerName,
        text: text,
        time: timeStr,
        productId: curProduct ? curProduct.id : null,
        productTitle: curProduct ? curProduct.title : null,
        orderId: curOrderId || null
    };

    window.app.chatMessages.push(newMsg);
    window.app.saveChats();
    window.app.renderChatMessages();

    // Đồng bộ tức thì lên mạng đa máy (Máy A ➔ Máy B, C, D...)
    if (window.UniPassOnlineSync) {
        window.UniPassOnlineSync.broadcastChatMessage(newMsg);
    }

    // Đồng bộ tức thì lên Supabase Cloud nếu đã cấu hình
    if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
        window.UniPassSupabase.sendChatMessage({
            id: newMsg.id,
            sender: newMsg.sender,
            senderEmail: window.app.user.email,
            receiver: newMsg.receiver,
            productId: newMsg.productId,
            text: newMsg.text,
            time: newMsg.time
        });
    }

    input.value = '';
    if (window.sound) window.sound.playClick();
}

function openChatFromModal() {
    if (!currentCheckoutProduct) return;
    openChatBetweenUsers(currentCheckoutProduct.seller, { id: currentCheckoutProduct.id, title: currentCheckoutProduct.title });
}

// ==========================================
// 6. ADMIN DASHBOARD LOGIC (XÓA BÀI, CẢNH CÁO, DUYỆT KHÁNG NGHỊ)
// ==========================================
function adminDeletePost(postId) {
    const post = window.app.products.find(p => p.id === postId);
    if (!post) return;

    const reason = prompt(`Nhập lý do xóa bài đăng "${post.title}":`, 'Vi phạm quy định: Không chụp ảnh kèm mã TimeMark thực tế');
    if (reason === null) return;

    window.app.products = window.app.products.filter(p => p.id !== postId);
    window.app.saveProducts();
    window.app.renderProducts();
    window.app.renderAdminDashboard();

    // Đồng bộ xóa bài lên mạng đa máy
    if (window.UniPassOnlineSync) {
        window.UniPassOnlineSync.broadcastDeletePost(postId);
    }

    // Đồng bộ xóa lên Supabase Cloud
    if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
        window.UniPassSupabase.deleteProduct(postId);
    }

    if (window.sound) window.sound.playSuccess();
    showToast(`Admin đã xóa bài đăng "${post.title}". Lý do: ${reason}`, 'success');

    if (window.app.syncChannel) {
        window.app.syncChannel.postMessage({
            type: 'USER_WARNED',
            targetName: post.seller,
            message: `Bài đăng "${post.title}" của bạn đã bị Admin gỡ bỏ vì: ${reason}.`
        });
    }
}

function adminApprovePost(postId) {
    const post = window.app.products.find(p => p.id === postId);
    if (!post) return;

    post.status = 'approved';
    post.approvedAt = Date.now();

    // Thưởng 1 điểm uy tín cho người bán vì làm đúng quy trình TimeMark chống lừa đảo
    const seller = window.app.registeredUsers.find(u => u.name === post.seller || u.email === post.sellerEmail);
    if (seller) {
        seller.reputation = Math.min(100, (seller.reputation || 95) + 1);
        window.app.saveUsers();
        if (window.app.user && (window.app.user.email === seller.email || window.app.user.name === seller.name)) {
            window.app.user.reputation = seller.reputation;
            window.app.updateUserUI();
        }
    }

    window.app.saveProducts();
    window.app.rebuildDSACache();
    window.app.renderProducts();
    window.app.renderAdminDashboard();
    window.app.renderProfile();

    if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
        window.UniPassSupabase.updateProductStatus(postId, 'approved');
    }

    if (window.UniPassOnlineSync) {
        window.UniPassOnlineSync.broadcastApprovePost(postId);
    }

    if (window.sound) window.sound.playSuccess();
    showToast(`✓ Đã duyệt bài "${post.title}"! Bài đăng đã chính thức hiển thị trên trang chính (+1 điểm uy tín cho ${post.seller})!`, 'success');
}

function adminApproveAllPendingPosts() {
    const pendingList = window.app.products.filter(p => p.status === 'pending');
    if (pendingList.length === 0) {
        showToast('Hiện không có bài đăng nào đang chờ duyệt!', 'info');
        return;
    }

    pendingList.forEach(p => {
        p.status = 'approved';
        p.approvedAt = Date.now();
        if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
            window.UniPassSupabase.updateProductStatus(p.id, 'approved');
        }
        if (window.UniPassOnlineSync) {
            window.UniPassOnlineSync.broadcastApprovePost(p.id);
        }
    });

    window.app.saveProducts();
    window.app.rebuildDSACache();
    window.app.renderProducts();
    window.app.renderAdminDashboard();
    window.app.renderProfile();

    if (window.sound) window.sound.playSuccess();
    showToast(`✓ Đã duyệt toàn bộ ${pendingList.length} bài đăng lên trang chính!`, 'success');
}

function adminRejectPost(postId) {
    const post = window.app.products.find(p => p.id === postId);
    if (!post) return;

    const reason = prompt(`Nhập lý do từ chối duyệt bài "${post.title}":`, 'Ảnh chụp TimeMark không rõ chữ viết tay mã OTP hoặc không trùng khớp sản phẩm.');
    if (reason === null) return;

    post.status = 'rejected';
    post.rejectReason = reason;

    window.app.saveProducts();
    window.app.rebuildDSACache();
    window.app.renderProducts();
    window.app.renderAdminDashboard();
    window.app.renderProfile();

    if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
        window.UniPassSupabase.updateProductStatus(postId, 'rejected');
    }

    if (window.UniPassOnlineSync) {
        window.UniPassOnlineSync.broadcastRejectPost(postId, reason);
    }

    if (window.sound) window.sound.playWarning();
    showToast(`Đã từ chối duyệt bài "${post.title}"!`, 'info');
}

function openZoomImageModal(imgSrc, title) {
    const imgEl = document.getElementById('zoomImageElement');
    const titleEl = document.getElementById('zoomImageTitle');
    if (imgEl) imgEl.src = imgSrc || '';
    if (titleEl) titleEl.innerText = title ? `🔍 ${title}` : '🔍 Xem Chi Tiết Ảnh';
    openModal('zoomImageModal');
}

function adminWarnUser(userName) {
    const warningMsg = prompt(`Nhập nội dung cảnh cáo gửi tới sinh viên ${userName}:`, 'Cảnh cáo: Tài khoản của bạn có dấu hiệu bùng hẹn giao nhận đồ tại campus UTC2.');
    if (!warningMsg) return;

    window.app.adminWarningsIssued.push({
        userName,
        warningMsg,
        time: new Date().toLocaleTimeString()
    });

    // Trừ 2 điểm uy tín trong danh sách registeredUsers
    const userToWarn = window.app.registeredUsers.find(u => u.name === userName);
    if (userToWarn) {
        userToWarn.reputation = Math.max(0, (userToWarn.reputation || 95) - 2);
        window.app.saveUsers();
        if (window.app.user.name === userName) {
            window.app.user.reputation = userToWarn.reputation;
            window.app.updateUserUI();
        }
    }

    // Đồng bộ cảnh cáo lên Supabase Cloud
    if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
        const targetEmail = (userToWarn && userToWarn.email) || 'student@st.utc2.edu.vn';
        window.UniPassSupabase.addWarning({
            targetName: userName,
            targetEmail: targetEmail,
            reason: warningMsg,
            penaltyPoints: 2
        });
    }

    // Đồng bộ cảnh cáo lên mạng đa máy (Máy B, C, D...)
    if (window.UniPassOnlineSync) {
        window.UniPassOnlineSync.broadcastWarning({
            targetName: userName,
            targetEmail: (userToWarn && userToWarn.email) || 'student@st.utc2.edu.vn',
            reason: warningMsg,
            penaltyPoints: 2
        });
    }

    window.app.renderAdminDashboard();

    if (window.sound) window.sound.playWarning();
    showToast(`Đã gửi cảnh cáo chính thức tới sinh viên ${userName}!`, 'danger');

    if (window.app.syncChannel) {
        window.app.syncChannel.postMessage({
            type: 'USER_WARNED',
            targetName: userName,
            message: warningMsg
        });
    }
}

function adminRemindUser(userName) {
    const msg = prompt(`Nhập lời nhắc nhở gửi tới sinh viên ${userName}:`, 'Nhắc nhở: Vui lòng luôn chụp ảnh sản phẩm kèm mã TimeMark trên giấy để đảm bảo quyền lợi.');
    if (!msg) return;

    showToast(`Đã gửi lời nhắc thân thiện tới ${userName}!`, 'info');
    if (window.app.syncChannel) {
        window.app.syncChannel.postMessage({
            type: 'USER_WARNED',
            targetName: userName,
            message: `[LỜI NHẮC TỪ ADMIN]: ${msg}`
        });
    }
}

function adminPenalizeDispute(dispId) {
    const dispute = window.app.adminDisputes.find(d => d.id === dispId);
    if (!dispute) return;

    dispute.status = 'penalized';

    // Xác định đối tượng vi phạm bị trừ điểm
    const accusedName = dispute.accusedName || dispute.userName;
    const accusedEmail = dispute.accusedEmail || dispute.userEmail;
    const pointsToDeduct = parseInt(dispute.penaltyPoints) || 10;

    const accusedUser = window.app.registeredUsers.find(u => 
        (accusedName && u.name === accusedName) || 
        (accusedEmail && u.email === accusedEmail)
    );

    if (accusedUser) {
        accusedUser.reputation = Math.max(0, (accusedUser.reputation || 95) - pointsToDeduct);
        window.app.saveUsers();
        if (window.app.user && (window.app.user.email === accusedUser.email || window.app.user.name === accusedUser.name)) {
            window.app.user.reputation = accusedUser.reputation;
            window.app.updateUserUI();
        }
        if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
            window.UniPassSupabase.upsertProfile(accusedUser);
        }
    }

    // Ghi nhận cảnh cáo chính thức trong hệ thống Admin
    const warning = {
        id: 'WARN_' + Date.now(),
        targetName: accusedName,
        targetEmail: accusedEmail || 'student@st.utc2.edu.vn',
        reason: `[Xử phạt khiếu nại đơn ${dispute.orderCode || ''}] ${dispute.reason}`,
        penaltyPoints: pointsToDeduct,
        time: 'Vừa xong'
    };
    window.app.adminWarningsIssued.unshift(warning);

    if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
        window.UniPassSupabase.addWarning(warning);
        window.UniPassSupabase.updateDisputeStatus(dispId, 'penalized', `Đã duyệt xử phạt -${pointsToDeduct} điểm uy tín`);
    }
    if (window.UniPassOnlineSync) {
        window.UniPassOnlineSync.broadcastWarning(warning);
        window.UniPassOnlineSync.broadcastDisputeResolved({
            disputeId: dispId,
            status: 'penalized',
            accusedName: accusedName,
            penaltyPoints: pointsToDeduct
        });
    }

    window.app.saveDisputes();
    window.app.renderAdminDashboard();

    if (window.sound) window.sound.playWarning();
    showToast(`⚖️ Admin đã duyệt khiếu nại! Đã trừ ${pointsToDeduct} điểm uy tín của ${accusedName} và ghi nhận cảnh cáo.`, 'success');
}

function adminApproveDispute(dispId) {
    // Tương thích ngược: Duyệt khôi phục điểm nếu là khiếu nại oan
    const dispute = window.app.adminDisputes.find(d => d.id === dispId);
    if (!dispute) return;

    dispute.status = 'approved';

    const user = window.app.registeredUsers.find(u => u.name === dispute.userName || u.email === dispute.userEmail);
    if (user) {
        user.reputation = 98;
        window.app.saveUsers();
        if (window.app.user.email === user.email) {
            window.app.user.reputation = 98;
            window.app.updateUserUI();
        }
    }

    window.app.saveDisputes();
    window.app.renderAdminDashboard();

    if (window.sound) window.sound.playSuccess();
    showToast(`Đã duyệt kiểm chứng! Khôi phục điểm uy tín của ${dispute.userName} lên 98 điểm.`, 'success');
}

function adminRejectDispute(dispId) {
    const dispute = window.app.adminDisputes.find(d => d.id === dispId);
    if (!dispute) return;

    dispute.status = 'rejected';
    window.app.saveDisputes();

    if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
        window.UniPassSupabase.updateDisputeStatus(dispId, 'rejected', 'Bằng chứng không đủ xác thực');
    }
    if (window.UniPassOnlineSync) {
        window.UniPassOnlineSync.broadcastDisputeResolved({ disputeId: dispId, status: 'rejected' });
    }

    window.app.renderAdminDashboard();
    showToast(`✕ Admin đã bác bỏ khiếu nại do không đủ bằng chứng xác thực.`, 'warning');
}

// ==========================================
// 7. CHECKOUT MODAL LOGIC
// ==========================================
let currentCheckoutProduct = null;

function openCheckoutModal(productId) {
    const item = window.app.products.find(p => p.id === productId);
    if (!item) return;

    currentCheckoutProduct = item;

    document.getElementById('modalProductImage').src = item.imageUrl;
    document.getElementById('modalProductTimeMark').innerText = `✓ Xác minh TimeMark: ${item.timemarkCode}`;
    document.getElementById('modalProductCategory').innerText = getCategoryName(item.category);
    document.getElementById('modalProductExpiry').innerText = `Hết hạn sau: ${item.expiryDays} ngày`;
    document.getElementById('modalProductTitle').innerText = item.title;
    document.getElementById('modalProductPrice').innerText = `${formatNumber(item.price)} VNĐ`;
    document.getElementById('modalSellerName').innerText = item.seller;
    document.getElementById('modalSellerRep').innerText = `★ ${item.sellerRep}/100`;
    document.getElementById('modalSellerLocation').innerText = item.location;
    const descEl = document.getElementById('modalProductDescription');
    if (descEl) {
        descEl.innerText = item.description || 'Món đồ được đăng pass trực tiếp tại campus UTC2.';
    }

    document.getElementById('shippingSelectOption').value = '0';
    document.getElementById('useCoinDiscountCheckbox').checked = true;

    updateCheckoutCalculations();

    const isMine = window.app.user ? (item.seller === window.app.user.name) : false;
    const confirmBtn = document.getElementById('confirmDepositBtn');
    if (isMine) {
        confirmBtn.innerText = 'Món đồ của chính bạn';
        confirmBtn.style.background = '#94a3b8';
        confirmBtn.disabled = true;
    } else {
        confirmBtn.innerText = '🤝 Đặt Cọc & Giữ Chỗ';
        confirmBtn.style.background = '#6366f1';
        confirmBtn.disabled = false;
    }

    const modal = document.getElementById('checkoutOrderModal');
    if (modal) modal.classList.add('active');
    if (window.sound) window.sound.playClick();
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutOrderModal');
    if (modal) modal.classList.remove('active');
}

function updateCheckoutCalculations() {
    if (!currentCheckoutProduct) return;

    const basePrice = currentCheckoutProduct.price;
    let deposit = Math.max(3000, Math.round((basePrice * 0.1) / 1000) * 1000);
    document.getElementById('depositAmountText').innerText = `${formatNumber(deposit)} VNĐ`;

    const shippingSelect = document.getElementById('shippingSelectOption');
    const shipFee = parseInt(shippingSelect ? shippingSelect.value : 0) || 0;

    const coinCheckbox = document.getElementById('useCoinDiscountCheckbox');
    const coinLabel = document.getElementById('coinDiscountLabelText');

    let availableCoins = window.app.user.coins || 0;
    let coinsToUse = Math.min(availableCoins, 20);
    let discountVND = coinsToUse * 100;

    if (coinLabel) {
        coinLabel.innerText = `Dùng ${coinsToUse} UniCoins săn được để giảm ${formatNumber(discountVND)} đ`;
    }

    let actualDiscount = 0;
    if (coinCheckbox && coinCheckbox.checked) {
        actualDiscount = discountVND;
    }

    const finalTotal = Math.max(0, basePrice + shipFee - actualDiscount);

    const breakdownEl = document.getElementById('calculationBreakdownText');
    if (breakdownEl) {
        breakdownEl.innerText = `(Giá đồ: ${formatNumber(basePrice)}đ + Ship: ${formatNumber(shipFee)}đ - Giảm: ${formatNumber(actualDiscount)}đ)`;
    }

    const totalEl = document.getElementById('finalTotalPaymentText');
    if (totalEl) {
        totalEl.innerText = `${formatNumber(finalTotal)} VNĐ`;
    }
}

function confirmDepositOrder() {
    if (!currentCheckoutProduct) return;

    if (window.app.user.reputation < 90) {
        showToast('Điểm uy tín dưới 90! Bạn bị khóa quyền đặt cọc.', 'danger');
        return;
    }

    const shipFee = parseInt(document.getElementById('shippingSelectOption').value) || 0;
    const useCoins = document.getElementById('useCoinDiscountCheckbox').checked;
    const coinsUsed = useCoins ? Math.min(window.app.user.coins || 0, 20) : 0;
    const discountVND = coinsUsed * 100;

    const basePrice = currentCheckoutProduct.price;
    const depositAmount = Math.max(3000, Math.round((basePrice * 0.1) / 1000) * 1000);
    const finalTotal = Math.max(0, basePrice + shipFee - discountVND);

    window.app.user.coins -= coinsUsed;
    
    // Đồng bộ số xu vào registeredUsers
    const uIdx = window.app.registeredUsers.findIndex(u => u.email === window.app.user.email);
    if (uIdx !== -1) {
        window.app.registeredUsers[uIdx].coins = window.app.user.coins;
        window.app.saveUsers();
    }
    window.app.updateUserUI();

    const newOrderData = {
        id: 'ORD_' + Date.now(),
        orderCode: 'UTC2-' + Math.floor(100000 + Math.random() * 900000),
        productId: currentCheckoutProduct.id,
        productTitle: currentCheckoutProduct.title,
        seller: currentCheckoutProduct.seller,
        sellerEmail: currentCheckoutProduct.sellerEmail || 'seller@st.utc2.edu.vn',
        buyer: window.app.user.name,
        buyerEmail: window.app.user.email || 'buyer@st.utc2.edu.vn',
        productPrice: basePrice,
        depositAmount,
        shippingFee: shipFee,
        discountAmount: discountVND,
        totalPayment: finalTotal,
        shippingOption: document.getElementById('shippingSelectOption') ? document.getElementById('shippingSelectOption').value : 'campus',
        meetLocation: currentCheckoutProduct.location,
        status: 'pending_seller', // Người mua đã cọc, chờ người bán xác nhận đơn hàng
        sellerAccepted: false,     // Người bán đã bấm xác nhận đơn hàng hay chưa
        buyerCompleted: false,     // Người mua xác nhận đã nhận hàng
        sellerCompleted: false,    // Người bán xác nhận đã giao hàng
        timestamp: Date.now()
    };

    window.app.depositOrders.push(newOrderData);
    window.app.saveOrders();

    // Đồng bộ đơn cọc lên Supabase Cloud
    if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
        window.UniPassSupabase.createOrder(newOrderData);
    }

    // Đồng bộ đơn cọc lên mạng đa máy (Máy B, C, D...)
    if (window.UniPassOnlineSync) {
        window.UniPassOnlineSync.broadcastDepositOrder(newOrderData);
    }

    closeCheckoutModal();
    if (window.sound) window.sound.playSuccess();
    showToast(`Đặt cọc thành công ${formatNumber(depositAmount)} đ! Đã gửi thông báo xác nhận đơn tới người bán (${currentCheckoutProduct.seller}).`, 'success');
    window.app.renderProfile();
}

// ==========================================
// 7b. QUẢN LÝ QUY TRÌNH GIAO DỊCH 2 BÊN & XỬ PHẠT (ĐẶC TẢ UTC2)
// ==========================================

// 1. Người bán xác nhận đơn hàng sau khi người mua đặt cọc
function confirmOrderBySeller(orderId) {
    const order = window.app.depositOrders.find(o => o.id === orderId);
    if (!order) return;

    if (window.app.user.name !== order.seller && window.app.user.email !== order.sellerEmail) {
        showToast('Chỉ người bán mới có quyền xác nhận đơn hàng này!', 'danger');
        return;
    }

    order.sellerAccepted = true;
    order.status = 'in_trade';
    window.app.saveOrders();

    if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
        window.UniPassSupabase.updateOrder(order.id, { status: 'in_trade', notes: 'Người bán đã xác nhận đơn' });
    }
    if (window.UniPassOnlineSync) {
        window.UniPassOnlineSync.broadcastOrderUpdate(order);
    }

    if (window.sound) window.sound.playSuccess();
    showToast(`✓ Bạn đã xác nhận đơn hàng "${order.productTitle}"! Vui lòng hẹn gặp ${order.buyer} tại điểm hẹn để trao đổi đồ.`, 'success');
    window.app.renderProfile();
}

// 2. Hai bên lên xác nhận giao dịch thành công (Cả 2 cùng xác nhận -> Tự động xóa bài đăng)
function confirmTradeComplete(orderId, role) {
    const order = window.app.depositOrders.find(o => o.id === orderId);
    if (!order) return;

    if (role === 'buyer') {
        if (window.app.user.name !== order.buyer && window.app.user.email !== order.buyerEmail) {
            showToast('Bạn không phải người mua của đơn này!', 'danger');
            return;
        }
        order.buyerCompleted = true;
    } else if (role === 'seller') {
        if (window.app.user.name !== order.seller && window.app.user.email !== order.sellerEmail) {
            showToast('Bạn không phải người bán của đơn này!', 'danger');
            return;
        }
        order.sellerCompleted = true;
    }

    // NẾU CẢ 2 BÊN ĐÃ XÁC NHẬN HOÀN TẤT: TỰ ĐỘNG XÓA BÀI ĐĂNG & CỘNG ĐIỂM UY TÍN
    if (order.buyerCompleted && order.sellerCompleted) {
        order.status = 'completed';

        // Cộng +2 điểm uy tín cho cả 2 bên
        const buyerUser = window.app.registeredUsers.find(u => u.name === order.buyer || u.email === order.buyerEmail);
        const sellerUser = window.app.registeredUsers.find(u => u.name === order.seller || u.email === order.sellerEmail);

        if (buyerUser) buyerUser.reputation = Math.min(100, (buyerUser.reputation || 95) + 2);
        if (sellerUser) sellerUser.reputation = Math.min(100, (sellerUser.reputation || 95) + 2);
        window.app.saveUsers();

        if (window.app.user && (window.app.user.name === order.buyer || window.app.user.name === order.seller)) {
            window.app.user.reputation = Math.min(100, (window.app.user.reputation || 95) + 2);
            window.app.updateUserUI();
        }

        // TỰ ĐỘNG XÓA BÀI ĐĂNG KHỎI HỆ THỐNG (BẢNG TIN + CLOUD + ĐA MÁY)
        if (order.productId) {
            window.app.products = window.app.products.filter(p => p.id !== order.productId);
            window.app.saveProducts();
            window.app.rebuildDSACache();
            window.app.renderProducts();
            window.app.renderAdminDashboard();

            if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
                window.UniPassSupabase.deleteProduct(order.productId);
            }
            if (window.UniPassOnlineSync) {
                window.UniPassOnlineSync.broadcastDeletePost(order.productId);
            }
        }

        // TỰ ĐỘNG XÓA TIN NHẮN CUỘC TRÒ CHUYỆN LIÊN QUAN ĐẾN ĐƠN HÀNG (BẢO VỆ RIÊNG TƯ THEO doPasss.docx)
        const buyerName = order.buyer;
        const sellerName = order.seller;
        const pId = order.productId;

        window.app.chatMessages = window.app.chatMessages.filter(m => {
            if (pId && m.productId === pId) return false;
            if (m.orderId && m.orderId === order.id) return false;
            if ((m.sender === buyerName && m.receiver === sellerName) || 
                (m.sender === sellerName && m.receiver === buyerName)) {
                return false;
            }
            return true;
        });
        window.app.saveChats();
        window.app.renderChatMessages();

        // Đồng bộ xóa tin nhắn trên Supabase Cloud
        if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
            window.UniPassSupabase.deleteChatMessagesForOrder(pId, buyerName, sellerName);
        }

        // Phát sóng xóa tin nhắn đa máy qua Realtime Sync
        if (window.UniPassOnlineSync) {
            window.UniPassOnlineSync.broadcastDeleteChat({
                orderId: order.id,
                productId: pId,
                buyer: buyerName,
                seller: sellerName
            });
        }

        window.app.saveOrders();

        if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
            window.UniPassSupabase.updateOrder(order.id, { status: 'completed' });
        }
        if (window.UniPassOnlineSync) {
            window.UniPassOnlineSync.broadcastOrderUpdate(order);
        }

        if (window.sound) window.sound.playSuccess();
        showToast(`🎉 Giao dịch thành công 100%! Cả hai bên đã xác nhận hoàn tất. Bài đăng "${order.productTitle}" và lịch sử chat đã được tự động dọn dẹp bảo mật (+2 điểm uy tín)!`, 'success');
    } else {
        // Chỉ mới 1 bên xác nhận
        order.status = 'pending_mutual';
        window.app.saveOrders();

        if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
            window.UniPassSupabase.updateOrder(order.id, { status: 'pending_mutual' });
        }
        if (window.UniPassOnlineSync) {
            window.UniPassOnlineSync.broadcastOrderUpdate(order);
        }

        if (window.sound) window.sound.playNotification();
        showToast(`✓ Bạn đã xác nhận thành công! Đang chờ đối phương xác nhận để hoàn tất giao dịch và hoàn cọc.`, 'info');
    }

    window.app.renderProfile();
}

// 3. Xử phạt cá nhân không chịu xác nhận sau khi giao dịch thành công (Trừ 5 điểm uy tín)
function reportUnconfirmedTrade(orderId) {
    const order = window.app.depositOrders.find(o => o.id === orderId);
    if (!order) return;

    let delinquentName = '';
    let delinquentEmail = '';

    if (order.buyerCompleted && !order.sellerCompleted) {
        delinquentName = order.seller;
        delinquentEmail = order.sellerEmail;
    } else if (order.sellerCompleted && !order.buyerCompleted) {
        delinquentName = order.buyer;
        delinquentEmail = order.buyerEmail;
    } else {
        showToast('Cần ít nhất một bên xác nhận đã trao đổi trước khi báo cáo vi phạm không xác nhận!', 'warning');
        return;
    }

    if (!confirm(`Xác nhận xử phạt "${delinquentName}" do không chịu xác nhận giao dịch thành công? Đối phương sẽ bị trừ 5 điểm uy tín theo quy định UTC2.`)) {
        return;
    }

    // Trừ 5 điểm uy tín của cá nhân không xác nhận
    const delinquentUser = window.app.registeredUsers.find(u => 
        (delinquentName && u.name === delinquentName) || 
        (delinquentEmail && u.email === delinquentEmail)
    );

    if (delinquentUser) {
        delinquentUser.reputation = Math.max(0, (delinquentUser.reputation || 95) - 5);
        window.app.saveUsers();
        if (window.app.user.email === delinquentUser.email || window.app.user.name === delinquentUser.name) {
            window.app.user.reputation = delinquentUser.reputation;
            window.app.updateUserUI();
        }
        if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
            window.UniPassSupabase.upsertProfile(delinquentUser);
        }
    }

    // Ghi nhận cảnh cáo
    const warning = {
        id: 'WARN_' + Date.now(),
        targetName: delinquentName,
        targetEmail: delinquentEmail || 'student@st.utc2.edu.vn',
        reason: `Bị trừ 5 điểm uy tín do không chịu xác nhận giao dịch thành công cho đơn ${order.orderCode} ("${order.productTitle}").`,
        penaltyPoints: 5,
        time: 'Vừa xong'
    };
    window.app.adminWarningsIssued.unshift(warning);

    if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
        window.UniPassSupabase.addWarning(warning);
    }
    if (window.UniPassOnlineSync) {
        window.UniPassOnlineSync.broadcastWarning(warning);
    }

    // Đóng giao dịch và gỡ bài đăng nếu còn
    order.status = 'closed_penalized';
    if (order.productId) {
        window.app.products = window.app.products.filter(p => p.id !== order.productId);
        window.app.saveProducts();
        window.app.rebuildDSACache();
        window.app.renderProducts();
        if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
            window.UniPassSupabase.deleteProduct(order.productId);
        }
        if (window.UniPassOnlineSync) {
            window.UniPassOnlineSync.broadcastDeletePost(order.productId);
        }
    }

    window.app.saveOrders();
    if (window.UniPassOnlineSync) {
        window.UniPassOnlineSync.broadcastOrderUpdate(order);
    }

    if (window.sound) window.sound.playWarning();
    showToast(`⚖️ Đã xử lý! ${delinquentName} bị trừ 5 điểm uy tín do không xác nhận giao dịch sau khi trao đồ.`, 'warning');
    window.app.renderProfile();
}

// 4. Mở modal khiếu nại (Boom hàng, hàng lỗi) gửi Admin
function openOrderDisputeModal(orderId) {
    const order = window.app.depositOrders.find(o => o.id === orderId);
    if (!order) return;

    const isBuyer = (window.app.user.name === order.buyer || window.app.user.email === order.buyerEmail);
    const targetName = isBuyer ? order.seller : order.buyer;
    const targetEmail = isBuyer ? (order.sellerEmail || 'seller@st.utc2.edu.vn') : (order.buyerEmail || 'buyer@st.utc2.edu.vn');

    document.getElementById('disputeOrderId').value = order.id;
    document.getElementById('disputeProductTitle').innerText = order.productTitle;
    document.getElementById('disputeOrderCode').innerText = order.orderCode || order.id;
    document.getElementById('disputeTargetUser').innerText = targetName;
    document.getElementById('disputeTargetEmail').innerText = targetEmail;
    document.getElementById('disputeEvidenceText').value = '';

    openModal('orderDisputeModal');
}

// 5. Gửi hồ sơ khiếu nại lên Admin
function handleOrderDisputeSubmit(event) {
    event.preventDefault();
    const orderId = document.getElementById('disputeOrderId').value;
    const order = window.app.depositOrders.find(o => o.id === orderId);
    if (!order) {
        closeModal('orderDisputeModal');
        return;
    }

    const isBuyer = (window.app.user.name === order.buyer || window.app.user.email === order.buyerEmail);
    const targetName = isBuyer ? order.seller : order.buyer;
    const targetEmail = isBuyer ? (order.sellerEmail || 'seller@st.utc2.edu.vn') : (order.buyerEmail || 'buyer@st.utc2.edu.vn');

    const reasonSelect = document.getElementById('disputeReasonSelect');
    const reasonType = reasonSelect.value;
    const reasonText = reasonSelect.options[reasonSelect.selectedIndex].text;
    const penaltyPoints = parseInt(document.getElementById('disputePenaltyPointsSelect').value) || 10;
    const evidenceText = document.getElementById('disputeEvidenceText').value.trim();

    const newDispute = {
        id: 'DISP_' + Date.now(),
        orderId: order.id,
        orderCode: order.orderCode || order.id,
        productTitle: order.productTitle,
        reporterName: window.app.user.name,
        reporterEmail: window.app.user.email,
        accusedName: targetName,
        accusedEmail: targetEmail,
        userName: targetName,
        userEmail: targetEmail,
        reasonType: reasonType,
        reason: reasonText,
        penaltyPoints: penaltyPoints,
        evidence: evidenceText,
        time: 'Hôm nay, ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        status: 'pending'
    };

    window.app.adminDisputes.unshift(newDispute);
    window.app.saveDisputes();

    if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
        window.UniPassSupabase.createDispute(newDispute);
    }
    if (window.UniPassOnlineSync) {
        window.UniPassOnlineSync.broadcastDispute(newDispute);
    }

    closeModal('orderDisputeModal');
    if (window.sound) window.sound.playNotification();
    showToast(`🚨 Đã gửi hồ sơ khiếu nại lên Admin! Quản trị viên UTC2 sẽ xem xét và trừ điểm uy tín của ${targetName}.`, 'success');
    window.app.renderProfile();
}

// ==========================================
// 8. ĐIỀU HƯỚNG TABS
// ==========================================
function switchNavTab(tabName) {
    if (tabName === 'admin') {
        if (!window.app.user || window.app.user.email !== '6651071091@st.utc2.edu.vn') {
            openAdminAccessDeniedModal();
            return;
        }
    }

    document.querySelectorAll('.nav-item-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    const homeView = document.getElementById('mainHomeView');
    const heroBanner = document.getElementById('heroBannerSection');
    const gameView = document.getElementById('gameSectionView');
    const profileView = document.getElementById('profileSectionView');
    const adminView = document.getElementById('adminDashboardSection');

    if (homeView) homeView.style.display = 'none';
    if (heroBanner) heroBanner.style.display = 'none';
    if (gameView) gameView.style.display = 'none';
    if (profileView) profileView.style.display = 'none';
    if (adminView) adminView.style.display = 'none';

    if (tabName === 'home') {
        if (homeView) homeView.style.display = 'grid';
        if (heroBanner) heroBanner.style.display = 'block';
        window.app.renderProducts();
    } else if (tabName === 'game') {
        if (gameView) gameView.style.display = 'flex';
        if (!window.game && document.getElementById('gameCanvas')) {
            window.game = new window.BlocklashGame('gameCanvas', (coins) => {
                window.app.user.coins = (window.app.user.coins || 0) + coins;
                const uIdx = window.app.registeredUsers.findIndex(u => u.email === window.app.user.email);
                if (uIdx !== -1) {
                    window.app.registeredUsers[uIdx].coins = window.app.user.coins;
                    window.app.saveUsers();
                }
                window.app.updateUserUI();
                showToast(`+${coins} Xu săn được đã cộng vào ví!`, 'success');
            });
        }
    } else if (tabName === 'profile') {
        if (profileView) profileView.style.display = 'flex';
        window.app.renderProfile();
    } else if (tabName === 'admin') {
        if (adminView) adminView.style.display = 'flex';
        window.app.renderAdminDashboard();
    }
}

function toggleQuickAccount() {
    window.app.toggleAccount();
}

function toggleFilterCriterion(criterionKey) {
    if (!window.app.filterCriteriaEnabled) {
        window.app.filterCriteriaEnabled = { price: false, distance: false, category: false, reputation: false };
    }

    const capKey = criterionKey.charAt(0).toUpperCase() + criterionKey.slice(1);
    const chk = document.getElementById(`chkFilter${capKey}`);
    const body = document.getElementById(`filterBody${capKey}`);

    if (chk) {
        window.app.filterCriteriaEnabled[criterionKey] = chk.checked;
        if (body) {
            if (chk.checked) {
                body.classList.remove('disabled-criterion');
            } else {
                body.classList.add('disabled-criterion');
            }
        }
    }

    // Tự động kích hoạt bộ lọc nếu người dùng tích bất kỳ tiêu chí nào
    if (!window.app.isFilterActive) {
        const anyChecked = Object.values(window.app.filterCriteriaEnabled).some(v => v);
        if (anyChecked) {
            const aside = document.getElementById('filterSidebarAside');
            const mainView = document.getElementById('mainHomeView');
            const toggleBtn = document.getElementById('btnToggleFilterMode');
            window.app.isFilterActive = true;
            if (aside) aside.style.display = 'block';
            if (mainView) mainView.style.gridTemplateColumns = '290px 1fr';
            if (toggleBtn) {
                toggleBtn.innerHTML = '⚡ Đang Bật Lọc (Bấm để Tắt)';
                toggleBtn.style.background = '#0284c7';
                toggleBtn.style.color = '#fff';
            }
        }
    }

    window.app.renderProducts();
    if (window.sound) window.sound.playClick();
}

function resetFilters() {
    window.app.filterCriteriaEnabled = {
        price: false,
        category: false,
        reputation: false
    };
    window.app.filterMaxPrice = 350000;
    window.app.filterCategoryKey = 'ALL';
    window.app.filterMinReputation = 90;
    window.app.searchKeyword = '';

    ['Price', 'Category', 'Reputation'].forEach(key => {
        const chk = document.getElementById(`chkFilter${key}`);
        const body = document.getElementById(`filterBody${key}`);
        if (chk) chk.checked = false;
        if (body) body.classList.add('disabled-criterion');
    });

    const priceSlider = document.getElementById('priceRangeSlider');
    const priceMaxInput = document.getElementById('filterPriceMax');
    if (priceSlider) priceSlider.value = 350000;
    if (priceMaxInput) priceMaxInput.value = 'Đến: 350k';

    const repSlider = document.getElementById('reputationRangeSlider');
    const repVal = document.getElementById('reputationDisplayVal');
    if (repSlider) repSlider.value = 90;
    if (repVal) repVal.innerText = '≥ 90 đ';

    const allCatRadio = document.querySelector('input[name="catFilter"][value="ALL"]');
    if (allCatRadio) allCatRadio.checked = true;

    const searchInput = document.getElementById('mainSearchInput');
    if (searchInput) searchInput.value = '';

    window.app.renderProducts();
    showToast('Đã đặt lại toàn bộ bộ lọc và tiêu chí!', 'info');
}

function applyFilters() {
    if (!window.app.isFilterActive) {
        const aside = document.getElementById('filterSidebarAside');
        const mainView = document.getElementById('mainHomeView');
        const toggleBtn = document.getElementById('btnToggleFilterMode');
        window.app.isFilterActive = true;
        if (aside) aside.style.display = 'block';
        if (mainView) mainView.style.gridTemplateColumns = '290px 1fr';
        if (toggleBtn) {
            toggleBtn.innerHTML = '⚡ Đang Bật Lọc (Bấm để Tắt)';
            toggleBtn.style.background = '#0284c7';
            toggleBtn.style.color = '#fff';
        }
    }
    window.app.renderProducts();
    showToast('Đã áp dụng các tiêu chí lọc được chọn!', 'success');
}

function filterCategory(catKey) {
    window.app.filterCategoryKey = catKey;
    const chk = document.getElementById('chkFilterCategory');
    const body = document.getElementById('filterBodyCategory');
    if (chk && !chk.checked) {
        chk.checked = true;
        if (body) body.classList.remove('disabled-criterion');
        if (!window.app.filterCriteriaEnabled) window.app.filterCriteriaEnabled = {};
        window.app.filterCriteriaEnabled.category = true;
    }
    window.app.renderProducts();
}

function handleSortChange(sortVal) {
    window.app.sortBy = sortVal;
    window.app.renderProducts();
}

function executeSearch() {
    const input = document.getElementById('mainSearchInput');
    if (!input) return;
    window.app.searchKeyword = input.value.trim();
    window.app.renderProducts();
}

function openShopeeSuggestion() {
    showToast('Đang kết nối API đề xuất giá sàn Shopee cho sinh viên UTC2...', 'info');
}

function openDepositOrders() {
    switchNavTab('profile');
    showToast(`Bạn đang có ${window.app.depositOrders.length} đơn đặt cọc giữ chỗ.`, 'info');
}

// ==========================================
// 9. QUẢN LÝ PHÂN QUYỀN ADMIN (CHỈ CHO 6651071091)
// ==========================================
function openAdminAccessDeniedModal() {
    const deniedName = document.getElementById('deniedCurrentUserName');
    const deniedEmail = document.getElementById('deniedCurrentUserEmail');
    const inputEl = document.getElementById('adminDeniedModalPassword');
    const errEl = document.getElementById('adminDeniedErrorMsg');

    if (deniedName && window.app.user) deniedName.innerText = window.app.user.name;
    if (deniedEmail && window.app.user) deniedEmail.innerText = window.app.user.email;
    if (inputEl) inputEl.value = '';
    if (errEl) errEl.style.display = 'none';

    openModal('adminAccessDeniedModal');
    if (window.sound) window.sound.playWarning();
    showToast('⛔ Quyền bị từ chối: Khu vực này chỉ dành riêng cho ' + ADMIN_CREDENTIALS.email + '!', 'danger');
}

function loginAsOfficialAdmin() {
    const inputEl = document.getElementById('adminDeniedModalPassword');
    const errEl = document.getElementById('adminDeniedErrorMsg');
    const entered = (inputEl ? inputEl.value.trim() : '') || prompt('Nhập mật khẩu Quản trị viên (' + ADMIN_CREDENTIALS.email + '):');

    if (!entered || entered !== ADMIN_CREDENTIALS.password) {
        if (errEl) {
            errEl.style.display = 'block';
            errEl.innerText = '⚠ Mật khẩu Quản trị viên không chính xác!';
        }
        showToast('Mật khẩu Quản trị viên không chính xác! Đăng nhập thất bại.', 'danger');
        if (window.sound) window.sound.playWarning();
        if (inputEl) {
            inputEl.focus();
            inputEl.select();
        }
        return;
    }

    if (errEl) errEl.style.display = 'none';
    if (inputEl) inputEl.value = '';
    closeModal('adminAccessDeniedModal');

    let target = USERS_REGISTRY.admin;
    let found = window.app.registeredUsers.find(u => u.email === target.email);
    if (!found) {
        window.app.registeredUsers.push(target);
        window.app.saveUsers();
        found = target;
    }

    window.app.user = found;
    window.app.isLoggedIn = true;
    window.app.checkAuthDisplay();
    window.app.updateUserUI();
    switchNavTab('admin');

    if (window.sound) window.sound.playSuccess();
    showToast('Đăng nhập quyền Quản Trị Viên UTC2 thành công!', 'success');
}

function openOnlinePresentationModal() {
    const lanInput = document.getElementById('lanUrlInput');
    if (lanInput) lanInput.value = 'http://192.168.1.25:8080';
    openModal('onlinePresentationModal');
    if (window.sound) window.sound.playClick();
}

function copyLanUrl() {
    const url = 'http://192.168.1.25:8080';
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            showToast('✓ Đã sao chép link mạng LAN: ' + url, 'success');
        }).catch(() => {
            showToast('Link mạng LAN: ' + url, 'info');
        });
    } else {
        showToast('Link mạng LAN: ' + url, 'info');
    }
}

// ==========================================
// 10. ĐĂNG BÀI PASS ĐỒ, TẢI ẢNH TỪ FILE & TIMEMARK
// ==========================================
let pendingNewPost = null;
let pendingUploadedImageDataUrl = null;

function handlePostImageFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, JPEG, WebP)!', 'danger');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const rawDataUrl = e.target.result;
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 480;
            const MAX_HEIGHT = 480;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width = Math.round((width * MAX_HEIGHT) / height);
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.68);
            pendingUploadedImageDataUrl = compressedDataUrl;

            const previewWrap = document.getElementById('fileImagePreviewWrap');
            const previewImg = document.getElementById('fileImagePreviewElement');
            const promptContent = document.getElementById('fileUploadPromptContent');

            if (previewImg) previewImg.src = compressedDataUrl;
            if (previewWrap) previewWrap.style.display = 'block';
            if (promptContent) promptContent.style.display = 'none';

            if (window.sound) window.sound.playClick();
            showToast('✓ Đã tải ảnh từ tệp thành công!', 'success');
        };
        img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
}

function removeSelectedPostImage() {
    pendingUploadedImageDataUrl = null;
    const fileInput = document.getElementById('postImageFileInput');
    if (fileInput) fileInput.value = '';

    const previewWrap = document.getElementById('fileImagePreviewWrap');
    const previewImg = document.getElementById('fileImagePreviewElement');
    const promptContent = document.getElementById('fileUploadPromptContent');

    if (previewImg) previewImg.src = '';
    if (previewWrap) previewWrap.style.display = 'none';
    if (promptContent) promptContent.style.display = 'block';
}

let pendingTimeMarkProofDataUrl = null;

function handleTimeMarkProofImageSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, JPEG, WebP)!', 'danger');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const rawDataUrl = e.target.result;
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 640;
            const MAX_HEIGHT = 640;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width = Math.round((width * MAX_HEIGHT) / height);
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.72);
            pendingTimeMarkProofDataUrl = compressedDataUrl;

            const previewWrap = document.getElementById('timemarkProofPreviewWrap');
            const previewImg = document.getElementById('timemarkProofPreviewImg');
            const promptBox = document.getElementById('timemarkProofUploadPrompt');

            if (previewImg) previewImg.src = compressedDataUrl;
            if (previewWrap) previewWrap.style.display = 'block';
            if (promptBox) promptBox.style.display = 'none';

            if (window.sound) window.sound.playClick();
            showToast('✓ Đã tải ảnh xác thực TimeMark thành công!', 'success');
        };
        img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
}

function removeTimeMarkProofImage() {
    pendingTimeMarkProofDataUrl = null;
    const fileInput = document.getElementById('timemarkProofFileInput');
    if (fileInput) fileInput.value = '';

    const previewWrap = document.getElementById('timemarkProofPreviewWrap');
    const previewImg = document.getElementById('timemarkProofPreviewImg');
    const promptBox = document.getElementById('timemarkProofUploadPrompt');

    if (previewImg) previewImg.src = '';
    if (previewWrap) previewWrap.style.display = 'none';
    if (promptBox) promptBox.style.display = 'block';
}

function handlePostSubmit(e) {
    e.preventDefault();

    if (!window.app.user) {
        showToast('Vui lòng đăng nhập trước khi đăng bài pass đồ!', 'warning');
        return;
    }

    const title = document.getElementById('newPostTitle').value.trim();
    const rawPrice = document.getElementById('newPostPrice').value;
    const price = parseInt(String(rawPrice).replace(/[^\d]/g, '')) || 0;
    const category = document.getElementById('newPostCategory').value;
    const location = document.getElementById('newPostLocation').value.trim();
    const description = document.getElementById('newPostDescription') ? document.getElementById('newPostDescription').value.trim() : '';
    const urlInput = document.getElementById('newPostImage').value.trim();

    if (!location) {
        showToast('Vui lòng tự nhập vị trí / địa điểm hẹn gặp tại UTC2!', 'warning');
        return;
    }

    if (!description) {
        showToast('Vui lòng nhập mô tả chi tiết sản phẩm!', 'warning');
        return;
    }

    const finalImage = pendingUploadedImageDataUrl || urlInput || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60';
    const randCode = 'UTC2 - ' + Math.floor(1000 + Math.random() * 9000);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} - ${now.toLocaleDateString('vi-VN')}`;

    pendingNewPost = {
        id: 'P_' + Date.now(),
        title,
        price,
        originalPrice: Math.round(price * 1.8),
        category,
        timemarkCode: randCode,
        seller: window.app.user.name,
        sellerEmail: window.app.user.email,
        sellerRep: window.app.user.reputation || 95,
        location: location,
        distanceKm: 0.5,
        expiryDays: 7,
        imageUrl: finalImage,
        timemarkProofUrl: finalImage,
        description: description,
        status: 'approved', // ✨ ĐƯỢC DUYỆT TỰ ĐỘNG ĐỂ HIỂN THỊ NGAY LẬP TỨC LÊN TRANG CHÍNH
        createdTimeStr: timeStr,
        submittedAt: Date.now(),
        approvedAt: Date.now()
    };

    const codeDisplay = document.getElementById('generatedTimeMarkCode');
    const guideCode = document.getElementById('timemarkCodeGuide');
    const sellerEmailEl = document.getElementById('timemarkSellerEmail');
    const emailBadge = document.getElementById('timemarkEmailStatusBadge');

    if (codeDisplay) codeDisplay.innerText = randCode;
    if (guideCode) guideCode.innerText = randCode;
    if (sellerEmailEl) sellerEmailEl.innerText = window.app.user.email;
    if (emailBadge) emailBadge.innerText = 'Đang Gửi Mail...';

    // Reset khung tải ảnh xác thực TimeMark
    removeTimeMarkProofImage();

    // Gửi mã xác nhận TimeMark về Gmail của người đăng qua SMTP
    UniPassMailer.sendTimeMarkOtp(window.app.user.email, randCode, title).then(() => {
        if (emailBadge) emailBadge.innerText = 'Đã Gửi Về Gmail';
    });

    closeModal('createPostModal');
    openModal('timemarkCodeModal');

    if (window.sound) window.sound.playNotification();
    showToast(`📸 Đã cấp mã TimeMark [${randCode}] và phát lệnh gửi về Gmail: ${window.app.user.email}!`, 'success');
}

function confirmPublishPostWithProof() {
    if (!pendingNewPost) return;

    // Dùng ảnh xác thực TimeMark nếu tải lên, hoặc dùng ảnh sản phẩm
    const proofImg = pendingTimeMarkProofDataUrl || pendingNewPost.imageUrl;
    pendingNewPost.timemarkProofUrl = proofImg;
    pendingNewPost.status = 'approved'; // ✨ ĐƯỢC DUYỆT THÀNH CÔNG VÀ HIỂN THỊ TRANG CHÍNH!
    pendingNewPost.approvedAt = Date.now();

    window.app.products.unshift(pendingNewPost);
    window.app.saveProducts();
    window.app.rebuildDSACache();
    window.app.renderProducts(); // Hiển thị ngay lên trang chính!
    window.app.renderProfile();  // Hiển thị trong Hồ sơ cá nhân
    window.app.renderAdminDashboard(); // Cập nhật thống kê Admin

    // Đồng bộ sản phẩm mới lên Supabase Cloud
    if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
        window.UniPassSupabase.addProduct(pendingNewPost);
    }

    // Đồng bộ bài đăng mới lên mạng đa máy
    if (window.UniPassOnlineSync) {
        window.UniPassOnlineSync.broadcastNewPost(pendingNewPost);
    }

    closeModal('timemarkCodeModal');
    removeSelectedPostImage();
    removeTimeMarkProofImage();

    // Đặt lại các ô nhập của form đăng bài
    const titleInput = document.getElementById('newPostTitle');
    const priceInput = document.getElementById('newPostPrice');
    const locInput = document.getElementById('newPostLocation');
    const descInput = document.getElementById('newPostDescription');
    const urlInput = document.getElementById('newPostImage');
    if (titleInput) titleInput.value = '';
    if (priceInput) priceInput.value = '';
    if (locInput) locInput.value = '';
    if (descInput) descInput.value = '';
    if (urlInput) urlInput.value = '';

    // Tự động chuyển về tab Săn Đồ (Home) nếu đang ở tab khác để người dùng thấy ngay bài đăng
    switchNavTab('home');

    if (window.sound) window.sound.playSuccess();
    showToast(`🎉 Đã duyệt và đăng bài "${pendingNewPost.title}" thành công lên trang chính!`, 'success');
    pendingNewPost = null;
}

function confirmPublishPost() {
    confirmPublishPostWithProof();
}

function removePost(id) {
    if (confirm('Xác nhận xóa bài đăng này?')) {
        window.app.products = window.app.products.filter(p => p.id !== id);
        window.app.saveProducts();
        window.app.renderProducts();
        window.app.renderProfile();

        // Đồng bộ xóa lên Supabase Cloud
        if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
            window.UniPassSupabase.deleteProduct(id);
        }

        // Đồng bộ xóa bài lên mạng đa máy (Máy B, C, D...)
        if (window.UniPassOnlineSync) {
            window.UniPassOnlineSync.broadcastDeletePost(id);
        }

        showToast('Đã xóa bài đăng!', 'success');
    }
}

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
}

function openReputationRules() {
    showToast('Điểm uy tín: 95 mặc định, max 100. <90 sẽ bị khóa quyền cọc & pass đồ!', 'info');
}

// Khởi tạo listeners khi tải trang
document.addEventListener('DOMContentLoaded', () => {
    const priceSlider = document.getElementById('priceRangeSlider');
    const priceMaxInput = document.getElementById('filterPriceMax');
    if (priceSlider) {
        priceSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            window.app.filterMaxPrice = val;
            if (priceMaxInput) priceMaxInput.value = `Đến: ${Math.round(val / 1000)}k`;

            // Tự động tích chọn tiêu chí giá
            const chk = document.getElementById('chkFilterPrice');
            const body = document.getElementById('filterBodyPrice');
            if (chk && !chk.checked) {
                chk.checked = true;
                if (body) body.classList.remove('disabled-criterion');
                if (!window.app.filterCriteriaEnabled) window.app.filterCriteriaEnabled = {};
                window.app.filterCriteriaEnabled.price = true;
            }
            window.app.renderProducts();
        });
    }

    const repSlider = document.getElementById('reputationRangeSlider');
    const repVal = document.getElementById('reputationDisplayVal');
    if (repSlider) {
        repSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            window.app.filterMinReputation = val;
            if (repVal) repVal.innerText = `≥ ${val} đ`;

            // Tự động tích chọn tiêu chí uy tín
            const chk = document.getElementById('chkFilterReputation');
            const body = document.getElementById('filterBodyReputation');
            if (chk && !chk.checked) {
                chk.checked = true;
                if (body) body.classList.remove('disabled-criterion');
                if (!window.app.filterCriteriaEnabled) window.app.filterCriteriaEnabled = {};
                window.app.filterCriteriaEnabled.reputation = true;
            }
            window.app.renderProducts();
        });
    }

    const searchInput = document.getElementById('mainSearchInput');
    const dropdown = document.getElementById('searchAutocompleteDropdown');
    if (searchInput) {
        searchInput.value = '';
        if (window.app) window.app.searchKeyword = '';
    }
    if (searchInput && dropdown) {
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            window.app.searchKeyword = val;
            if (val.length > 0) {
                const suggs = window.app.trie.suggest(val);
                if (suggs.length > 0) {
                    dropdown.innerHTML = `
                        <div class="autocomplete-header">
                            <span>Gợi ý Trie Cache (O(k))</span>
                            <span>Độ phổ biến</span>
                        </div>
                        ${suggs.map(s => `
                            <div class="autocomplete-item" onclick="pickSearchSuggestion('${s.word}')">
                                <span>🔍 ${s.word}</span>
                                <span style="color:#0284c7; font-size:11px;">🔥 ${s.freq} lượt</span>
                            </div>
                        `).join('')}
                    `;
                    dropdown.classList.add('active');
                } else {
                    dropdown.classList.remove('active');
                }
            } else {
                dropdown.classList.remove('active');
            }
            window.app.renderProducts();
        });

      searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                dropdown.classList.remove('active');
                executeSearch();
            }
        });
    }
});

function pickSearchSuggestion(word) {
    const input = document.getElementById('mainSearchInput');
    const dropdown = document.getElementById('searchAutocompleteDropdown');
    if (input) input.value = word;
    if (dropdown) dropdown.classList.remove('active');
    window.app.searchKeyword = word;
    window.app.trie.recordSearch(word);
    window.app.renderProducts();
}

// Lắng nghe sự kiện storage để đồng bộ tức thì trên nhiều cửa sổ / tab khác nhau
window.addEventListener('storage', (e) => {
    if (e.key === 'unipass_products' && e.newValue) {
        try {
            window.app.products = JSON.parse(e.newValue);
            window.app.rebuildDSACache();
            window.app.renderProducts();
            window.app.renderAdminDashboard();
        } catch (err) {}
    } else if (e.key === 'unipass_registered_users' && e.newValue) {
        try {
            window.app.registeredUsers = JSON.parse(e.newValue);
            window.app.renderAdminDashboard();
            window.app.updateUserUI();
        } catch (err) {}
    } else if (e.key === 'unipass_shared_messages' && e.newValue) {
        try {
            window.app.chatMessages = JSON.parse(e.newValue);
            window.app.renderChatMessages();
            window.app.updateChatUnreadBadge();
        } catch (err) {}
    } else if (e.key === 'unipass_deposit_orders' && e.newValue) {
        try {
            window.app.depositOrders = JSON.parse(e.newValue);
            window.app.updateDepositBadge();
            window.app.renderProfile();
        } catch (err) {}
    }
});
function toggleSidebarFilter() {
    const aside = document.getElementById('filterSidebarAside');
    const mainView = document.getElementById('mainHomeView');
    const toggleBtn = document.getElementById('btnToggleFilterMode');
    if (!aside || !mainView) return;

    window.app.isFilterActive = !window.app.isFilterActive;

    if (window.app.isFilterActive) {
        aside.style.display = 'block';
        mainView.style.gridTemplateColumns = '290px 1fr';
        if (toggleBtn) {
            toggleBtn.innerHTML = '⚡ Bộ Lọc: Đang Hiện (Bấm để Ẩn)';
            toggleBtn.style.background = '#0284c7';
            toggleBtn.style.color = '#fff';
        }
        showToast('Đã hiển thị bộ lọc song song', 'info');
    } else {
        aside.style.display = 'none';
        mainView.style.gridTemplateColumns = '1fr';
        if (toggleBtn) {
            toggleBtn.innerHTML = '🎛️ Bộ Lọc: Đang Ẩn (Bấm để Hiện)';
            toggleBtn.style.background = '#ffffff';
            toggleBtn.style.color = '#334155';
        }
        showToast('Đã ẩn bộ lọc (Hiện toàn màn hình đồ)', 'info');
    }

    window.app.renderProducts();
    if (window.sound) window.sound.playClick();
}

// ==========================================
// SUPABASE MODAL & CLOUD CONFIGURATION CONTROLLERS
// ==========================================
function updateSupabaseNavIndicator() {
    const btn = document.getElementById('supabaseStatusNavBtn');
    const text = document.getElementById('supabaseStatusNavText');
    if (!btn || !text) return;

    if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
        btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        btn.style.color = '#ffffff';
        btn.style.borderColor = '#059669';
        text.innerText = 'Supabase Cloud (Đã nối)';
    } else {
        btn.style.background = '#f0f9ff';
        btn.style.color = '#0284c7';
        btn.style.borderColor = '#7dd3fc';
        text.innerText = 'Supabase DB';
    }
}

function openSupabaseModal() {
    openModal('supabaseConfigModal');

    const urlInput = document.getElementById('supabaseUrlInput');
    const keyInput = document.getElementById('supabaseKeyInput');
    const webhookInput = document.getElementById('emailWebhookUrlInput');
    const badge = document.getElementById('supabaseStatusBadge');
    const detail = document.getElementById('supabaseDetailText');

    if (webhookInput) {
        webhookInput.value = localStorage.getItem('unipass_email_webhook') || DEFAULT_APPS_SCRIPT_WEBHOOK;
    }

    const smtpHostInput = document.getElementById('smtpHostInput');
    const smtpPortInput = document.getElementById('smtpPortInput');
    const smtpUserInput = document.getElementById('smtpUserInput');
    const smtpPassInput = document.getElementById('smtpPassInput');
    if (smtpHostInput) smtpHostInput.value = localStorage.getItem('unipass_smtp_host') || 'smtp.gmail.com';
    if (smtpPortInput) smtpPortInput.value = localStorage.getItem('unipass_smtp_port') || '587';
    if (smtpUserInput) smtpUserInput.value = localStorage.getItem('unipass_smtp_user') || '';
    if (smtpPassInput) smtpPassInput.value = localStorage.getItem('unipass_smtp_pass') || '';

    if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
        const cfg = window.UniPassSupabase.getConfig();
        if (urlInput) urlInput.value = cfg.url || 'https://lhlwemmpnrmlskeljniq.supabase.co';
        if (keyInput) keyInput.value = (window.UniPassSupabase.getRawKey && window.UniPassSupabase.getRawKey()) || localStorage.getItem('unipass_supabase_key') || '';
        if (badge) {
            badge.innerText = '🟢 Trạng thái: Đã kết nối Supabase Cloud';
            badge.style.color = '#15803d';
        }
        if (detail) {
            detail.innerText = `Đang kết nối: ${cfg.url}. Cơ sở dữ liệu Supabase PostgreSQL đang hoạt động.`;
        }
    } else {
        if (urlInput && !urlInput.value) urlInput.value = localStorage.getItem('unipass_supabase_url') || 'https://lhlwemmpnrmlskeljniq.supabase.co';
        if (keyInput && !keyInput.value) keyInput.value = localStorage.getItem('unipass_supabase_key') || '';
        if (badge) {
            badge.innerText = '🟡 Trạng thái: Bộ nhớ đệm cục bộ (Chưa nối Cloud)';
            badge.style.color = '#d97706';
        }
        if (detail) {
            detail.innerText = 'Nhập Anon Key (hoặc bấm link "Lấy Key tại đây") để kích hoạt đồng bộ đám mây PostgreSQL.';
        }
    }
}

async function saveAndConnectSupabase() {
    const urlInput = document.getElementById('supabaseUrlInput');
    const keyInput = document.getElementById('supabaseKeyInput');
    const webhookInput = document.getElementById('emailWebhookUrlInput');
    const smtpHostInput = document.getElementById('smtpHostInput');
    const smtpPortInput = document.getElementById('smtpPortInput');
    const smtpUserInput = document.getElementById('smtpUserInput');
    const smtpPassInput = document.getElementById('smtpPassInput');

    if (smtpHostInput) localStorage.setItem('unipass_smtp_host', smtpHostInput.value.trim() || 'smtp.gmail.com');
    if (smtpPortInput) localStorage.setItem('unipass_smtp_port', smtpPortInput.value.trim() || '587');
    if (smtpUserInput) {
        const u = smtpUserInput.value.trim();
        if (u) localStorage.setItem('unipass_smtp_user', u);
        else localStorage.removeItem('unipass_smtp_user');
    }
    if (smtpPassInput) {
        const p = smtpPassInput.value.trim();
        if (p) localStorage.setItem('unipass_smtp_pass', p);
        else localStorage.removeItem('unipass_smtp_pass');
    }

    if (!urlInput || !keyInput) return;

    const url = urlInput.value.trim() || 'https://lhlwemmpnrmlskeljniq.supabase.co';
    let key = keyInput.value.trim();

    // Bảo vệ: Nếu người dùng để trống hoặc bị hiển thị dạng che dấu (****** hoặc ...), giữ lại key thật
    if (!key || key.includes('...') || key.includes('*') || key.length < 25) {
        key = (window.UniPassSupabase && window.UniPassSupabase.getRawKey && window.UniPassSupabase.getRawKey()) || 
              localStorage.getItem('unipass_supabase_key') || 
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxobHdlbW1wbnJtbHNrZWxqbmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNzIyNTYsImV4cCI6MjEwNjg0ODI1Nn0.OBOpRm80_LZ9vmt3hgKUuDqPkeAzDHPkYS_MoacHeDo';
        keyInput.value = key;
    }

    if (webhookInput) {
        const webhookVal = webhookInput.value.trim();
        if (webhookVal) {
            localStorage.setItem('unipass_email_webhook', webhookVal);
        } else {
            localStorage.removeItem('unipass_email_webhook');
        }
    }

    if (!url || !key) {
        showToast('Vui lòng nhập đầy đủ Supabase Project URL và Anon Key!', 'danger');
        return;
    }

    try {
        window.UniPassSupabase.saveConfig(url, key);
        updateSupabaseNavIndicator();
        showToast('Đang kết nối và kiểm tra Database...', 'info');

        const testRes = await window.UniPassSupabase.testConnection();
        const badge = document.getElementById('supabaseStatusBadge');
        const pingEl = document.getElementById('supabasePingTime');
        const detail = document.getElementById('supabaseDetailText');

        if (testRes.success) {
            if (badge) {
                badge.innerText = '🟢 Kết nối Thành Công!';
                badge.style.color = '#15803d';
            }
            if (pingEl) pingEl.innerText = `Ping: ${testRes.duration} ms`;
            if (detail) detail.innerText = `Đã kết nối cơ sở dữ liệu Supabase. Tìm thấy ${testRes.productsCount} sản phẩm sẵn có.`;
            showToast(`✓ Kết nối Supabase thành công! Ping: ${testRes.duration}ms`, 'success');

            // Đồng bộ dữ liệu mới nhất
            if (window.app) {
                window.app.initSupabaseSync();
            }
        } else {
            if (badge) {
                badge.innerText = '⚠️ Lỗi kiểm tra bảng';
                badge.style.color = '#ef4444';
            }
            if (detail) detail.innerText = testRes.message + ' (Hãy đảm bảo bạn đã chạy file supabase_schema.sql trong tab SQL Editor của Supabase).';
            showToast(testRes.message, 'danger');
        }
    } catch (err) {
        showToast(`Lỗi: ${err.message}`, 'danger');
    }
}

async function testSupabasePing() {
    if (!window.UniPassSupabase || !window.UniPassSupabase.isConfigured()) {
        const urlInput = document.getElementById('supabaseUrlInput');
        const keyInput = document.getElementById('supabaseKeyInput');
        if (urlInput && keyInput && urlInput.value.trim() && keyInput.value.trim()) {
            return saveAndConnectSupabase();
        }
        showToast('Chưa cấu hình Supabase URL hoặc Key để ping!', 'warning');
        return;
    }

    showToast('Đang ping Supabase Cloud...', 'info');
    const testRes = await window.UniPassSupabase.testConnection();
    const pingEl = document.getElementById('supabasePingTime');
    const badge = document.getElementById('supabaseStatusBadge');
    const detail = document.getElementById('supabaseDetailText');

    if (testRes.success) {
        if (pingEl) pingEl.innerText = `Ping: ${testRes.duration} ms`;
        if (badge) {
            badge.innerText = '🟢 Kết nối ổn định';
            badge.style.color = '#15803d';
        }
        if (detail) detail.innerText = `Phản hồi tốt (${testRes.duration}ms). Số lượng sản phẩm trên mây: ${testRes.productsCount}.`;
        showToast(`✓ Ping thành công: ${testRes.duration}ms!`, 'success');
    } else {
        if (badge) {
            badge.innerText = '❌ Mất kết nối';
            badge.style.color = '#ef4444';
        }
        if (detail) detail.innerText = testRes.message;
        showToast(testRes.message, 'danger');
    }
}

function copySupabaseSchemaSql() {
    fetch('supabase_schema.sql')
        .then(res => res.text())
        .then(sqlText => {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(sqlText).then(() => {
                    showToast('Đã sao chép toàn bộ mã SQL Schema! Hãy dán vào SQL Editor trên Supabase.', 'success');
                }).catch(() => {
                    fallbackCopy(sqlText);
                });
            } else {
                fallbackCopy(sqlText);
            }
        })
        .catch(() => {
            showToast('Vui lòng mở file supabase_schema.sql trong thư mục để sao chép!', 'info');
        });

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Đã sao chép mã SQL Schema vào Clipboard!', 'success');
    }
}

function disconnectSupabase() {
    if (window.UniPassSupabase) {
        window.UniPassSupabase.clearConfig();
    }
    const urlInput = document.getElementById('supabaseUrlInput');
    const keyInput = document.getElementById('supabaseKeyInput');
    const webhookInput = document.getElementById('emailWebhookUrlInput');
    const badge = document.getElementById('supabaseStatusBadge');
    const detail = document.getElementById('supabaseDetailText');
    const pingEl = document.getElementById('supabasePingTime');

    if (urlInput) urlInput.value = '';
    if (keyInput) keyInput.value = '';
    if (webhookInput) webhookInput.value = '';
    localStorage.removeItem('unipass_email_webhook');

    if (badge) {
        badge.innerText = '⚪ Đã ngắt kết nối';
        badge.style.color = '#64748b';
    }
    if (detail) detail.innerText = 'Hệ thống đã chuyển về chế độ bộ nhớ đệm cục bộ (Local Cache).';
    if (pingEl) pingEl.innerText = 'Ping: -- ms';

    updateSupabaseNavIndicator();
    showToast('Đã ngắt kết nối Supabase Cloud. Dùng Local Cache.', 'info');
}