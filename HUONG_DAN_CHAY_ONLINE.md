# 🎓 HƯỚNG DẪN TRÌNH BÀY & CHẠY ONLINE HỆ THỐNG UNIPASS UTC2

Hệ thống **UniPass UTC2** (Sàn pass đồ sinh viên Trường Đại học Giao thông Vận tải Phân hiệu TP.HCM) đã được tối ưu hóa toàn diện để phục vụ buổi báo cáo, thuyết trình và chia sẻ cho nhiều người cùng trải nghiệm đồng thời.

---

## 1. 📶 CÁCH 1: TRÌNH BÀY TRỰC TIẾP TRONG PHÒNG HỌC (MẠNG WI-FI / LAN)
*Cách này lý tưởng nhất cho buổi thuyết trình trước thầy cô và lớp học mà không cần upload lên mạng internet.*

1. **Khởi động Server:**
   - Trong thư mục dự án `c:\withAI\Lần N`, bạn chỉ cần **click đúp chuột vào file `chay_server.bat`** (hoặc chạy lệnh `powershell -ExecutionPolicy Bypass -File server.ps1`).
   - Cửa sổ server sẽ hiện lên và tự động mở trình duyệt web.

2. **Chia sẻ cho thầy cô & các bạn sinh viên:**
   - **Trên máy tính thuyết trình:** Truy cập `http://localhost:8080`
   - **Trên điện thoại / laptop của người nghe (kết nối chung Wi-Fi phòng học):**
     👉 Mở trình duyệt điện thoại và nhập: **`http://192.168.1.25:8080`**
     👉 Hoặc trên thanh menu web, bấm vào nút **`🌐 Trình Bày Online`** và bảo mọi người dùng camera điện thoại **quét mã QR** để vào ngay lập tức!

---

## 2. 🚀 CÁCH 2: CHẠY ONLINE TOÀN CẦU (4G / INTERNET BẤT KỲ ĐÂU)
*Cách này giúp bạn có một link web chính thức để gửi qua Zalo / Facebook cho mọi người ở bất kỳ đâu cũng truy cập được.*

### ⭐ Cách A: Dùng Netlify Drop (Cực nhanh - Chỉ 15 giây, không cần cài đặt)
1. Mở trình duyệt và truy cập trang: **[https://app.netlify.com/drop](https://app.netlify.com/drop)**
2. Đăng nhập miễn phí bằng Google / GitHub.
3. **Kéo và thả nguyên thư mục `c:\withAI\Lần N`** vào ô tròn nét đứt trên trang web.
4. Chờ 5 giây, Netlify sẽ cấp ngay một đường link trực tuyến công khai (ví dụ: `https://unipass-utc2.netlify.app`). Bạn có thể đổi tên miền con theo ý muốn trong phần *Site settings -> Change site name*.

### ⭐ Cách B: Đưa lên GitHub Pages
1. Truy cập GitHub của bạn (`ngoctuyetle137`).
2. Tạo một repository mới tên là `unipass-utc2`.
3. Tải toàn bộ các file trong thư mục lên repo.
4. Vào **Settings -> Pages -> Branch: main -> Save**.
5. Link trang web sẽ tự động chạy tại: **`https://ngoctuyetle137.github.io/unipass-utc2`**.

---

## 3. 🛡️ QUY ĐỊNH PHÂN QUYỀN ADMIN (BẢO MẬT CHẶT CHẼ)
Theo đúng yêu cầu đặc tả:
- **Tài khoản Quản Trị Viên hợp lệ duy nhất:** **`6651071091@st.utc2.edu.vn`** (Mật khẩu chính thức: **`TietLee113377`**).
- **Cơ chế kiểm soát truy cập (Access Control):**
  - Khi đang ở tài khoản sinh viên (như Tuyết `tuyetltn.st@st.utc2.edu.vn` hoặc Lâm `lamnp.st@st.utc2.edu.vn`), nếu nhấn vào mục **"🛡️ Quản Trị Admin"**, hệ thống sẽ **lập tức chặn lại** và hiển thị hộp thoại cảnh báo: **`⛔ Truy Cập Bị Từ Chối!`**.
  - Hộp thoại yêu cầu nhập đúng mật khẩu **`TietLee113377`** để mở khóa và đăng nhập vào phân hệ Admin. Nếu nhập sai mật khẩu sẽ bị từ chối truy cập.
- **Quyền hạn của Admin (Chuẩn tài liệu Word `doPasss.docx`):**
  - Quản lý bài đăng: Xóa bài rác, tin phá giá, sai TimeMark.
  - Quản lý người dùng: Cảnh cáo tài khoản có dấu hiệu bùng hẹn, gửi lời nhắc nhở.
  - Phê duyệt kiểm chứng kháng nghị: Khôi phục điểm uy tín cho sinh viên bị dìm điểm oan.
  - **Bảo vệ quyền riêng tư:** Admin **tuyệt đối không** có quyền truy cập vào tin nhắn trò chuyện riêng tư giữa các sinh viên.

---

## 4. 📸 TÍNH NĂNG ĐĂNG BÀI PASS ĐỒ & TẢI ẢNH TỪ FILE
1. Bấm vào nút **"📝 Đăng Bài & TimeMark"** trên thanh điều hướng (hoặc nút `+ Đăng Đồ Pass` trong trang Cá nhân).
2. Bấm vào khung **"📷 Bấm vào đây để chọn ảnh từ máy / điện thoại"** để chọn bất kỳ tệp ảnh thực tế nào từ máy tính hoặc thư viện ảnh trên điện thoại.
3. Hệ thống sử dụng công nghệ xử lý Canvas để **tự động nén chuẩn tỉ lệ**, hiển thị xem trước sắc nét và lưu trữ tức thời.
4. Bấm **"Tiếp Tục Nhận Mã TimeMark"**: Hệ thống cấp mã TimeMark ngẫu nhiên (VD: `UTC2 - 8924`).
5. Bấm **"✓ Xác Nhận & Đăng Lên Bảng Tin"**:
   - Món đồ mới đăng sẽ **ngay lập tức hiển thị ở vị trí đầu tiên** trên bảng tin Săn Đồ chung với tất cả các mặt hàng khác.
   - Tự động được chỉ mục vào cấu trúc dữ liệu **AVL Tree** (lọc theo giá) và **Trie** (tìm kiếm gợi ý tức thời).
   - Được đồng bộ tức thời sang tất cả các cửa sổ / thiết bị khác qua Realtime Storage.

