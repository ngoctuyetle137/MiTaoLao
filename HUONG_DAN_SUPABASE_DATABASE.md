# ⚡ HƯỚNG DẪN CƠ SỞ DỮ LIỆU SUPABASE CHO UNIPASS UTC2 (UTC2HAND)

Hệ thống đã được thiết kế và tích hợp hoàn chỉnh với **Cơ sở dữ liệu Supabase Cloud (PostgreSQL)** kèm tính năng **Đồng bộ Thời Gian Thực (Realtime WebSockets)** giữa tất cả người dùng và thiết bị (Điện thoại, Laptop, Máy tính bảng).

---

## 📌 1. Cấu Trúc Cơ Sở Dữ Liệu (`supabase_schema.sql`)

File schema đã được biên soạn chuẩn theo yêu cầu đồ án UTC2 với 8 bảng chính:

| STT | Tên Bảng (Table) | Mục Đích & Nghiệp Vụ | Điểm Đặc Biệt / Ràng Buộc |
|---|---|---|---|
| **1** | `profiles` | Quản lý tài khoản sinh viên & Quản trị viên Admin | Khóa chính ID, Email trường `@st.utc2.edu.vn`, điểm uy tín (0-100), số UniCoins, phân quyền `role ('student', 'admin')`. |
| **2** | `categories` | Danh mục phân loại sản phẩm pass | Giáo trình, Đồ điện tử, Đồ gia dụng KTX, Xe cộ, Dụng cụ vẽ. |
| **3** | `products` | Danh sách bài đăng pass đồ tại campus UTC2 | Tiêu đề, giá bán, giá gốc, **mã TimeMark chống lừa đảo** (VD: `UTC2 - 8924`), ảnh chụp thực tế, số ngày hết hạn. |
| **4** | `orders` | Đơn đặt cọc & thỏa thuận giao dịch | Mã đơn, người mua, người bán, tiền cọc (10%), tiền ship, giảm giá xu, trạng thái `deposited`, `completed`, `cancelled`. |
| **5** | `chat_messages` | Tin nhắn trao đổi trực tiếp giữa Sinh viên A ↔ B | **Bảo mật quyền riêng tư**: Admin KHÔNG can thiệp/đọc tin nhắn riêng theo tài liệu Word `doPasss.docx`. |
| **6** | `reputation_disputes`| Đơn kháng nghị điểm uy tín gửi Admin | Sinh viên gửi bằng chứng (ảnh hẹn, nhật ký gọi) khi bị hạ điểm oan để Admin phục hồi điểm. |
| **7** | `admin_warnings` | Lịch sử xử phạt & cảnh cáo của Admin | Ghi nhận tài khoản vi phạm (bom hàng, spam, phá giá), tự động trừ điểm uy tín. |
| **8** | `vouchers` | Mã giảm giá sinh viên UTC2 | `UTC2FREE` (free ship campus), `TANSINHVIEN` (giảm 15k), `GIAM20K`. |

---

## ⚙️ 2. Tính Năng Tự Động Hóa (Triggers & Realtime)

1. **Supabase Realtime (`alter publication supabase_realtime add table ...`)**:
   - Khi Sinh viên A đăng bài pass đồ mới trên điện thoại ➔ Màn hình laptop của Sinh viên B tự động hiển thị ngay lập tức không cần F5.
   - Khi Sinh viên B gửi tin nhắn ➔ Máy của Sinh viên A phát chuông thông báo và hiện tin nhắn ngay.
2. **Trigger Tự Động Cộng Điểm Uy Tín (`handle_order_completed_reputation`)**:
   - Khi đơn cọc chuyển sang trạng thái `completed` (giao dịch thành công), hệ thống tự động cộng **+5 điểm uy tín** cho cả người bán và người mua.
3. **Trigger Tự Động Xử Phạt (`handle_admin_warning_penalty`)**:
   - Khi Admin phát lệnh cảnh cáo vi phạm, hệ thống tự động trừ điểm uy tín tương ứng của sinh viên vi phạm.
4. **Phân Quyền Hàng (Row Level Security - RLS)**:
   - Chỉ Admin chính thức (`6651071091@st.utc2.edu.vn`) mới có quyền xóa bài đăng rác hoặc duyệt đơn kháng nghị điểm uy tín.

---

## 🚀 3. Hướng Dẫn 3 Phút Khởi Tạo Database Trên Supabase (Miễn Phí 100%)

### Bước 1: Tạo dự án mới trên Supabase
1. Truy cập [https://supabase.com](https://supabase.com) và bấm **Sign In** (có thể đăng nhập bằng GitHub).
2. Bấm **New Project** ➔ Đặt tên dự án: `unipass-utc2` ➔ Đặt Database Password ➔ Chọn Region gần Việt Nam (như `Singapore`).
3. Bấm **Create new project** và chờ khoảng 1 - 2 phút để máy chủ khởi tạo.

### Bước 2: Chạy mã SQL Schema
1. Ở thanh menu bên trái của Supabase Dashboard, chọn biểu tượng **SQL Editor**.
2. Mở file [supabase_schema.sql](supabase_schema.sql) trong thư mục dự án này, copy toàn bộ nội dung.
3. Dán vào ô soạn thảo SQL trên Supabase và nhấn nút **RUN** (màu xanh lá ở góc phải).
4. Bạn sẽ thấy thông báo `Success. No rows returned` ➔ Cả 8 bảng, triggers, phân quyền và dữ liệu mẫu đã sẵn sàng!

### Bước 3: Kết nối vào Web App UniPass UTC2
1. Trên Supabase, vào mục **Project Settings** (biểu tượng bánh răng ở góc dưới bên trái) ➔ chọn **API**.
2. Tìm 2 thông số:
   - **Project URL**: Ví dụ dạng `https://abcdefghijklmnop.supabase.co`
   - **Project API keys (anon public)**: Chuỗi mã dài bắt đầu bằng `eyJhbGciOi...`
3. Mở ứng dụng Web [http://localhost:8080](http://localhost:8080) trên trình duyệt:
   - Bấm vào nút **⚡ Supabase DB** trên thanh menu trên cùng.
   - Dán **Project URL** và **Anon Public Key** vào 2 ô tương ứng.
   - Bấm nút **🚀 Lưu & Kết Nối Ngay**.
   - Bấm nút **🧪 Kiểm Tra (Ping)** để xem tốc độ phản hồi Database!

---

## 💻 4. Trải Nghiệm Offline / Local Cache Sẵn Có
- Ngay cả khi chưa nhập Supabase URL, ứng dụng vẫn hoạt động trơn tru 100% nhờ cơ chế **Local Cache + BroadcastChannel** tự động.
- Dữ liệu luôn được lưu an toàn trên máy và đồng bộ tức thì giữa các tab trình duyệt. Khi bạn nhập thông tin Supabase, mọi thứ sẽ lập tức đồng bộ lên đám mây.

---

## 🛡️ 5. Thông Tin Tài Khoản Thử Nghiệm

| Vai Trò | Email Đăng Nhập | Mật Khẩu | Điểm Uy Tín | Quyền Hạn |
|---|---|---|---|---|
| **Quản Trị Viên Admin** | `6651071091@st.utc2.edu.vn` | `TietLee113377` | 100 | Quyền duyệt bài, xóa tin rác, cảnh cáo tài khoản vi phạm, duyệt kháng nghị |
| **Sinh Viên A (Tuyết)** | `tuyetltn.st@st.utc2.edu.vn` | `123456` | 98 | Đăng bài pass đồ, nhắn tin, đặt cọc giữ chỗ |
| **Sinh Viên B (Lâm)** | `lamnp.st@st.utc2.edu.vn` | `123456` | 92 | Đăng bài pass đồ, trả lời chat, nhận cọc |
| **Sinh Viên C (An)** | `annv.st@st.utc2.edu.vn` | `123456` | 95 | Mua sắm, trao đổi học tập |

