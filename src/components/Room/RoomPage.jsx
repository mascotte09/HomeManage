import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiTrash2,
  FiUser,
  FiEye,
  FiShare2,
} from "react-icons/fi";

import { roomRepository } from "../../db/roomRepository.js";
import { homeRepository } from "../../db/homeRepository.js";

import HeaderRoom from "./HeaderRoom.jsx";
import NoRoomSelected from "./NoRoomSelected.jsx";
import SelectedRoom from "./SelectedRoom.jsx";
import DeleteModal from "../DeleteModal.jsx";
import QRDialog from "../BrokerRoom/QRDialog.jsx";

const VIEW = {
  LIST: "list",
  CREATE: "create",
  DETAIL: "detail",
};


// ─────────────────────────────────────────────
// Room Card
// ─────────────────────────────────────────────
function RoomCard({
  room,
  selected,
  onSelect,
  onDelete,
}) {

  const isOccupied = room.status;
  const navigate = useNavigate();

  // Parse amenities
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


  const amenityIcons = [];

  if (amenities.hotWater) amenityIcons.push("🚿");
  if (amenities.airConditioner) amenityIcons.push("❄️");
  if (amenities.bed) amenityIcons.push("🛏️");
  if (amenities.window) amenityIcons.push("🪟");
  if (amenities.balcony) amenityIcons.push("🪟");
  if (amenities.kitchen) amenityIcons.push("🍳");


  return (
    <button
      onClick={() =>
        navigate(`/invoicesRoom/${room.id}/${room.home_id}`)
      }
      className={`
        w-full text-left p-3 rounded-2xl border
        transition active:scale-[0.98]

        ${
          selected
            ? "border-blue-400 bg-blue-50"
            : "border-stone-200 bg-white hover:border-stone-300"
        }
      `}
    >

      <div className="flex items-start justify-between gap-2">

        {/* Info */}
        <div className="flex-1 min-w-0">

          {/* Room name */}
          <div className="flex items-center gap-2 mb-1">

            <span className="font-semibold text-stone-800">
              Phòng {room.room_name}
            </span>

            <span
              className={`
                px-2 py-0.5 rounded-full text-xs font-medium

                ${
                  isOccupied
                    ? "bg-green-100 text-green-700"
                    : "bg-stone-100 text-stone-500"
                }
              `}
            >
              {isOccupied ? "Có người" : "Trống"}
            </span>

          </div>


          {/* Renter */}
          {room.room_renter && (
            <div className="flex items-center gap-1.5 text-sm text-stone-500 mb-2">

              <FiUser size={12} />

              <span className="truncate">
                {room.room_renter}
              </span>

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
                  💰{" "}
                  {Number(room.monthly_rent).toLocaleString("vi-VN")} đ
                </span>
              )}

            </div>

          )}


          {/* Amenities */}
          {amenityIcons.length > 0 && (

            <div className="flex gap-1 mt-1">
              {amenityIcons.map((icon, index) => (
                <span key={index} className="text-sm">
                  {icon}
                </span>
              ))}
            </div>

          )}

        </div>


        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">

          {/* View */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(room.id);
            }}
            className="
              w-9 h-9
              flex items-center justify-center
              rounded-full
              text-blue-400
              hover:text-blue-600
              hover:bg-blue-50
              transition
            "
          >
            <FiEye size={17} />
          </button>


          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(room);
            }}
            className="
              w-9 h-9
              flex items-center justify-center
              rounded-full
              text-red-400
              hover:text-red-600
              hover:bg-red-50
              transition
            "
          >
            <FiTrash2 size={17} />
          </button>

        </div>

      </div>

    </button>
  );
}


// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
export default function RoomPage() {

  const { houseId } = useParams();

  const [home, setHome] = useState(null);
  const [rooms, setRooms] = useState([]);

  const [view, setView] = useState(VIEW.LIST);

  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] =
    useState(false);

  const [roomToDelete, setRoomToDelete] =
    useState(null);

  const [qrDialogOpen, setQrDialogOpen] =
    useState(false);


  // ─────────────────────────────────────────────
  // Load home từ IndexedDB
  // ─────────────────────────────────────────────
  const fetchHome = useCallback(async () => {

    if (!houseId) return;

    try {

      const data =
        await homeRepository.getById(houseId);

      setHome(data || null);

    } catch (error) {

      console.error(
        "Lỗi khi lấy thông tin nhà:",
        error
      );

    }

  }, [houseId]);


  // ─────────────────────────────────────────────
  // Load rooms từ IndexedDB
  // ─────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {

    if (!houseId) return;

    try {

      const data =
        await roomRepository.getByHomeId(houseId);

      setRooms(data || []);

    } catch (error) {

      console.error(
        "Lỗi khi lấy danh sách phòng:",
        error
      );

    }

  }, [houseId]);


  useEffect(() => {

    fetchHome();
    fetchRooms();

  }, [fetchHome, fetchRooms]);


  // ─────────────────────────────────────────────
  // Derived
  // ─────────────────────────────────────────────
  const selectedRoom =
    rooms.find(
      (r) => r.id === selectedRoomId
    ) || null;


  const occupiedCount =
    rooms.filter((r) => r.status).length;


  // ─────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────
  const goToList = useCallback(() => {

    setView(VIEW.LIST);
    setSelectedRoomId(null);

  }, []);


  const goToCreate = useCallback(() => {

    setSelectedRoomId(null);
    setView(VIEW.CREATE);

  }, []);


  const goToDetail = useCallback((id) => {

    setSelectedRoomId(id);
    setView(VIEW.DETAIL);

  }, []);


  // ─────────────────────────────────────────────
  // Delete modal
  // ─────────────────────────────────────────────
  const openDeleteModal =
    useCallback((room) => {

      setRoomToDelete(room);
      setDeleteModalOpen(true);

    }, []);


  const closeDeleteModal =
    useCallback(() => {

      setDeleteModalOpen(false);
      setRoomToDelete(null);

    }, []);


  // ─────────────────────────────────────────────
  // Delete room
  // ─────────────────────────────────────────────
  const handleConfirmDelete =
    useCallback(async () => {

      if (!roomToDelete?.id) return;

      try {

        // Local DB
        await roomRepository.retire(
          roomToDelete.id
        );


        // Remove khỏi UI
        setRooms((prev) =>
          prev.filter(
            (room) =>
              room.id !== roomToDelete.id
          )
        );


        setSelectedRoomId((prev) =>
          prev === roomToDelete.id
            ? null
            : prev
        );


        closeDeleteModal();

      } catch (error) {

        console.error(
          "Lỗi khi xóa phòng:",
          error
        );

        alert("Xóa phòng thất bại");

      }

    }, [
      roomToDelete,
      closeDeleteModal,
    ]);


  // ─────────────────────────────────────────────
  // View
  // ─────────────────────────────────────────────
  const isListView =
    view === VIEW.LIST;

  const isCreateView =
    view === VIEW.CREATE;

  const isDetailView =
    view === VIEW.DETAIL;


  return (

    <div className="h-dvh bg-stone-50 flex flex-col overflow-hidden">

      <HeaderRoom />


      {/* LIST */}
      {isListView && (

        <div className="flex-1 overflow-y-auto p-4 pb-24">

          {/* Summary */}
          <div className="flex items-center justify-between mb-4">

            <div className="flex items-center gap-2">

              {home && (
                <>
                  <span className="text-stone-300">
                    •
                  </span>

                  <span className="text-stone-500 font-medium">
                    {home.name}
                  </span>
                </>
              )}

            </div>


            {rooms.length > 0 && (

              <button
                onClick={() =>
                  setQrDialogOpen(true)
                }
                className="
                  flex items-center gap-1.5
                  text-sm font-medium
                  text-blue-600
                  hover:text-blue-700
                  bg-blue-50
                  hover:bg-blue-100
                  px-3 py-1.5
                  rounded-full
                  transition
                "
              >
                <FiShare2 size={15} />

                Chia sẻ phòng trống (
                {rooms.length - occupiedCount}
                )
              </button>

            )}

          </div>


          {/* Empty */}
          {rooms.length === 0 ? (

            <NoRoomSelected
              onStartAddRoom={goToCreate}
            />

          ) : (

            <div className="space-y-3">

              {rooms.map((room) => (

                <RoomCard
                  key={room.id}
                  room={room}
                  selected={
                    selectedRoomId === room.id
                  }
                  onSelect={goToDetail}
                  onDelete={openDeleteModal}
                />

              ))}

            </div>

          )}

        </div>

      )}


      {/* CREATE */}
      {isCreateView && (

        <SelectedRoom
          homeID={houseId}
          onBack={goToList}
          refreshRooms={fetchRooms}
        />

      )}


      {/* DETAIL */}
      {isDetailView && selectedRoom && (

        <SelectedRoom
          homeID={houseId}
          room={selectedRoom}
          onBack={goToList}
          refreshRooms={fetchRooms}
        />

      )}


      {/* FAB */}
      {isListView && (

        <button
          onClick={goToCreate}
          className="
            fixed bottom-3 right-5
            w-14 h-14
            rounded-full
            bg-blue-600
            text-white
            shadow-lg
            flex items-center justify-center
            hover:bg-blue-700
            active:scale-95
            transition
          "
          aria-label="Thêm phòng mới"
        >
          <FiPlus size={26} />
        </button>

      )}


      {/* Delete */}
      <DeleteModal
        open={deleteModalOpen}
        title="Xóa phòng"
        message={`
          Bạn có chắc muốn xóa phòng
          "${roomToDelete?.room_name}"?
          Thao tác này không thể hoàn tác.
        `}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
      />


      {/* QR */}
      {qrDialogOpen && (

        <QRDialog
          url={`${window.location.origin}/vacantRooms/${houseId}`}
          onClose={() =>
            setQrDialogOpen(false)
          }
        />

      )}

    </div>
  );
}