import { useEffect, useState } from "react";

const PAYMENT_TYPES = [
  { key: "final-pay",   label: "Đủ",  emoji: "✅", active: "border-green-500 bg-green-50 text-green-700" },
  { key: "partial-pay", label: "Nợ",  emoji: "⚠️", active: "border-red-500 bg-red-50 text-red-700" },
  { key: "extra-pay",   label: "Dư",  emoji: "💰", active: "border-blue-500 bg-blue-50 text-blue-700" },
];

export default function PaymentRecord({ invoice, onSave, onCancel }) {
  const [paymentType, setPaymentType] = useState("final-pay");
  const [debitAmount, setDebitAmount] = useState(0);

  useEffect(() => {
    if (!invoice) return;

    const debt = Number(invoice.debit_amount || 0);

    if (debt === 0) {
      setPaymentType("final-pay");
      setDebitAmount(0);
    } else if (debt > 0) {
      setPaymentType("partial-pay");
      setDebitAmount(debt);
    } else {
      setPaymentType("extra-pay");
      setDebitAmount(Math.abs(debt));
    }
  }, [invoice]);

  const finalDebitAmount =
    paymentType === "final-pay"
      ? 0
      : paymentType === "extra-pay"
        ? -debitAmount
        : debitAmount;

  function handleTypeSelect(key) {
    setPaymentType(key);
    if (key === "final-pay" || key === "extra-pay") {
      setDebitAmount(0);
    } else if (key === "partial-pay") {
      setDebitAmount(Number(invoice.total_amount) || 0);
    }
  }

  function handleSave() {
    const total = Number(invoice.total_amount || 0);

    if (paymentType === "partial-pay" && debitAmount > total) {
      alert("Số tiền nợ không được lớn hơn tổng hóa đơn");
      return;
    }

    onSave?.({ ...invoice, debit_amount: finalDebitAmount });
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">

      {/* Header */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          Phòng {invoice.room_number}
        </p>
      </div>

      <div className="px-4 pb-4 space-y-4">

        {/* Info row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-stone-50 rounded-xl p-3">
            <p className="text-xs text-stone-400 mb-1">Ngày tạo</p>
            <p className="text-sm font-medium text-stone-700">
              {invoice.invoice_create_date
                ? new Date(invoice.invoice_create_date).toLocaleDateString("vi-VN")
                : "—"}
            </p>
          </div>
          <div className="bg-stone-50 rounded-xl p-3">
            <p className="text-xs text-stone-400 mb-1">Tổng hóa đơn</p>
            <p className="text-sm font-semibold text-stone-800">
              {Number(invoice.total_amount || 0).toLocaleString("vi-VN")} đ
            </p>
          </div>
        </div>

        {/* Payment type */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">
            Trạng thái thanh toán
          </p>

          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_TYPES.map(({ key, label, emoji, active }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleTypeSelect(key)}
                className={`rounded-xl border p-3 text-center transition active:scale-95 ${
                  paymentType === key
                    ? active
                    : "border-stone-200 bg-white hover:bg-stone-50 text-stone-600"
                }`}
              >
                <div className="text-lg">{emoji}</div>
                <div className="text-sm font-medium mt-0.5">{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount input */}
        {paymentType !== "final-pay" && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">
              {paymentType === "extra-pay" ? "Số tiền dư" : "Số tiền nợ"}
            </p>

            <input
              type="text"
              value={debitAmount === 0 ? "" : debitAmount.toLocaleString("vi-VN")}
              onChange={(e) => {
                const value = Number(e.target.value.replace(/\D/g, ""));
                setDebitAmount(value || 0);
              }}
              placeholder={
                paymentType === "extra-pay" ? "Nhập số tiền dư" : "Nhập số tiền nợ"
              }
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-base text-stone-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />

            <p
              className={`mt-2 text-sm font-medium ${
                paymentType === "extra-pay" ? "text-blue-600" : "text-red-600"
              }`}
            >
              {paymentType === "extra-pay" ? "Dư" : "Nợ"}:{" "}
              {debitAmount.toLocaleString("vi-VN")} đ
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-full transition active:scale-95"
          >
            Lưu
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold py-2.5 rounded-full transition active:scale-95"
          >
            Hủy
          </button>
        </div>

      </div>
    </div>
  );
}
