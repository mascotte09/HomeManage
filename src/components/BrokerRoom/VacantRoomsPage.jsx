import { useEffect, useState, useCallback } from "react";
import { useParams} from "react-router-dom";
import { FiUser, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";

import { supabase } from "../../supabase";

// ─── Photo lightbox ──────────────────────────────────────────────────────────
function PhotoLightbox({ photos, startIndex, onClose }) {
    const [index, setIndex] = useState(startIndex);

    const goPrev = useCallback(
        (e) => {
            e.stopPropagation();
            setIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
        },
        [photos.length]
    );

    const goNext = useCallback(
        (e) => {
            e.stopPropagation();
            setIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
        },
        [photos.length]
    );

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        >
            {/* Close */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
                <FiX size={22} />
            </button>

            {/* Prev */}
            {photos.length > 1 && (
                <button
                    onClick={goPrev}
                    className="absolute left-2 sm:left-4 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                    <FiChevronLeft size={24} />
                </button>
            )}

            {/* Image */}
            <img
                src={photos[index]?.image_url}
                alt=""
                onClick={(e) => e.stopPropagation()}
                className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            />

            {/* Next */}
            {photos.length > 1 && (
                <button
                    onClick={goNext}
                    className="absolute right-2 sm:right-4 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                    <FiChevronRight size={24} />
                </button>
            )}

            {/* Counter */}
            {photos.length > 1 && (
                <div className="absolute bottom-4 text-sm text-white/70">
                    {index + 1} / {photos.length}
                </div>
            )}
        </div>
    );
}

// ─── Vacant room card (with photos) ─────────────────────────────────────────
function VacantRoomCard({ room }) {
    const [lightboxIndex, setLightboxIndex] = useState(null); // ← thêm

    const amenities = (() => {
        try {
            if (!room.amenities) return {};
            return typeof room.amenities === "string"
                ? JSON.parse(room.amenities)
                : room.amenities;
        } catch {
            return {};
        }
    })();

    const amenityList = [];
    if (amenities.hotWater) amenityList.push("Nước nóng");
    if (amenities.airConditioner) amenityList.push("Máy lạnh");
    if (amenities.bed) amenityList.push("Giường");
    if (amenities.kitchen) amenityList.push("Bếp");
    if (amenities.balcony) amenityList.push("Ban công");
    if (amenities.window) amenityList.push("Cửa sổ");

    const photos = room.photos || [];

    return (
        <>
            <div className="w-full text-left rounded-2xl border border-stone-200 bg-white overflow-hidden">
                <div className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-stone-800">
                            Phòng {room.room_name}
                        </span>
                    </div>

                    {/* Photo strip */}
                    {photos.length > 0 ? (
                        <div className="flex gap-1 p-1.5 overflow-x-auto">
                            {photos.slice(0, 4).map((photo, i) => (
                                <img
                                    key={photo.id}
                                    src={photo.image_url}
                                    alt={`Phòng ${room.room_name}`}
                                    onClick={() => setLightboxIndex(i)}
                                    className="w-20 h-20 object-cover rounded-xl flex-shrink-0 cursor-pointer"
                                />
                            ))}
                            {photos.length > 4 && (
                                <div
                                    onClick={() => setLightboxIndex(4)}
                                    className="w-20 h-20 flex-shrink-0 rounded-xl bg-stone-100 flex items-center justify-center text-xs text-stone-500 font-medium cursor-pointer"
                                >
                                    +{photos.length - 4}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-20 bg-stone-100 flex items-center justify-center text-xs text-stone-400">
                            Chưa có ảnh
                        </div>
                    )}

                    {room.room_renter && (
                        <div className="flex items-center gap-1.5 text-sm text-stone-500 mb-2">
                            <FiUser size={12} />
                            <span className="truncate">{room.room_renter}</span>
                        </div>
                    )}

                    {(room.area || room.monthly_rent) && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {room.area > 0 && (
                                <span className="text-xs text-stone-600 bg-stone-100 px-2 py-1 rounded-full">
                                    📐 Diện tích: {room.area} m²
                                </span>
                            )}
                            {room.monthly_rent > 0 && (
                                <span className="text-xs text-stone-600 bg-stone-100 px-2 py-1 rounded-full">
                                    💰 Giá: {room.monthly_rent.toLocaleString("vi-VN")} đ
                                </span>
                            )}
                        </div>
                    )}

                    {amenityList.length > 0 && (
                        <p className="text-sm text-stone-500 mt-1">
                            🎁 Tiện nghi: {amenityList.join(", ")}
                        </p>
                    )}
                </div>
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <PhotoLightbox
                    photos={photos}
                    startIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </>
    );
}
// ─── Main page ───────────────────────────────────────────────────────────────
export default function VacantRoomsPage() {
    const { houseId } = useParams();
    const [home, setHome] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchVacantRooms = useCallback(async () => {
        if (!houseId) return;
        setLoading(true);

        const { data, error } = await supabase
            .from("rooms")
            .select("*, photos(*)")
            .eq("home_id", houseId)
            .eq("status", false);

        if (error) {
            console.error(error.message);
            setLoading(false);
            return;
        }

        const sorted = (data || []).sort((a, b) =>
            a.room_name.localeCompare(b.room_name, undefined, {
                numeric: true,
                sensitivity: "base",
            })
        );

        setRooms(sorted);
        setLoading(false);
    }, [houseId]);

    useEffect(() => {
        fetchVacantRooms();
    }, [fetchVacantRooms]);

    useEffect(() => {
        async function fetchHome() {
            if (!houseId) return;

            const { data, error } = await supabase
                .from("homes")
                .select("*")
                .eq("id", houseId)
                .single();

            if (error) {
                console.error(error.message);
                return;
            }

            setHome(data);
        }

        fetchHome();
    }, [houseId]);

    return (
        <div className="h-dvh bg-stone-50 flex flex-col overflow-hidden">


            <div className="flex-1 overflow-y-auto p-4 pb-24">
                <div>
                    <h2 className="text-lg font-bold text-stone-800">Các phòng trống</h2>
                    {home?.address && (
                        <p className="text-sm text-stone-500 mt-0.5">
                            📍 {home.address}
                        </p>
                    )}
                    {home && (
                        <div className="text-sm text-stone-500 mt-1 space-y-0.5">
                            <p className="font-medium text-stone-600">💡 Phí:</p>
                            <p className="ml-4">
                                • Điện: {Number(home.electricity_price || 0).toLocaleString("vi-VN")} đ/kWh
                            </p>
                            <p className="ml-4">
                                • Nước: {home.is_water_per_person
                                    ? `${Number(home.water_price || 0).toLocaleString("vi-VN")} đ/người`
                                    : `${Number(home.water_price || 0).toLocaleString("vi-VN")} đ/khối`}
                            </p>
                            <p className="ml-4">
                                • Dịch vụ (wifi, rác...): {Number(home.service_amount || 0).toLocaleString("vi-VN")} đ/phòng
                            </p>
                        </div>
                    )}
                </div>

                {loading ? (
                    <p className="text-stone-500 text-sm">Đang tải...</p>
                ) : rooms.length === 0 ? (
                    <p className="text-stone-500 text-sm">Không có phòng trống nào.</p>
                ) : (
                    <div className="space-y-3">
                        {rooms.map((room) => (
                            <VacantRoomCard key={room.id} room={room} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}