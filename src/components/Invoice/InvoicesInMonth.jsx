import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../supabase.js";
import InvoicesSidebar from "./InvoicesSidebar.jsx";
import InvoiceRecord from "./InvoiceRecord.jsx";
import NoInvoiceSelected from "./NoInvoiceSelected.jsx";
import { useParams } from "react-router-dom";

export default function InvoicesInMonth() {
  const [state, setState] = useState({
    home: null,
    rooms: [],
    invRooms: [],
    noInvRooms: [],
  });

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [mode, setMode] = useState("empty");
  // mode:
  // "empty"
  // "create"
  // "view"

  const { houseId } = useParams();

  // =========================
  // FETCH ROOMS + INVOICES
  // =========================
  const fetchRooms = useCallback(async () => {
    // fetch home
    const { data: homeData, error: homeError } = await supabase
        .from("homes")
        .select("*")
        .eq("id", houseId)
        .single();

    if (homeError) {
        console.log(homeError.message);
        return;
    }
    const { data: roomsData, error } = await supabase
      .from("rooms")
      .select("*, invoices(*)")
      .eq("home_id", houseId);

    if (error) {
      console.log(error.message);
      return;
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const invRooms = [];
    const noInvRooms = [];

    roomsData.forEach((room) => {
      const hasInvoiceThisMonth = room.invoices?.some((inv) => {
        if (!inv.invoice_create_date) return false;

        const d = new Date(inv.invoice_create_date);

        return (
          d.getMonth() + 1 === currentMonth &&
          d.getFullYear() === currentYear
        );
      });

      if (hasInvoiceThisMonth) {
        invRooms.push(room);
      } else {
        noInvRooms.push(room);
      }
    });
    // SORT
    invRooms.sort((a, b) =>
      a.room_name.localeCompare(
        b.room_name,
        undefined,
        { numeric: true }
      )
    );

    noInvRooms.sort((a, b) =>
      a.room_name.localeCompare(
        b.room_name,
        undefined,
        { numeric: true }
      )
    );
    setState({
      home: homeData,
      rooms: roomsData || [],
      invRooms,
      noInvRooms,
    });
  }, [houseId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // =========================
  // SELECT ROOM
  // =========================
  function handleSelectRoom(roomId) {
    const room = state.rooms.find((r) => r.id === roomId);

    if (!room) return;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const invoiceThisMonth = room.invoices?.find((inv) => {
      if (!inv.invoice_create_date) return false;

      const d = new Date(inv.invoice_create_date);

      return (
        d.getMonth() + 1 === currentMonth &&
        d.getFullYear() === currentYear
      );
    });

    setSelectedRoom(room);

    // ✅ HAS invoice => show SelectedInvoice
    if (invoiceThisMonth) {
      setSelectedInvoice(invoiceThisMonth);
      setMode("view");
    }

    // ✅ NO invoice => show InvoiceRecord
    else {
      setSelectedInvoice(null);
      setMode("create");
    }
  }

  // =========================
  // CONTENT
  // =========================
  let content;

  // EMPTY
  if (mode === "empty") {
    content = <NoInvoiceSelected />;
  }

  // CREATE INVOICE
  else if (mode === "create") {
    content = (
      <InvoiceRecord
        room={selectedRoom}
        homeID={houseId}
        invoice={null}
        onCancel={() => setMode("empty")}
        onAdd={() => {
          setMode("empty");
          fetchRooms();
        }}
      />
    );
  }

  // VIEW INVOICE
  else if (mode === "view") {
    content = (
      <InvoiceRecord
        room={selectedRoom}
        homeID={houseId}
        invoice={selectedInvoice}
        onCancel={() => setMode("empty")}
        onAdd={() => {
          setMode("empty");
          fetchRooms();
        }}
      />
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="h-screen flex flex-col m-0 p-0">
      <main className="flex flex-1 w-full gap-0">
        <InvoicesSidebar
          houseID={houseId}
          noInvRooms={state.noInvRooms}
          invRooms={state.invRooms}
          onSelectInvoice={handleSelectRoom}
        />

        {content}
      </main>
    </div>
  );
}