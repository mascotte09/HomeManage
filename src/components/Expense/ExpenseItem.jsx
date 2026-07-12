import { useState, useEffect } from "react";
import { supabase } from "../../supabase.js";
import { FiArrowLeft, FiSave, FiTrash2 } from "react-icons/fi";
import Input from "../InputVal.jsx";
import DeleteModal from "../DeleteModal.jsx";

// ─── Section wrapper ────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-3">
      <div className="px-4 pt-3 pb-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          {title}
        </p>
      </div>
      <div className="px-4 pb-4 space-y-3">{children}</div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function ExpenseItem({
  expenseItem,
  home_id,
  onBack,
  refreshExpenses,
}) {
  const isNew = !expenseItem;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [typeCode, setTypeCode] = useState("");
  const [expense, setExpense] = useState(0);
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [expenseNote, setExpenseNote] = useState("");
  const [expenseTypes, setExpenseTypes] = useState([]);

  // ── Load selected expense ───────────────────────────────────────────────────
  useEffect(() => {
    if (!expenseItem) {
      setTypeCode("");
      setExpense(0);
      setExpenseNote("");
      setExpenseDate(new Date().toISOString().substring(0, 10));
      return;
    }

    setTypeCode(expenseItem.type_code || "");
    setExpenseNote(expenseItem.notes || "");
    setExpense(expenseItem.expense || 0);
    setExpenseDate(
      expenseItem.expense_date
        ? expenseItem.expense_date.substring(0, 10)
        : new Date().toISOString().substring(0, 10)
    );
  }, [expenseItem]);

  // ── Load expense types ───────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("expenses_type")
      .select("*")
      .order("type_name")
      .then(({ data, error }) => {
        if (!error) setExpenseTypes(data || []);
      });
  }, []);

  function resetForm() {
    setTypeCode("");
    setExpense(0);
     setExpenseDate(new Date().toISOString().substring(0, 10));
    setExpenseNote("");
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!typeCode || !expenseDate || expense <= 0) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        home_id,
        type_code: typeCode,
        expense,
        expense_date: expenseDate,
        notes: expenseNote,
      };

      if (isNew) {
        const { error } = await supabase.from("expenses").insert([payload]);
        if (error) throw error;
        await refreshExpenses();
        resetForm();
      } else {
        const { error } = await supabase
          .from("expenses")
          .update(payload)
          .eq("id", expenseItem.id);
        if (error) throw error;
        await refreshExpenses();
        onBack();
      }
    } catch (err) {
      console.error(err);
      alert(isNew ? "Không thể tạo chi phí" : "Không thể cập nhật chi phí");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleConfirmDelete() {
    if (!expenseItem?.id) return;

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseItem.id);

    if (error) {
      console.error(error.message);
      alert("Không thể xóa chi phí");
      return;
    }

    await refreshExpenses();
    setShowDeleteModal(false);
    onBack();
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen bg-stone-50 pb-6">

        {/* ── Top bar ── */}
        <div className="bg-white border-b border-stone-200 px-3 py-2 flex items-center justify-between gap-2 sticky top-0 z-10">

          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 transition text-stone-600 flex-shrink-0"
            aria-label="Quay lại"
          >
            <FiArrowLeft size={20} />
          </button>

          <p className="flex-1 font-semibold text-stone-800 text-sm truncate">
            {isNew ? "Thêm chi phí mới" : "Chi tiết chi phí"}
          </p>

          <div className="flex gap-2 flex-shrink-0">
            {!isNew && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 text-red-500 transition"
                aria-label="Xóa chi phí"
              >
                <FiTrash2 size={16} />
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className={`
                h-9 px-4 flex items-center gap-1.5 rounded-full text-white text-sm font-medium transition
                ${saving
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-95"}
              `}
            >
              <FiSave size={15} />
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </div>

        {/* ── Form body ── */}
        <div className="p-4">

          <Section title="Thông tin chi phí">
            {/* Loại chi phí */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 block mb-1">
                Loại chi phí
              </label>
              <select
                value={typeCode}
                onChange={(e) => setTypeCode(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">-- Chọn loại chi phí --</option>
                {expenseTypes.map((item) => (
                  <option key={item.type_code} value={item.type_code}>
                    {item.type_name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Số tiền (đ)"
              type="text"
              value={expense.toLocaleString("vi-VN")}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\./g, "");
                const numberValue = Number(rawValue.replace(/\D/g, ""));
                setExpense(numberValue);
              }}
            />

            <Input
              label="Ngày chi"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />

            <Input
              label="Ghi chú"
              type="textArea"
              value={expenseNote}
              onChange={(e) => setExpenseNote(e.target.value)}
            />
          </Section>

        </div>
      </div>

      <DeleteModal
        open={showDeleteModal}
        title="Xóa chi phí"
        message="Bạn có chắc muốn xóa chi phí này? Thao tác này không thể hoàn tác."
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
