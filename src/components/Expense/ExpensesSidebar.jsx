import Button from "../Button.jsx";

export default function ExpensesSidebar({
    onStartAddExpense,
    expenses,
    onSelectExpense,
    selectedExpenseId,
    selectedMonth,
    onMonthChange,
}) {
    return (
        <aside className="w-21 flex-shrink-0 px-1 py-8 bg-stone-900 text-stone-50 md:w-72 rounded-r-xl flex flex-col">
            <h2 className="mb-3 text-xs font-bold uppercase text-stone-200">
                Chi phí
            </h2>
            
            <select
                value={selectedMonth}
                onChange={(e) =>
                    onMonthChange(e.target.value)
                }
                className="w-full mb-3 px-2 py-1 rounded text-black"
            >
                {Array.from({ length: 24 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(
                        date.getMonth() - 12 + i
                    );

                    const year =
                        date.getFullYear();

                    const month = String(
                        date.getMonth() + 1
                    ).padStart(2, "0");

                    const value =
                        `${year}-${month}`;

                    return (
                        <option
                            key={value}
                            value={value}
                        >
                            {month}/{year}
                        </option>
                    );
                })}
            </select>
            <div className="mb-3">
                <Button onClick={onStartAddExpense}>
                    Tạo mới
                </Button>
            </div>

            <ul className="space-y-1">
                {expenses.map((expense) => {
                    let cssClasses =
                        "w-full text-left px-2 py-1 text-sm rounded-sm hover:text-stone-200 hover:bg-stone-800 leading-tight";

                    if (
                        expense.id === selectedExpenseId
                    ) {
                        cssClasses +=
                            " bg-stone-800 text-stone-200";
                    } else {
                        cssClasses += " text-stone-400";
                    }

                    return (
                        <li key={expense.id}>
                            <button
                                className={cssClasses}
                                onClick={() =>
                                    onSelectExpense(
                                        expense.id
                                    )
                                }
                            >
                                {expense.expenses_type?.type_name} -{" "}
                                {expense.expense?.toLocaleString()}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
}