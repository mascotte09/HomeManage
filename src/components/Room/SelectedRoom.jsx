import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import {
  FiArrowLeft,
  FiSave,
  FiCamera,
} from "react-icons/fi";
import Input from "../InputVal.jsx";
import Photos from "../Photos.jsx";
import DeleteModal from "../DeleteModal.jsx";

// ─── Reusable section wrapper ────────────────────────────────────────────────
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
export default function SelectedRoom({
  homeID,
  room,
  onBack,
  refreshRooms,
}) {
  const isNew = !room;

  const [saving, setSaving] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);

  // Delete modal handles both room + invoice deletes
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [roomName, setRoomName] = useState("");
  const [roomRenter, setRoomRenter] = useState("");
  const [depositAmount, setDepositAmount] = useState(0);
  const [telephone, setTelephone] = useState("");
  const [numPerson, setNumPerson] = useState(1);
  const [datePay, setDatePay] = useState(1);
  const [currentElectricityNumber, setCurrentElectricityNumber] = useState(0);
  const [currentWaterNumber, setCurrentWaterNumber] = useState(0);
  const [rentDueDate, setRentDueDate] = useState("");
  const [status, setStatus] = useState(false);

  // ── Load room into form ────────────────────────────────────────────────────
  useEffect(() => {
    setRoomName(room?.room_name || "");
    setRoomRenter(room?.room_renter || "");
    setDepositAmount(room?.deposit_amount || 0);
    setTelephone(room?.telephone || "");
    setNumPerson(room?.num_person || 1);
    setDatePay(room?.date_pay || 1);
    setCurrentElectricityNumber(room?.current_electricity_number || 0);
    setCurrentWaterNumber(room?.current_water_number || 0);
    setStatus(room?.status || false);
    setRentDueDate(
      room?.rent_due_date ? room.rent_due_date.substring(0, 10) : ""
    );
  }, [room]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function parseCurrency(str) {
    return Number(str.replace(/\./g, "").replace(/\D/g, ""));
  }

  function resetForm() {
    setRoomName(""); setRoomRenter(""); setDepositAmount(0);
    setTelephone(""); setNumPerson(1); setDatePay(1);
    setCurrentElectricityNumber(0); setCurrentWaterNumber(0);
    setRentDueDate(""); setStatus(false);
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (saving) return;
    if (!roomName.trim()) { alert("Vui lòng nhập số phòng"); return; }
    setSaving(true);
    try {
      const payload = {
        home_id: homeID,
        room_name: roomName.trim(),
        room_renter: roomRenter.trim(),
        deposit_amount: depositAmount,
        telephone: telephone.trim(),
        num_person: numPerson,
        date_pay: datePay,
        current_electricity_number: currentElectricityNumber,
        current_water_number: currentWaterNumber,
        rent_due_date: rentDueDate || null,
        status,
      };
      if (isNew) {
        const { error } = await supabase.from("rooms").insert([payload]);
        if (error) throw error;
        await refreshRooms();
        resetForm();
      } else {
        const { error } = await supabase.from("rooms").update(payload).eq("id", room.id);
        if (error) throw error;
        await refreshRooms();
      }
    } catch (err) {
      console.error(err);
      alert(isNew ? "Không thể tạo phòng" : "Không thể cập nhật phòng");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete room / invoice ──────────────────────────────────────────────────
  async function handleConfirmDelete() {
    if (!room?.id) return;
    const { error } = await supabase.from("rooms").delete().eq("id", room.id);
    if (error) { alert("Không thể xóa phòng"); return; }
    await refreshRooms();
    onBack();

    setShowDeleteModal(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex-1 bg-stone-50 flex flex-col min-h-0">

        {/* ── Sticky top bar ── */}
        <div className="bg-white border-b border-stone-200 px-3 py-2 flex items-center justify-between gap-2 sticky top-0 z-10">
          {/* Back */}
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-600 transition flex-shrink-0"
            aria-label="Quay lại"
          >
            <FiArrowLeft size={20} />
          </button>

          {/* Title */}
          <p className="flex-1 font-semibold text-stone-800 text-sm truncate">
            {isNew ? "Thêm phòng mới" : `Phòng ${roomName}`}
          </p>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            {/* Photos */}
            {!isNew && (
              <button
                onClick={() => setShowPhotos(true)}
                className="
                  h-9 px-4
                  flex items-center gap-2
                  rounded-full
                  bg-purple-200
                  text-purple-600
                  hover:bg-purple-300
                  transition
                  active:scale-95
                "
              >
                <FiCamera size={16} />
                Hình
              </button>
            )}


            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className={`
                h-9 px-4 flex items-center gap-1.5 rounded-full text-white text-sm font-medium transition
                ${saving ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"}
              `}
            >
              <FiSave size={15} />
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto p-4 pb-8">

          <Section title="Thông tin phòng">
            {/* Status toggle */}
            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-medium text-stone-700">Tình trạng</span>
              <button
                onClick={() => setStatus((s) => !s)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition
                  ${status ? "bg-blue-600" : "bg-stone-200"}
                `}
                aria-label="Toggle trạng thái phòng"
              >
                <span
                  className={`
                    inline-block h-4 w-4 rounded-full bg-white shadow transition-transform
                    ${status ? "translate-x-6" : "translate-x-1"}
                  `}
                />
              </button>
              <span className={`text-xs font-medium ${status ? "text-green-600" : "text-stone-400"}`}>
                {status ? "Đang có người thuê" : "Phòng trống"}
              </span>
            </div>

            <Input label="Số phòng" type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} />
            <Input label="Người thuê" type="text" value={roomRenter} onChange={(e) => setRoomRenter(e.target.value)} />
            <Input label="Số điện thoại" type="text" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
            <Input label="Số người" type="number" value={numPerson} onChange={(e) => setNumPerson(Number(e.target.value))} />
          </Section>

          <Section title="Tài chính">
            <Input
              label="Tiền cọc (đ)"
              type="text"
              value={depositAmount.toLocaleString("vi-VN")}
              onChange={(e) => setDepositAmount(parseCurrency(e.target.value))}
            />
            <Input
              label="Ngày đóng tiền hàng tháng"
              type="number"
              value={datePay}
              onChange={(e) => setDatePay(Number(e.target.value))}
            />
            <Input
              label="Ngày hết hạn hợp đồng"
              type="date"
              value={rentDueDate}
              onChange={(e) => setRentDueDate(e.target.value)}
            />
          </Section>

          <Section title="Chỉ số điện nước">
            <Input
              label="Số điện hiện tại (kWh)"
              type="number"
              value={currentElectricityNumber}
              onChange={(e) => setCurrentElectricityNumber(Number(e.target.value))}
            />
            <Input
              label="Số nước hiện tại (m³)"
              type="number"
              value={currentWaterNumber}
              onChange={(e) => setCurrentWaterNumber(Number(e.target.value))}
            />
          </Section>

        </div>
      </div>

      {/* ── Photos modal ── */}
      {!isNew && showPhotos && (
        <Photos room={room} open={showPhotos} onClose={() => setShowPhotos(false)} />
      )}

      {/* ── Delete modal ── */}
      <DeleteModal
        open={showDeleteModal}
        title="Xóa phòng" 
        message={ `Bạn có chắc muốn xóa phòng "${roomName}"? Thao tác này không thể hoàn tác.`
            
        }
        onClose={() => { setShowDeleteModal(false);   }}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
