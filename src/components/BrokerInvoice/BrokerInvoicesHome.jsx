import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiEye,
  FiUser,
  FiCalendar,
  FiPhone,
  FiHome,
  FiSave,
} from "react-icons/fi";
import Input from "../InputVal.jsx";

function Section({ title, children }) {
  return (
    <div className="bg-white first:pt-0">
      <div className="pt-4 pb-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          {title}
        </p>
      </div>
      <div className="pb-1 space-y-3">{children}</div>
    </div>
  );
}

const emptyForm = {
  renter_name: "",
  renter_phone: "",
  move_in_date: new Date().toISOString().slice(0, 10),
  move_out_date: "",
  monthly_rent: "",
  deposit: "",
  broker_fee: "",
  note: "",
};

// ─── Lịch sử chốt thuê cho NHÀ NGUYÊN CĂN (không chia phòng) ──────────────────
// Ghi chú: dùng chung bảng `room_rentals` với case Phòng, nhưng lọc theo
// home_id trực tiếp (room_id để null) vì nhà nguyên căn không có bản ghi
// trong bảng `rooms`. Nếu schema thực tế khác (vd: có 1 room đại diện cho
// cả nhà), chỉ cần sửa lại phần fetch/payload bên dưới.
export default function BrokerInvoicesHome() {
  const { homeId } = useParams();
  const navigate = useNavigate();

  const [home, setHome] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [view, setView] = useState("list"); // "list" | "form"
  const [formMode, setFormMode] = useState("create");
  const [selectedRental, setSelectedRental] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!homeId) return;

    try {
      const { data: homeData, error: homeError } = await supabase
        .from("homes")
        .select("*")
        .eq("id", homeId)
        .single();

      if (homeError || !homeData) {
        console.error(homeError?.message);
        return;
      }

      setHome(homeData);

      const { data: rentalData, error: rentalError } = await supabase
        .from("room_rentals")
        .select("*")
        .eq("home_id", homeId)
        .is("room_id", null)
        .order("move_in_date", { ascending: false });

      if (!rentalError) {
        setRentals(rentalData || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [homeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleBack() {
    navigate(`/broker/homes`);
  }

  function openCreateForm() {
    setSelectedRental(null);
    setFormMode("create");
    setForm({
      ...emptyForm,
      broker_fee: home?.monthly_rent ?? "",
    });
    setView("form");
  }

  function openViewForm(rental) {
    setSelectedRental(rental);
    setFormMode("edit");
    setForm({
      renter_name: rental.renter_name || "",
      renter_phone: rental.renter_phone || "",
      move_in_date: rental.move_in_date || "",
      move_out_date: rental.move_out_date || "",
      monthly_rent: rental.monthly_rent ?? "",
      deposit: rental.deposit ?? "",
      broker_fee: rental.broker_fee ?? "",
      note: rental.note || "",
    });
    setView("form");
  }

  function closeForm() {
    setView("list");
    setSelectedRental(null);
    setFormMode("create");
    setForm(emptyForm);
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };

      // Tiền môi giới mặc định = tiền thuê
      if (name === "monthly_rent") {
        next.broker_fee = value;
      }

      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!homeId) return;

    setSaving(true);

    try {
      const payload = {
        home_id: homeId,
        room_id: null,
        renter_name: form.renter_name.trim(),
        renter_phone: form.renter_phone.trim(),
        move_in_date: form.move_in_date || null,
        move_out_date: form.move_out_date || null,
        monthly_rent: Number(form.monthly_rent) || 0,
        deposit: Number(form.deposit) || 0,
        broker_fee: Number(form.broker_fee) || 0,
        note: form.note.trim(),
      };

      const { error } = selectedRental?.id
        ? await supabase.from("room_rentals").update(payload).eq("id", selectedRental.id)
        : await supabase.from("room_rentals").insert([payload]);

      if (error) throw error;

      await fetchData();
      closeForm();
    } catch (err) {
      console.error(err);
      const message = err?.code === "42501" || /row-level security/i.test(err?.message || "")
        ? "Không thể lưu vì bảng room_rentals đang bị chặn bởi RLS. Hãy chạy migration Supabase để cấp quyền cho người dùng đã đăng nhập."
        : "Không thể lưu lịch sử chốt thuê";
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(rentalId) {
    const ok = window.confirm("Bạn có chắc muốn xóa chốt thuê này?");
    if (!ok) return;

    const { error } = await supabase.from("room_rentals").delete().eq("id", rentalId);

    if (error) {
      const message = error?.code === "42501" || /row-level security/i.test(error?.message || "")
        ? "Không thể xóa vì bảng room_rentals đang bị chặn bởi RLS. Hãy chạy migration Supabase để cấp quyền cho người dùng đã đăng nhập."
        : "Không thể xóa chốt thuê";
      alert(message);
      return;
    }

    setRentals((prev) => prev.filter((item) => item.id !== rentalId));
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN");
  }

  function formatMoney(value) {
    return Number(value || 0).toLocaleString("vi-VN");
  }

  // ── FORM PAGE (styled like BrokerInvoiceRecord) ─────────────────────────────
  if (view === "form") {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        <div className="bg-white/90 backdrop-blur border-b border-stone-200 px-3 py-2.5 flex items-center gap-2 sticky top-0 z-10">
          <button
            onClick={closeForm}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-600 transition flex-shrink-0"
            aria-label="Quay lại"
          >
            <FiArrowLeft size={20} />
          </button>
          <p className="font-semibold text-stone-800 text-sm truncate">
            {formMode === "create" ? "Chốt thuê mới" : "Chi tiết chốt thuê"} · Nhà {home?.home_name}
          </p>
        </div>

        <div className="flex-1 p-4">
          <div className="w-full max-w-lg mx-auto">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">

              <div className="px-5 pt-5 pb-4 border-b border-stone-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#146356] mb-1">
                  {formMode === "create" ? "Chốt thuê mới" : "Cập nhật chốt thuê"}
                </p>
                <h2 className="text-xl font-bold text-stone-800 tracking-tight">
                  Nhà nguyên căn {home?.home_name}
                </h2>
                {home?.address && (
                  <p className="text-sm text-stone-400 mt-0.5">{home.address}</p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
                <Section title="Thông tin khách">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      label="Tên khách"
                      type="text"
                      value={form.renter_name}
                      onChange={(e) => handleFieldChange({ target: { name: "renter_name", value: e.target.value } })}
                    />
                    <Input
                      label="Số điện thoại"
                      type="text"
                      value={form.renter_phone}
                      onChange={(e) => handleFieldChange({ target: { name: "renter_phone", value: e.target.value } })}
                    />
                  </div>
                </Section>

                <Section title="Thời gian & giá">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      label="Ngày nhận nhà"
                      type="date"
                      value={form.move_in_date}
                      onChange={(e) => handleFieldChange({ target: { name: "move_in_date", value: e.target.value } })}
                    />
                    <Input
                      label="Ngày trả nhà"
                      type="date"
                      value={form.move_out_date}
                      onChange={(e) => handleFieldChange({ target: { name: "move_out_date", value: e.target.value } })}
                    />
                    <Input
                      label="Tiền môi giới"
                      type="text"
                      value={Number(form.broker_fee || 0).toLocaleString("vi-VN")}
                      onChange={(e) =>
                        handleFieldChange({
                          target: {
                            name: "broker_fee",
                            value: e.target.value.replace(/\D/g, ""),
                          },
                        })
                      }
                    />
                  </div>
                </Section>

                <Section title="Ghi chú">
                  <textarea
                    name="note"
                    value={form.note}
                    onChange={handleFieldChange}
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 min-h-[96px] focus:outline-none focus:border-[#146356] focus:ring-2 focus:ring-[#146356]/20 transition"
                    placeholder="Ghi chú thêm..."
                  />
                </Section>

                <div className="flex gap-3 mt-4 pt-4 border-t border-stone-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition active:scale-[0.98] ${saving
                      ? "bg-[#146356]/50 cursor-not-allowed"
                      : "bg-[#146356] hover:bg-[#0F4C42] shadow-sm shadow-[#146356]/20"
                      }`}
                  >
                    <FiSave size={15} />
                    {saving ? "Đang lưu..." : formMode === "create" ? "Chốt thuê" : "Cập nhật"}
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition disabled:opacity-50"
                  >
                    Đóng
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST PAGE ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 transition"
            >
              <FiArrowLeft size={17} />
            </button>
            <div>
              <h1 className="text-base font-bold text-stone-800 tracking-tight">
                Lịch sử chốt thuê
              </h1>
              <p className="text-sm text-stone-500">
                Nhà nguyên căn {home?.home_name || "..."}
              </p>
            </div>
          </div>

          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 rounded-full bg-[#146356] hover:bg-[#0F4C42] text-white px-3.5 py-2 text-sm font-semibold shadow-sm shadow-[#146356]/20 transition active:scale-95"
            title="Chốt thuê mới"
          >
            <FiPlus size={16} />
            <span>Chốt thuê</span>
          </button>
        </div>

        {rentals.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#E3F3EC] flex items-center justify-center text-2xl mx-auto mb-4">
              🏠
            </div>
            <p className="text-stone-600 font-medium mb-1">Chưa có lịch sử chốt thuê</p>
            <p className="text-sm text-stone-400">Bấm "Chốt thuê" để thêm khách thuê đầu tiên</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rentals.map((rental) => {
              const isActive = !rental.move_out_date;

              return (
                <div
                  key={rental.id}
                  className={`bg-white border rounded-2xl p-4 shadow-sm border-l-4 ${isActive ? "border-l-[#146356] border-stone-200" : "border-l-stone-300 border-stone-200"
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-stone-800">
                          {rental.renter_name || "Khách chưa cập nhật"}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? "bg-[#E3F3EC] text-[#146356]" : "bg-stone-100 text-stone-500"
                            }`}
                        >
                          {isActive ? "Đang thuê" : "Đã trả"}
                        </span>
                      </div>

                      <div className="mt-2.5 space-y-1.5 text-sm text-stone-600">
                        <div className="flex items-center gap-2">
                          <FiCalendar size={14} className="text-stone-400 flex-shrink-0" />
                          <span>Nhận nhà: {formatDate(rental.move_in_date)}</span>
                        </div>
                        {rental.move_out_date && (
                          <div className="flex items-center gap-2">
                            <FiCalendar size={14} className="text-stone-400 flex-shrink-0" />
                            <span>Trả nhà: {formatDate(rental.move_out_date)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <FiHome size={14} className="text-stone-400 flex-shrink-0" />
                          <span>
                            Giá thuê:{" "}
                            <span className="font-mono tabular-nums font-medium text-stone-700">
                              {formatMoney(rental.monthly_rent)} đ
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiPhone size={14} className="text-stone-400 flex-shrink-0" />
                          <span>
                            Môi giới:{" "}
                            <span className="font-mono tabular-nums font-medium text-stone-700">
                              {formatMoney(rental.broker_fee)} đ
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiUser size={14} className="text-stone-400 flex-shrink-0" />
                          <span>Liên hệ: {rental.renter_phone || "—"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openViewForm(rental)}
                        className="w-9 h-9 rounded-full bg-[#E3F3EC] text-[#146356] flex items-center justify-center hover:bg-[#146356]/20 transition"
                        title="Xem"
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(rental.id)}
                        className="w-9 h-9 rounded-full bg-[#FBE9E5] text-[#B3452F] flex items-center justify-center hover:bg-[#B3452F]/20 transition"
                        title="Xóa"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
