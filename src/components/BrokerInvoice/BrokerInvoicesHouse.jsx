import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiClock, FiChevronRight } from "react-icons/fi";
import { supabase } from "../../supabase.js";

import InvoiceRecord from "./BrokerInvoiceRecord.jsx";
import NoInvoiceSelected from "./NoInvoiceSelected.jsx";

// ─── Room invoice card ────────────────────────────────────────────────────────
function RoomInvoiceCard({ room, invoice, onSelect }) {
  const hasInvoice = !!invoice;

  function formatDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN");
  }

  return (
    <button
      onClick={() => onSelect(room.id)}
      className="w-full text-left p-4 rounded-2xl border border-stone-200 bg-white hover:border-[#146356]/30 hover:shadow-md shadow-sm transition active:scale-[0.98] group"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${hasInvoice ? "bg-[#146356]" : "bg-[#C98A3E]"
                }`}
            />
            <p className="font-semibold text-stone-800 truncate">
              Phòng {room.room_name}
            </p>
          </div>

          {room.room_renter && (
            <p className="text-sm text-stone-500 truncate mt-1 ml-3.5">
              {room.room_renter}
            </p>
          )}

          <p className="text-xs text-stone-400 mt-1 ml-3.5">
            Ngày thu: ngày {room.date_pay} hàng tháng
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {hasInvoice ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E3F3EC] text-[#146356] text-xs font-medium">
              <FiCheckCircle size={13} />
              {formatDate(invoice.invoice_create_date)}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FBEEDD] text-[#92610F] text-xs font-medium">
              <FiClock size={13} />
              Chưa tạo
            </span>
          )}
          <FiChevronRight
            size={16}
            className="text-stone-300 group-hover:text-stone-400 transition"
          />
        </div>
      </div>
    </button>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function InvoicesInMonth() {
  const { houseId } = useParams();

  const [state, setState] = useState({
    home: null,
    invRooms: [],
    noInvRooms: [],
  });

  const [view, setView] = useState("list"); // "list" | "record"
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // ── Fetch rooms + invoices ──────────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    const { data: homeData, error: homeError } = await supabase
      .from("homes")
      .select("*")
      .eq("id", houseId)
      .single();

    if (homeError) {
      console.error(homeError.message);
      return;
    }

    const { data: roomsData, error } = await supabase
      .from("rooms")
      .select("*, invoices(*)")
      .eq("home_id", houseId);

    if (error) {
      console.error(error.message);
      return;
    }

    const invRooms = [];
    const noInvRooms = [];

    (roomsData || []).forEach((room) => {
      const invoiceThisMonth = room.invoices?.find((inv) => {
        if (!inv.invoice_create_date) return false;
        const d = new Date(inv.invoice_create_date);
        return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
      });

      if (invoiceThisMonth) {
        invRooms.push({ ...room, _invoice: invoiceThisMonth });
      } else {
        noInvRooms.push(room);
      }
    });

    const sortFn = (a, b) =>
      a.room_name.localeCompare(b.room_name, undefined, { numeric: true });

    invRooms.sort(sortFn);
    noInvRooms.sort(sortFn);

    setState({ home: homeData, invRooms, noInvRooms });
  }, [houseId, currentMonth, currentYear]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  function handleSelectRoom(room, invoice) {
    setSelectedRoom(room);
    setSelectedInvoice(invoice || null);
    setView("record");
  }

  function goToList() {
    setView("list");
    setSelectedRoom(null);
    setSelectedInvoice(null);
  }

  const allRooms = [...state.noInvRooms, ...state.invRooms].sort((a, b) =>
    a.room_name.localeCompare(b.room_name, undefined, { numeric: true })
  );

  const progressPct =
    allRooms.length > 0
      ? Math.round((state.invRooms.length / allRooms.length) * 100)
      : 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  if (view === "record" && selectedRoom) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        {/* Sticky top bar */}
        <div className="bg-white/90 backdrop-blur border-b border-stone-200 px-3 py-2.5 flex items-center gap-2 sticky top-0 z-10">
          <button
            onClick={goToList}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-600 transition flex-shrink-0"
            aria-label="Quay lại"
          >
            <FiArrowLeft size={20} />
          </button>
          <p className="font-semibold text-stone-800 text-sm truncate">
            Hóa đơn · Phòng {selectedRoom.room_name}
          </p>
        </div>

        <div className="flex-1 p-4">
          <InvoiceRecord
            room={selectedRoom}
            homeID={houseId}
            invoice={selectedInvoice}
            onCancel={goToList}
            onAdd={() => {
              goToList();
              fetchRooms();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto p-4 pb-8">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-stone-800 tracking-tight">
              Hóa đơn tháng {String(currentMonth).padStart(2, "0")}/{currentYear}
            </h2>
            {allRooms.length > 0 && (
              <span className="text-sm font-medium text-stone-500 font-mono tabular-nums">
                {state.invRooms.length}/{allRooms.length} đã tạo
              </span>
            )}
          </div>

          {allRooms.length > 0 && (
            <div className="h-1.5 rounded-full bg-stone-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#146356] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>

        {allRooms.length === 0 ? (
          <NoInvoiceSelected />
        ) : (
          <div className="space-y-2.5">
            {state.noInvRooms.map((room) => (
              <RoomInvoiceCard
                key={room.id}
                room={room}
                invoice={null}
                onSelect={() => handleSelectRoom(room, null)}
              />
            ))}

            {state.invRooms.map((room) => (
              <RoomInvoiceCard
                key={room.id}
                room={room}
                invoice={room._invoice}
                onSelect={() => handleSelectRoom(room, room._invoice)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
