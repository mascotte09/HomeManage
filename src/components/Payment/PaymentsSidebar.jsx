export default function PaymentsSidebar({
    lstInvoicePaied = [],
    lstInvoiceNoPaied = [],
    onSelectInvoice,
    selectedInvoiceId,
    selectedMonth,
    onMonthChange,
}) {
    const renderInvoices = (invoices) =>
        invoices.map((invoice) => {
            let cssClasses =
                "w-full text-left px-2 py-1 text-sm rounded-sm hover:text-stone-200 hover:bg-stone-800 leading-tight";

            if (
                invoice.id === selectedInvoiceId
            ) {
                cssClasses +=
                    " bg-stone-800 text-stone-200";
            } else {
                cssClasses += " text-stone-400";
            }

            return (
                <li key={invoice.id}>
                    <button
                        className={cssClasses}
                        onClick={() =>
                            onSelectInvoice(
                                invoice.id
                            )
                        }
                    >
                        Phòng: {invoice.room_number}
                        <br />
                        <span className="text-xs">
                            {Number(
                                invoice.total_amount || 0
                            ).toLocaleString("vi-VN")} đ
                        </span>
                    </button>
                </li>
            );
        });

    return (
        <aside className="w-21 flex-shrink-0 px-1 py-8 bg-stone-900 text-stone-50 md:w-72 rounded-r-xl flex flex-col">
            <h2 className="mb-3 text-xs font-bold uppercase text-stone-200">
                Thu Tiền
            </h2>

            <input
                type="month"
                value={selectedMonth}
                onChange={(e) =>
                    onMonthChange(
                        e.target.value
                    )
                }
                className="w-full text-xs mb-3 px-2 py-1 rounded text-black"
            />

            {/* Chưa thu */}
            <div className="mb-4">
                <h3 className="mb-2 text-xs font-bold text-yellow-400 uppercase">
                    Chưa thu ({lstInvoiceNoPaied.length})
                </h3>

                <ul className="space-y-1">
                    {renderInvoices(
                        lstInvoiceNoPaied
                    )}
                </ul>
            </div>

            {/* Đã thu */}
            <div>
                <h3 className="mb-2 text-xs font-bold text-green-400 uppercase">
                    Đã thu ({lstInvoicePaied.length})
                </h3>

                <ul className="space-y-1">
                    {renderInvoices(
                        lstInvoicePaied
                    )}
                </ul>
            </div>
        </aside>
    );
}