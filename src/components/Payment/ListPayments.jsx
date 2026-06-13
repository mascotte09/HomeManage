import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { FiArrowLeft, FiChevronDown } from "react-icons/fi";
import { supabase } from "../../supabase.js";
import PaymentRecord from "./PaymentRecord.jsx";

// ─── Invoice card ─────────────────────────────────────────────────────────────
function InvoiceCard({ invoice, onSelect }) {
  const debt = Number(invoice.debit_amount || 0);
  const isPaid = debt <= 0;
  const displayAmount = isPaid
    ? Number(invoice.total_amount || 0)
    : debt;

  return (
    <button
      onClick={() => onSelect(invoice.id)}
      className="w-full text-left p-3 rounded-2xl border border-stone-200 bg-white hover:border-stone-300 transition active:scale-[0.98]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-800">
            Phòng {invoice.room_number}
          </p>
          <p className="text-xs text-stone-400 mt-0.5">
            {invoice.invoice_create_date
              ? new Date(invoice.invoice_create_date).toLocaleDateString("vi-VN")
              : ""}
          </p>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
            isPaid
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {displayAmount.toLocaleString("vi-VN")} đ
        </span>
      </div>
    </button>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function ListPayments() {
  const { houseId } = useParams();

  const [state, setState] = useState({
    home: null,
    rooms: [],
    collected: [],
    noCollected: [],
  });

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchInvoices = useCallback(async () => {
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

    const [year, month] = selectedMonth.split("-").map(Number);

    const collected = [];
    const noCollected = [];

    (roomsData || []).forEach((room) => {
      room.invoices?.forEach((invoice) => {
        if (!invoice.invoice_create_date) return;

        const d = new Date(invoice.invoice_create_date);
        if (d.getMonth() + 1 !== month || d.getFullYear() !== year) return;

        const invoiceWithRoom = { ...invoice, room_number: room.room_name };

        if (Number(invoice.debit_amount) <= 0) {
          collected.push(invoiceWithRoom);
        } else {
          noCollected.push(invoiceWithRoom);
        }
      });
    });

    const sortFn = (a, b) =>
      a.room_number.localeCompare(b.room_number, undefined, { numeric: true });

    collected.sort(sortFn);
    noCollected.sort(sortFn);

    setState({ home: homeData, rooms: roomsData || [], collected, noCollected });
  }, [houseId, selectedMonth]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    setSelectedInvoice(null);
  }, [selectedMonth]);

  // ── Select ───────────────────────────────────────────────────────────────
  function handleSelectInvoice(invoiceId) {
    const invoice = [...state.collected, ...state.noCollected].find(
      (inv) => inv.id === invoiceId
    );
    if (invoice) setSelectedInvoice(invoice);
  }

  const allInvoices = [...state.noCollected, ...state.collected];

  // ── Render: PaymentRecord view ──────────────────────────────────────────────
  if (selectedInvoice) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        <div className="bg-white border-b border-stone-200 px-3 py-2 flex items-center gap-2 sticky top-0 z-10">
          <button
            onClick={() => setSelectedInvoice(null)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-600 transition flex-shrink-0"
            aria-label="Quay lại"
          >
            <FiArrowLeft size={20} />
          </button>
          <p className="font-semibold text-stone-800 text-sm truncate">
            Thu tiền · Phòng {selectedInvoice.room_number}
          </p>
        </div>

        <div className="flex-1 p-4">
          <PaymentRecord
            invoice={selectedInvoice}
            onCancel={() => setSelectedInvoice(null)}
            onSave={async (updatedInvoice) => {
              const { error } = await supabase
                .from("invoices")
                .update({ debit_amount: updatedInvoice.debit_amount })
                .eq("id", updatedInvoice.id);

              if (error) {
                alert(error.message);
                return;
              }

              await fetchInvoices();
              setSelectedInvoice(null);
            }}
          />
        </div>
      </div>
    );
  }

  // ── Render: List view ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="p-4 pb-8">
        {/* Header + month picker */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="text-lg font-bold text-stone-800">Thu Tiền</h2>

          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-full border border-stone-200 bg-white text-sm font-medium text-stone-700"
            >
              {Array.from({ length: 24 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - 12 + i);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const value = `${year}-${month}`;
                return (
                  <option key={value} value={value}>
                    {month}/{year}
                  </option>
                );
              })}
            </select>
            <FiChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Summary */}
        {allInvoices.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-3">
              <p className="text-xs text-amber-600 font-medium mb-1">
                Chưa thu ({state.noCollected.length})
              </p>
              <p className="text-lg font-bold text-stone-800">
                {state.noCollected
                  .reduce((sum, inv) => sum + Number(inv.debit_amount || 0), 0)
                  .toLocaleString("vi-VN")}{" "}
                đ
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-3">
              <p className="text-xs text-green-600 font-medium mb-1">
                Đã thu ({state.collected.length})
              </p>
              <p className="text-lg font-bold text-stone-800">
                {state.collected
                  .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)
                  .toLocaleString("vi-VN")}{" "}
                đ
              </p>
            </div>
          </div>
        )}

        {/* Lists */}
        {allInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="text-5xl mb-4">💵</div>
            <h2 className="text-lg font-bold text-stone-700 mb-2">
              Chưa có hóa đơn nào
            </h2>
            <p className="text-sm text-stone-500 max-w-xs">
              Không có hóa đơn nào trong tháng {selectedMonth.split("-")[1]}/
              {selectedMonth.split("-")[0]}.
            </p>
          </div>
        ) : (
          <>
            {state.noCollected.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-2 px-1">
                  Chưa thu
                </p>
                <div className="space-y-3">
                  {state.noCollected.map((invoice) => (
                    <InvoiceCard
                      key={invoice.id}
                      invoice={invoice}
                      onSelect={handleSelectInvoice}
                    />
                  ))}
                </div>
              </div>
            )}

            {state.collected.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-2 px-1">
                  Đã thu
                </p>
                <div className="space-y-3">
                  {state.collected.map((invoice) => (
                    <InvoiceCard
                      key={invoice.id}
                      invoice={invoice}
                      onSelect={handleSelectInvoice}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
