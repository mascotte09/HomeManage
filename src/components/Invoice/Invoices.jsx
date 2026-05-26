export default function Invoices({
  invoices,
  onDelete,
}) {

  function formatDate(dateString) {

    if (!dateString) return "";

    const d = new Date(dateString);

    return d.toLocaleDateString(
      "vi-VN"
    );
  }

  function formatMoney(value) {

    return (
      Number(value || 0)
        .toLocaleString("vi-VN") + " đ"
    );
  }

  return (
    <section className="w-full">

      <h2 className="text-lg font-bold text-stone-700 mb-3">
        Hóa đơn
      </h2>

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

              {/* Left */}
              <div className="flex flex-col text-sm">

                {/* Room */}
                <div className="font-semibold text-stone-700">
                  {invoice.room_name}
                </div>

                {/* Date */}
                <div className="text-xs text-stone-500">
                  Ngày tạo:{" "}
                  {formatDate(
                    invoice.invoice_create_date
                  )}
                </div>

                {/* Note */}
                {invoice.note && (
                  <div className="text-xs text-stone-500 italic">
                    {invoice.note}
                  </div>
                )}

              </div>

              {/* Right */}
              <div className="flex items-center gap-4">

                {/* Amount */}
                <div className="text-sm font-bold text-green-600">
                  {formatMoney(
                    invoice.total_amount
                  )}
                </div>

                {/* Delete */}
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