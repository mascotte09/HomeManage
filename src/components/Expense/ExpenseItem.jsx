import { useState, useEffect } from "react";
import { supabase } from "../../supabase.js";
import Input from "../InputVal.jsx";
import DeleteModal from "../DeleteModal.jsx";
export default function ExpenseItem({
  expenseItem,
  home_id,
  onDelete,
  refreshExpenses,
}) {
  const [showDeleteModal, setShowDeleteModal] =
    useState(false);
  // Check create mode
  const isNew = !expenseItem;
  const [saving, setSaving] = useState(false);
  // States
  const [typeCode, setTypeCode] = useState("");

  const [expense, setExpense] = useState(0);

  const [expenseDate, setExpenseDate] = useState("");
  const [expenseNote, setExpenseNote] = useState("");

  const [expenseTypes, setExpenseTypes] = useState([]);
  // Load selected expense
  useEffect(() => {

    setTypeCode(
      expenseItem?.type_code || ""
    );

    setExpenseNote(
      expenseItem?.notes || ""
    );

    setExpense(
      expenseItem?.expense || 0
    );

    setExpenseDate(
      expenseItem?.expense_date
        ? expenseItem.expense_date.substring(
          0,
          10
        )
        : ""
    );

  }, [expenseItem]);

  useEffect(() => {
    async function fetchExpenseTypes() {

      const { data, error } =
        await supabase
          .from("expenses_type")
          .select("*")
          .order("type_name");

      if (error) {
        console.log(error.message);
        return;
      }

      setExpenseTypes(data || []);
    }

    fetchExpenseTypes();

  }, []);

  function resetForm() {
  setTypeCode("");
  setExpense(0);
  setExpenseDate("");
  setExpenseNote("");
}
  // Save / Update
  async function handleSave() {

    // Validation
    if (
      !typeCode ||
      !expenseDate ||
      expense <= 0
    ) {
      alert(
        "Please enter required fields"
      );
      return;
    }
    setSaving(true);
    try {
      // CREATE
      if (isNew) {

        const { error } = await supabase
          .from("expenses")
          .insert([
            {
              home_id: home_id,
              type_code: typeCode,
              expense: expense,
              expense_date: expenseDate,
              notes: expenseNote,
            },
          ]);

        if (error) {
          console.log(error.message);
          alert(
            "Failed to create expense"
          );
          return;
        }
      }

      // UPDATE
      else {

        const { error } = await supabase
          .from("expenses")
          .update({
            type_code: typeCode,
            expense: expense,
            expense_date: expenseDate,
            notes: expenseNote,
          })
          .eq("id", expenseItem.id);

        if (error) {
          console.log(error.message);
          alert(
            "Failed to update expense"
          );
          return;
        }
      }

      // Refresh list
      await refreshExpenses();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
      resetForm() ;
    }
  }
  async function handleDelete() {
    try {
      await onDelete();

      setShowDeleteModal(false);
    } catch (err) {
      console.error(err);
    }
  }
  return (
    <div className="ml-0 flex flex-col items-start w-full pr-2">

      <header className="flex flex-col items-start pb-4 mb-4 border-b border-stone-300 w-full">

        {/* Buttons */}
        <div className="flex gap-2 mb-6">

          {/* Cancel / Delete */}
          {!isNew && (
            <button
              className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-md"
              onClick={() => setShowDeleteModal(true)}
            >
              Xóa
            </button>
          )}

          {/* Save / Update */}
          <button
            onClick={handleSave}
            className={`
                text-white text-sm px-3 py-1 rounded-md
                ${saving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"}
              `}
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>

        </div>

        {/* Form */}
        <div className="flex flex-col items-start gap-3 w-full">

          <div className="flex flex-col items-start w-full">

            <label className="text-left font-bold uppercase text-stone-500">
              Loại chi phí
            </label>

            <select
              value={typeCode}
              onChange={(e) =>
                setTypeCode(e.target.value)
              }
              className="w-full p-1 border-b-2 rounded-sm border-stone-300 bg-stone-200 text-stone-600 focus:outline-none focus:border-stone-600"
            >

              <option value="">
                -- Chọn loại chi phí --
              </option>

              {expenseTypes.map((item) => (
                <option
                  key={item.type_code}
                  value={item.type_code}
                >
                  {item.type_name}
                </option>
              ))}

            </select>

          </div>
          <Input
            label="Ghi chú"
            type="textArea"
            value={expenseNote}
            onChange={(e) =>
              setExpenseNote(e.target.value)
            }
          />
          <Input
            label="Số tiền"
            type="text"
            value={expense.toLocaleString("vi-VN")}
            onChange={(e) => {

              // remove dấu chấm
              const rawValue =
                e.target.value.replace(/\./g, "");

              // chỉ giữ số
              const numberValue =
                Number(rawValue.replace(/\D/g, ""));

              setExpense(numberValue);
            }}
          />

          <Input
            label="Ngày chi"
            type="date"
            value={expenseDate}
            onChange={(e) =>
              setExpenseDate(
                e.target.value
              )
            }
          />

        </div>

      </header>
      <DeleteModal
        open={showDeleteModal}
        header="Xóa chi phí"
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </div>

  );
}