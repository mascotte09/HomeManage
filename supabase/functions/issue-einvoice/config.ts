// supabase/functions/issue-einvoice/config.ts

export const CONFIG = {
    /**
     * EasyInvoice API
     *
     * Production:
     * https://api.easyinvoice.vn
     *
     * Demo:
     * http://api.softdreams.vn
     */
    easyApiUrl:
        Deno.env.get("EASY_API_URL") ??
        "https://api.easyinvoice.vn",

    /**
     * Tài khoản API EasyInvoice
     */
    easyUsername:
        Deno.env.get("EASY_USERNAME") ?? "",

    /**
     * Mật khẩu API EasyInvoice
     *
     * KHÔNG hard-code password.
     */
    easyPassword:
        Deno.env.get("EASY_PASSWORD") ?? "",

    /**
     * Mã số thuế
     */
    easyTaxCode:
        Deno.env.get("EASY_TAX_CODE") ?? "",

    /**
     * Ký hiệu mẫu hóa đơn
     *
     * Ví dụ:
     * 1C26MBB
     */
    pattern:
        Deno.env.get("EASY_PATTERN") ??
        "1C26MBB",

    /**
     * Ký hiệu hóa đơn
     *
     * Ví dụ:
     * 1C26TBB
     */
    serial:
        Deno.env.get("EASY_SERIAL") ??
        "",

    /**
     * Phương thức thanh toán
     */
    paymentMethod:
        Deno.env.get("EASY_PAYMENT_METHOD") ??
        "Chuyển khoản",

    /**
     * Thuế suất tiền thuê
     *
     * -1 = không chịu VAT / không áp dụng VAT
     */
    vatRent: Number(
        Deno.env.get("EASY_VAT_RENT") ?? "-1"
    ),

    /**
     * Thuế suất tiền điện
     */
    vatElectric: Number(
        Deno.env.get("EASY_VAT_ELECTRIC") ?? "-1"
    ),

    /**
     * Thuế suất tiền nước
     */
    vatWater: Number(
        Deno.env.get("EASY_VAT_WATER") ?? "-1"
    ),

    /**
     * Thuế suất WiFi
     */
    vatWifi: Number(
        Deno.env.get("EASY_VAT_WIFI") ?? "-1"
    ),

    /**
     * Thuế suất phí dịch vụ
     */
    vatService: Number(
        Deno.env.get("EASY_VAT_SERVICE") ?? "-1"
    ),

    /**
     * Thuế suất phụ thu
     */
    vatSurcharge: Number(
        Deno.env.get("EASY_VAT_SURCHARGE") ?? "-1"
    ),
};