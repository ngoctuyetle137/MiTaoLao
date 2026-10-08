/**
 * ===================================================================
 * GOOGLE APPS SCRIPT - BỘ GỬI EMAIL OTP TỰ ĐỘNG CHO UNIPASS UTC2
 * Miễn phí 100%, gửi thư trực tiếp từ máy chủ Gmail của Google (không sợ vào spam)
 * ===================================================================
 * 
 * 📘 HƯỚNG DẪN CÀI ĐẶT 3 BƯỚC NHANH TRONG 1 PHÚT:
 * 1. Mở trang: https://script.google.com/ ➔ Bấm "Dự án mới" (New project)
 * 2. Xóa hết mã cũ, dán toàn bộ nội dung file này vào ➔ Nhấn Ctrl + S để Lưu.
 * 3. Bấm nút màu xanh "Triển khai" (Deploy) ở góc trên bên phải:
 *    - Chọn "Tùy chọn triển khai mới" (New deployment).
 *    - Bấm biểu tượng Bánh răng (⚙️) ➔ Chọn loại "Ứng dụng web" (Web app).
 *    - Mô tả: "UniPass OTP Mailer".
 *    - Thực thi dưới dạng (Execute as): "Tôi" (tài khoản Gmail của bạn).
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone) -> RẤT QUAN TRỌNG.
 *    - Bấm nút "Triển khai" (Deploy) ➔ Cấp quyền truy cập cho Gmail khi Google hỏi.
 *    - Sao chép đường dẫn "URL ứng dụng web" (Web App URL) có dạng:
 *      https://script.google.com/macros/s/AKfycb.../exec
 * 4. Dán URL vừa sao chép vào mục "Cấu Hình Supabase & Email OTP" trên trang web UniPass UTC2.
 * 
 * ===================================================================
 */

function handleSendEmail(targetEmail, otpCode, appName, mailType, productTitle) {
  try {
    appName = appName || "UniPass UTC2";
    mailType = mailType || "register";
    productTitle = productTitle || "Sản phẩm của bạn";

    if (!targetEmail || !otpCode) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Thiếu địa chỉ email người nhận hoặc mã OTP!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var subject = "";
    var htmlBody = "";

    if (mailType === "timemark") {
      subject = "[" + appName + "] 📸 Mã xác thực TimeMark đăng bài: " + otpCode + " (" + productTitle + ")";
      htmlBody = 
        '<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">' +
          '<div style="text-align: center; margin-bottom: 20px;">' +
            '<div style="font-size: 40px;">📸</div>' +
            '<h2 style="color: #0284c7; margin: 6px 0 0 0; font-size: 22px;">' + appName + '</h2>' +
            '<div style="font-size: 13px; color: #64748b;">Hệ Thống Trao Đổi Đồ Học Tập Sinh Viên UTC2</div>' +
          '</div>' +
          '<div style="background: #f0fdf4; border: 2px dashed #86efac; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 20px;">' +
            '<div style="font-size: 12px; font-weight: 700; color: #16a34a; text-transform: uppercase; letter-spacing: 1px;">MÃ XÁC THỰC TIMEMARK ĐĂNG BÀI:</div>' +
            '<div style="font-size: 34px; font-weight: 900; letter-spacing: 4px; color: #15803d; margin: 12px 0;">' + otpCode + '</div>' +
            '<div style="font-size: 12.5px; color: #475569;">Áp dụng cho bài đăng: <strong>' + productTitle + '</strong></div>' +
          '</div>' +
          '<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 13px; color: #334155; line-height: 1.6; margin-bottom: 20px;">' +
            '<strong>📋 Hướng dẫn chụp ảnh xác thực:</strong><br>' +
            '1. Lấy mẩu giấy trắng, viết rõ mã: <strong>' + otpCode + '</strong> cùng ngày giờ hiện tại.<br>' +
            '2. Đặt mẩu giấy ngay bên cạnh món đồ bạn muốn pass.<br>' +
            '3. Dùng điện thoại chụp ảnh rõ cả món đồ và mẩu giấy ghi mã, sau đó tải lên hệ thống để <strong>Admin duyệt bài</strong>.' +
          '</div>' +
          '<div style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 16px;">' +
            'Hệ thống áp dụng cơ chế TimeMark chụp cùng giấy để đảm bảo 100% sinh viên có đồ thật, ngăn chặn tình trạng ảnh mạng lừa đảo hoặc bom hàng.' +
          '</div>' +
          '<div style="border-top: 1px solid #e2e8f0; padding-top: 14px; font-size: 11.5px; color: #94a3b8; text-align: center; line-height: 1.4;">' +
            'Trường Đại Học Giao Thông Vận Tải - Phân Hiệu Tại TP. Hồ Chí Minh (UTC2)<br>' +
            'Thư này được tạo tự động bởi hệ thống bảo mật UniPass UTC2.' +
          '</div>' +
        '</div>';
    } else {
      subject = "[" + appName + "] Mã OTP xác thực tài khoản: " + otpCode;
      htmlBody = 
        '<div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">' +
          '<div style="text-align: center; margin-bottom: 20px;">' +
            '<div style="font-size: 38px;">🎓</div>' +
            '<h2 style="color: #0284c7; margin: 6px 0 0 0; font-size: 22px;">' + appName + '</h2>' +
            '<div style="font-size: 13px; color: #64748b;">Hệ Thống Trao Đổi Đồ Học Tập Sinh Viên UTC2</div>' +
          '</div>' +
          '<div style="background: #f0fdf4; border: 2px dashed #86efac; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 20px;">' +
            '<div style="font-size: 12px; font-weight: 700; color: #16a34a; text-transform: uppercase; letter-spacing: 1px;">MÃ OTP XÁC THỰC CỦA BẠN:</div>' +
            '<div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #15803d; margin: 12px 0;">' + otpCode + '</div>' +
            '<div style="font-size: 12.5px; color: #475569;">Mã có hiệu lực trong vòng <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho người khác.</div>' +
          '</div>' +
          '<div style="font-size: 13px; color: #334155; line-height: 1.6; margin-bottom: 20px;">' +
            'Chào bạn sinh viên UTC2,<br>' +
            'Bạn vừa gửi yêu cầu đăng ký/xác thực tài khoản trên <strong>' + appName + '</strong>. Vui lòng mở tin nhắn này, lấy mã 6 chữ số bên trên và quay lại ứng dụng để nhập vào ô xác thực.' +
          '</div>' +
          '<div style="border-top: 1px solid #e2e8f0; padding-top: 14px; font-size: 11.5px; color: #94a3b8; text-align: center; line-height: 1.4;">' +
            'Trường Đại Học Giao Thông Vận Tải - Phân Hiệu Tại TP. Hồ Chí Minh (UTC2)<br>' +
            'Thư này được tạo tự động bởi hệ thống bảo mật UniPass, vui lòng không trả lời thư này.' +
          '</div>' +
        '</div>';
    }

    // Gửi email chính thức qua Gmail API của Google (Sử dụng máy chủ SMTP của Google)
    MailApp.sendEmail({
      to: targetEmail,
      subject: subject,
      htmlBody: htmlBody
    });

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Đã gửi mã " + (mailType === "timemark" ? "TimeMark" : "OTP") + " thành công về Gmail " + targetEmail
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    var data = JSON.parse(raw);
    return handleSendEmail(data.email, data.otp, data.appName, data.type || data.mailType, data.productTitle || data.extra);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.email && e.parameter.otp) {
      return handleSendEmail(
        e.parameter.email, 
        e.parameter.otp, 
        e.parameter.appName,
        e.parameter.type || e.parameter.mailType,
        e.parameter.productTitle || e.parameter.extra
      );
    }
    return ContentService.createTextOutput(JSON.stringify({
      status: "active",
      service: "UniPass UTC2 Real SMTP/Gmail OTP & TimeMark Mailer Dispatcher"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
