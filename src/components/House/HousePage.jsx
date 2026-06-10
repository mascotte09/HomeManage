import { useEffect, useMemo, useCallback, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { supabase } from "../../supabase.js";

import HouseList from "./HouseList.jsx";
import NoHouseSelected from "./NoHouseSelected.jsx";
import SelectedHouse from "./SelectedHouse.jsx";
import DeleteModal from "../DeleteModal.jsx";

const VIEW = {
  LIST: "list",
  CREATE: "create",
  DETAIL: "detail",
};

export default function HousePage({ user_id }) {
  const [houses, setHouses] = useState([]);
  const [view, setView] = useState(VIEW.LIST);
  const [selectedHomeId, setSelectedHomeId] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [houseToDelete, setHouseToDelete] = useState(null);

  // =====================
  // DATA FETCH
  // =====================
  const fetchUserHomes = useCallback(async () => {
    if (!user_id) return;

    const { data, error } = await supabase
      .from("homes")
      .select("*")
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

  const refreshHouses = fetchUserHomes;

  // =====================
  // DERIVED STATE
  // =====================
  const selectedHouse = useMemo(() => {
    return houses.find((h) => h.id === selectedHomeId) || null;
  }, [houses, selectedHomeId]);

  // =====================
  // NAVIGATION HANDLERS
  // =====================
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

  // =====================
  // DELETE HANDLERS
  // =====================
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

    setSelectedHomeId((prev) =>
      prev === houseToDelete.id ? null : prev
    );

    closeDeleteModal();
  }, [houseToDelete, closeDeleteModal]);

  // =====================
  // RENDER HELPERS
  // =====================
  const isListView = view === VIEW.LIST;
  const isCreateView = view === VIEW.CREATE;
  const isDetailView = view === VIEW.DETAIL;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ================= LIST ================= */}
      {isListView && (
        <div className="p-4">
          <h1 className="text-xl font-bold text-stone-800 mb-5">
            Nhà trọ của bạn
          </h1>

          {houses.length === 0 ? (
            <NoHouseSelected onStartAddHouse={goToCreate} />
          ) : (
            <HouseList
              homes={houses}
              selectedHomeId={selectedHomeId}
              onSelectHome={goToDetail}
              onDelete={openDeleteModal}
            />
          )}
        </div>
      )}

      {/* ================= CREATE ================= */}
      {isCreateView && (
        <SelectedHouse
          userID={user_id}
          onBack={goToList}
          refreshHouses={refreshHouses}
        />
      )}

      {/* ================= DETAIL ================= */}
      {isDetailView && selectedHouse && (
        <SelectedHouse
          house={selectedHouse}
          onBack={goToList}
          refreshHouses={refreshHouses}
        />
      )}

      {/* ================= FLOAT BUTTON (mobile-first) ================= */}
      {isListView && (
        <button
          onClick={goToCreate}
          className="fixed bottom-5 right-5 w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center active:scale-95 transition"
        >
          <FiPlus size={26} />
        </button>
      )}

      {/* ================= DELETE MODAL ================= */}
      <DeleteModal
        header="Xóa nhà trọ"
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}