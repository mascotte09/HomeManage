import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";

import InvoiceRecord from "./InvoiceRecord.jsx";
import NoInvoiceSelected from "./NoInvoiceSelected.jsx";

import { invoiceRepository } from "../../db/invoiceRepository.js";
import { roomRepository } from "../../db/roomRepository.js";
import { homeRepository } from "../../db/homeRepository.js";

// =========================================================
// ROOM INVOICE CARD
// =========================================================
function RoomInvoiceCard({
  room,
  invoice,
  onSelect,
}) {
  const hasInvoice = !!invoice;

  function formatDate(dateString) {
    if (!dateString) return "";

    return new Date(
      dateString
    ).toLocaleDateString("vi-VN");
  }

  return (
    <button
      onClick={() => onSelect(room, invoice)}
      className="
        w-full
        text-left
        p-3
        rounded-2xl
        border border-stone-200
        bg-white
        hover:border-stone-300
        transition
        active:scale-[0.98]
      "
    >

      <div className="
        flex items-center
        justify-between
        gap-2
      ">

        {/* INFO */}
        <div className="
          flex-1
          min-w-0
        ">

          <p className="
            font-semibold
            text-stone-800
          ">
            Phòng {room.room_name}
          </p>

          {room.room_renter && (
            <p className="
              text-sm
              text-stone-500
              truncate
              mt-0.5
            ">
              {room.room_renter}
            </p>
          )}

          <p className="
            text-xs
            text-stone-400
            mt-1
          ">
            Ngày thu: ngày{" "}
            {room.date_pay || 1} hàng tháng
          </p>

        </div>

        {/* STATUS */}
        {hasInvoice ? (

          <span className="
            flex items-center
            gap-1.5
            px-2.5 py-1
            rounded-full
            bg-green-100
            text-green-700
            text-xs
            font-medium
            flex-shrink-0
          ">

            <FiCheckCircle size={13} />

            {formatDate(
              invoice.invoice_create_date
            )}

          </span>

        ) : (

          <span className="
            flex items-center
            gap-1.5
            px-2.5 py-1
            rounded-full
            bg-amber-100
            text-amber-700
            text-xs
            font-medium
            flex-shrink-0
          ">

            <FiClock size={13} />

            Chưa tạo

          </span>

        )}

      </div>

    </button>
  );
}

// =========================================================
// MAIN
// =========================================================
export default function InvoicesInMonth() {
  const { houseId } = useParams();

  const [state, setState] = useState({
    home: null,
    invRooms: [],
    noInvRooms: [],
  });

  const [view, setView] =
    useState("list");

  const [selectedRoom, setSelectedRoom] =
    useState(null);

  const [selectedInvoice, setSelectedInvoice] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // =========================================================
  // CURRENT MONTH
  // =========================================================
  const now = new Date();

  const currentMonth =
    now.getMonth() + 1;

  const currentYear =
    now.getFullYear();

  // =========================================================
  // FETCH
  // =========================================================
  const fetchRooms = useCallback(
    async () => {
      if (!houseId) return;

      setLoading(true);

      try {
        // -----------------------------------------------------
        // HOME
        // -----------------------------------------------------
        const homeData =
          await homeRepository.getById(
            houseId
          );

        // -----------------------------------------------------
        // ROOMS
        // -----------------------------------------------------
        const rooms =
          await roomRepository.getByHomeId(
            houseId
          );

        // -----------------------------------------------------
        // INVOICES
        // -----------------------------------------------------
        const invRooms = [];
        const noInvRooms = [];

        for (const room of rooms || []) {

          let invoiceThisMonth = null;

          try {
            invoiceThisMonth =
              await invoiceRepository.getInvoiceOfMonth(
                room.id,
                currentMonth,
                currentYear
              );
          } catch (error) {
            console.error(
              `Không thể lấy hóa đơn phòng ${room.room_name}:`,
              error
            );
          }

          if (invoiceThisMonth) {

            invRooms.push({
              ...room,
              _invoice:
                invoiceThisMonth,
            });

          } else {

            noInvRooms.push(room);

          }
        }

        // -----------------------------------------------------
        // SORT
        // -----------------------------------------------------
        const sortFn = (a, b) =>
          String(a.room_name || "").localeCompare(
            String(b.room_name || ""),
            undefined,
            {
              numeric: true,
              sensitivity: "base",
            }
          );

        invRooms.sort(sortFn);
        noInvRooms.sort(sortFn);

        setState({
          home: homeData,
          invRooms,
          noInvRooms,
        });

      } catch (error) {

        console.error(
          "InvoicesInMonth error:",
          error
        );

      } finally {

        setLoading(false);

      }
    },
    [
      houseId,
      currentMonth,
      currentYear,
    ]
  );

  // =========================================================
  // LOAD
  // =========================================================
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // =========================================================
  // SELECT ROOM
  // =========================================================
  function handleSelectRoom(
    room,
    invoice
  ) {
    setSelectedRoom(room);

    setSelectedInvoice(
      invoice || null
    );

    setView("record");
  }

  // =========================================================
  // BACK
  // =========================================================
  function goToList() {
    setView("list");

    setSelectedRoom(null);

    setSelectedInvoice(null);
  }

  // =========================================================
  // ALL ROOMS
  // =========================================================
  const allRooms = [
    ...state.noInvRooms,
    ...state.invRooms,
  ].sort((a, b) =>
    String(a.room_name || "").localeCompare(
      String(b.room_name || ""),
      undefined,
      {
        numeric: true,
        sensitivity: "base",
      }
    )
  );

  // =========================================================
  // RECORD VIEW
  // =========================================================
  if (
    view === "record" &&
    selectedRoom
  ) {

    return (
      <div className="
        min-h-screen
        bg-stone-50
        flex flex-col
      ">

        {/* TOP BAR */}
        <div className="
          bg-white
          border-b border-stone-200
          px-3 py-2
          flex items-center
          gap-2
          sticky top-0
          z-10
        ">

          <button
            onClick={goToList}
            className="
              w-10 h-10
              flex items-center
              justify-center
              rounded-full
              hover:bg-stone-100
              text-stone-600
              transition
              flex-shrink-0
            "
            aria-label="Quay lại"
          >
            <FiArrowLeft size={20} />
          </button>

          <p className="
            font-semibold
            text-stone-800
            text-sm
            truncate
          ">
            Hóa đơn · Phòng{" "}
            {selectedRoom.room_name}
          </p>

        </div>

        {/* RECORD */}
        <div className="
          flex-1
          p-4
        ">

          <InvoiceRecord
            room={selectedRoom}
            homeID={houseId}
            invoice={selectedInvoice}

            onCancel={goToList}

            onAdd={async () => {
              await fetchRooms();

              goToList();
            }}
          />

        </div>

      </div>
    );
  }

  // =========================================================
  // LIST VIEW
  // =========================================================
  return (
    <div className="
      min-h-screen
      bg-stone-50
    ">

      <div className="
        p-4
        pb-8
      ">

        {/* HEADER */}
        <div className="
          flex items-center
          justify-between
          mb-4
        ">

          <h2 className="
            text-lg
            font-bold
            text-stone-800
          ">
            Hóa đơn tháng{" "}
            {String(currentMonth).padStart(
              2,
              "0"
            )}
            /{currentYear}
          </h2>

          {!loading &&
            allRooms.length > 0 && (

              <span className="
                text-sm
                text-stone-500
              ">
                {state.invRooms.length}/
                {allRooms.length} đã tạo
              </span>

            )}

        </div>

        {/* LOADING */}
        {loading ? (

          <div className="
            bg-white
            border border-stone-200
            rounded-2xl
            p-8
            text-center
          ">
            <p className="
              text-stone-500
            ">
              Đang tải...
            </p>
          </div>

        ) : allRooms.length === 0 ? (

          <NoInvoiceSelected />

        ) : (

          <div className="
            space-y-3
          ">

            {/* CHƯA TẠO */}
            {state.noInvRooms.map(
              (room) => (

                <RoomInvoiceCard
                  key={room.id}
                  room={room}
                  invoice={null}
                  onSelect={
                    handleSelectRoom
                  }
                />

              )
            )}

            {/* ĐÃ TẠO */}
            {state.invRooms.map(
              (room) => (

                <RoomInvoiceCard
                  key={room.id}
                  room={room}
                  invoice={
                    room._invoice
                  }
                  onSelect={
                    handleSelectRoom
                  }
                />

              )
            )}

          </div>

        )}

      </div>

    </div>
  );
}