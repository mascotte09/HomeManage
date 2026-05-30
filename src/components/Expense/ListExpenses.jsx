import {
    useEffect,
    useState,
    useCallback,
} from "react";

import { supabase } from "../../supabase";

import ExpensesSidebar from "./ExpensesSidebar.jsx";
import NoExpenseSelected from "./NoExpenseSelected.jsx";
import ExpenseItem from "./ExpenseItem.jsx";
import { useParams } from "react-router-dom";

export default function ListExpenses() {
    const now = new Date();

    const [selectedMonth, setSelectedMonth] = useState(
        `${now.getFullYear()}-${String(
            now.getMonth() + 1
        ).padStart(2, "0")}`
    );

    const { houseId } = useParams();
    const [expensesState, setExpensesState] =
        useState({
            selectedExpenseId: undefined,
            expenses: [],
        });

    // Fetch expenses
    const fetchExpenses = useCallback(async () => {
        const startDate =
            `${selectedMonth}-01`;

        const endDate = new Date(
            startDate
        );

        endDate.setMonth(
            endDate.getMonth() + 1
        );

        const {
            data: expensesData,
            error: expensesError,
        } = await supabase
            .from("expenses")
            .select(`*,
                expenses_type (
                    type_name
                )
            `)
            .eq("home_id", houseId)
            .gte(
                "expense_date",
                startDate
            )
            .lt(
                "expense_date",
                endDate
                    .toISOString()
                    .split("T")[0]
            )
            .order("expense_date", {
                ascending: false,
            });

        if (expensesError) {
            console.log(expensesError.message);
            return;
        }

        if (
            !expensesData ||
            expensesData.length === 0
        ) {
            setExpensesState((prevState) => ({
                ...prevState,
                expenses: [],
            }));

            return;
        }

        setExpensesState((prevState) => ({
            ...prevState,
            expenses: expensesData || [],
        }));
    }, [houseId, selectedMonth]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const filteredExpenses =
        expensesState.expenses.filter(
            (expense) => {
                if (!expense.expense_date)
                    return false;

                const d = new Date(
                    expense.expense_date
                );

                const expenseMonth = `${d.getFullYear()}-${String(
                    d.getMonth() + 1
                ).padStart(2, "0")}`;

                return (
                    expenseMonth ===
                    selectedMonth
                );
            }
        );

    // Select expense
    function handleSelectExpense(id) {
        setExpensesState((prevState) => {
            return {
                ...prevState,
                selectedExpenseId: id,
            };
        });
    }

    // Start add
    function handleStartAddExpense() {
        setExpensesState((prevState) => {
            return {
                ...prevState,
                selectedExpenseId: null,
            };
        });
    }

    // Cancel add
    function handleCancelAddExpense() {
        setExpensesState((prevState) => {
            return {
                ...prevState,
                selectedExpenseId:
                    undefined,
            };
        });
    }

    // Delete expense
    function handleDeleteExpense() {
        setExpensesState((prevState) => {
            return {
                ...prevState,
                selectedExpenseId:
                    undefined,
                expenses:
                    prevState.expenses.filter(
                        (expense) =>
                            expense.id !==
                            prevState.selectedExpenseId
                    ),
            };
        });
    }

    let content;

    // New expense
    if (
        expensesState.selectedExpenseId === null
    ) {
        content = (
            <ExpenseItem
                expenseItem={null}
                home_id={houseId}
                onDelete={handleCancelAddExpense}
                refreshExpenses={fetchExpenses}
            />
        );
    }

    // Nothing selected
    else if (
        expensesState.selectedExpenseId ===
        undefined
    ) {
        content = (
            <NoExpenseSelected
                onStartAddExpense={
                    handleStartAddExpense
                }
            />
        );
    }

    // Selected expense
    else {
        const selectedExpense =
            expensesState.expenses.find(
                (expense) =>
                    expense.id ===
                    expensesState.selectedExpenseId
            );

        content = (
            <ExpenseItem
                expenseItem={
                    selectedExpense
                }
                onDelete={
                    handleDeleteExpense
                }
                refreshExpenses={
                    fetchExpenses
                }
            />
        );
    }

    return (
        <div className="h-screen flex flex-col m-0 p-0">

            {/* Main Content */}
            <main className="flex-1 flex gap-2 mt-0 pt-0">

                <ExpensesSidebar
                    onStartAddExpense={
                        handleStartAddExpense
                    }
                    expenses={
                        filteredExpenses
                    }
                    onSelectExpense={
                        handleSelectExpense
                    }
                    selectedExpenseId={
                        expensesState.selectedExpenseId
                    }
                    selectedMonth={
                        selectedMonth
                    }
                    onMonthChange={
                        setSelectedMonth
                    }
                />

                {content}

            </main>
        </div>
    );
}