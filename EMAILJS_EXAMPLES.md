# EmailJS Usage Examples

## 1. Verification Email (Đã Implement)
```javascript
import { sendVerificationEmail } from '../utils/emailService'

// Gọi khi đăng ký
await sendVerificationEmail(userEmail, verificationCode)
```

## 2. Invoice Email - Trong Invoice Component
```javascript
import { sendInvoiceEmail } from '../utils/emailService'

// Ví dụ: Gửi hóa đơn khi thanh lập
const handleSendInvoice = async (invoiceId) => {
    const invoice = invoices.find(inv => inv.id === invoiceId)
    
    try {
        await sendInvoiceEmail(currentUser.email, {
            roomName: invoice.room_name,
            totalAmount: invoice.total_amount,
            month: invoice.month,
            year: invoice.year,
            details: `Tiền nước: 500.000đ, Tiền điện: 200.000đ, ...`
        })
        setMessage('Hóa đơn đã gửi qua email thành công!')
    } catch (error) {
        setMessage('Lỗi gửi email: ' + error.message)
    }
}

return (
    <button onClick={() => handleSendInvoice(invoice.id)}>
        📧 Gửi Email
    </button>
)
```

## 3. Payment Confirmation - Trong Payment Component
```javascript
import { sendPaymentConfirmation } from '../utils/emailService'

// Khi xác nhận thanh toán
const handleConfirmPayment = async (paymentData) => {
    const { roomId, amount, method } = paymentData
    
    // Lưu vào DB
    const { error } = await supabase
        .from('payments')
        .insert([{ room_id: roomId, amount, payment_method: method }])
    
    if (!error) {
        // Gửi email xác nhận
        await sendPaymentConfirmation(currentUser.email, {
            roomName: room.name,
            amount: amount,
            paymentMethod: method,
            date: new Date().toLocaleDateString('vi-VN')
        })
    }
}
```

## 4. Reminder Email - Monthly Notification
```javascript
import { sendNotification } from '../utils/emailService'

// Gọi hàng tháng (ví dụ: từ backend hoặc task scheduler)
const sendMonthlyReminders = async (users) => {
    for (const user of users) {
        await sendNotification(user.email, {
            title: 'Nhắc nhở thanh toán',
            message: `Hôm nay là ngày ${new Date().getDate()}/tháng. Vui lòng thanh toán hóa đơn tháng này.`,
            actionUrl: 'https://yourapp.com/invoices'
        })
    }
}
```

## Setup Template Variables

### Verification Code Template
**Variables:**
- `{{to_email}}` - Email người dùng
- `{{verification_code}}` - 123456
- `{{code_display}}` - 1 2 3 4 5 6

### Invoice Template
**Variables:**
- `{{to_email}}` - Email người dùng
- `{{room_name}}` - Tên phòng
- `{{total_amount}}` - Tổng tiền
- `{{month}}` - Tháng
- `{{year}}` - Năm
- `{{details}}` - Chi tiết breakdown

### Payment Confirmation Template
**Variables:**
- `{{to_email}}` - Email người dùng
- `{{room_name}}` - Tên phòng
- `{{amount}}` - Số tiền
- `{{payment_method}}` - Phương thức thanh toán
- `{{payment_date}}` - Ngày thanh toán

### Notification Template
**Variables:**
- `{{to_email}}` - Email người dùng
- `{{title}}` - Tiêu đề thông báo
- `{{message}}` - Nội dung thông báo
- `{{action_url}}` - Link hành động

## HTML Template Examples

### Verification Code HTML
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .code { font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #007bff; }
        .footer { margin-top: 40px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Xác minh email của bạn</h2>
        <p>Cảm ơn bạn đã đăng ký. Vui lòng nhập mã xác minh bên dưới:</p>
        <p class="code">{{code_display}}</p>
        <p>Mã này sẽ hết hạn trong 10 phút.</p>
        <div class="footer">
            <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
        </div>
    </div>
</body>
</html>
```

### Invoice HTML
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #007bff; color: white; }
        .total { font-size: 24px; font-weight: bold; color: #d9534f; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Hóa đơn phòng {{room_name}}</h2>
        <p><strong>Tháng:</strong> {{month}}/{{year}}</p>
        
        <table>
            <tr>
                <th>Mục chi</th>
                <th>Số tiền</th>
            </tr>
            <tr>
                <td colspan="2">{{details}}</td>
            </tr>
            <tr>
                <th>Tổng cộng</th>
                <td class="total">{{total_amount}} đ</td>
            </tr>
        </table>
        
        <p>Vui lòng thanh toán trong vòng 7 ngày.</p>
    </div>
</body>
</html>
```

## Rate Limits & Pricing

**Free Plan (EmailJS):**
- 500 emails/tháng
- Unlimited templates
- No credit card required

**Cách tối ưu:**
- Gửi email chỉ khi cần thiết
- Batch multiple recipients
- Reuse templates

## Troubleshooting

### "Failed to send email"
1. Kiểm tra keys trong `.env.local`
2. Kiểm tra Service ID có kết nối email đúng
3. Kiểm tra Template ID tồn tại

### "Unauthorized" Error
- Kiểm tra Public Key có chính xác
- Tạo Public Key mới trong Account Settings

### Email không đến
- Kiểm tra spam folder
- Verify email domain trong EmailJS
- Test template trong EmailJS dashboard

## Next Steps
1. Tạo các template cho Invoice, Payment, Notification
2. Thêm `sendInvoiceEmail()` vào Invoice component
3. Thêm `sendPaymentConfirmation()` vào Payment component
4. Setup automated monthly reminders (nếu cần backend support)
