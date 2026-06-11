import { useEffect, useMemo, useCallback, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { supabase } from "../../supabase.js";

import NoHouseSelected from "./NoHouseSelected.jsx";
import SelectedHouse from "./SelectedHouse.jsx";
import DeleteModal from "../DeleteModal.jsx";

const VIEW = {
  LIST: "list",
  CREATE: "create",
  DETAIL: "detail",
};

// ─── House card ────────────────────────────────────────────────────────────────
function HouseCard({ house, selected, onSelect, onDelete }) {
  const totalRooms = house.rooms?.length || 0;
  const emptyRooms = house.rooms?.filter((r) => !r.status).length || 0;
  const occupiedRooms = totalRooms - emptyRooms;

  return (
    <button
      onClick={() => onSelect(house.id)}
      className={`
        w-full text-left p-4 rounded-2xl border transition active:scale-[0.98]
        ${selected
          ? "border-blue-400 bg-blue-50"
          : "border-stone-200 bg-white hover:border-stone-300"}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-800 truncate">
            🏠 {house.name}
          </p>

          {house.address && (
            <p className="text-sm text-stone-500 mt-0.5 truncate">
              📍 {house.address}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
              {totalRooms} phòng
            </span>

            <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
              {occupiedRooms} có người
            </span>

            {emptyRooms > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                {emptyRooms} trống
              </span>
            )}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(house);
          }}
          className="w-9 h-9 flex items-center justify-center rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition flex-shrink-0"
        >
          <FiTrash2 size={17} />
        </button>
      </div>
    </button>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function HousePage({ user_id }) {
  const [houses, setHouses] = useState([]);
  const [view, setView] = useState(VIEW.LIST);
  const [selectedHomeId, setSelectedHomeId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [houseToDelete, setHouseToDelete] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUserHomes = useCallback(async () => {
    if (!user_id) return;

    const { data, error } = await supabase
      .from("homes")
      .select("*, rooms(*)")
      .eq("userID", user_id)
      .order("name");

    if (error) {
      console.error(error.message);
      return;
    }

    setHouses(data || []);
  }, [user_id]);

  useEffect(() => {
    fetchUserHomes();
  }, [fetchUserHomes]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedHouse = useMemo(
    () => houses.find((h) => h.id === selectedHomeId) || null,
    [houses, selectedHomeId]
  );

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goToList = useCallback(() => {
    setView(VIEW.LIST);
    setSelectedHomeId(null);
  }, []);

  const goToCreate = useCallback(() => {
    setSelectedHomeId(null);
    setView(VIEW.CREATE);
  }, []);

  const goToDetail = useCallback((id) => {
    setSelectedHomeId(id);
    setView(VIEW.DETAIL);
  }, []);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const openDeleteModal = useCallback((house) => {
    setHouseToDelete(house);
    setDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setHouseToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!houseToDelete?.id) return;

    const { error } = await supabase
      .from("homes")
      .delete()
      .eq("id", houseToDelete.id);

    if (error) {
      console.error(error.message);
      alert("Xóa thất bại");
      return;
    }

    setHouses((prev) => prev.filter((h) => h.id !== houseToDelete.id));
    setSelectedHomeId((prev) => (prev === houseToDelete.id ? null : prev));
    closeDeleteModal();
  }, [houseToDelete, closeDeleteModal]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const isListView   = view === VIEW.LIST;
  const isCreateView = view === VIEW.CREATE;
  const isDetailView = view === VIEW.DETAIL;

  return (
    <div className="min-h-screen bg-stone-50">

      {/* ── LIST ── */}
      {isListView && (
        <div className="p-4 pb-24">
          <h2 className="text-lg font-bold text-stone-800 mb-4">
            Nhà trọ của bạn
          </h2>

          {houses.length === 0 ? (
            <NoHouseSelected onStartAddHouse={goToCreate} />
          ) : (
            <div className="space-y-3">
              {houses.map((house) => (
                <HouseCard
                  key={house.id}
                  house={house}
                  selected={selectedHomeId === house.id}
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
        <SelectedHouse
          userID={user_id}
          onBack={goToList}
          refreshHouses={fetchUserHomes}
        />
      )}

      {/* ── DETAIL ── */}
      {isDetailView && selectedHouse && (
        <SelectedHouse
          house={selectedHouse}
          onBack={goToList}
          refreshHouses={fetchUserHomes}
        />
      )}

      {/* ── FAB ── */}
      {isListView && (
        <button
          onClick={goToCreate}
          className="fixed bottom-6 right-5 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition"
          aria-label="Tạo nhà trọ mới"
        >
          <FiPlus size={26} />
        </button>
      )}

      {/* ── DELETE MODAL ── */}
      <DeleteModal
        open={deleteModalOpen}
        title="Xóa nhà trọ"
        message={`Bạn có chắc muốn xóa "${houseToDelete?.name}"? Thao tác này không thể hoàn tác.`}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
