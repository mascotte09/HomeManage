import { useNavigate } from "react-router-dom";
import {
    FiEye,
    FiTrash2,
    FiHome,
} from "react-icons/fi";
import { MdBedroomParent } from "react-icons/md";

function BrokerHouseCard({ house, selected, onSelect, onDelete }) {
    const navigate = useNavigate();

    const totalRooms = house.rooms?.length || 0;
    const emptyRooms = house.rooms?.filter((r) => !r.status).length || 0;

    const isWholeHouseVacant =
        house.property_type === "whole_house" && !house.status;

    const hasVacancy =
        house.property_type === "whole_house"
            ? isWholeHouseVacant
            : emptyRooms > 0;

    return (
        <button
            onClick={() => navigate(`/rooms/${house.id}`)}
            className={`
        relative w-full text-left p-3 rounded-2xl border transition-all duration-200 active:scale-[0.98]
        ${selected
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : hasVacancy
                        ? "border-emerald-400 bg-emerald-50 hover:border-emerald-500"
                        : "border-stone-200 bg-white hover:border-stone-300"
                }
      `}
        >
            {/* Chấm xanh nếu còn trống */}
            {hasVacancy && (
                <span className="absolute top-3 right-3 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                </span>
            )}

            <div className="flex items-start justify-between gap-3">
                {/* Nội dung */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        {house.property_type === "whole_house" ? (
                            <FiHome className="text-green-600 text-lg shrink-0" />
                        ) : (
                            <MdBedroomParent className="text-blue-600 text-xl shrink-0" />
                        )}

                        <p className="font-semibold text-stone-800 truncate text-sm sm:text-base">
                            {house.name}
                        </p>
                    </div>

                    {house.address && (
                        <p className="text-xs sm:text-sm text-stone-500 mt-1 truncate">
                            📍 {house.address}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                        {house.property_type === "whole_house" ? (
                            <>
                                <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                    💰{" "}
                                    {Number(house.monthly_rent || 0).toLocaleString("vi-VN")}
                                </span>

                                {isWholeHouseVacant ? (
                                    <span className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-red-100 text-red-600 text-[12px] sm:text-xs font-medium whitespace-nowrap">
                                        Còn Trống
                                    </span>
                                ) : (
                                    <span className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-stone-100 text-stone-600 text-[12px] sm:text-xs font-medium whitespace-nowrap">
                                        Đã thuê
                                    </span>
                                )}
                            </>
                        ) : (
                            <>
                                <span className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-blue-100 text-blue-700 text-[12px] sm:text-xs font-medium whitespace-nowrap">
                                    <MdBedroomParent className="inline mr-1 text-base" />{totalRooms} phòng
                                </span>

                                {emptyRooms > 0 && (
                                    <span className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-red-100 text-red-600 text-[12px] sm:text-xs font-medium whitespace-nowrap">
                                        {emptyRooms} trống
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Action */}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(house.id);
                        }}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-100 transition"
                    >
                        <FiEye size={18} />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(house);
                        }}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-red-500 hover:bg-red-100 transition"
                    >
                        <FiTrash2 size={18} />
                    </button>
                </div>
            </div>
        </button>
    );
}

export default BrokerHouseCard;