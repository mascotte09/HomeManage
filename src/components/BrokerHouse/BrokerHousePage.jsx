import { useEffect, useMemo, useCallback, useState } from "react";
import { FiPlus, } from "react-icons/fi";
import { supabase } from "../../supabase.js";
import NoBrokerHouseSelected from "./NoBrokerHouseSelected.jsx";
import SelectedBrokerHouse from "./SelectedBrokerHouse.jsx";
import BrokerHouseCard from "./BrokerHouseCard.jsx";
import DeleteModal from "../DeleteModal.jsx";
const VIEW = {
  LIST: "list",
  CREATE: "create",
  DETAIL: "detail",
};

const TAB = {
  WHOLE: "whole",
  ROOM: "room",
};

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function BrokerHousePage({ user_id }) {
  const [houses, setHouses] = useState([]);
  const [view, setView] = useState(VIEW.LIST);
  const [selectedHomeId, setSelectedHomeId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [houseToDelete, setHouseToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState(TAB.ROOM);

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

  // Split into whole-house rentals and room rentals, each sorted by vacancy priority
  const { wholeHouses, roomHouses } = useMemo(() => {
    const whole = houses.filter((h) => h.property_type === "whole_house");
    const rooms = houses.filter((h) => h.property_type !== "whole_house");

    // Whole house: vacant houses (no active tenant) first
    const sortedWhole = [...whole].sort((a, b) => {
      const aVacant = !a.status ? 0 : 1;
      const bVacant = !b.status ? 0 : 1;
      return aVacant - bVacant;
    });

    // Room rentals: houses with the most empty rooms first
    const sortedRooms = [...rooms].sort((a, b) => {
      const aEmpty = a.rooms?.filter((r) => !r.status).length || 0;
      const bEmpty = b.rooms?.filter((r) => !r.status).length || 0;
      return bEmpty - aEmpty;
    });

    return { wholeHouses: sortedWhole, roomHouses: sortedRooms };
  }, [houses]);

  const activeList = activeTab === TAB.WHOLE ? wholeHouses : roomHouses;

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
  const isListView = view === VIEW.LIST;
  const isCreateView = view === VIEW.CREATE;
  const isDetailView = view === VIEW.DETAIL;

  return (
    <div className="bg-stone-50">

      {/* ── LIST ── */}
      {isListView && (
        <div className="p-4">
          <h2 className="text-lg font-bold text-stone-800 mb-4">
            Danh sách Nhà
          </h2>

          {houses.length === 0 ? (
            <NoBrokerHouseSelected onStartAddHouse={goToCreate} />
          ) : (
            <div className="max-w-[420px] sm:max-w-2xl mx-auto">
              {/* Tabs */}
              <div className="flex border-b border-stone-200 mb-3">                
                <button
                  type="button"
                  onClick={() => setActiveTab(TAB.ROOM)}
                  className={`flex-1 py-2.5 text-sm font-semibold transition border-b-2 ${
                    activeTab === TAB.ROOM
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-stone-400 hover:text-stone-600"
                  }`}
                >
                  Thuê phòng ({roomHouses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab(TAB.WHOLE)}
                  className={`flex-1 py-2.5 text-sm font-semibold transition border-b-2 ${
                    activeTab === TAB.WHOLE
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-stone-400 hover:text-stone-600"
                  }`}
                >
                  Nguyên căn ({wholeHouses.length})
                </button>
              </div>

              {/* Active tab content */}
              {activeList.length === 0 ? (
                <p className="text-sm text-stone-400 px-1 py-6 text-center">
                  Chưa có nhà nào.
                </p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {activeList.map((house) => (
                    <BrokerHouseCard
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
        </div>
      )}

      {/* ── CREATE ── */}
      {isCreateView && (
        <SelectedBrokerHouse
          userID={user_id}
          onBack={goToList}
          refreshHouses={fetchUserHomes}
        />
      )}

      {/* ── DETAIL ── */}
      {isDetailView && selectedHouse && (
        <SelectedBrokerHouse
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
