export default function NoHouseSelected({ onStartAddHouse }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="text-5xl mb-4">🏘️</div>

      <h2 className="text-lg font-bold text-stone-700 mb-2">
        Chưa có nhà trọ nào
      </h2>

      <p className="text-sm text-stone-500 mb-6 max-w-xs">
        Nhấn nút bên dưới để thêm nhà trọ đầu tiên và bắt đầu quản lý phòng.
      </p>

      <button
        onClick={onStartAddHouse}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition active:scale-95"
      >
        + Tạo nhà trọ
      </button>
    </div>
  );
}
