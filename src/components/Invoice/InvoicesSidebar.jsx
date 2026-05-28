import { Link } from "react-router-dom";

export default function InvoicesSidebar({
  houseID,
  noInvRooms,
  invRooms,
  onSelectInvoice,
  selectedRoomId,
}) {

  function formatDate(dateString) {

    if (!dateString) return "";

    const d = new Date(dateString);

    return d.toLocaleDateString("en-GB");
  }

  return (

    <aside className="w-1/3 px-1 py-8 bg-stone-900 text-stone-50 md:w-72 rounded-r-xl flex flex-col">

      <div>
        <Link
            to={`/rooms/${houseID}`}
            className="block mb-5 text-blue-400 hover:text-yellow-300 text-sm font-bold"
        >
            ← Chọn Phòng
        </Link>
        <h2 className="mb-5 text-xs px-2 py-1 font-bold uppercase text-stone-200">
          Hóa Đơn{" "}
          {String(new Date().getMonth() + 1).padStart(2, "0")}
          /
          {new Date().getFullYear()}
        </h2>

        <ul className="space-y-1 w-full">

          {/* ========================= */}
          {/* ROOMS WITHOUT INVOICE */}
          {/* ========================= */}
          {noInvRooms.map((room) => {

            let cssClasses =
              "w-full text-left px-2 py-1 text-sm rounded-sm hover:text-stone-200 hover:bg-stone-800 leading-tight";
            if (
              room.id === selectedRoomId
            ) {

              cssClasses +=
                " bg-stone-800 text-stone-200";

            } else {

              cssClasses +=
                " text-stone-400";
            }

            return (
              <li key={room.id} className="w-full">

                <button
                  className={`${cssClasses} w-full`}
                    onClick={() =>
                    onSelectInvoice(room.id)
                  }
                >

                  {/* Room */}
                  <div className="font-medium">
                    Phòng: {room.room_name}
                  </div>

                  {/* datePay */}
                  <div className="text-xs text-stone-400">
                    Ngày thu: {room.date_pay}
                  </div>

                  {/* Status */}
                  <div className="text-xs text-red-400">
                    Chưa tạo Hóa Đơn
                  </div>

                </button>

              </li>
            );
          })}

          {/* ========================= */}
          {/* ROOMS WITH INVOICE */}
          {/* ========================= */}
          {invRooms.map((room) => {

            let cssClasses =
              "w-full text-left px-2 py-1 text-sm rounded-sm hover:text-stone-200 hover:bg-stone-800 leading-tight";

            if (
              room.id === selectedRoomId
            ) {

              cssClasses +=
                " bg-stone-800 text-stone-200";

            } else {

              cssClasses +=
                " text-stone-400";
            }

            // Current month invoice
            const now = new Date();

            const currentMonth =
              now.getMonth() + 1;

            const currentYear =
              now.getFullYear();

            const invoiceThisMonth =
              room.invoices?.find(
                (inv) => {

                  if (
                    !inv.invoice_create_date
                  ) {
                    return false;
                  }

                  const d = new Date(
                    inv.invoice_create_date
                  );

                  return (
                    d.getMonth() + 1 ===
                      currentMonth &&
                    d.getFullYear() ===
                      currentYear
                  );
                }
              );

            return (
              <li key={room.id}>                

                <button
                  className={`${cssClasses} w-full`}
                    onClick={() =>
                    onSelectInvoice(room.id)
                  }
                >

                  {/* Room */}
                  <div className="font-medium">
                    Phòng: {room.room_name}
                  </div>            

                  {/* Invoice date */}
                  <div className="text-xs text-green-400">
                    Ngày tạo:{" "}
                    {formatDate(
                      invoiceThisMonth?.invoice_create_date
                    )}
                  </div>

                </button>

              </li>
            );
          })}

        </ul>

      </div>

    </aside>
  );
}