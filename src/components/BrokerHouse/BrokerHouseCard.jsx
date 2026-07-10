import { useNavigate } from "react-router-dom";
import { FiEye, FiTrash2, FiHome } from "react-icons/fi";
import { MdBedroomParent } from "react-icons/md";

function BrokerHouseCard({ house, selected, onSelect, onDelete }) {
    const navigate = useNavigate();

    const totalRooms = house.rooms?.length || 0;
    const emptyRooms = house.rooms?.filter((r) => !r.status).length || 0;

    const isWholeHouseVacant =
        house.property_type === "whole_house" && !house.status;

    const hasVacancy =
        house.property_type === "whole_house" ? isWholeHouseVacant : emptyRooms > 0;

    // Màu viền trái theo trạng thái: selected > còn trống > mặc định
    const borderAccent = selected
        ? "border-l-blue-500"
        : hasVacancy
            ? "border-l-emerald-500"
            : "border-l-stone-200";

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/rooms/${house.id}`)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate(`/rooms/${house.id}`);
            }}
            className={`
                relative flex flex-col justify-between h-full
                rounded-xl border border-stone-200 border-l-4 ${borderAccent}
                bg-white p-2.5 shadow-sm
                transition-all duration-150 active:scale-[0.97] cursor-pointer
                ${selected ? "ring-2 ring-blue-100" : ""}
            `}
        >
            {/* Chấm báo còn trống, không đè lên nút */}
            {hasVacancy && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
            )}

            {/* Header: icon + tên */}
            <div className="flex items-center gap-1.5 min-w-0 pr-3">
                {house.property_type === "whole_house" ? (
                    <FiHome className="text-green-600 shrink-0" size={15} />
                ) : (
                    <MdBedroomParent className="text-blue-600 shrink-0" size={16} />
                )}
                <p className="font-semibold text-stone-800 text-[13px] leading-tight truncate">
                    {house.name}
                </p>
            </div>

            {/* Địa chỉ */}
            {house.address && (
                <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                    📍 {house.address}
                </p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-1 mt-2">
                {house.property_type === "whole_house" ? (
                    <>
                        <span className="px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 text-[10px] font-medium whitespace-nowrap">
                            💰 {Number(house.monthly_rent || 0).toLocaleString("vi-VN")}
                        </span>
                        {isWholeHouseVacant ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-medium whitespace-nowrap">
                                Còn trống
                            </span>
                        ) : (
                            <span className="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-medium whitespace-nowrap">
                                Đã thuê
                            </span>
                        )}
                    </>
                ) : (
                    <>
                        <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-medium whitespace-nowrap">
                            {totalRooms} phòng
                        </span>
                        {emptyRooms > 0 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-medium whitespace-nowrap">
                                {emptyRooms} trống
                            </span>
                        )}
                    </>
                )}
            </div>

            {/* Actions: nằm gọn trong card, không đá ra ngoài */}
            <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-stone-100">
                <button
                    aria-label="Xem chi tiết"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(house.id);
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 active:bg-blue-100 transition"
                >
                    <FiEye size={15} />
                </button>
                <button
                    aria-label="Xoá"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(house);
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 active:bg-red-100 transition"
                >
                    <FiTrash2 size={15} />
                </button>
            </div>
        </div>
    );
}

export default BrokerHouseCard;
