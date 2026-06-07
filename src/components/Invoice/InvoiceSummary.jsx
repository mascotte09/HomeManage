export default function InvoiceSummary({
    summaryRef,
    formData,
    room,
    electAmount,
    waterAmount,
    total,
    elecPrice,
    waterPrice,
    qrUrl,
    home,
    unpaidInvoices = [],
}) {
    const totalOldDebt = unpaidInvoices.reduce(
        (sum, item) => sum + Number(item.debit_amount || 0),
        0
    );
    const grandTotal = total + totalOldDebt;
    return (
        <div
            ref={summaryRef}
            className="mt-6 bg-white rounded-2xl border border-stone-200 shadow-lg overflow-hidden"
        >
            {/* HEADER */}
            <div className="bg-blue-600 text-white px-6 py-5 text-center">
                <h2 className="text-2xl font-bold tracking-wide">
                    HÓA ĐƠN THANH TOÁN
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
                    ).getFullYear()}
                </p>

                <p className="font-medium mt-1">
                    Phòng: {room?.room_name}
                </p>
            </div>

            <div className="p-6">

                {/* CHI TIẾT */}
                <div className="space-y-3">

                    <div className="flex justify-between">
                        <span>Tiền phòng</span>
                        <span>
                            {Number(
                                formData.rental_amount || 0
                            ).toLocaleString("vi-VN")} đ
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
                                {" "}kWh × {elecPrice.toLocaleString("vi-VN")} đ
                            </div>
                        </div>

                        <span className="font-medium">
                            {electAmount.toLocaleString("vi-VN")} đ
                        </span>
                    </div>

                    <div className="flex justify-between items-start">
                        <div>
                            <div>Tiền nước</div>

                            {home?.is_water_per_person ? (
                                <div className="text-xs text-gray-500">
                                    {room?.num_person || 0} người ×{" "}
                                    {waterPrice.toLocaleString("vi-VN")} đ
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
                                        {" "}m³ × {waterPrice.toLocaleString("vi-VN")} đ
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
                            ).toLocaleString("vi-VN")} đ
                        </span>
                    </div>
                </div>

                {/* TỔNG THÁNG */}
                <div className="mt-5 border-t pt-4">
                    <div className="flex justify-between font-semibold">
                        <span>Tổng hóa đơn tháng này</span>

                        <span>
                            {total.toLocaleString("vi-VN")} đ
                        </span>
                    </div>
                </div>

                {/* NỢ CŨ */}
                {totalOldDebt > 0 && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">

                        <div className="flex justify-between mb-2">
                            <span className="font-semibold text-red-700">
                                Nợ cũ
                            </span>

                            <span className="font-bold text-red-700">
                                {totalOldDebt.toLocaleString("vi-VN")} đ
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
                                        ).toLocaleString("vi-VN")} đ
                                    </span>
                                </div>
                            ))}
                        </div>

                    </div>
                )}

                {/* GRAND TOTAL */}
                <div className="mt-5 bg-green-50 border-2 border-green-500 rounded-xl p-4">

                    <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-green-800">
                            Tổng cần thanh toán
                        </span>

                        <span className="text-2xl font-bold text-red-600">
                            {grandTotal.toLocaleString("vi-VN")} đ
                        </span>
                    </div>

                </div>

                {/* QR */}
                {qrUrl && (
                    <div className="mt-6 flex flex-col items-center">

                        <img
                            src={qrUrl}
                            alt="vietqr"
                            className="w-56 h-56 border rounded-xl shadow"
                        />

                        <p className="mt-2 text-sm text-gray-500">
                            Quét mã QR để thanh toán
                        </p>

                    </div>
                )}

            </div>
        </div>
    );
}