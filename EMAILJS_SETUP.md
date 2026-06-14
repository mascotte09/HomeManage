# EmailJS Setup Guide

## Bước 1: Tạo tài khoản EmailJS
1. Truy cập [emailjs.com](https://www.emailjs.com/)
2. Đăng ký một tài khoản miễn phí
3. Xác minh email

## Bước 2: Lấy Public Key
1. Vào **Account Settings** (cog icon)
2. Chuyển đến tab **API Keys**
3. Copy **Public Key** (trong phần "Public key")
4. Dán vào `.env.local`:
   ```
   VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
   ```

## Bước 3: Tạo Email Service
1. Từ Dashboard, vào **Email Services**
2. Click **Add New Service**
3. Chọn provider (Gmail, Outlook, etc.)
4. Làm theo hướng dẫn để kết nối email của bạn
5. Copy **Service ID** 
6. Dán vào `.env.local`:
   ```
   VITE_EMAILJS_SERVICE_ID=your_service_id_here
   ```

## Bước 4: Tạo Email Template
1. Từ Dashboard, vào **Email Templates**
2. Click **Create New Template**
3. Đặt tên template (vd: "Verification Code")
4. Thiết kế email template với biến như sau:

### Template HTML Example:
```html
<h2>Xác minh email của bạn</h2>
<p>Mã xác minh của bạn là:</p>
<h1 style="font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #007bff;">
  {{code_display}}
</h1>
<p>Mã này sẽ hết hạn trong 10 phút.</p>
<p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
```

### Important Template Variables:
- `{{to_email}}` - Email người dùng
- `{{verification_code}}` - Mã xác minh (dạng số liên tục: 123456)
- `{{code_display}}` - Mã xác minh với khoảng cách (dạng: 1 2 3 4 5 6)

5. Copy **Template ID**
6. Dán vào `.env.local`:
   ```
   VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
   ```

## Bước 5: Cập nhật .env.local
Đảm bảo file `.env.local` chứa:
```
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
```

## Bước 6: Test
1. Khởi động ứng dụng: `npm start`
2. Thử đăng ký với email của bạn
3. Kiểm tra email để xác minh mã

## Ghi chú quan trọng:
- EmailJS hỗ trợ **500 email miễn phí/tháng** trên gói free
- Không cần backend hay domain riêng
- Tất cả configuration lưu ở `.env.local` (tệp cục bộ, không push lên git)
- Các environment variables VITE sẽ được tự động thay thế lúc build
