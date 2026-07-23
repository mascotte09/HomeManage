import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { FiPlus, FiTrash2, FiUser, FiEye, FiShare2 } from "react-icons/fi";
import { supabase } from "../../supabase";

import HeaderRoom from "./HeaderRoom.jsx";
import NoRoomSelected from "./NoRoomSelected.jsx";
import SelectedRoom from "./SelectedRoom.jsx";
import DeleteModal from "../DeleteModal.jsx";
import { useNavigate } from "react-router-dom";
import QRDialog from "../BrokerRoom/QRDialog.jsx";
const VIEW = {
    LIST: "list",
    CREATE: "create",
    DETAIL: "detail",
};

// ─── Room card ──────────────────────────────────────────────────────────────
function RoomCard({ room, selected, onSelect, onDelete }) {
    const isOccupied = room.status;
    const navigate = useNavigate();

    // Parse amenities from JSON
    const amenities = (() => {
        try {
            if (!room.amenities) return {};
            return typeof room.amenities === 'string' ? JSON.parse(room.amenities) : room.amenities;
        } catch {
            return {};
        }
    })();

    const amenityIcons = [];
    if (amenities.hotWater) amenityIcons.push('🚿');
    if (amenities.airConditioner) amenityIcons.push('❄️');
    if (amenities.bed) amenityIcons.push('🛏️');
    if (amenities.window) amenityIcons.push('🪟');
    if (amenities.balcony) amenityIcons.push('🪟');
    if (amenities.kitchen) amenityIcons.push('🍳');

    return (
        <button
            onClick={() => navigate(`/invoicesRoom/${room.id}/${room.home_id}`)}
            className={`
        w-full text-left p-3 rounded-2xl border transition active:scale-[0.98]
        ${selected
                    ? "border-blue-400 bg-blue-50"
                    : "border-stone-200 bg-white hover:border-stone-300"}
      `}
        >
            <div className="flex items-start justify-between gap-2">
                {/* Info */}
                <div className="flex-1 min-w-0">
                    {/* Room name + status */}
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-stone-800">
                            Phòng {room.room_name}
                        </span>
                        <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${isOccupied
                                ? "bg-green-100 text-green-700"
                                : "bg-stone-100 text-stone-500"
                                }`}
                        >
                            {isOccupied ? "Có người" : "Trống"}
                        </span>
                    </div>

                    {/* Renter */}
                    {room.room_renter && (
                        <div className="flex items-center gap-1.5 text-sm text-stone-500 mb-2">
                            <FiUser size={12} />
                            <span className="truncate">{room.room_renter}</span>
                        </div>
                    )}

                    {/* Room details */}
                    {(room.area || room.monthly_rent) && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {room.area > 0 && (
                                <span className="text-xs text-stone-600 bg-stone-100 px-2 py-1 rounded-full">
                                    📐 {room.area} m²
                                </span>
                            )}
                            {room.monthly_rent > 0 && (
                                <span className="text-xs text-stone-600 bg-stone-100 px-2 py-1 rounded-full">
                                    💰 {(room.monthly_rent).toLocaleString("vi-VN")} đ
                                </span>
                            )}
                        </div>
                    )}

                    {/* Meter readings */}
                    {/* <div className="flex gap-3">
                        <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            <FiZap size={11} />
                            {(room.current_electricity_number || 0).toLocaleString("vi-VN")}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            <FiDroplet size={11} />
                            {(room.current_water_number || 0).toLocaleString("vi-VN")}
                        </span>
                    </div> */}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    {/* View rooms */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(room.id);
                        }}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    >
                        <FiEye size={17} />
                    </button>
                    {/* Delete */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(room);
                        }}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition flex-shrink-0"
                    >
                        <FiTrash2 size={17} />
                    </button>
                </div>

            </div>
        </button>
    );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function RoomPage() {
    const { houseId } = useParams();
    const [home, setHome] = useState(null);
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
    const [rooms, setRooms] = useState([]);
    const [view, setView] = useState(VIEW.LIST);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState(null);
    const [qrDialogOpen, setQrDialogOpen] = useState(false);

    // ── Fetch ────────────────────────────────────────────────────────────────
    const fetchRooms = useCallback(async () => {
        if (!houseId) return;

        const { data, error } = await supabase
            .from("rooms")
            .select("*")
            .eq("home_id", houseId);

        if (error) {
            console.error(error.message);
            return;
        }

        const sorted = (data || []).sort((a, b) =>
            a.room_name.localeCompare(b.room_name, undefined, {
                numeric: true,
                sensitivity: "base",
            })
        );

        setRooms(sorted);

    }, [houseId]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    // ── Derived ──────────────────────────────────────────────────────────────
    const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || null;
    const occupiedCount = rooms.filter((r) => r.status).length;

    // ── Navigation ───────────────────────────────────────────────────────────
    const goToList = useCallback(() => { setView(VIEW.LIST); setSelectedRoomId(null); }, []);
    const goToCreate = useCallback(() => { setView(VIEW.CREATE); setSelectedRoomId(null); }, []);
    const goToDetail = useCallback((id) => { setView(VIEW.DETAIL); setSelectedRoomId(id); }, []);

    // ── Delete ───────────────────────────────────────────────────────────────
    const openDeleteModal = useCallback((room) => { setRoomToDelete(room); setDeleteModalOpen(true); }, []);
    const closeDeleteModal = useCallback(() => { setDeleteModalOpen(false); setRoomToDelete(null); }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!roomToDelete?.id) return;

        // Delete photos from storage
        const { data: photos } = await supabase
            .from("photos")
            .select("*")
            .eq("room_id", roomToDelete.id);

        for (const photo of photos || []) {
            if (!photo.image_url) continue;
            const path = photo.image_url.split("/storage/v1/object/public/roomphotos/")[1];
            if (path) await supabase.storage.from("roomphotos").remove([path]);
        }

        await supabase.from("photos").delete().eq("room_id", roomToDelete.id);

        const { error } = await supabase.from("rooms").delete().eq("id", roomToDelete.id);
        if (error) {
            alert("Xóa thất bại");
            return;
        }

        setRooms((prev) => prev.filter((r) => r.id !== roomToDelete.id));
        setSelectedRoomId((prev) => (prev === roomToDelete.id ? null : prev));
        closeDeleteModal();
    }, [roomToDelete, closeDeleteModal]);

    const isListView = view === VIEW.LIST;
    const isCreateView = view === VIEW.CREATE;
    const isDetailView = view === VIEW.DETAIL;

    return (
        <div className="h-dvh bg-stone-50 flex flex-col overflow-hidden">
            <HeaderRoom />

            {/* ── LIST ── */}
            {isListView && (
                <div className="flex-1 overflow-y-auto p-4 pb-24">
                    {/* Summary row */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">

                            {home && (
                                <>
                                    <span className="text-stone-300">•</span>
                                    <span className="text-stone-500 font-medium">
                                        {home.name}
                                    </span>
                                </>
                            )}
                        </div>

                        {rooms.length > 0 && (
                            <button
                                onClick={() => setQrDialogOpen(true)}
                                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition"
                            >
                                <FiShare2 size={15} />
                                Chia sẻ phòng trống ({rooms.length - occupiedCount})
                            </button>
                        )}
                    </div>

                    {rooms.length === 0 ? (
                        <NoRoomSelected onStartAddRoom={goToCreate} />
                    ) : (
                        <div className="space-y-3">
                            {rooms.map((room) => (
                                <RoomCard
                                    key={room.id}
                                    room={room}
                                    selected={selectedRoomId === room.id}
                                    onSelect={goToDetail}
                                    onDelete={openDeleteModal}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── CREATE ── */}
            {isCreateView && (
                <SelectedRoom
                    homeID={houseId}
                    onBack={goToList}
                    refreshRooms={fetchRooms}
                />
            )}

            {/* ── DETAIL ── */}
            {isDetailView && selectedRoom && (
                <SelectedRoom
                    homeID={houseId}
                    room={selectedRoom}
                    onBack={goToList}
                    refreshRooms={fetchRooms}
                />
            )}

            {/* ── FAB ── */}
            {isListView && (
                <button
                    onClick={goToCreate}
                    className="fixed bottom-3 right-5 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition"
                    aria-label="Thêm phòng mới"
                >
                    <FiPlus size={26} />
                </button>
            )}

            {/* ── DELETE MODAL ── */}
            <DeleteModal
                open={deleteModalOpen}
                title="Xóa phòng"
                message={`Bạn có chắc muốn xóa phòng "${roomToDelete?.room_name}"? Thao tác này sẽ xóa toàn bộ ảnh và dữ liệu liên quan.`}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
            />
            {qrDialogOpen && (
                <QRDialog
                    url={`${window.location.origin}/vacantRooms/${houseId}`}
                    onClose={() => setQrDialogOpen(false)}
                />
            )}

        </div>
    );
}
