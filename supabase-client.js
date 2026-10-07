/**
 * ===================================================================
 * UNIPASS UTC2 - SUPABASE CLIENT INTEGRATION ADAPTER
 * Hỗ trợ kết nối trực tiếp cơ sở dữ liệu Supabase PostgreSQL & Realtime
 * Tự động đồng bộ bài đăng, tin nhắn, đơn cọc và cảnh cáo Admin.
 * ===================================================================
 */

(function (window) {
    'use strict';

    // Khóa lưu cấu hình trong LocalStorage
    const STORAGE_KEY_URL = 'unipass_supabase_url';
    const STORAGE_KEY_KEY = 'unipass_supabase_key';

    // Cấu hình dự án Supabase chính thức của tài khoản ngoctuyetle137 (lhlwemmpnrmlskeljniq)
    const DEFAULT_PROJECT_URL = 'https://lhlwemmpnrmlskeljniq.supabase.co';
    const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxobHdlbW1wbnJtbHNrZWxqbmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNzIyNTYsImV4cCI6MjEwNjg0ODI1Nn0.OBOpRm80_LZ9vmt3hgKUuDqPkeAzDHPkYS_MoacHeDo';

    // Cấu hình mặc định hoặc từ bộ nhớ trình duyệt
    let supabaseUrl = localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_PROJECT_URL;
    let supabaseKey = localStorage.getItem(STORAGE_KEY_KEY) || DEFAULT_ANON_KEY;
    let supabaseClient = null;
    let realtimeChannel = null;

    const UniPassSupabase = {
        // Kiểm tra xem đã có thông tin kết nối Supabase hay chưa
        isConfigured: function () {
            return Boolean(supabaseUrl && supabaseKey && supabaseUrl.startsWith('http'));
        },

        // Lấy cấu hình hiện tại
        getConfig: function () {
            return {
                url: supabaseUrl,
                key: supabaseKey ? (supabaseKey.substring(0, 10) + '...' + supabaseKey.substring(supabaseKey.length - 6)) : ''
            };
        },

        // Lấy toàn bộ key
        getRawKey: function () {
            return supabaseKey;
        },

        // Lưu cấu hình và khởi tạo client
        saveConfig: function (url, key) {
            url = (url || '').trim().replace(/\/+$/, '');
            key = (key || '').trim();

            if (!url || !key) {
                throw new Error('Vui lòng nhập đầy đủ Supabase URL và Anon Public Key!');
            }

            localStorage.setItem(STORAGE_KEY_URL, url);
            localStorage.setItem(STORAGE_KEY_KEY, key);
            supabaseUrl = url;
            supabaseKey = key;

            return this.init();
        },

        // Xóa cấu hình
        clearConfig: function () {
            localStorage.removeItem(STORAGE_KEY_URL);
            localStorage.removeItem(STORAGE_KEY_KEY);
            supabaseUrl = '';
            supabaseKey = '';
            supabaseClient = null;
            if (realtimeChannel) {
                try { realtimeChannel.unsubscribe(); } catch (e) {}
                realtimeChannel = null;
            }
        },

        // Khởi tạo Supabase Client
        init: function () {
            if (!this.isConfigured()) {
                console.log('ℹ️ [Supabase] Chưa cấu hình URL/Key. Hệ thống đang dùng Local Cache.');
                return null;
            }

            if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
                console.warn('⚠️ [Supabase] SDK @supabase/supabase-js chưa được tải qua CDN.');
                return null;
            }

            try {
                supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
                console.log('✅ [Supabase] Đã khởi tạo kết nối Cloud Supabase:', supabaseUrl);
                return supabaseClient;
            } catch (err) {
                console.error('❌ [Supabase] Lỗi khởi tạo Supabase Client:', err);
                return null;
            }
        },

        getClient: function () {
            if (!supabaseClient) {
                this.init();
            }
            return supabaseClient;
        },

        // Kiểm tra kết nối đến cơ sở dữ liệu Supabase (Ping Test)
        testConnection: async function () {
            const client = this.getClient();
            if (!client) {
                return { success: false, message: 'Chưa khởi tạo được Supabase Client (kiểm tra mạng hoặc key)' };
            }

            try {
                const startTime = performance.now();
                const { data, error, count } = await client
                    .from('products')
                    .select('id, title', { count: 'exact', head: false })
                    .limit(1);

                const duration = Math.round(performance.now() - startTime);

                if (error) {
                    return { success: false, message: `Lỗi truy vấn bảng products: ${error.message}` };
                }

                return {
                    success: true,
                    duration: duration,
                    productsCount: count || (data ? data.length : 0),
                    message: `Kết nối thành công! Ping: ${duration}ms`
                };
            } catch (err) {
                return { success: false, message: `Lỗi kết nối mạng: ${err.message}` };
            }
        },

        // =======================================================
        // 1. QUẢN LÝ SẢN PHẨM (PRODUCTS)
        // =======================================================
        getProducts: async function () {
            const client = this.getClient();
            if (!client) return null;
            try {
                const { data, error } = await client
                    .from('products')
                    .select('*')
                    .neq('status', 'deleted')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (!data) return [];

                // Format dữ liệu tương thích với giao diện app.js
                return data.map(item => ({
                    id: item.id,
                    title: item.title,
                    price: Number(item.price),
                    originalPrice: item.original_price ? Number(item.original_price) : Number(item.price),
                    category: item.category,
                    courseCode: item.course_code || '',
                    timemarkCode: item.timemark_code || 'UTC2 - PASS',
                    seller: item.seller_name,
                    sellerEmail: item.seller_email,
                    sellerRep: Number(item.seller_rep) || 95,
                    location: item.location,
                    distanceKm: Number(item.distance_km) || 0.5,
                    expiryDays: Number(item.expiry_days) || 7,
                    imageUrl: item.image_url,
                    description: item.description,
                    status: item.status || 'available'
                }));
            } catch (err) {
                console.error('❌ [Supabase] Lỗi tải products:', err);
                return null;
            }
        },

        addProduct: async function (product) {
            const client = this.getClient();
            if (!client) return false;
            try {
                const record = {
                    id: product.id || ('P' + Date.now()),
                    title: product.title,
                    price: product.price,
                    original_price: product.originalPrice || product.price,
                    category: product.category,
                    course_code: product.courseCode || null,
                    timemark_code: product.timemarkCode || ('UTC2 - ' + Math.floor(1000 + Math.random() * 9000)),
                    seller_name: product.seller,
                    seller_email: product.sellerEmail || 'student@st.utc2.edu.vn',
                    seller_rep: product.sellerRep || 95,
                    location: product.location,
                    distance_km: product.distanceKm || 0.5,
                    expiry_days: product.expiryDays || 7,
                    image_url: product.imageUrl,
                    description: product.description || '',
                    status: 'available'
                };

                const { data, error } = await client
                    .from('products')
                    .insert([record]);

                if (error) throw error;
                console.log('✅ [Supabase] Đã thêm sản phẩm lên Cloud:', record.id);
                return true;
            } catch (err) {
                console.error('❌ [Supabase] Lỗi thêm sản phẩm:', err);
                return false;
            }
        },

        deleteProduct: async function (productId) {
            const client = this.getClient();
            if (!client) return false;
            try {
                // Xóa mềm: đánh dấu status = 'deleted'
                const { error } = await client
                    .from('products')
                    .update({ status: 'deleted' })
                    .eq('id', productId);

                if (error) throw error;
                console.log('✅ [Supabase] Đã xóa sản phẩm trên Cloud:', productId);
                return true;
            } catch (err) {
                console.error('❌ [Supabase] Lỗi xóa sản phẩm:', err);
                return false;
            }
        },

        // =======================================================
        // 2. QUẢN LÝ TIN NHẮN CHAT (CHAT_MESSAGES)
        // =======================================================
        getChatMessages: async function () {
            const client = this.getClient();
            if (!client) return null;
            try {
                const { data, error } = await client
                    .from('chat_messages')
                    .select('*')
                    .order('created_at', { ascending: true });

                if (error) throw error;
                if (!data) return [];

                return data.map(item => ({
                    id: item.id,
                    sender: item.sender_name,
                    receiver: item.receiver_name,
                    text: item.text,
                    time: item.time_str || 'Vừa xong'
                }));
            } catch (err) {
                console.error('❌ [Supabase] Lỗi tải chat_messages:', err);
                return null;
            }
        },

        sendChatMessage: async function (msg) {
            const client = this.getClient();
            if (!client) return false;
            try {
                const record = {
                    id: msg.id || ('M_' + Date.now()),
                    sender_name: msg.sender,
                    sender_email: msg.senderEmail || null,
                    receiver_name: msg.receiver,
                    receiver_email: msg.receiverEmail || null,
                    product_id: msg.productId || null,
                    text: msg.text,
                    time_str: msg.time || (new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })),
                    is_read: false
                };

                const { error } = await client
                    .from('chat_messages')
                    .insert([record]);

                if (error) throw error;
                console.log('✅ [Supabase] Đã gửi tin nhắn lên Cloud:', record.id);
                return true;
            } catch (err) {
                console.error('❌ [Supabase] Lỗi gửi chat:', err);
                return false;
            }
        },

        // =======================================================
        // 3. QUẢN LÝ ĐƠN CỌC & GIAO DỊCH (ORDERS)
        // =======================================================
        getOrders: async function () {
            const client = this.getClient();
            if (!client) return null;
            try {
                const { data, error } = await client
                    .from('orders')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return data || [];
            } catch (err) {
                console.error('❌ [Supabase] Lỗi tải orders:', err);
                return null;
            }
        },

        createOrder: async function (order) {
            const client = this.getClient();
            if (!client) return false;
            try {
                const record = {
                    id: order.id || ('ORD_' + Date.now()),
                    order_code: order.orderCode || ('UTC2-' + Math.floor(100000 + Math.random() * 900000)),
                    product_id: order.productId,
                    product_title: order.productTitle,
                    buyer_name: order.buyerName,
                    buyer_email: order.buyerEmail || 'student@st.utc2.edu.vn',
                    seller_name: order.sellerName,
                    seller_email: order.sellerEmail || 'seller@st.utc2.edu.vn',
                    product_price: order.productPrice,
                    deposit_amount: order.depositAmount,
                    shipping_fee: order.shippingFee || 0,
                    discount_amount: order.discountAmount || 0,
                    total_payment: order.totalPayment,
                    shipping_option: order.shippingOption || 'campus',
                    meet_location: order.meetLocation || 'Cơ sở UTC2',
                    status: 'deposited',
                    notes: order.notes || ''
                };

                const { error } = await client
                    .from('orders')
                    .insert([record]);

                if (error) throw error;

                // Cập nhật trạng thái sản phẩm sang deposited
                await client
                    .from('products')
                    .update({ status: 'deposited' })
                    .eq('id', order.productId);

                console.log('✅ [Supabase] Đã tạo đơn cọc trên Cloud:', record.id);
                return true;
            } catch (err) {
                console.error('❌ [Supabase] Lỗi tạo đơn cọc:', err);
                return false;
            }
        },

        // =======================================================
        // 4. QUẢN LÝ TÀI KHOẢN PROFILES (USERS)
        // =======================================================
        getProfiles: async function () {
            const client = this.getClient();
            if (!client) return null;
            try {
                const { data, error } = await client
                    .from('profiles')
                    .select('*')
                    .order('created_at', { ascending: true });

                if (error) throw error;
                return data || [];
            } catch (err) {
                console.error('❌ [Supabase] Lỗi tải profiles:', err);
                return null;
            }
        },

        upsertProfile: async function (user) {
            const client = this.getClient();
            if (!client) return false;
            try {
                const record = {
                    id: user.id || ('U_' + Date.now()),
                    email: user.email,
                    name: user.name,
                    mssv: user.mssv || null,
                    role: user.role || 'student',
                    password: user.password || '123456',
                    reputation: user.reputation || 95,
                    coins: user.coins || 500,
                    avatar_letter: user.avatarLetter || user.name.charAt(0).toUpperCase()
                };

                const { error } = await client
                    .from('profiles')
                    .upsert([record], { onConflict: 'email' });

                if (error) throw error;
                console.log('✅ [Supabase] Đã đồng bộ tài khoản lên Cloud:', record.email);
                return true;
            } catch (err) {
                console.error('❌ [Supabase] Lỗi đồng bộ profile:', err);
                return false;
            }
        },

        // =======================================================
        // 5. QUẢN LÝ CẢNH CÁO ADMIN (ADMIN_WARNINGS)
        // =======================================================
        addWarning: async function (warning) {
            const client = this.getClient();
            if (!client) return false;
            try {
                const record = {
                    id: 'WARN_' + Date.now(),
                    target_name: warning.targetName,
                    target_email: warning.targetEmail || 'student@st.utc2.edu.vn',
                    reason: warning.reason,
                    penalty_points: warning.penaltyPoints || 5,
                    admin_email: '6651071091@st.utc2.edu.vn'
                };

                const { error } = await client
                    .from('admin_warnings')
                    .insert([record]);

                if (error) throw error;
                console.log('✅ [Supabase] Đã ghi nhận cảnh cáo vi phạm:', record.id);
                return true;
            } catch (err) {
                console.error('❌ [Supabase] Lỗi ghi nhận cảnh cáo:', err);
                return false;
            }
        },

        // =======================================================
        // 6. ĐỒNG BỘ REALTIME QUA WEBSOCKET SUPABASE
        // =======================================================
        subscribeRealtime: function (onEventCallback) {
            const client = this.getClient();
            if (!client) return null;

            try {
                if (realtimeChannel) {
                    client.removeChannel(realtimeChannel);
                }

                realtimeChannel = client
                    .channel('unipass_realtime_stream')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
                        console.log('🔔 [Supabase Realtime] Sản phẩm thay đổi:', payload);
                        if (typeof onEventCallback === 'function') onEventCallback('products', payload);
                    })
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
                        console.log('🔔 [Supabase Realtime] Tin nhắn mới:', payload);
                        if (typeof onEventCallback === 'function') onEventCallback('chat_messages', payload);
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
                        console.log('🔔 [Supabase Realtime] Đơn hàng thay đổi:', payload);
                        if (typeof onEventCallback === 'function') onEventCallback('orders', payload);
                    })
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_warnings' }, payload => {
                        console.log('🔔 [Supabase Realtime] Cảnh cáo mới từ Admin:', payload);
                        if (typeof onEventCallback === 'function') onEventCallback('admin_warnings', payload);
                    })
                    .subscribe((status) => {
                        console.log('📡 [Supabase Realtime Status]:', status);
                    });

                return realtimeChannel;
            } catch (err) {
                console.error('❌ [Supabase] Lỗi đăng ký Realtime Channel:', err);
                return null;
            }
        }
    };

    // Tự động khởi tạo ngay khi nạp script
    if (UniPassSupabase.isConfigured()) {
        window.addEventListener('DOMContentLoaded', () => {
            UniPassSupabase.init();
        });
    }

    // Xuất ra biến toàn cục
    window.UniPassSupabase = UniPassSupabase;

})(window);

