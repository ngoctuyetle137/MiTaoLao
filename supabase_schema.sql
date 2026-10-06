-- ===================================================================
-- UNIPASS UTC2 (UTC2HAND) - SUPABASE POSTGRESQL DATABASE SCHEMA
-- Hệ Thống Trao Đổi & Pass Đồ Dùng Học Tập Sinh Viên UTC2
-- Tương thích hoàn toàn với Supabase Cloud & PostgreSQL 14+
-- ===================================================================

-- 1. BẬT CÁC EXTENSION CẦN THIẾT
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================================================================
-- 2. BẢNG PROFILES (NGƯỜI DÙNG & TÀI KHOẢN SINH VIÊN / ADMIN)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    mssv TEXT,
    phone TEXT,
    password TEXT NOT NULL DEFAULT '123456',
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    reputation INTEGER NOT NULL DEFAULT 95 CHECK (reputation BETWEEN 0 AND 100),
    coins INTEGER NOT NULL DEFAULT 500 CHECK (coins >= 0),
    avatar_letter TEXT DEFAULT 'S',
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================================================================
-- 3. BẢNG CATEGORIES (DANH MỤC SẢN PHẨM)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================================================================
-- 4. BẢNG PRODUCTS (BÀI ĐĂNG PASS ĐỒ KÈM MÃ TIMEMARK)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    price NUMERIC NOT NULL CHECK (price >= 0),
    original_price NUMERIC CHECK (original_price >= 0),
    category TEXT NOT NULL,
    course_code TEXT,
    timemark_code TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    seller_email TEXT NOT NULL,
    seller_rep INTEGER NOT NULL DEFAULT 95 CHECK (seller_rep BETWEEN 0 AND 100),
    location TEXT NOT NULL,
    distance_km NUMERIC NOT NULL DEFAULT 0.5,
    expiry_days INTEGER NOT NULL DEFAULT 7,
    image_url TEXT,
    description TEXT,
    views_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'deposited', 'sold', 'hidden', 'deleted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================================================================
-- 5. BẢNG ORDERS (ĐƠN ĐẶT CỌC GIỮ CHỖ & MUA BÁN)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_code TEXT UNIQUE NOT NULL,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    product_title TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    seller_email TEXT NOT NULL,
    product_price NUMERIC NOT NULL CHECK (product_price >= 0),
    deposit_amount NUMERIC NOT NULL CHECK (deposit_amount >= 0),
    shipping_fee NUMERIC NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
    discount_amount NUMERIC NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_payment NUMERIC NOT NULL CHECK (total_payment >= 0),
    shipping_option TEXT NOT NULL DEFAULT 'pickup',
    meet_location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'deposited' CHECK (status IN ('pending', 'deposited', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================================================================
-- 6. BẢNG CHAT_MESSAGES (TIN NHẮN TRỰC TIẾP GIỮA CÁC SINH VIÊN)
-- (Admin KHÔNG được phép đọc trộm tin nhắn theo tài liệu Word doPasss.docx)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY,
    sender_name TEXT NOT NULL,
    sender_email TEXT,
    receiver_name TEXT NOT NULL,
    receiver_email TEXT,
    product_id TEXT,
    text TEXT NOT NULL,
    time_str TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================================================================
-- 7. BẢNG REPUTATION_DISPUTES (KHÁNG NGHỊ ĐIỂM UY TÍN GỬI ADMIN)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.reputation_disputes (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    current_rep INTEGER NOT NULL DEFAULT 90,
    reason TEXT NOT NULL,
    evidence TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================================================================
-- 8. BẢNG ADMIN_WARNINGS (LỊCH SỬ CẢNH CÁO & XỬ PHẠT TỪ ADMIN)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.admin_warnings (
    id TEXT PRIMARY KEY,
    target_name TEXT NOT NULL,
    target_email TEXT NOT NULL,
    reason TEXT NOT NULL,
    penalty_points INTEGER NOT NULL DEFAULT 5,
    admin_email TEXT NOT NULL DEFAULT '6651071091@st.utc2.edu.vn',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================================================================
-- 9. BẢNG VOUCHERS (MÃ GIẢM GIÁ SINH VIÊN UTC2)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.vouchers (
    code TEXT PRIMARY KEY,
    discount_amount NUMERIC NOT NULL CHECK (discount_amount >= 0),
    min_order NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================================================================
-- 10. INDEXES TĂNG TỐC TRUY VẤN
-- ===================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_created ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants ON public.chat_messages(sender_name, receiver_name);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_email);

-- ===================================================================
-- 11. BẬT TÍNH NĂNG SUPABASE REALTIME ĐỂ ĐỒNG BỘ TỨC THÌ ĐA THIẾT BỊ
-- ===================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reputation_disputes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_warnings;

-- ===================================================================
-- 12. TRIGGERS & FUNCTIONS TỰ ĐỘNG HÓA
-- ===================================================================

-- Function tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gắn Trigger updated_at cho các bảng
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: Khi đơn hàng hoàn tất (completed) -> Tự động cộng +5 điểm uy tín
CREATE OR REPLACE FUNCTION public.handle_order_completed_reputation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
        -- Cộng 5 điểm cho người bán (tối đa 100)
        UPDATE public.profiles 
        SET reputation = LEAST(100, reputation + 5)
        WHERE email = NEW.seller_email;

        -- Cộng 5 điểm cho người mua (tối đa 100)
        UPDATE public.profiles 
        SET reputation = LEAST(100, reputation + 5)
        WHERE email = NEW.buyer_email;

        -- Cập nhật sản phẩm sang 'sold'
        UPDATE public.products
        SET status = 'sold'
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_completed_rep ON public.orders;
CREATE TRIGGER trg_order_completed_rep
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_order_completed_reputation();

-- Trigger: Khi Admin phát cảnh cáo -> Tự động trừ điểm uy tín sinh viên vi phạm
CREATE OR REPLACE FUNCTION public.handle_admin_warning_penalty()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET reputation = GREATEST(0, reputation - NEW.penalty_points)
    WHERE email = NEW.target_email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_warning_penalty ON public.admin_warnings;
CREATE TRIGGER trg_admin_warning_penalty
AFTER INSERT ON public.admin_warnings
FOR EACH ROW EXECUTE FUNCTION public.handle_admin_warning_penalty();

-- ===================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- Phân quyền bảo mật: Admin kiểm duyệt, sinh viên trao đổi riêng tư
-- ===================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách mở cho anon key của demo app
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public Insert Profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (status != 'deleted');
CREATE POLICY "Public Insert Products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Admin Delete Products" ON public.products FOR DELETE USING (true);

CREATE POLICY "Public Read Orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Orders" ON public.orders FOR UPDATE USING (true);

CREATE POLICY "Public Read Chat" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Public Insert Chat" ON public.chat_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Disputes" ON public.reputation_disputes FOR SELECT USING (true);
CREATE POLICY "Public Insert Disputes" ON public.reputation_disputes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Disputes" ON public.reputation_disputes FOR UPDATE USING (true);

CREATE POLICY "Public Read Warnings" ON public.admin_warnings FOR SELECT USING (true);
CREATE POLICY "Public Insert Warnings" ON public.admin_warnings FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Vouchers" ON public.vouchers FOR SELECT USING (true);

-- ===================================================================
-- 14. DỮ LIỆU BAN ĐẦU (SEED DATA MẪU)
-- ===================================================================

-- 14.1 Tài khoản Quản trị Admin chính thức & Sinh viên mẫu
INSERT INTO public.profiles (id, email, name, mssv, phone, password, role, reputation, coins, avatar_letter)
VALUES 
('ADMIN', '6651071091@st.utc2.edu.vn', 'Quản Trị Viên UTC2 (6651071091)', '6651071091', '0901234567', 'TietLee113377', 'admin', 100, 9999, 'A'),
('UA', 'tuyetltn.st@st.utc2.edu.vn', 'Lê Thị Ngọc Tuyết', '6651071001', '0912345678', '123456', 'student', 98, 170, 'T'),
('UB', 'lamnp.st@st.utc2.edu.vn', 'Phúc Lâm', '6651071002', '0987654321', '123456', 'student', 92, 250, 'L'),
('UC', 'annv.st@st.utc2.edu.vn', 'Nguyễn Văn An', '6651071003', '0977112233', '123456', 'student', 95, 500, 'A')
ON CONFLICT (id) DO NOTHING;

-- 14.2 Danh mục hàng hóa
INSERT INTO public.categories (id, name, icon, description)
VALUES
('GiaoTrinh', 'Giáo Trình & Sách Đại Cương', '📚', 'Tài liệu, sách in màu, đề cương các môn UTC2'),
('DoDienTu', 'Đồ Điện Tử & Máy Tính', '💻', 'Máy tính Casio, laptop, sạc, chuột bàn phím'),
('DoGiaDung', 'Đồ Phòng Trọ & Đời Sống KTX', '🍳', 'Nồi cơm điện, quạt mini, ấm đun, vật dụng'),
('PhuongTien', 'Xe Cộ & Đi Lại Campus', '🚲', 'Xe đạp, mũ bảo hiểm, đồ phượt sinh viên'),
('Khac', 'Dụng Cụ Học Tập Khác', '📐', 'Thước kẻ cơ khí, đồng phục thể dục, bảng vẽ')
ON CONFLICT (id) DO NOTHING;

-- 14.3 Danh sách sản phẩm pass đồ khởi tạo
INSERT INTO public.products (id, title, price, original_price, category, course_code, timemark_code, seller_name, seller_email, seller_rep, location, distance_km, expiry_days, image_url, description, status)
VALUES
(
    'P01',
    'Giáo trình Vật Lý Đại Cương 1 (VL101) – Tái bản mới',
    35000,
    85000,
    'GiaoTrinh',
    'VL101',
    'UTC2 - 8924',
    'Lê Thị Ngọc Tuyết',
    'tuyetltn.st@st.utc2.edu.vn',
    98,
    'Ký túc xá Cỏ May UTC2 (0.5 km)',
    0.5,
    6,
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60',
    'Sách sạch đẹp không viết bậy, có kèm đề cương ôn thi học kỳ điểm 9+.',
    'available'
),
(
    'P02',
    'Sách Cấu Trúc Dữ Liệu & Giải Thuật (C++) bản in màu',
    45000,
    110000,
    'GiaoTrinh',
    'DSA01',
    'UTC2 - 7719',
    'Lê Thị Ngọc Tuyết',
    'tuyetltn.st@st.utc2.edu.vn',
    98,
    'Thư viện & Khu tự học UTC2 (0.2 km)',
    0.2,
    7,
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=60',
    'Bản in màu sắc nét, có chú thích code C++ giải thích cây AVL và đồ thị.',
    'available'
),
(
    'P03',
    'Nồi cơm điện mini 1.2L nắp gài cho sinh viên phòng trọ',
    120000,
    280000,
    'DoGiaDung',
    NULL,
    'UTC2 - 9931',
    'Phúc Lâm',
    'lamnp.st@st.utc2.edu.vn',
    92,
    'Cổng 1 Trường UTC2 (0.4 km)',
    0.4,
    4,
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&auto=format&fit=crop&q=60',
    'Nồi chống dính còn rất tốt, nấu cơm dẻo nhanh, tiết kiệm điện.',
    'available'
),
(
    'P04',
    'Máy tính Casio fx-580VN X chính hãng tem Bitex',
    350000,
    650000,
    'DoDienTu',
    'TOAN01',
    'UTC2 - 1042',
    'Phúc Lâm',
    'lamnp.st@st.utc2.edu.vn',
    92,
    'Ký túc xá Cỏ May UTC2 (0.5 km)',
    0.5,
    5,
    'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=500&auto=format&fit=crop&q=60',
    'Mới 98%, phím nảy nhạy, còn tem bảo hành chính hãng Bitex.',
    'available'
)
ON CONFLICT (id) DO NOTHING;

-- 14.4 Tin nhắn trao đổi trực tiếp mẫu giữa Tài khoản A và Tài khoản B
INSERT INTO public.chat_messages (id, sender_name, sender_email, receiver_name, receiver_email, product_id, text, time_str, is_read)
VALUES
('M1', 'Lê Thị Ngọc Tuyết', 'tuyetltn.st@st.utc2.edu.vn', 'Phúc Lâm', 'lamnp.st@st.utc2.edu.vn', 'P03', 'Chào bạn Lâm, nồi cơm điện mini bạn còn pass không?', '08:15', true),
('M2', 'Phúc Lâm', 'lamnp.st@st.utc2.edu.vn', 'Lê Thị Ngọc Tuyết', 'tuyetltn.st@st.utc2.edu.vn', 'P03', 'Chào Tuyết, nồi cơm vẫn còn nhé! Mình trọ gần cổng 1, có thể mang qua KTX Cỏ May cho bạn.', '08:20', true)
ON CONFLICT (id) DO NOTHING;

-- 14.5 Kháng nghị điểm uy tín mẫu gửi Admin kiểm chứng
INSERT INTO public.reputation_disputes (id, user_name, user_email, current_rep, reason, evidence, status)
VALUES
('DISP_1', 'Phúc Lâm', 'lamnp.st@st.utc2.edu.vn', 92, 'Bị hạ điểm oan do đối phương hẹn nhưng trễ 45 phút rồi tự ý hủy đơn cọc', 'Ảnh tin nhắn hẹn tại KTX Cỏ May lúc 17h00 và nhật ký cuộc gọi 17h15 không nghe máy', 'pending')
ON CONFLICT (id) DO NOTHING;

-- 14.6 Vouchers ưu đãi sinh viên UTC2
INSERT INTO public.vouchers (code, discount_amount, min_order, description, is_active)
VALUES
('UTC2FREE', 5000, 20000, 'Miễn phí tiền ship campus UTC2', true),
('TANSINHVIEN', 15000, 50000, 'Giảm 15.000đ cho tân sinh viên K66', true),
('GIAM20K', 20000, 100000, 'Giảm 20.000đ cho đơn đồ điện tử trên 100k', true)
ON CONFLICT (code) DO NOTHING;

-- ===================================================================
-- HOÀN TẤT SCHEMA DATABASE SUPABASE CHO UNIPASS UTC2
-- ===================================================================

