import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../supabase.js";
import PaymentsSidebar from "./PaymentsSidebar.jsx";
import PaymentRecord from "./PaymentRecord.jsx";
import { useParams } from "react-router-dom";

export default function ListPayments() {
  const { houseId } = useParams();

  const [state, setState] = useState({
    home: null,
    rooms: [],
    collected: [],
    noCollected: [],
  });

  const [selectedMonth, setSelectedMonth] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 7)
    );

  const [selectedInvoice, setSelectedInvoice] =
    useState(null);

  // =========================
  // FETCH DATA
  // =========================
  const fetchInvoices =
    useCallback(async () => {
      const {
        data: homeData,
        error: homeError,
      } = await supabase
        .from("homes")
        .select("*")
        .eq("id", houseId)
        .single();

      if (homeError) {
        console.log(
          homeError.message
        );
        return;
      }

      const {
        data: roomsData,
        error,
      } = await supabase
        .from("rooms")
        .select(
          `
                    *,
                    invoices(
                        *
                    )
                `
        )
        .eq(
          "home_id",
          houseId
        );
      console.debug("roomsData: " + roomsData);

      if (error) {
        console.log(
          error.message
        );
        return;
      }

      const month =
        Number(
          selectedMonth.split(
            "-"
          )[1]
        );
      const year =
        Number(
          selectedMonth.split(
            "-"
          )[0]
        );
      const collected =
        [];

      const noCollected =
        [];

      roomsData.forEach(
        (room) => {

          room.invoices?.forEach(
            (
              invoice
            ) => {
              const invoiceWithRoom = {
                ...invoice,
                room_number: room.room_name,
              };
              if (
                !invoice.invoice_create_date
              )
                return;

              const d =
                new Date(
                  invoice.invoice_create_date
                );

              if (
                d.getMonth() +
                1 !==
                month ||
                d.getFullYear() !==
                year
              ) {
                return;
              }

              if (
                Number(
                  invoice.debit_amount
                ) ===
                0
              ) {
                collected.push(
                  invoiceWithRoom
                );
              } else {
                noCollected.push(
                  invoiceWithRoom
                );
              }
            }
          );
        }
      );

      setState({
        home: homeData,
        rooms:
          roomsData ||
          [],
        collected,
        noCollected,
      });
    }, [
      houseId,
      selectedMonth,
    ]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);
  useEffect(() => {
    setSelectedInvoice(null);
  }, [selectedMonth]);
  // =========================
  // SELECT INVOICE
  // =========================
  function handleSelectInvoice(
    invoiceId
  ) {
    const invoice = [
      ...state.collected,
      ...state.noCollected,
    ].find(
      (inv) =>
        inv.id === invoiceId
    );

    if (!invoice) return;

    setSelectedInvoice(
      invoice
    );
  }

  // =========================
  // CONTENT
  // =========================
  let content;

  if (selectedInvoice) {
    content = (
      <PaymentRecord
        invoice={selectedInvoice}
        onCancel={() => {
          setSelectedInvoice(null);
        }}
        onSave={async (updatedInvoice) => {
          const { error } =
            await supabase
              .from("invoices")
              .update({
                debit_amount:
                  updatedInvoice.debit_amount,
              })
              .eq(
                "id",
                updatedInvoice.id
              );

          if (error) {
            alert(error.message);
            return;
          }

          await fetchInvoices();

          setSelectedInvoice(null);
        }}
      />

    );

  } else {
    content = (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">
          Chọn một hóa đơn để thu tiền
        </p>
      </div>
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="h-screen flex flex-col m-0 p-0">
      <main className="flex flex-1 w-full gap-0">
        <PaymentsSidebar
          lstInvoicePaied={
            state.collected
          }
          lstInvoiceNoPaied={
            state.noCollected
          }
          selectedInvoiceId={
            selectedInvoice?.id
          }
          selectedMonth={
            selectedMonth
          }
          onMonthChange={
            setSelectedMonth
          }
          onSelectInvoice={
            handleSelectInvoice
          }
        />

        {content}
      </main>
    </div>
  );
}