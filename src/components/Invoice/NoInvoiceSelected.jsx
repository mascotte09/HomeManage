export default function NoInvoiceSelected() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="text-5xl mb-4">🧾</div>

      <h2 className="text-lg font-bold text-stone-700 mb-2">
        Chưa chọn phòng
      </h2>

      <p className="text-sm text-stone-500 max-w-xs">
        Chọn một phòng ở danh sách để xem hoặc tạo hóa đơn tháng này.
      </p>
    </div>
  );
}
