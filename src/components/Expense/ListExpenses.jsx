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
    const { houseId } = useParams();
    const [expensesState, setExpensesState] =
        useState({
            selectedExpenseId: undefined,
            expenses: [],
        });

    // Fetch expenses
    const fetchExpenses = useCallback(async () => {
        const {
            data: expensesData,
            error: expensesError,
        } = await supabase
            .from("expenses")
            .select("*")
            .eq("home_id", houseId)
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
    }, [houseId]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

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
                        expensesState.expenses
                    }
                    onSelectExpense={
                        handleSelectExpense
                    }
                    selectedExpenseId={
                        expensesState.selectedExpenseId
                    }
                />

                {content}

            </main>
        </div>
    );
}