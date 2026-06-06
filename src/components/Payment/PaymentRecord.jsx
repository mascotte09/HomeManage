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
                <fieldset className="mb-5 border border-gray-300 rounded-lg p-3">
                    <legend className="text-sm font-semibold text-gray-700 px-2">
                        Trả tiền
                    </legend>

                    <div className="flex gap-6">

                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                value="final-pay"
                                checked={paymentType === "final-pay"}
                                onChange={() => {
                                    setPaymentType("final-pay");
                                    setDebitAmount(0);
                                }}
                            />
                            Trả đủ
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                value="partial-pay"
                                checked={paymentType === "partial-pay"}
                                onChange={() =>
                                    setPaymentType("partial-pay")
                                }
                            />
                            Nợ
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                value="extra-pay"
                                checked={paymentType === "extra-pay"}
                                onChange={() => {
                                    setPaymentType("extra-pay");
                                }}
                            />
                            Dư
                        </label>

                    </div>
                    {/* Công nợ */}
                    <div className="mb-6">
                        <label className="block mb-1 font-medium">
                            {paymentType === "extra-pay"
                                ? "Số tiền dư"
                                : "Số tiền nợ"}
                        </label>

                        <input
                            type="text"
                            disabled={paymentType === "final-pay"}
                            value={debitAmount === 0 ? "" : debitAmount.toLocaleString("vi-VN")}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, "");
                                const value = Number(raw || 0);

                                setDebitAmount(value);
                            }}
                            className="
    w-full
    border
    rounded
    px-1
    py-2
    text-black
    disabled:bg-gray-100
  "
                        />
                    </div>
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