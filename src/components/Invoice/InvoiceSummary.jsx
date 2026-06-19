export default function InvoiceSummary({
    summaryRef,
    formData,
    room,
    electAmount,
    waterAmount,
    total,
    elecPrice,
    waterPrice,
    home,
    unpaidInvoices = [],
    extraPaidInvoices = [],
}) {

    const totalOldDebt = unpaidInvoices.reduce(
        (sum, item) => sum + Number(item.debit_amount || 0),
        0
    );
    const totalExtraPaid = extraPaidInvoices.reduce(
        (sum, item) =>
            sum + Math.abs(Number(item.debit_amount || 0)),
        0
    );

    const grandTotal =
        total +
        totalOldDebt -
        totalExtraPaid;
    const qrContent = encodeURIComponent(
        `${room?.room_renter || ""} Room ${room?.room_number || ""}`
    );
    const hasBankInfo =
        home?.bank_id && home?.bank_account;

    const qrUrl = hasBankInfo
        ? `https://img.vietqr.io/image/${home.bank_id}-${home.bank_account}-compact2.png?amount=${grandTotal}&addInfo=${qrContent}`
        : null;

    return (
        <div
            ref={summaryRef}
            style={{ lineHeight: 1.5 }}
            className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"
        >
            {/* HEADER */}
            <div className="bg-blue-600 text-white px-4 py-3 text-center">
                <h2 className="text-lg font-bold tracking-wide">
                    HÓA ĐƠN
                </h2>

                <p className="text-sm text-blue-100 mt-1">
                    Tháng{" "}
                    {String(
                        new Date(
                            formData.invoice_create_date
                        ).getMonth() + 1
                    ).padStart(2, "0")}
                    /
                    {new Date(
                        formData.invoice_create_date
                    ).getFullYear()} · Phòng {room?.room_name}
                </p>
            </div>

            <div className="p-4">

                {/* CHI TIẾT */}
                <div className="space-y-3 text-stone-800 text-sm">

                    <div className="flex justify-between">
                        <span>1. Tiền phòng</span>
                        <span className="font-medium">
                            {Number(
                                formData.rental_amount || 0
                            ).toLocaleString("vi-VN")}
                        </span>
                    </div>

                    <div className="flex justify-between items-start">
                        <div>
                            <div>2. Tiền điện</div>

                            <div className="text-xs text-stone-400 mt-0.5">
                                {formData.current_electricity_number || 0}
                                {" → "}
                                {formData.new_electricity_number || 0}
                                {" · "}
                                {Number(formData.new_electricity_number) -
                                    Number(formData.current_electricity_number)}
                                {" kWh × "}
                                {elecPrice.toLocaleString("vi-VN")}
                            </div>
                        </div>

                        <span className="font-medium">
                            {electAmount.toLocaleString("vi-VN")}
                        </span>
                    </div>

                    <div className="flex justify-between items-start">
                        <div>
                            <div>3. Tiền nước</div>
                            {home?.is_water_per_person ? (
                                <div className="text-xs text-stone-400 mt-0.5">
                                    {room?.num_person || 0} người ×{" "}
                                    {waterPrice.toLocaleString("vi-VN")}
                                </div>
                            ) : (
                                <div className="text-xs text-stone-400 mt-0.5">
                                    {formData.current_water_number || 0}
                                    {" → "}
                                    {formData.new_water_number || 0}
                                    {" · "}
                                    {Number(formData.new_water_number || 0) -
                                        Number(formData.current_water_number || 0)}
                                    {" m³ × "}
                                    {waterPrice.toLocaleString("vi-VN")}
                                </div>
                            )}
                        </div>

                        <span className="font-medium">
                            {waterAmount.toLocaleString("vi-VN")}
                        </span>
                    </div>

                    {Number(formData.wifi_amount || 0) > 0 && (
                        <div className="flex justify-between items-start">
                            <div>
                                <div>4. Dịch vụ</div>
                                <div className="text-xs text-stone-400 mt-0.5">
                                    Wifi, rác...
                                </div>
                            </div>

                            <span className="font-medium">
                                {Number(
                                    formData.wifi_amount || 0
                                ).toLocaleString("vi-VN")}
                            </span>
                        </div>
                    )}
                </div>

                {/* TỔNG THÁNG (chỉ hiện khi có nợ/dư) */}
                {(totalOldDebt > 0 || totalExtraPaid > 0) && (
                    <div className="mt-3 border-t border-stone-200 pt-2">
                        <div className="flex justify-between font-semibold text-sm text-stone-800">
                            <span>Tổng tháng này</span>
                            <span>{total.toLocaleString("vi-VN")}</span>
                        </div>
                    </div>
                )}

                {/* NỢ CŨ */}
                {totalOldDebt > 0 && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">

                        <div className="flex justify-between mb-1">
                            <span className="font-semibold text-red-700 text-sm">
                                Nợ cũ
                            </span>

                            <span className="font-bold text-red-700 text-sm">
                                {totalOldDebt.toLocaleString("vi-VN")}
                            </span>
                        </div>

                        <div className="space-y-1 text-sm">
                            {unpaidInvoices.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between text-stone-600"
                                >
                                    <span>
                                        {new Date(
                                            item.invoice_create_date
                                        ).toLocaleDateString("vi-VN")}
                                    </span>

                                    <span>
                                        {Number(
                                            item.debit_amount
                                        ).toLocaleString("vi-VN")}
                                    </span>
                                </div>
                            ))}
                        </div>

                    </div>
                )}

                {/* TIỀN DƯ CŨ */}
                {totalExtraPaid > 0 && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3">

                        <div className="flex justify-between mb-2">
                            <span className="font-semibold text-blue-700 text-sm">
                                Tiền dư kỳ trước
                            </span>

                            <span className="font-bold text-blue-700 text-sm">
                                -{totalExtraPaid.toLocaleString("vi-VN")}
                            </span>
                        </div>

                        <div className="space-y-1 text-sm">
                            {extraPaidInvoices.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between text-stone-600"
                                >
                                    <span>
                                        {new Date(
                                            item.invoice_create_date
                                        ).toLocaleDateString("vi-VN")}
                                    </span>

                                    <span className="text-blue-600">
                                        -{Math.abs(
                                            Number(item.debit_amount)
                                        ).toLocaleString("vi-VN")}
                                    </span>
                                </div>
                            ))}
                        </div>

                    </div>
                )}

                {/* GRAND TOTAL */}
                <div className="mt-3 pt-3 border-t-2 border-green-500">
                    <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-green-800">
                            Tổng cộng
                        </span>

                        <span className="text-xl font-bold text-red-600">
                            {grandTotal.toLocaleString("vi-VN")}
                        </span>
                    </div>
                </div>

                {/* QR */}
                {qrUrl && (
                    <div className="mt-4 flex flex-col items-center">
                        <img
                            src={qrUrl}
                            alt="VietQR thanh toán"
                            className="w-40 h-40 border border-stone-200 rounded-xl shadow-sm"
                        />
                        <p className="text-xs text-stone-400 mt-2">
                            Quét mã để thanh toán
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}
