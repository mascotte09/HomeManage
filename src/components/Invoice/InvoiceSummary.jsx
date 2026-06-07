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
            className="mt-6 bg-white rounded-2xl border border-stone-200 shadow-lg overflow-hidden"
        >
            {/* HEADER */}
            <div className="bg-blue-600 text-white px-3 py-2 text-center">
                <h2 className="text-xl font-bold tracking-wide">
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
                    ).getFullYear()} - Phòng: {room?.room_name}
                </p>
            </div>

            <div className="p-3">

                {/* CHI TIẾT */}
                <div className="space-y-2 text-black">

                    <div className="flex justify-between">
                        <span>Tiền phòng</span>
                        <span>
                            {Number(
                                formData.rental_amount || 0
                            ).toLocaleString("vi-VN")}
                        </span>
                    </div>

                    <div className="flex justify-between items-start">
                        <div>
                            <div>Tiền điện</div>

                            <div className="text-xs text-gray-500">
                                {formData.current_electricity_number || 0}
                                {" → "}
                                {formData.new_electricity_number || 0}
                            </div>

                            <div className="text-xs text-gray-500">
                                {Number(formData.new_electricity_number) -
                                    Number(formData.current_electricity_number)}
                                {" "}kWh × {elecPrice.toLocaleString("vi-VN")}
                            </div>
                        </div>

                        <span className="font-medium">
                            {electAmount.toLocaleString("vi-VN")}
                        </span>
                    </div>

                    <div className="flex justify-between items-start">
                        <div>
                            <div>Tiền nước</div>
                            {home?.is_water_per_person ? (
                                <div className="text-xs text-gray-500">
                                    {room?.num_person || 0} người ×{" "}
                                    {waterPrice.toLocaleString("vi-VN")}
                                </div>
                            ) : (
                                <>
                                    <div className="text-xs text-gray-500">
                                        {formData.current_water_number || 0}
                                        {" → "}
                                        {formData.new_water_number || 0}
                                    </div>

                                    <div className="text-xs text-gray-500">
                                        {Number(formData.new_water_number || 0) -
                                            Number(formData.current_water_number || 0)}
                                        {" "}m³ × {waterPrice.toLocaleString("vi-VN")}
                                    </div>
                                </>
                            )}
                        </div>

                        <span className="font-medium">
                            {waterAmount.toLocaleString("vi-VN")} đ
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span>Dịch vụ (Wifi, rác...)</span>

                        <span>
                            {Number(
                                formData.wifi_amount || 0
                            ).toLocaleString("vi-VN")}
                        </span>
                    </div>
                </div>

                {/* TỔNG THÁNG */}
                {(totalOldDebt > 0 || totalExtraPaid > 0) && (<div className="mt-3 border-t pt-2 text-black">
                    <div className="flex justify-between font-semibold">
                        <span>Tổng </span>
                        <span>
                            {total.toLocaleString("vi-VN")}
                        </span>
                    </div>
                </div>)}

                {/* NỢ CŨ */}
                {totalOldDebt > 0 && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-2">

                        <div className="flex justify-between mb-2">
                            <span className="font-semibold text-red-700">
                                Nợ cũ
                            </span>

                            <span className="font-bold text-red-700">
                                {totalOldDebt.toLocaleString("vi-VN")}
                            </span>
                        </div>

                        <div className="space-y-1 text-sm">
                            {unpaidInvoices.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between text-gray-700"
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
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-2">

                        <div className="flex justify-between mb-2">
                            <span className="font-semibold text-blue-700">
                                Tiền dư kỳ trước
                            </span>

                            <span className="font-bold text-blue-700">
                                -{totalExtraPaid.toLocaleString("vi-VN")}
                            </span>
                        </div>

                        <div className="space-y-1 text-sm">
                            {extraPaidInvoices.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between text-gray-700"
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
                <div className="mt-3 bg-green-50 border-2 border-green-500 rounded-xl p-3">

                    <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-green-800">
                            Tổng
                        </span>

                        <span className="text-xl font-bold text-red-600">
                            {grandTotal.toLocaleString("vi-VN")}
                        </span>
                    </div>
                </div>

                {/* QR */}
                {qrUrl && (
                    <div className="mt-3 flex flex-col items-center">
                        <img
                            src={qrUrl}
                            alt="vietqr"
                            className="w-56 h-56 border rounded-xl shadow"
                        />
                    </div>
                )}

            </div>
        </div>
    );
}