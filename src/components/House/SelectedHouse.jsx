import { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiSave, FiGrid } from "react-icons/fi";
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
      <div className="px-4 pb-4 space-y-3">
        {children}
      </div>
    </div>
  );
}


// ─── Main component ─────────────────────────────────────────────────────────
export default function SelectedHouse({
  userID,
  house,
  onBack,
  refreshHouses,
}) {
  const navigate = useNavigate();
  const isNew = !house;

  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [bankID, setBankID] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [electricityPrice, setElectricityPrice] = useState(3500);
  const [waterPrice, setWaterPrice] = useState(100000);
  const [isWaterPerPerson, setIsWaterPerPerson] = useState(false);

  // Load house data into state
  useEffect(() => {
    setName(house?.name || "");
    setAddress(house?.address || "");
    setBankID(house?.bank_id || "");
    setBankAccount(house?.bank_account || "");
    setElectricityPrice(house?.electricity_price || 3500);
    setWaterPrice(house?.water_price || 100000);
    setIsWaterPerPerson(house?.is_water_per_person || false);
  }, [house]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function parseCurrency(str) {
    return Number(str.replace(/\./g, "").replace(/\D/g, ""));
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (saving) return;

    if (!name.trim()) {
      alert("Vui lòng nhập tên nhà trọ");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        userID,
        name: name.trim(),
        address: address.trim(),
        bank_id: bankID.trim(),
        bank_account: bankAccount.trim(),
        electricity_price: electricityPrice,
        water_price: waterPrice,
        is_water_per_person: isWaterPerPerson,
      };

      if (isNew) {
        const { error } = await supabase.from("homes").insert([payload]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("homes")
          .update(payload)
          .eq("id", house.id);
        if (error) throw error;
      }

      await refreshHouses();
      onBack();
    } catch (err) {
      console.error(err);
      alert(isNew ? "Không thể tạo nhà trọ" : "Không thể cập nhật nhà trọ");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleConfirmDelete() {
    if (!house?.id) return;

    const { error } = await supabase
      .from("homes")
      .delete()
      .eq("id", house.id);

    if (error) {
      console.error(error.message);
      alert("Không thể xóa nhà trọ");
      return;
    }

    await refreshHouses();
    setShowDeleteModal(false);
    onBack();
  }
const initialRef = useRef(null);

useEffect(() => {
  const init = {
    name: house?.name || "",
    address: house?.address || "",
    bankID: house?.bank_id || "",
    bankAccount: house?.bank_account || "",
    electricityPrice: house?.electricity_price || 3500,
    waterPrice: house?.water_price || 100000,
    isWaterPerPerson: house?.is_water_per_person || false,
  };

  setName(init.name);
  setAddress(init.address);
  setBankID(init.bankID);
  setBankAccount(init.bankAccount);
  setElectricityPrice(init.electricityPrice);
  setWaterPrice(init.waterPrice);
  setIsWaterPerPerson(init.isWaterPerPerson);

  initialRef.current = init;
}, [house]);

const isDirty = () => {
  const init = initialRef.current;
  if (!init) return false;

  return (
    name !== init.name ||
    address !== init.address ||
    bankID !== init.bankID ||
    bankAccount !== init.bankAccount ||
    electricityPrice !== init.electricityPrice ||
    waterPrice !== init.waterPrice ||
    isWaterPerPerson !== init.isWaterPerPerson
  );
};

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen bg-stone-50 pb-6">

        {/* ── Top bar ── */}
        <div className="bg-white border-b border-stone-200 px-3 py-2 flex items-center justify-between gap-2 sticky top-0 z-10">

          {/* Back */}
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 transition text-stone-600 flex-shrink-0"
            aria-label="Quay lại"
          >
            <FiArrowLeft size={20} />
          </button>

          {/* Title */}
          <p className="flex-1 font-semibold text-stone-800 text-sm truncate">
            {isNew ? "Tạo nhà trọ mới" : name || "Chi tiết nhà trọ"}
          </p>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">

            {/* Manage rooms (edit mode only) */}
            {!isNew && (
              <button
                onClick={() => navigate(`/rooms/${house.id}`)}
                className="h-9 px-3 flex items-center gap-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition text-sm font-medium"
              >
                <FiGrid size={15} />
                <span>Phòng</span>
              </button>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving || (!isNew && !isDirty())}
              className={`
    h-9 px-4 flex items-center gap-1.5 rounded-full text-white text-sm font-medium transition
    ${saving || (!isNew && !isDirty())
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-95"}
  `}
            >
              <FiSave size={15} />
              <span>{saving ? "Đang lưu..." : "Lưu"}</span>
            </button>

          </div>
        </div>

        {/* ── Form body ── */}
        <div className="p-4">

          <Section title="Thông tin cơ bản">
            <Input
              label="Tên nhà trọ"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Địa chỉ"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Section>

          <Section title="Giá dịch vụ">
            <Input
              label="Giá điện (đ/kWh)"
              type="text"
              value={electricityPrice.toLocaleString("vi-VN")}
              onChange={(e) => setElectricityPrice(parseCurrency(e.target.value))}
            />

            {/* Water type */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 block mb-2">
                Cách tính nước
              </label>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!isWaterPerPerson}
                    onChange={() => setIsWaterPerPerson(false)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-stone-700">Theo khối</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={isWaterPerPerson}
                    onChange={() => setIsWaterPerPerson(true)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-stone-700">Theo người</span>
                </label>
              </div>
            </div>

            <Input
              label={isWaterPerPerson ? "Giá nước (đ/người)" : "Giá nước (đ/khối)"}
              type="text"
              value={waterPrice.toLocaleString("vi-VN")}
              onChange={(e) => setWaterPrice(parseCurrency(e.target.value))}
            />
          </Section>

          <Section title="Thông tin thanh toán">
            <Input
              label="Ngân hàng"
              type="text"
              value={bankID}
              onChange={(e) => setBankID(e.target.value)}
            />
            <Input
              label="Số tài khoản"
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
            />
          </Section>

        </div>
      </div>

      <DeleteModal
        open={showDeleteModal}
        title="Xóa nhà trọ"
        message={`Bạn có chắc muốn xóa "${name}"? Thao tác này không thể hoàn tác.`}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
