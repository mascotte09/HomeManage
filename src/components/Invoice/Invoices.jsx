import { useEffect, useState } from "react";
import { supabase } from "../../supabase";

export default function Invoices({
  homeID,
  room,
  invoices,
  onDelete,
  onEdit,
  onAdd,
}) {

  // =========================
  // HOME
  // =========================
  const [home, setHome] =
    useState(null);

  // =========================
  // LOAD HOME
  // =========================
  useEffect(() => {

    async function fetchHome() {

      if (!homeID) {
        return;
      }

      const { data, error } =
        await supabase
          .from("homes")
          .select("*")
          .eq("id", homeID)
          .single();

      if (error) {

        console.log(error.message);

        return;
      }

      setHome(data);
    }

    fetchHome();

  }, [homeID]);

  // =========================
  // FORMAT DATE
  // =========================
  function formatDate(dateString) {

    if (!dateString) {
      return "";
    }

    const d = new Date(dateString);

    return d.toLocaleDateString(
      "vi-VN"
    );
  }

  // =========================
  // FORMAT MONEY
  // =========================
  function formatMoney(value) {

    return (
      Number(value || 0)
        .toLocaleString("vi-VN") 
    );
  }
    
  return (
    <section className="w-full">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">

        <div>
          <h2 className="text-lg font-bold text-stone-700">
            Hóa đơn
          </h2>

          {home && (
            <div className="text-xs text-stone-500 mt-1">
              {home.bank_id} • {home.bank_account}
            </div>
          )}
        </div>

        <button
          onClick={onAdd}
          className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded-md"
        >
          Tạo mới
        </button>

      </div>

      {/* EMPTY */}
      {invoices.length === 0 ? (

        <p className="text-sm text-stone-500 my-4">
          Chưa có hóa đơn.
        </p>

      ) : (

        <ul className="mt-2 rounded-md border border-stone-200 overflow-hidden">

          {invoices.map((invoice) => (

            <li
              key={invoice.id}
              className="flex items-center justify-between px-3 py-2 border-b border-stone-200 bg-stone-50 hover:bg-stone-100"
            >

              {/* LEFT */}
              <div className="flex flex-col text-sm">              
                {/* DATE */}
                <div className="text-sm text-stone-700">
                  Ngày tạo:{" "}
                  {formatDate(
                    invoice.invoice_create_date
                  )}
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex items-center gap-4">
                {/* AMOUNT */}
                <div className="text-sm font-bold text-green-600">
                  {formatMoney(
                    invoice.total_amount
                  )}
                </div>

                {/* EDIT */}
                <button
                  className="text-xs text-blue-500 hover:text-blue-700"
                  onClick={() =>
                    onEdit(invoice)
                  }
                >
                  Xem
                </button>

                {/* DELETE */}
                <button
                  className="text-xs text-red-500 hover:text-red-700"
                  onClick={() =>
                    onDelete(invoice.id)
                  }
                >
                  Xóa
                </button>

              </div>

            </li>
          ))}

        </ul>
      )}

    </section>
  );
}