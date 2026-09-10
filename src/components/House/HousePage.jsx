import { useEffect, useMemo, useCallback, useState } from "react";
import { FiPlus, FiTrash2, FiEye } from "react-icons/fi";
import { homeRepository } from "../../db/homeRepository.js";
import { db } from "../../db/db.js";
import { supabase } from "../../supabase.js";

import NoHouseSelected from "./NoHouseSelected.jsx";
import SelectedHouse from "./SelectedHouse.jsx";
import DeleteModal from "../DeleteModal.jsx";
import { useNavigate } from "react-router-dom";

const VIEW = {
  LIST: "list",
  CREATE: "create",
  DETAIL: "detail",
};

// ─────────────────────────────────────────────
// House Card
// ─────────────────────────────────────────────

function HouseCard({
  house,
  selected,
  onSelect,
  onDelete,
}) {
  const totalRooms = house.rooms?.length || 0;

  const emptyRooms =
    house.rooms?.filter((r) => !r.status).length || 0;

  const occupiedRooms = totalRooms - emptyRooms;

  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/rooms/${house.id}`)}
      className={`
        w-full text-left p-3 rounded-2xl border
        transition active:scale-[0.98]
        ${selected
          ? "border-blue-400 bg-blue-50"
          : "border-stone-200 bg-white hover:border-stone-300"
        }
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

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">

          {/* View */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(house.id);
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
              onDelete(house);
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
            title="Xóa nhà trọ"
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

export default function HousePage({ user_id }) {

  const [houses, setHouses] = useState([]);

  const [view, setView] = useState(VIEW.LIST);

  const [selectedHomeId, setSelectedHomeId] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [houseToDelete, setHouseToDelete] = useState(null);

  const [loading, setLoading] = useState(true);

  // ───────────────────────────────────────────
  // Load from Supabase and save to Local DB
  // ───────────────────────────────────────────

  const importFromSupabase = useCallback(async () => {

    if (!user_id) return [];

    console.log("Local DB chưa có dữ liệu.");
    console.log("Đang lấy dữ liệu home graph từ Supabase...");

    const { data: homesData, error: homesError } = await supabase
      .from("homes")
      .select("*")
      .eq("userID", user_id)
      .eq("retired", false)
      .order("name");

    if (homesError) {
      console.error("Lỗi lấy homes từ Supabase:", homesError);
      throw homesError;
    }

    const homes = homesData || [];

    if (homes.length === 0) {
      return [];
    }

    const homeIds = homes
      .map((home) => home.id)
      .filter(Boolean);

    let rooms = [];
    let invoices = [];
    let photos = [];
    let expenses = [];

    const { data: roomsData, error: roomsError } = await supabase
      .from("rooms")
      .select("*")
      .in("home_id", homeIds)
      .eq("retired", false);

    if (roomsError) {
      console.error("Lỗi lấy rooms từ Supabase:", roomsError);
      throw roomsError;
    }

    rooms = roomsData || [];

    const roomIds = rooms
      .map((room) => room.id)
      .filter(Boolean);

    if (roomIds.length > 0) {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .in("room_id", roomIds)
        .eq("retired", false);

      if (invoiceError) {
        console.error("Lỗi lấy invoices từ Supabase:", invoiceError);
        throw invoiceError;
      }

      invoices = invoiceData || [];
    }

    if (homeIds.length > 0) {
      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .select("*")
        .in("home_id", homeIds)
        .eq("retired", false);

      if (expenseError) {
        console.error("Lỗi lấy expenses từ Supabase:", expenseError);
        throw expenseError;
      }

      expenses = expenseData || [];
    }

    if (homeIds.length > 0 || roomIds.length > 0) {
      const photoQuery = supabase
        .from("photos")
        .select("*")
        .eq("retired", false);

      const photoMatcher = [];

      if (homeIds.length > 0) {
        photoMatcher.push(`home_id.in.(${homeIds.join(",")})`);
      }

      if (roomIds.length > 0) {
        photoMatcher.push(`room_id.in.(${roomIds.join(",")})`);
      }

      if (photoMatcher.length > 0) {
        const { data: photoData, error: photoError } = await photoQuery.or(photoMatcher.join(","));

        if (photoError) {
          console.error("Lỗi lấy photos từ Supabase:", photoError);
          throw photoError;
        }

        photos = photoData || [];
      }
    }

    console.log(`Đã load ${homes.length} nhà, ${rooms.length} phòng, ${invoices.length} hóa đơn, ${expenses.length} chi phí, ${photos.length} ảnh từ Supabase`);

    await db.transaction(
      "rw",
      db.homes,
      db.rooms,
      db.invoices,
      db.expenses,
      db.photos,
      async () => {

        for (const home of homes) {
          await db.homes.put(home);
        }

        for (const room of rooms) {
          await db.rooms.put(room);
        }

        for (const invoice of invoices) {
          await db.invoices.put(invoice);
        }

        for (const expense of expenses) {
          await db.expenses.put(expense);
        }

        for (const photo of photos) {
          await db.photos.put(photo);
        }
      }
    );

    console.log(`Đã import home graph: ${homes.length} nhà, ${rooms.length} phòng, ${invoices.length} hóa đơn, ${expenses.length} chi phí, ${photos.length} ảnh`);

    return homes;
  }, [user_id]);

  // ───────────────────────────────────────────
  // Fetch Local
  // ───────────────────────────────────────────

  const fetchUserHomes = useCallback(async () => {
    if (!user_id) return;

    setLoading(true);

    try {
      // 1. Luôn đọc Local trước
      let localHomes =
        await homeRepository.getByUserId(user_id);

      console.log(
        "🏠 Local homes:",
        localHomes.length
      );

      // 2. Chỉ import full graph khi local rỗng
      if (localHomes.length === 0) {

        console.log(
          "📭 Local không có nhà → import full graph từ Supabase"
        );

        await importFromSupabase();

        // 3. Đọc lại Local sau khi import
        localHomes =
          await homeRepository.getByUserId(
            user_id
          );
      } else {
        console.log(
          "✅ Local đã có dữ liệu → không import lại full graph"
        );
      }

      // 4. Hiển thị
      setHouses(localHomes || []);

    } catch (error) {

      console.error(
        "❌ Lỗi khi lấy danh sách nhà:",
        error
      );

    } finally {

      setLoading(false);

    }
  }, [
    user_id,
    importFromSupabase,
  ]);

  // ───────────────────────────────────────────
  // Initial load
  // ───────────────────────────────────────────

  useEffect(() => {

    fetchUserHomes();

  }, [fetchUserHomes]);

  // ───────────────────────────────────────────
  // Selected house
  // ───────────────────────────────────────────

  const selectedHouse = useMemo(
    () =>
      houses.find(
        (h) => h.id === selectedHomeId
      ) || null,
    [
      houses,
      selectedHomeId,
    ]
  );

  // ───────────────────────────────────────────
  // Navigation
  // ───────────────────────────────────────────

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

  // ───────────────────────────────────────────
  // Delete
  // ───────────────────────────────────────────

  const openDeleteModal = useCallback(
    (house) => {

      setHouseToDelete(house);

      setDeleteModalOpen(true);

    },
    []
  );

  const closeDeleteModal = useCallback(() => {

    setDeleteModalOpen(false);

    setHouseToDelete(null);

  }, []);

  const handleConfirmDelete =
    useCallback(async () => {

      if (!houseToDelete?.id) return;

      try {

        // Không DELETE thật
        // Chỉ retired = true
        await homeRepository.retire(
          houseToDelete.id
        );

        // Xóa khỏi UI
        setHouses((prev) =>
          prev.filter(
            (h) =>
              h.id !== houseToDelete.id
          )
        );

        setSelectedHomeId((prev) =>
          prev === houseToDelete.id
            ? null
            : prev
        );

        closeDeleteModal();

      } catch (error) {

        console.error(
          "Lỗi khi xóa nhà:",
          error
        );

        alert("Xóa thất bại");

      }

    }, [
      houseToDelete,
      closeDeleteModal,
    ]);

  // ───────────────────────────────────────────
  // View
  // ───────────────────────────────────────────

  const isListView =
    view === VIEW.LIST;

  const isCreateView =
    view === VIEW.CREATE;

  const isDetailView =
    view === VIEW.DETAIL;

  // ───────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────

  return (
    <div className="bg-stone-50">

      {/* LIST */}
      {isListView && (
        <div className="p-4">

          <h2 className="text-lg font-bold text-stone-800 mb-4">
            Nhà trọ của bạn
          </h2>

          {loading ? (

            <p className="text-sm text-stone-500">
              Đang tải...
            </p>

          ) : houses.length === 0 ? (

            <NoHouseSelected
              onStartAddHouse={goToCreate}
            />

          ) : (

            <div className="space-y-3">

              {houses.map((house) => (

                <HouseCard
                  key={house.id}
                  house={house}
                  selected={
                    selectedHomeId === house.id
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

        <SelectedHouse
          userID={user_id}
          onBack={goToList}
          refreshHouses={fetchUserHomes}
        />

      )}

      {/* DETAIL */}
      {isDetailView &&
        selectedHouse && (

          <SelectedHouse
            house={selectedHouse}
            onBack={goToList}
            refreshHouses={fetchUserHomes}
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
          aria-label="Tạo nhà trọ mới"
        >
          <FiPlus size={26} />
        </button>

      )}

      {/* DELETE MODAL */}
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