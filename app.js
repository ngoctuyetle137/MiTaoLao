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

// Tài khoản khởi tạo mặc định ban đầu
const DEFAULT_USERS = [
    {
        id: 'UA',
        name: 'Lê Thị Ngọc Tuyết',
        email: 'tuyetltn.st@st.utc2.edu.vn',
        role: 'student',
        reputation: 98,
        coins: 170,
        avatarLetter: 'T'
    },
    {
        id: 'UB',
        name: 'Phúc Lâm',
        email: 'lamnp.st@st.utc2.edu.vn',
        role: 'student',
        reputation: 92,
        coins: 250,
        avatarLetter: 'L'
    },
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
    userA: DEFAULT_USERS[0],
    userB: DEFAULT_USERS[1],
    admin: DEFAULT_USERS[2]
};

// ==========================================
// 2. STATE MANAGER TRUNG TÂM
// ==========================================
class AppController {
    constructor() {
        this.registeredUsers = [];
        this.currentUserKey = 'userA';
        this.user = DEFAULT_USERS[0];
        this.isLoggedIn = false;
        this.currentAuthMode = 'register';
        this.generatedOtp = '';

        this.products = [];
        this.chatMessages = [];
        this.depositOrders = [];
        this.adminDisputes = [
            {
                id: 'DISP_1',
                userName: 'Phúc Lâm',
                userEmail: 'lamnp.st@st.utc2.edu.vn',
                currentRep: 92,
                reason: 'Bị hạ điểm oan do đối phương hẹn nhưng trễ 45 phút rồi tự ý hủy đơn cọc',
                evidence: 'Ảnh tin nhắn hẹn tại KTX Cỏ May lúc 17h00 và nhật ký cuộc gọi 17h15 không nghe máy',
                time: 'Hôm nay, 08:30',
                status: 'pending'
            }
        ];
        this.adminWarningsIssued = [];

        this.filterMaxPrice = 350000;
        this.filterMaxDistance = 5;
        this.filterCategoryKey = 'ALL';
        this.searchKeyword = '';
        this.sortBy = 'newest';
        this.isFilterActive = false; // Mặc định tắt lọc để hiện tất cả đồ pass

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
                    text: 'Chào bạn Lâm, nồi cơm điện mini bạn còn pass không?',
                    time: '08:15'
                },
                {
                    id: 'M2',
                    sender: 'Phúc Lâm',
                    receiver: 'Lê Thị Ngọc Tuyết',
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

        // Kiểm tra phiên đăng nhập đã lưu
        const savedUser = localStorage.getItem('unipass_current_user');
        if (savedUser) {
            try {
                this.user = JSON.parse(savedUser);
                this.isLoggedIn = true;
            } catch (e) {
                this.isLoggedIn = false;
            }
        }

        this.rebuildDSACache();
        this.checkAuthDisplay();
        this.updateUserUI();
        this.renderProducts();
        this.updateDepositBadge();
        this.updateChatUnreadBadge();
        this.initSupabaseSync();
    }

    async initSupabaseSync() {
        if (typeof updateSupabaseNavIndicator === 'function') {
            updateSupabaseNavIndicator();
        }

        if (!window.UniPassSupabase || !window.UniPassSupabase.isConfigured()) {
            return;
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
            } else if (payload.eventType === 'DELETE' || (payload.eventType === 'UPDATE' && payload.new.status === 'deleted')) {
                const targetId = payload.old ? payload.old.id : payload.new.id;
                this.products = this.products.filter(p => p.id !== targetId);
                this.rebuildDSACache();
                this.renderProducts();
                this.renderAdminDashboard();
            }
        } else if (table === 'chat_messages') {
            if (payload.eventType === 'INSERT') {
                const newM = payload.new;
                if (!this.chatMessages.some(m => m.id === newM.id)) {
                    this.chatMessages.push({
                        id: newM.id,
                        sender: newM.sender_name,
                        receiver: newM.receiver_name,
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
        } else {
            if (authScreen) authScreen.style.display = 'flex';
            if (mainApp) mainApp.style.display = 'none';
        }
    }

    rebuildDSACache() {
        this.avl = new window.UTC2_DSA.AVLTree();
        this.postDLL = new window.UTC2_DSA.PostDoublyLinkedList();

        this.products.forEach(p => {
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

    saveOrders() {
        localStorage.setItem('unipass_deposit_orders', JSON.stringify(this.depositOrders));
        this.updateDepositBadge();
    }

updateDepositBadge() {
        const badge = document.getElementById('depositOrderCount');
        if (!badge) return;
        
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

        const partnerName = this.getChatPartnerName();
        const unread = this.chatMessages.filter(m => m.receiver === this.user.name && m.sender === partnerName).length;

        if (unread > 0) {
            badge.style.display = 'inline-block';
            badge.innerText = unread;
        } else {
            badge.style.display = 'none';
        }
    }

    getChatPartnerName() {
        // Tìm bạn chat mặc định: ưu tiên người khác mình trong danh sách
        const otherUser = this.registeredUsers.find(u => u.name !== this.user.name && u.role !== 'admin');
        if (otherUser) return otherUser.name;
        return this.user.name === 'Lê Thị Ngọc Tuyết' ? 'Phúc Lâm' : 'Lê Thị Ngọc Tuyết';
    }

    updateUserUI() {
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
            // Hiển thị tên người dùng tiếp theo trong danh sách
            const nextIdx = (this.registeredUsers.findIndex(u => u.email === this.user.email) + 1) % this.registeredUsers.length;
            const nextUser = this.registeredUsers[nextIdx] || this.registeredUsers[0];
            switchBtn.innerText = `Đổi sang: ${nextUser.name.split(' ').slice(-1)[0] || nextUser.name}`;
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
        // Nếu TẮT bộ lọc: Hiển thị toàn bộ bài đăng
        if (!this.isFilterActive) {
            let items = [...this.products];
            if (this.searchKeyword.trim().length > 0) {
                const kw = this.searchKeyword.toLowerCase();
                items = items.filter(p => 
                    p.title.toLowerCase().includes(kw) ||
                    (p.courseCode && p.courseCode.toLowerCase().includes(kw)) ||
                    (p.seller && p.seller.toLowerCase().includes(kw))
                );
            }
            return items;
        }

        // Nếu BẬT bộ lọc: Chạy thuật toán AVL Tree và lọc theo tiêu chí
        let items = this.avl.rangeQuery(0, this.filterMaxPrice);

        items = items.filter(p => (p.distanceKm || 0.5) <= this.filterMaxDistance);

        if (this.filterCategoryKey !== 'ALL') {
            items = items.filter(p => p.category === this.filterCategoryKey);
        }

        if (this.searchKeyword.trim().length > 0) {
            const kw = this.searchKeyword.toLowerCase();
            items = items.filter(p => 
                p.title.toLowerCase().includes(kw) ||
                (p.courseCode && p.courseCode.toLowerCase().includes(kw)) ||
                (p.seller && p.seller.toLowerCase().includes(kw))
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
            dsaInfo.innerText = `AVL Tree lọc được ${list.length} sp trong tầm giá [0 - ${formatNumber(this.filterMaxPrice)} đ].`;
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
            const isMyItem = item.seller === this.user.name;
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

        if (myPosts) {
            const myItems = this.products.filter(p => p.seller === this.user.name);
            if (myItems.length === 0) {
                myPosts.innerHTML = `<p style="font-size:12px; color:#64748b;">Chưa có bài đăng nào.</p>`;
            } else {
                myPosts.innerHTML = myItems.map(p => `
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; margin-bottom:6px; font-size:12.5px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong>${p.title}</strong>
                            <div style="color:#0284c7; font-size:11px;">${formatNumber(p.price)} đ • TimeMark: ${p.timemarkCode}</div>
                        </div>
                        <button onclick="removePost('${p.id}')" style="background:none; border:none; color:#ef4444; font-size:12px; cursor:pointer; font-weight:700;">Xóa</button>
                    </div>
                `).join('');
            }
        }

       if (history) {
            // ✅ Chỉ lấy các đơn mà tài khoản hiện tại là người mua (buyer) HOẶC người bán (seller)
            const myOrders = this.depositOrders.filter(o => 
                o.buyer === this.user.name || o.seller === this.user.name
            );

            if (myOrders.length === 0) {
                history.innerHTML = `<p style="font-size:12px; color:#64748b;">Chưa có đơn cọc nào.</p>`;
            } else {
                history.innerHTML = myOrders.map(o => `
                    <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:8px 12px; margin-bottom:6px; font-size:12.5px;">
                        <div style="display:flex; justify-content:space-between;">
                            <strong>${o.productTitle}</strong>
                            <span style="color:#16a34a; font-weight:700;">Đã cọc ${formatNumber(o.depositAmount)} đ</span>
                        </div>
                        <div style="font-size:11px; color:#64748b; margin-top:2px;">
                            ${o.buyer === this.user.name ? `Người bán: ${o.seller}` : `Người mua: ${o.buyer}`} • Tổng tiền: ${formatNumber(o.finalTotal)} đ (Đã trừ ${o.discountCoins} xu)
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    renderChatMessages() {
        const area = document.getElementById('chatMessagesArea');
        const headerSub = document.getElementById('chatHeaderSubtitle');
        if (!area) return;

        const partnerName = this.getChatPartnerName();
        if (headerSub) {
            headerSub.innerText = `Bạn (${this.user.name}) đang nhắn tin với: ${partnerName}`;
        }

        const conversation = this.chatMessages.filter(m => 
            (m.sender === this.user.name && m.receiver === partnerName) ||
            (m.sender === partnerName && m.receiver === this.user.name)
        );

        if (conversation.length === 0) {
            area.innerHTML = `
                <div style="text-align:center; color:#94a3b8; font-size:12.5px; margin-top:30px;">
                    Chưa có tin nhắn nào giữa <strong>${this.user.name}</strong> và <strong>${partnerName}</strong>.<br>
                    Hãy gõ tin nhắn bên dưới để bắt đầu trao đổi đồ!
                </div>
            `;
            return;
        }

        area.innerHTML = conversation.map(m => {
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
        const postsTbody = document.getElementById('adminPostsTableBody');
        const usersTbody = document.getElementById('adminUsersTableBody');
        const disputesTbody = document.getElementById('adminDisputesTableBody');
        const totalPostsEl = document.getElementById('adminTotalPosts');
        const totalUsersEl = document.querySelector('.admin-stat-card:nth-child(2) .admin-stat-number');
        const pendingDispEl = document.getElementById('adminPendingDisputes');
        const warningsCountEl = document.getElementById('adminWarningsCount');

        // Danh sách sinh viên thực tế (loại tài khoản quản trị)
        const studentUsers = this.registeredUsers.filter(u => u.role !== 'admin');

        if (totalPostsEl) totalPostsEl.innerText = this.products.length;
        if (totalUsersEl) totalUsersEl.innerText = studentUsers.length;
        if (pendingDispEl) pendingDispEl.innerText = this.adminDisputes.filter(d => d.status === 'pending').length;
        if (warningsCountEl) warningsCountEl.innerText = this.adminWarningsIssued.length;

        // Bảng 1: Quản lý bài đăng & Xóa bài rác
        if (postsTbody) {
            postsTbody.innerHTML = this.products.map(p => `
                <tr>
                    <td><strong>${p.title}</strong></td>
                    <td style="color:#0284c7; font-weight:700;">${formatNumber(p.price)} đ</td>
                    <td>${p.seller}</td>
                    <td><span style="background:#e0f2fe; color:#0284c7; padding:2px 8px; border-radius:4px; font-weight:700; font-size:11px;">${p.timemarkCode}</span></td>
                    <td><span style="color:#d97706;">Còn ${p.expiryDays} ngày</span></td>
                    <td>
                        <button class="btn-admin-danger" onclick="adminDeletePost('${p.id}')">
                            🗑 Xóa Bài Rác
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

        // Bảng 3: Duyệt kiểm chứng kháng nghị uy tín
        if (disputesTbody) {
            if (this.adminDisputes.length === 0) {
                disputesTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:20px;">Không có kháng nghị nào đang chờ xử lý.</td></tr>`;
            } else {
                disputesTbody.innerHTML = this.adminDisputes.map(d => `
                    <tr>
                        <td><strong>${d.userName}</strong><br><span style="font-size:11px; color:#64748b;">${d.userEmail}</span></td>
                        <td style="color:#b45309; font-weight:600;">${d.reason}</td>
                        <td style="font-size:12px; color:#475569;">${d.evidence}</td>
                        <td style="color:#64748b; font-size:11px;">${d.time}</td>
                        <td>
                            ${d.status === 'pending' ? `
                                <div style="display:flex; gap:6px;">
                                    <button class="btn-admin-success" onclick="adminApproveDispute('${d.id}')">
                                        ✓ Khôi Phục Uy Tín
                                    </button>
                                    <button class="btn-admin-danger" onclick="adminRejectDispute('${d.id}')">
                                        ✕ Bác Bỏ
                                    </button>
                                </div>
                            ` : `<span style="font-weight:700; color:${d.status === 'approved' ? '#16a34a' : '#ef4444'};">${d.status === 'approved' ? '✓ Đã khôi phục điểm' : '✕ Đã từ chối'}</span>`}
                        </td>
                    </tr>
                `).join('');
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
        if (submitBtn) submitBtn.innerText = '✓ Đăng Nhập Vào Hệ Thống';
    }
    if (window.sound) window.sound.playClick();
}

function requestOtpCode(e) {
    if (e && e.preventDefault) e.preventDefault(); // Chặn form tự nộp và load lại trang
    
    const emailInput = document.getElementById('authEmailInput');
    if (!emailInput) return;
    const email = emailInput.value.trim();

    const isCollegeEmail = email.endsWith('@st.utc2.edu.vn') || email.endsWith('@utc2.edu.vn');
    if (!isCollegeEmail) {
        showToast('Chỉ cho phép Gmail trường UTC2 (@st.utc2.edu.vn hoặc @utc2.edu.vn)!', 'danger');
        if (window.sound) window.sound.playWarning();
        return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    window.app.generatedOtp = otp;

    const mockBox = document.getElementById('mockEmailNotification');
    const displayOtp = document.getElementById('displayGeneratedOtp');
    const targetEmail = document.getElementById('mockTargetEmail');
    const otpInput = document.getElementById('authOtpInput');

    if (displayOtp) displayOtp.innerText = otp;
    if (targetEmail) targetEmail.innerText = email;
    if (mockBox) {
        mockBox.classList.add('active');
        mockBox.style.display = 'block'; // Đảm bảo hộp thư hiện lên
    }

    if (otpInput) otpInput.value = otp; // Tự điền luôn mã OTP vào ô nhập

    if (window.sound) window.sound.playNotification();
    showToast(`Mã OTP đã gửi về ${email}! Vui lòng kiểm tra hộp thư bên dưới.`, 'success');
}

   
// Xử lý nộp form Đăng ký / Đăng nhập
function handleAuthSubmitForm(e) {
    e.preventDefault();
    const email = document.getElementById('authEmailInput').value.trim();
    const fullName = document.getElementById('authFullNameInput').value.trim();
    const enteredOtp = document.getElementById('authOtpInput').value.trim();
    const password = document.getElementById('authPasswordInput') ? document.getElementById('authPasswordInput').value.trim() : '';

    const isCollegeEmail = email.endsWith('@st.utc2.edu.vn') || email.endsWith('@utc2.edu.vn');
    if (!isCollegeEmail) {
        showToast('Vui lòng dùng Gmail trường UTC2 (@st.utc2.edu.vn)!', 'danger');
        if (window.sound) window.sound.playWarning();
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
        if (!window.app.generatedOtp) {
            showToast('Vui lòng bấm "Gửi Mã OTP" để nhận mã xác nhận trước!', 'danger');
            if (window.sound) window.sound.playWarning();
            return;
        }

        if (enteredOtp !== window.app.generatedOtp && enteredOtp !== '123456') {
            showToast('Mã OTP không chính xác! Vui lòng kiểm tra lại.', 'danger');
            if (window.sound) window.sound.playWarning();
            return;
        }

        // Tìm xem tài khoản đã tồn tại hay chưa
        let existingUser = window.app.registeredUsers.find(u => u.email === email);
        if (existingUser) {
            window.app.user = existingUser;
        } else {
            const newUser = {
                id: isOfficialAdmin ? 'ADMIN' : ('U_' + Date.now()),
                name: fullName || (isOfficialAdmin ? 'Quản Trị Viên UTC2 (6651071091)' : email.split('@')[0]),
                email: email,
                password: isOfficialAdmin ? ADMIN_CREDENTIALS.password : (password || '123456'),
                role: isOfficialAdmin ? 'admin' : 'student',
                coins: isOfficialAdmin ? 9999 : 500,
                reputation: isOfficialAdmin ? 100 : 95,
                avatarLetter: (fullName || email).charAt(0).toUpperCase()
            };
            window.app.registeredUsers.push(newUser);
            window.app.saveUsers();
            window.app.user = newUser;
        }

        window.app.isLoggedIn = true;
        window.app.checkAuthDisplay();
        window.app.updateUserUI();
        window.app.renderAdminDashboard();

        if (window.sound) window.sound.playSuccess();
        showToast(isOfficialAdmin ? `Đăng nhập quyền Quản Trị Viên UTC2 (6651071091)!` : `Đăng ký thành công! Chào mừng bạn gia nhập UniPass UTC2 (+500 Xu, Uy tín 95đ)!`, 'success');
        if (isOfficialAdmin) {
            switchNavTab('admin');
        }
    } else {
        // Chế độ Đăng nhập
        let existingUser = window.app.registeredUsers.find(u => u.email === email);
        if (!existingUser) {
            // Nếu chưa có trong hệ thống, tự động ghi nhận
            existingUser = {
                id: isOfficialAdmin ? 'ADMIN' : ('U_' + Date.now()),
                name: isOfficialAdmin ? 'Quản Trị Viên UTC2 (6651071091)' : email.split('@')[0],
                email: email,
                password: isOfficialAdmin ? ADMIN_CREDENTIALS.password : (password || '123456'),
                role: isOfficialAdmin ? 'admin' : 'student',
                coins: isOfficialAdmin ? 9999 : 500,
                reputation: isOfficialAdmin ? 100 : 95,
                avatarLetter: email.charAt(0).toUpperCase()
            };
            window.app.registeredUsers.push(existingUser);
            window.app.saveUsers();
        }

        window.app.user = existingUser;
        window.app.isLoggedIn = true;
        window.app.checkAuthDisplay();
        window.app.updateUserUI();
        window.app.renderAdminDashboard();

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
    localStorage.removeItem('unipass_current_user');
    window.app.checkAuthDisplay();
    if (window.sound) window.sound.playClick();
    showToast('Đã đăng xuất khỏi tài khoản!', 'info');
}

// ==========================================
// 5. CHAT GIỮA CÁC TÀI KHOẢN (THỦ CÔNG, KHÔNG CÓ BOT)
// ==========================================
function openChatBetweenUsers() {
    const partner = window.app.getChatPartnerName();
    const chatHeader = document.getElementById('chatHeaderName');
    if (chatHeader) chatHeader.innerText = `Trò chuyện: ${partner}`;

    const chatBox = document.getElementById('chatWindow');
    if (chatBox) chatBox.style.display = 'flex';

    window.app.renderChatMessages();
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

    const newMsg = {
        id: 'MSG_' + Date.now(),
        sender: window.app.user.name,
        receiver: partnerName,
        text: text,
        time: timeStr
    };

    window.app.chatMessages.push(newMsg);
    window.app.saveChats();
    window.app.renderChatMessages();

    // Đồng bộ tức thì lên Supabase Cloud nếu đã cấu hình
    if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
        window.UniPassSupabase.sendChatMessage({
            id: newMsg.id,
            sender: newMsg.sender,
            senderEmail: window.app.user.email,
            receiver: newMsg.receiver,
            text: newMsg.text,
            time: newMsg.time
        });
    }

    input.value = '';
    if (window.sound) window.sound.playClick();
}

function openChatFromModal() {
    if (!currentCheckoutProduct) return;
    openChatBetweenUsers();
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

function adminApproveDispute(dispId) {
    const dispute = window.app.adminDisputes.find(d => d.id === dispId);
    if (!dispute) return;

    dispute.status = 'approved';

    // Khôi phục điểm uy tín lên 98 điểm
    const user = window.app.registeredUsers.find(u => u.name === dispute.userName || u.email === dispute.userEmail);
    if (user) {
        user.reputation = 98;
        window.app.saveUsers();
        if (window.app.user.email === user.email) {
            window.app.user.reputation = 98;
            window.app.updateUserUI();
        }
    }

    window.app.renderAdminDashboard();

    if (window.sound) window.sound.playSuccess();
    showToast(`Đã duyệt kiểm chứng! Khôi phục điểm uy tín của ${dispute.userName} lên 98 điểm.`, 'success');
}

function adminRejectDispute(dispId) {
    const dispute = window.app.adminDisputes.find(d => d.id === dispId);
    if (!dispute) return;

    dispute.status = 'rejected';
    window.app.renderAdminDashboard();
    showToast(`Đã bác bỏ khiếu nại của ${dispute.userName} do không đủ bằng chứng.`, 'warning');
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

    document.getElementById('shippingSelectOption').value = '0';
    document.getElementById('useCoinDiscountCheckbox').checked = true;

    updateCheckoutCalculations();

    const isMine = item.seller === window.app.user.name;
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
        timestamp: Date.now()
    };

    window.app.depositOrders.push(newOrderData);
    window.app.saveOrders();

    // Đồng bộ đơn cọc lên Supabase Cloud
    if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
        window.UniPassSupabase.createOrder(newOrderData);
    }

    closeCheckoutModal();
    if (window.sound) window.sound.playSuccess();
    showToast(`Đặt cọc thành công ${formatNumber(depositAmount)} đ! Đã giữ chỗ món "${currentCheckoutProduct.title}".`, 'success');
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

function resetFilters() {
    window.app.filterMaxPrice = 350000;
    window.app.filterMaxDistance = 5;
    window.app.filterCategoryKey = 'ALL';
    window.app.searchKeyword = '';

    document.getElementById('priceRangeSlider').value = 350000;
    document.getElementById('filterPriceMax').value = 'Đến: 350k';
    document.getElementById('distanceRangeSlider').value = 5;
    document.getElementById('distanceDisplayVal').innerText = '5 km';
    document.getElementById('mainSearchInput').value = '';

    const allCatRadio = document.querySelector('input[name="catFilter"][value="ALL"]');
    if (allCatRadio) allCatRadio.checked = true;

    window.app.renderProducts();
    showToast('Đã đặt lại toàn bộ bộ lọc!', 'info');
}

function applyFilters() {
    window.app.renderProducts();
    showToast('Đã áp dụng bộ lọc!', 'success');
}

function filterCategory(catKey) {
    window.app.filterCategoryKey = catKey;
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
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
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

            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
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

function handlePostSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('newPostTitle').value.trim();
    const price = parseInt(document.getElementById('newPostPrice').value) || 0;
    const category = document.getElementById('newPostCategory').value;
    const location = document.getElementById('newPostLocation').value.trim();
    const urlInput = document.getElementById('newPostImage').value.trim();

    const finalImage = pendingUploadedImageDataUrl || urlInput || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60';

    const randCode = 'UTC2 - ' + Math.floor(1000 + Math.random() * 9000);

    pendingNewPost = {
        id: 'P_' + Date.now(),
        title,
        price,
        originalPrice: Math.round(price * 1.8),
        category,
        timemarkCode: randCode,
        seller: window.app.user.name,
        sellerEmail: window.app.user.email,
        sellerRep: window.app.user.reputation,
        location,
        distanceKm: 0.5,
        expiryDays: 7,
        imageUrl: finalImage,
        description: 'Món đồ được đăng pass trực tiếp tại campus UTC2.'
    };

    const codeDisplay = document.getElementById('generatedTimeMarkCode');
    if (codeDisplay) codeDisplay.innerText = randCode;

    closeModal('createPostModal');
    openModal('timemarkCodeModal');
}

function confirmPublishPost() {
    if (!pendingNewPost) return;

    window.app.products.unshift(pendingNewPost);
    window.app.rebuildDSACache(); // <-- BẮT BUỘC: Thêm dòng này để nạp bài mới vào AVL Tree & Trie
    window.app.saveProducts();
    window.app.renderProducts();
    window.app.renderProfile();

    // Đồng bộ sản phẩm mới lên Supabase Cloud
    if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
        window.UniPassSupabase.addProduct(pendingNewPost);
    }

    closeModal('timemarkCodeModal');
    removeSelectedPostImage();

    if (window.sound) window.sound.playSuccess();
    showToast(`✓ Đã đăng bài "${pendingNewPost.title}" thành công lên hệ thống!`, 'success');
    pendingNewPost = null;
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
            window.app.renderProducts();
        });
    }

    const distSlider = document.getElementById('distanceRangeSlider');
    const distVal = document.getElementById('distanceDisplayVal');
    if (distSlider) {
        distSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            window.app.filterMaxDistance = val;
            if (distVal) distVal.innerText = `${val} km`;
            window.app.renderProducts();
        });
    }

    const searchInput = document.getElementById('mainSearchInput');
    const dropdown = document.getElementById('searchAutocompleteDropdown');
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
            toggleBtn.innerHTML = '⚡ Đang Bật Lọc (Bấm để Tắt)';
            toggleBtn.style.background = '#0284c7';
            toggleBtn.style.color = '#fff';
        }
        showToast('Đã BẬT bộ lọc (Lọc AVL Tree)', 'info');
    } else {
        aside.style.display = 'none';
        mainView.style.gridTemplateColumns = '1fr';
        if (toggleBtn) {
            toggleBtn.innerHTML = '🎛️ Bộ Lọc: Đang Tắt (Hiện tất cả đồ)';
            toggleBtn.style.background = '#ffffff';
            toggleBtn.style.color = '#334155';
        }
        showToast('Đã TẮT bộ lọc (Hiện tất cả đồ)', 'success');
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
    const badge = document.getElementById('supabaseStatusBadge');
    const detail = document.getElementById('supabaseDetailText');

    if (window.UniPassSupabase && window.UniPassSupabase.isConfigured()) {
        const cfg = window.UniPassSupabase.getConfig();
        if (urlInput) urlInput.value = cfg.url || '';
        if (keyInput) keyInput.value = localStorage.getItem('unipass_supabase_key') || '';
        if (badge) {
            badge.innerText = '🟢 Trạng thái: Đã kết nối Supabase Cloud';
            badge.style.color = '#15803d';
        }
        if (detail) {
            detail.innerText = `Đang kết nối: ${cfg.url}. Các bài đăng và tin nhắn đang được đồng bộ Realtime.`;
        }
    } else {
        if (urlInput && !urlInput.value) urlInput.value = localStorage.getItem('unipass_supabase_url') || '';
        if (keyInput && !keyInput.value) keyInput.value = localStorage.getItem('unipass_supabase_key') || '';
        if (badge) {
            badge.innerText = '🟡 Trạng thái: Bộ nhớ đệm cục bộ (Chưa nối Cloud)';
            badge.style.color = '#d97706';
        }
        if (detail) {
            detail.innerText = 'Nhập thông tin bên dưới hoặc dán Schema vào Supabase để kích hoạt đồng bộ đám mây.';
        }
    }
}

async function saveAndConnectSupabase() {
    const urlInput = document.getElementById('supabaseUrlInput');
    const keyInput = document.getElementById('supabaseKeyInput');
    if (!urlInput || !keyInput) return;

    const url = urlInput.value.trim();
    const key = keyInput.value.trim();

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
    const badge = document.getElementById('supabaseStatusBadge');
    const detail = document.getElementById('supabaseDetailText');
    const pingEl = document.getElementById('supabasePingTime');

    if (urlInput) urlInput.value = '';
    if (keyInput) keyInput.value = '';
    if (badge) {
        badge.innerText = '⚪ Đã ngắt kết nối';
        badge.style.color = '#64748b';
    }
    if (detail) detail.innerText = 'Hệ thống đã chuyển về chế độ bộ nhớ đệm cục bộ (Local Cache).';
    if (pingEl) pingEl.innerText = 'Ping: -- ms';

    updateSupabaseNavIndicator();
    showToast('Đã ngắt kết nối Supabase Cloud. Dùng Local Cache.', 'info');
}