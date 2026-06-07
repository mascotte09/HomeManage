import { useEffect, useState } from "react";

export default function PaymentRecord({
    invoice,
    onSave,
    onCancel,
}) {
    const [paymentType, setPaymentType] =
        useState("final-pay");


    function formatMoney(value) {
        const number = value.replace(/\D/g, "");

        return number.replace(
            /\B(?=(\d{3})+(?!\d))/g,
            "."
        );
    }
    const [debitAmount, setDebitAmount] = useState(0);
    const finalDebitAmount =
        paymentType === "final-pay"
            ? 0
            : paymentType === "extra-pay"
                ? -Math.abs(debitAmount)
                : Math.abs(debitAmount);
    useEffect(() => {
        if (!invoice) return;

        if (Number(invoice.debit_amount) > 0) {
            setPaymentType("partial-pay");

            setDebitAmount(
                Number(
                    invoice.debit_amount
                ).toLocaleString("vi-VN")
            );
        } else {
            setPaymentType("final-pay");
            setDebitAmount("0");
        }
    }, [invoice]);

    useEffect(() => {
        if (!invoice) return;

        if (
            Number(invoice.debit_amount) > 0
        ) {
            setPaymentType(
                "partial-pay"
            );

            setDebitAmount(
                formatMoney(
                    String(invoice.debit_amount || 0)
                )
            );
        } else {
            setPaymentType(
                "final-pay"
            );

            setDebitAmount("0");
        }
    }, [invoice]);

    if (!invoice) {
        return (
            <div className="flex-1 p-6">
                Không có hóa đơn
            </div>
        );
    }

    function handleSave() {
        const total = Number(invoice.total_amount || 0);

        if (debitAmount > total) {
            alert("Số tiền không hợp lệ");
            return;
        }

        onSave?.({
            ...invoice,
            debit_amount: finalDebitAmount,
        });
    }

    return (
        <div className="flex-1 p-2">
            <div className="bg-white rounded-lg shadow p-3 text-black">

                <h2 className="mb-3 text-sm font-bold uppercase text-stone-700">
                    Thu tiền: phòng {invoice.room_number}
                </h2>

                {/* Ngày tạo */}
                <div className="mb-4">
                    <label className="block mb-1 font-medium">
                        Ngày tạo hóa đơn
                    </label>

                    <input
                        type="text"
                        readOnly
                        value={
                            invoice.invoice_create_date
                                ? new Date(
                                    invoice.invoice_create_date
                                ).toLocaleDateString(
                                    "vi-VN"
                                )
                                : ""
                        }
                        className="
                            w-full
                            border
                            rounded
                            px-1
                            py-2
                            bg-gray-100
                        "
                    />
                </div>

                {/* Tổng tiền */}
                <div className="mb-4">
                    <label className="block mb-1 font-medium">
                        Tổng tiền hóa đơn
                    </label>

                    <input
                        type="text"
                        readOnly
                        value={`${Number(
                            invoice.total_amount || 0
                        ).toLocaleString()} đ`}
                        className="
                            w-full
                            border
                            rounded
                            px-1
                            py-2
                            bg-gray-100
                        "
                    />
                </div>

                {/* Radio */}
                <fieldset className="mb-5 rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm">
                    <legend className="px-2 text-sm font-bold text-stone-700">
                        Thanh toán
                    </legend>

                    {/* Payment Type */}
                    <div className="grid grid-cols-3 gap-3 mb-4">

                        <button
                            type="button"
                            onClick={() => {
                                setPaymentType("final-pay");
                                setDebitAmount(0);
                            }}
                            className={`rounded-lg border p-3 text-center transition
        ${paymentType === "final-pay"
                                    ? "border-green-500 bg-green-50 text-green-700"
                                    : "border-stone-300 bg-white hover:bg-stone-100"
                                }`}
                        >
                            <div className="text-lg">✅</div>
                            <div className="font-medium">Đủ</div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setPaymentType("partial-pay")}
                            className={`rounded-lg border p-3 text-center transition
        ${paymentType === "partial-pay"
                                    ? "border-red-500 bg-red-50 text-red-700"
                                    : "border-stone-300 bg-white hover:bg-stone-100"
                                }`}
                        >
                            <div className="text-lg">⚠️</div>
                            <div className="font-medium">Nợ</div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setPaymentType("extra-pay")}
                            className={`rounded-lg border p-3 text-center transition
        ${paymentType === "extra-pay"
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : "border-stone-300 bg-white hover:bg-stone-100"
                                }`}
                        >
                            <div className="text-lg">💰</div>
                            <div className="font-medium">Dư</div>
                        </button>

                    </div>

                    {/* Debt / Extra Money */}
                    {paymentType !== "final-pay" && (
                        <div>

                            <input
                                type="text"
                                value={
                                    debitAmount === 0
                                        ? ""
                                        : debitAmount.toLocaleString("vi-VN")
                                }
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, "");
                                    setDebitAmount(Number(raw || 0));
                                }}
                                placeholder="Nhập số tiền"
                                className="
          w-full
          rounded-lg
          border
          border-stone-300
          bg-white
          px-3
          py-2
          text-black
          shadow-sm
          focus:border-blue-500
          focus:outline-none
          focus:ring-2
          focus:ring-blue-200
        "
                            />

                            <div
                                className={`mt-2 text-sm font-medium
          ${paymentType === "extra-pay"
                                        ? "text-blue-600"
                                        : "text-red-600"
                                    }`}
                            >
                                {debitAmount.toLocaleString("vi-VN")} đ
                            </div>
                        </div>
                    )}

                </fieldset>



                {/* Buttons */}
                <div className="flex gap-3">

                    <button
                        onClick={handleSave}
                        className="
                            bg-green-600
                            text-white
                            px-5
                            py-2
                            rounded
                        "
                    >
                        Lưu
                    </button>

                    <button
                        onClick={onCancel}
                        className="
                            bg-gray-500
                            text-white
                            px-5
                            py-2
                            rounded
                        "
                    >
                        Hủy
                    </button>

                </div>

            </div>
        </div>
    );
}