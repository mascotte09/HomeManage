export default function InvoicesSidebar({
  noInvRooms,
  invRooms,
  onSelectProject,
  selectedRoomId,
}) {
  function formatDate(dateString) {
    if (!dateString) return "";

    const d = new Date(dateString);

    return d.toLocaleDateString("en-GB");
  }

  return (
    <aside className="w-1/3 px-8 py-16 bg-stone-900 text-stone-50 md:w-72 rounded-r-xl">
      <h2 className="mb-8 font-bold uppercase md:text-xl text-stone-200">
        Invoices
      </h2>

      <ul className="mt-8">

        {/* ========================= */}
        {/* ROOMS WITHOUT INVOICE */}
        {/* ========================= */}
        {noInvRooms.map((room) => {
          let cssClasses =
            "w-full text-left px-3 py-3 rounded-md my-2 hover:text-stone-200 hover:bg-stone-800 transition";

          if (room.id === selectedRoomId) {
            cssClasses += " bg-stone-800 text-stone-200";
          } else {
            cssClasses += " text-stone-400";
          }

          return (
            <li key={room.id}>
              <button
                className={cssClasses}
                onClick={() => onSelectProject(room.id)}
              >
                {/* Room Name */}
                <div className="font-semibold">
                  {room.room_name} - {room.room_renter}
                </div>

                {/* Status */}
                <div className="text-xs text-red-400 mt-1">
                  Not yet created
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
            "w-full text-left px-3 py-3 rounded-md my-2 hover:text-stone-200 hover:bg-stone-800 transition";

          if (room.id === selectedRoomId) {
            cssClasses += " bg-stone-800 text-stone-200";
          } else {
            cssClasses += " text-stone-400";
          }

          // Find invoice this month
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

          return (
            <li key={room.id}>
              <button
                className={cssClasses}
                onClick={() => onSelectProject(room.id)}
              >
                {/* Room Name */}
                <div className="font-semibold">
                  {room.room_name} - {room.room_renter}
                </div>

                {/* Created Date */}
                <div className="text-xs text-green-400 mt-1">
                  Created:{" "}
                  {formatDate(invoiceThisMonth?.invoice_create_date)}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}