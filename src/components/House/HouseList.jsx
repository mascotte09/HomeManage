import { FiTrash2 } from "react-icons/fi";
export default function HouseList({
  homes,
  selectedHomeId,
  onSelectHome,
  onDelete,
}) {
  return (
    <div className="space-y-3">
      {homes.map((house) => {
        const selected = selectedHomeId === house.id;

        const totalRooms = house.rooms?.length || 0;

        const emptyRooms =
          house.rooms?.filter((room) => !room.status).length || 0;

        return (
          <button
            key={house.id}
            onClick={() => onSelectHome(house.id)}
            className={`
              w-full text-left p-4 rounded-xl border transition
              ${selected
                ? "border-blue-500 bg-blue-50"
                : "border-stone-200 bg-white"}
            `}
          >
            <div className="flex items-start justify-between gap-2">

              {/* LEFT */}
              <div className="flex-1">
                <div className="font-semibold text-stone-800">
                  🏠 {house.name}
                </div>

                <div className="text-sm text-stone-500 mt-1">
                  {house.address}
                </div>

                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                    {totalRooms} phòng
                  </span>

                  <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                    {emptyRooms} trống
                  </span>
                </div>
              </div>

              {/* RIGHT DELETE */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(house);
                }}
                className="text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition"
              >
                <FiTrash2 size={18} />
              </button>

            </div>
          </button>
        );
      })}
    </div>
  );
}