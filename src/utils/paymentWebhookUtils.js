export function applyIncomingPayment(invoice, paymentAmount, paymentStatus) {
  const normalizedStatus = String(paymentStatus || "").trim().toLowerCase();
  const isSuccessful = ["success", "paid", "completed", "succeeded", "settled", "confirmed"].includes(normalizedStatus);

  if (!isSuccessful) {
    return {
      updated: false,
      reason: "payment-not-successful",
    };
  }

  const totalAmount = Number(invoice?.total_amount || 0);
  const incomingAmount = Number(paymentAmount || 0);
  const currentAlreadyPaid = Number(invoice?.amount_already_pay || 0);
  const nextAlreadyPaid = Math.min(totalAmount, currentAlreadyPaid + incomingAmount);
  const nextDebitAmount = totalAmount - nextAlreadyPaid;

  return {
    updated: true,
    debit_amount: nextDebitAmount,
    amount_already_pay: nextAlreadyPaid,
  };
}

export function resolvePaymentReference(payload = {}) {
  return (
    payload.invoice_id ||
    payload.invoiceId ||
    payload.reference ||
    payload.payment_reference ||
    payload.paymentRef ||
    null
  );
}

export function normalizeVietQrPayload(payload = {}) {
  const nested = payload.data || payload.transaction || payload.payment || {};
  const amount =
    nested.amount ??
    nested.transferAmount ??
    nested.totalAmount ??
    payload.amount ??
    payload.totalAmount ??
    null;

  const status =
    nested.status ??
    nested.state ??
    payload.status ??
    payload.state ??
    null;

  const reference =
    nested.reference ??
    nested.description ??
    nested.remark ??
    nested.memo ??
    payload.reference ??
    payload.payment_reference ??
    payload.paymentRef ??
    payload.description ??
    null;

  const normalizedStatus = String(status || "").trim().toLowerCase();

  return {
    amount: Number(amount || 0),
    status: normalizedStatus,
    reference: reference ? String(reference) : null,
    invoice_id: payload.invoice_id || payload.invoiceId || null,
  };
}
