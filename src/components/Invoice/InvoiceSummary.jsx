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
}) {
    return (
        <div
            ref={summaryRef}
            className="mt-6 bg-white border rounded-xl p-6 text-black"
        >
            <div className="text-center mb-5">
                <h2 className="text-2xl font-bold">
                    HÓA ĐƠN
                </h2>

                <div className="text-sm text-gray-500 mt-1">
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
                    {" "}• Phòng: {room?.room_name}
                </div>
            </div>

            <div className="space-y-2 border-b pb-4">

                {/* RENT */}
                <div className="flex justify-between">
                    <span>1. Tiền Phòng</span>

                    <span>
                        {Number(
                            formData.rental_amount || 0
                        ).toLocaleString()} đ
                    </span>
                </div>

                {/* ELECTRIC */}
                <div className="flex justify-between">
                    <div className="flex flex-col">
                        <span>2. Tiền Điện</span>

                        <div className="flex gap-4 text-sm text-gray-500">
                            <span>
                                Số cũ:{" "}
                                {formData.current_electricity_number || 0}
                            </span>

                            <span>
                                Số mới:{" "}
                                {formData.new_electricity_number || 0}
                            </span>
                        </div>

                        <span className="text-sm text-gray-500">
                            {Number(
                                formData.new_electricity_number
                            ) -
                                Number(
                                    formData.current_electricity_number
                                )}{" "}
                            × {elecPrice.toLocaleString()} đ
                        </span>
                    </div>

                    <span>
                        {electAmount.toLocaleString()} đ
                    </span>
                </div>

                {/* WATER */}
                <div className="flex justify-between">
                    <div className="flex flex-col">
                        <span>3. Tiền Nước</span>

                        {!home?.is_water_per_person && (
                            <div className="flex gap-4 text-sm text-gray-500">
                                <span>
                                    Số cũ: {formData.current_water_number || 0}
                                </span>

                                <span>
                                    Số mới: {formData.new_water_number || 0}
                                </span>
                            </div>
                        )}

                        <span className="text-sm text-gray-500">
                            {home?.is_water_per_person
                                ? `${room?.num_person || 0} Người × ${waterPrice.toLocaleString()} đ`
                                : `${Number(formData.new_water_number) -
                                Number(formData.current_water_number)
                                } × ${waterPrice.toLocaleString()} đ`}
                        </span>
                    </div>

                    <span>
                        {waterAmount.toLocaleString()} đ
                    </span>
                </div>

                {/* SERVICE */}
                <div className="flex justify-between">
                    <div className="flex flex-col">
                        <span>4. Tiền Dịch Vụ</span>

                        <div className="flex gap-4 text-sm text-gray-500">
                            <span>Wifi, rác...</span>
                        </div>
                    </div>

                    <span>
                        {Number(
                            formData.wifi_amount || 0
                        ).toLocaleString()} đ
                    </span>
                </div>
            </div>

            {/* TOTAL */}
            <div className="flex justify-between mt-5 text-xl font-bold">
                <span>Tổng</span>

                <span className="text-red-600">
                    {total.toLocaleString()} đ
                </span>
            </div>

            {/* QR */}
            {qrUrl && (
                <div className="mt-8 flex flex-col items-center">
                    <img
                        src={qrUrl}
                        alt="vietqr"
                        className="w-56 h-56 border rounded-lg"
                    />

                    <div className="mt-4 text-center">
                        <div className="font-semibold">
                            {home?.bank_id}
                        </div>

                        <div>
                            {home?.bank_account}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}