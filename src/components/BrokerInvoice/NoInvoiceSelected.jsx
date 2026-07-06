export default function NoInvoiceSelected() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#E3F3EC] flex items-center justify-center text-3xl mb-5">
        🧾
      </div>

      <h2 className="text-lg font-semibold text-stone-800 mb-1.5 tracking-tight">
        Chưa chọn phòng
      </h2>

      <p className="text-sm text-stone-500 max-w-xs leading-relaxed">
        Chọn một phòng ở danh sách để xem hoặc tạo hóa đơn tháng này.
      </p>
    </div>
  );
}
