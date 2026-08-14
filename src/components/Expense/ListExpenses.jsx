import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  FiPlus,
  FiTrash2,
  FiChevronDown,
} from "react-icons/fi";

import { supabase } from "../../supabase";
import { expensesRepository } from "../../db/expenseRepository.js";

import NoExpenseSelected from "./NoExpenseSelected.jsx";
import ExpenseItem from "./ExpenseItem.jsx";
import DeleteModal from "../DeleteModal.jsx";


// ─────────────────────────────────────────────
// Expense card
// ─────────────────────────────────────────────

function ExpenseCard({
  expense,
  onSelect,
  onDelete,
}) {

  function formatDate(dateString) {

    if (!dateString) {
      return "";
    }

    return new Date(
      dateString
    ).toLocaleDateString("vi-VN");
  }


  return (

    <button
      onClick={() =>
        onSelect(expense.id)
      }
      className="
        w-full
        text-left
        p-3
        rounded-2xl
        border
        border-stone-200
        bg-white
        hover:border-stone-300
        transition
        active:scale-[0.98]
      "
    >

      <div className="
        flex
        items-start
        justify-between
        gap-2
      ">

        <div className="
          flex-1
          min-w-0
        ">

          <p className="
            font-semibold
            text-stone-800
            truncate
          ">
            {expense.type_name || "Chi phí"}
          </p>


          {expense.notes && (

            <p className="
              text-sm
              text-stone-500
              mt-0.5
              truncate
            ">
              {expense.notes}
            </p>

          )}


          <div className="
            flex
            items-center
            gap-2
            mt-2
          ">

            <span className="
              px-2.5
              py-1
              rounded-full
              bg-red-100
              text-red-600
              text-xs
              font-medium
            ">
              -
              {Number(
                expense.expense || 0
              ).toLocaleString("vi-VN")}
              {" "}đ
            </span>


            <span className="
              text-xs
              text-stone-400
            ">
              {formatDate(
                expense.expense_date
              )}
            </span>

          </div>

        </div>


        <span
          onClick={(e) => {

            e.stopPropagation();

            onDelete(expense);

          }}
          className="
            w-9
            h-9
            flex
            items-center
            justify-center
            rounded-full
            text-red-400
            hover:text-red-600
            hover:bg-red-50
            transition
            flex-shrink-0
          "
        >
          <FiTrash2 size={17} />
        </span>

      </div>

    </button>

  );
}


// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

export default function ListExpenses() {

  const { houseId } =
    useParams();


  const now =
    new Date();


  const [selectedMonth, setSelectedMonth] =
    useState(
      `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`
    );


  const [expenses, setExpenses] =
    useState([]);


  const [expenseTypes, setExpenseTypes] =
    useState([]);


  const [view, setView] =
    useState("list");


  const [selectedExpenseId, setSelectedExpenseId] =
    useState(null);


  const [deleteModalOpen, setDeleteModalOpen] =
    useState(false);


  const [expenseToDelete, setExpenseToDelete] =
    useState(null);


  // ═══════════════════════════════════════════
  // LOAD EXPENSE TYPES
  //
  // Hiện tại expenses_type vẫn lấy từ
  // Supabase vì chưa có local repository.
  // ═══════════════════════════════════════════

  useEffect(() => {

    let cancelled = false;


    async function loadExpenseTypes() {

      try {

        const {
          data,
          error,
        } = await supabase
          .from("expenses_type")
          .select("*")
          .order(
            "type_name"
          );


        if (error) {

          console.error(
            "Không thể tải loại chi phí:",
            error
          );

          return;
        }


        if (!cancelled) {

          setExpenseTypes(
            data || []
          );

        }

      } catch (error) {

        console.error(
          "Lỗi tải loại chi phí:",
          error
        );

      }

    }


    loadExpenseTypes();


    return () => {

      cancelled = true;

    };

  }, []);


  // ═══════════════════════════════════════════
  // MAP TYPE NAME
  // ═══════════════════════════════════════════

  const addExpenseTypeName = useCallback(
    (items) => {

      return items.map(
        (expense) => {

          const type =
            expenseTypes.find(
              (item) =>
                item.type_code ===
                expense.type_code
            );


          return {

            ...expense,

            type_name:
              type?.type_name ||
              "Chi phí",

          };

        }
      );

    },
    [expenseTypes]
  );


  // ═══════════════════════════════════════════
  // FETCH LOCAL EXPENSES
  // ═══════════════════════════════════════════

  const fetchExpenses =
    useCallback(
      async () => {

        if (!houseId) {

          setExpenses([]);

          return;

        }


        try {

          console.log(
            "📥 LOAD EXPENSES LOCAL:",
            {
              homeId: houseId,
              month: selectedMonth,
            }
          );


          const [
            year,
            month,
          ] =
            selectedMonth.split("-");


          const localExpenses =
            await expensesRepository.getByMonth(
              houseId,
              Number(year),
              Number(month)
            );


          const result =
            addExpenseTypeName(
              localExpenses || []
            );


          setExpenses(
            result
          );


          console.log(
            `✅ LOCAL EXPENSES: ${result.length}`
          );

        } catch (error) {

          console.error(
            "❌ Không thể tải chi phí local:",
            error
          );

          setExpenses([]);

        }

      },
      [
        houseId,
        selectedMonth,
        addExpenseTypeName,
      ]
    );


  // ═══════════════════════════════════════════
  // LOAD WHEN DATA / MONTH CHANGES
  // ═══════════════════════════════════════════

  useEffect(() => {

    fetchExpenses();

  }, [
    fetchExpenses,
  ]);


  // ═══════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════

  const selectedExpense =
    expenses.find(
      (expense) =>
        expense.id ===
        selectedExpenseId
    ) || null;


  const goToList =
    useCallback(
      () => {

        setView("list");

        setSelectedExpenseId(
          null
        );

      },
      []
    );


  const goToCreate =
    useCallback(
      () => {

        setView("create");

        setSelectedExpenseId(
          null
        );

      },
      []
    );


  const goToDetail =
    useCallback(
      (id) => {

        setView("detail");

        setSelectedExpenseId(
          id
        );

      },
      []
    );


  // ═══════════════════════════════════════════
  // DELETE MODAL
  // ═══════════════════════════════════════════

  const openDeleteModal =
    useCallback(
      (expense) => {

        setExpenseToDelete(
          expense
        );

        setDeleteModalOpen(
          true
        );

      },
      []
    );


  const closeDeleteModal =
    useCallback(
      () => {

        setDeleteModalOpen(
          false
        );

        setExpenseToDelete(
          null
        );

      },
      []
    );


  // ═══════════════════════════════════════════
  // DELETE LOCAL
  //
  // Repository sẽ:
  //
  // 1. Xóa khỏi IndexedDB
  // 2. Tạo sync_queue DELETE
  // 3. syncService sau đó sẽ UPDATE
  //    Supabase retired = true
  // ═══════════════════════════════════════════

  const handleConfirmDelete =
    useCallback(
      async () => {

        if (
          !expenseToDelete?.id
        ) {

          return;

        }


        try {

          console.log(
            "🗑️ RETIRE EXPENSE LOCAL:",
            expenseToDelete.id
          );


          await expensesRepository.retire(
            expenseToDelete.id
          );


          // Xóa ngay khỏi UI

          setExpenses(
            (prev) =>
              prev.filter(
                (expense) =>
                  expense.id !==
                  expenseToDelete.id
              )
          );


          setSelectedExpenseId(
            (prev) =>
              prev ===
              expenseToDelete.id
                ? null
                : prev
          );


          closeDeleteModal();


          console.log(
            "✅ Đã xóa expense local + tạo sync queue"
          );

        } catch (error) {

          console.error(
            "❌ Không thể xóa chi phí:",
            error
          );

          alert(
            "Không thể xóa chi phí"
          );

        }

      },
      [
        expenseToDelete,
        closeDeleteModal,
      ]
    );


  // ═══════════════════════════════════════════
  // TOTAL
  // ═══════════════════════════════════════════

  const totalExpense =
    expenses.reduce(
      (sum, expense) =>
        sum +
        Number(
          expense.expense || 0
        ),
      0
    );


  const isCreateView =
    view === "create";


  const isDetailView =
    view === "detail";


  // ═══════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════

  if (isCreateView) {

    return (

      <ExpenseItem
        expenseItem={null}
        home_id={houseId}
        onBack={goToList}
        refreshExpenses={
          fetchExpenses
        }
      />

    );

  }


  // ═══════════════════════════════════════════
  // DETAIL
  // ═══════════════════════════════════════════

  if (
    isDetailView &&
    selectedExpense
  ) {

    return (

      <ExpenseItem
        expenseItem={
          selectedExpense
        }
        home_id={houseId}
        onBack={goToList}
        refreshExpenses={
          fetchExpenses
        }
      />

    );

  }


  // ═══════════════════════════════════════════
  // LIST
  // ═══════════════════════════════════════════

  return (

    <div className="
      min-h-screen
      bg-stone-50
    ">

      <div className="
        p-4
        pb-24
      ">


        {/* ═══════════════════════════════
            HEADER
        ═══════════════════════════════ */}

        <div className="
          flex
          items-center
          justify-between
          mb-4
          gap-3
        ">

          <h2 className="
            text-lg
            font-bold
            text-stone-800
          ">
            Chi Phí
          </h2>


          <div className="
            relative
          ">

            <select
              value={
                selectedMonth
              }
              onChange={(e) =>
                setSelectedMonth(
                  e.target.value
                )
              }
              className="
                appearance-none
                pl-3
                pr-8
                py-1.5
                rounded-full
                border
                border-stone-200
                bg-white
                text-sm
                font-medium
                text-stone-700
              "
            >

              {Array.from(
                {
                  length: 24,
                },
                (_, i) => {

                  const date =
                    new Date();

                  date.setMonth(
                    date.getMonth() -
                    12 +
                    i
                  );


                  const year =
                    date.getFullYear();


                  const month =
                    String(
                      date.getMonth() +
                      1
                    ).padStart(
                      2,
                      "0"
                    );


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

                }
              )}

            </select>


            <FiChevronDown
              size={14}
              className="
                absolute
                right-2.5
                top-1/2
                -translate-y-1/2
                text-stone-400
                pointer-events-none
              "
            />

          </div>

        </div>


        {/* ═══════════════════════════════
            SUMMARY
        ═══════════════════════════════ */}

        {expenses.length > 0 && (

          <div className="
            bg-white
            rounded-2xl
            border
            border-stone-200
            p-3
            mb-4
          ">

            <p className="
              text-xs
              text-stone-400
              mb-1
            ">

              Tổng chi phí tháng{" "}

              {
                selectedMonth.split(
                  "-"
                )[1]
              }

              /

              {
                selectedMonth.split(
                  "-"
                )[0]
              }

            </p>


            <p className="
              text-xl
              font-bold
              text-red-600
            ">

              {totalExpense.toLocaleString(
                "vi-VN"
              )}{" "}
              đ

            </p>

          </div>

        )}


        {/* ═══════════════════════════════
            LIST
        ═══════════════════════════════ */}

        {expenses.length === 0 ? (

          <NoExpenseSelected
            onStartAddExpense={
              goToCreate
            }
          />

        ) : (

          <div className="
            space-y-3
          ">

            {expenses.map(
              (expense) => (

                <ExpenseCard
                  key={
                    expense.id
                  }
                  expense={
                    expense
                  }
                  onSelect={
                    goToDetail
                  }
                  onDelete={
                    openDeleteModal
                  }
                />

              )
            )}

          </div>

        )}

      </div>


      {/* ═══════════════════════════════
          FAB
      ═══════════════════════════════ */}

      <button
        onClick={
          goToCreate
        }
        className="
          fixed
          bottom-3
          right-5
          w-14
          h-14
          rounded-full
          bg-blue-600
          text-white
          shadow-lg
          flex
          items-center
          justify-center
          hover:bg-blue-700
          active:scale-95
          transition
        "
        aria-label="Thêm chi phí mới"
      >

        <FiPlus size={26} />

      </button>


      {/* ═══════════════════════════════
          DELETE MODAL
      ═══════════════════════════════ */}

      <DeleteModal
        open={
          deleteModalOpen
        }
        title="Xóa chi phí"
        message={`
          Bạn có chắc muốn xóa chi phí
          "${expenseToDelete?.type_name || ""}"?
        `}
        onClose={
          closeDeleteModal
        }
        onConfirm={
          handleConfirmDelete
        }
      />

    </div>

  );
}