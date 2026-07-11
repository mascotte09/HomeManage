import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiEye,
  FiCalendar,
  FiPhone,
  FiHome,
  FiSave,
} from "react-icons/fi";
import Input from "../InputVal.jsx";

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

export default function BrokerInvoices({ homeId: homeIdProp, homeName: homeNameProp }) {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [home, setHome] = useState(null);
  const [room, setRoom] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [view, setView] = useState("list");
  const [selectedRental, setSelectedRental] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      if (homeIdProp) {
        const { data: homeData, error: homeError } = await supabase
          .from("homes")
          .select("*")
          .eq("id", homeIdProp)
          .single();

        if (!homeError) {
          setHome(homeData);
        }

        const { data: rentalData, error: rentalError } = await supabase
          .from("room_rentals")
          .select("*")
          .eq("home_id", homeIdProp)
          .order("move_in_date", { ascending: false });

        if (!rentalError) {
          setRentals(rentalData || []);
        }
        return;
      }

      if (!roomId) return;

      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomError || !roomData) {
        console.error(roomError?.message);
        return;
      }

      setRoom(roomData);

      const { data: homeData, error: homeError } = await supabase
        .from("homes")
        .select("*")
        .eq("id", roomData.home_id)
        .single();

      if (!homeError) {
        setHome(homeData);
      }

      const { data: rentalData, error: rentalError } = await supabase
        .from("room_rentals")
        .select("*")
        .eq("room_id", roomId)
        .order("move_in_date", { ascending: false });

      if (!rentalError) {
        setRentals(rentalData || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [homeIdProp, roomId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleBack() {
    navigate(`/broker/rooms/${room?.home_id || homeIdProp || ""}`);
  }

  function openCreatePage() {
    const defaultRent =
      home?.property_type === "whole_house"
        ? home?.monthly_rent
        : room?.monthly_rent;
    setSelectedRental(null);
    setView("form");
    setForm({
      ...emptyForm,
      broker_fee: defaultRent ?? "",
      monthly_rent: defaultRent ?? "",
    });
  }

  function openEditPage(rental) {
    setSelectedRental(rental);
    setView("form");
    setForm({
      renter_name: rental.renter_name || "",
      renter_phone: rental.renter_phone || "",
      move_in_date: rental.move_in_date || "",
      move_out_date: rental.move_out_date || "",
      monthly_rent: rental.monthly_rent ?? "",
      deposit: rental.deposit ?? "",
      broker_fee: rental.broker_fee ?? "",
      broker_fee_paid: rental.broker_fee_paid,
      broker_fee_paid_at: rental.broker_fee_paid_at?.slice(0, 10) || "",
      note: rental.note || "",
    });
  }

  function closePage() {
    setView("list");
    setSelectedRental(null);
    setForm(emptyForm);
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      // Tiền môi giới mặc định = tiền thuê
      if (name === "monthly_rent") {
        next.broker_fee = value;
        next.monthly_rent = value;
      }

      return next;
    });
  }

  async function handleSubmit(event) {
    if (event?.preventDefault) event.preventDefault();

    if (!roomId && !homeIdProp) return;

    setSaving(true);

    try {
      const payload = {
        home_id: home?.id || homeIdProp || room?.home_id,
        room_id: roomId || null,
        renter_name: form.renter_name.trim(),
        renter_phone: form.renter_phone.trim(),
        move_in_date: form.move_in_date || null,
        move_out_date: form.move_out_date || null,
        monthly_rent: Number(form.monthly_rent) || 0,
        deposit: Number(form.deposit) || 0,
        broker_fee: Number(form.broker_fee) || 0,
        broker_fee_paid: form.broker_fee_paid,
        broker_fee_paid_at: form.broker_fee_paid_at || null,
        note: form.note.trim(),
      };

      const { error } = selectedRental?.id
        ? await supabase.from("room_rentals").update(payload).eq("id", selectedRental.id)
        : await supabase.from("room_rentals").insert([payload]);

      if (!selectedRental?.id) {
        if (home.property_type === "whole_house") {
          await supabase
            .from("homes")
            .update({ status: true })
            .eq("id", home?.id);
        } else {
          // cập nhật phòng
          await supabase
            .from("rooms")
            .update({ status: true })
            .eq("id", room.id);
        }
      }
      if (error) throw error;

      await fetchData();
      closePage();
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

  if (view === "form") {
    return (
      <div className="flex-1 bg-stone-50 flex flex-col min-h-0">
        <div className="bg-white border-b border-stone-200 px-3 py-2 flex items-center justify-between gap-2 sticky top-0 z-10">
          <button
            type="button"
            onClick={closePage}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 transition"
          >
            <FiArrowLeft size={17} />
          </button>

          <div className="flex-1 text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              {selectedRental ? "Cập nhật chốt thuê" : "Chốt thuê mới"}
            </p>
            <h2 className="text-sm font-semibold text-stone-800 truncate">
              {homeIdProp ? `Nhà ${homeNameProp || home?.name || "..."}` : `Phòng ${room?.room_name || "..."}`}
            </h2>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={closePage}
              className="h-9 px-4 rounded-full border border-stone-300 text-sm font-medium text-stone-600 hover:bg-stone-50 transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className={`h-9 px-4 flex items-center gap-1.5 rounded-full text-white text-sm font-medium transition ${saving ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"}`}
            >
              <FiSave size={15} />
              {saving ? "Đang lưu..." : selectedRental ? "Cập nhật" : "Lưu"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-8">
          <Section title="Thông tin khách">
            <div className="grid grid-cols-2 gap-3">
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
            {/* Ngày nhận + Ngày trả */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Ngày ở"
                type="date"
                value={form.move_in_date}
                onChange={(e) =>
                  handleFieldChange({
                    target: {
                      name: "move_in_date",
                      value: e.target.value,
                    },
                  })
                }
              />

              <Input
                label="Ngày trả"
                type="date"
                value={form.move_out_date}
                onChange={(e) =>
                  handleFieldChange({
                    target: {
                      name: "move_out_date",
                      value: e.target.value,
                    },
                  })
                }
              />
            </div>

            {/* Giá chốt thuê */}
            <div className="mt-3">
              <Input
                label="Giá chốt thuê"
                type="text"
                value={Number(form.monthly_rent || 0).toLocaleString("vi-VN")}
                onChange={(e) =>
                  handleFieldChange({
                    target: {
                      name: "monthly_rent",
                      value: e.target.value.replace(/\D/g, ""),
                    },
                  })
                }
              />
            </div>
          </Section>
          <Section title="Môi giới">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="flex items-center justify-between py-1">
                <span className="text-sm font-medium text-stone-700">
                  Thanh toán phí
                </span>

                <button
                  type="button"
                  onClick={() => {
                    const paid = !form.broker_fee_paid;

                    handleFieldChange({
                      target: {
                        name: "broker_fee_paid",
                        value: paid,
                      },
                    });

                    handleFieldChange({
                      target: {
                        name: "broker_fee_paid_at",
                        value: paid
                          ? new Date().toISOString().slice(0, 10)
                          : "",
                      },
                    });
                  }}
                  className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition
                            ${form.broker_fee_paid
                      ? "bg-emerald-600"
                      : "bg-stone-300"
                    }
                          `}
                  aria-label="Toggle trạng thái thanh toán"
                >
                  <span
                    className={`
                              inline-block h-4 w-4 rounded-full bg-white shadow transition-transform
                              ${form.broker_fee_paid
                        ? "translate-x-6"
                        : "translate-x-1"
                      }
                            `}
                  />
                </button>

                <span
                  className={`text-xs font-medium ${form.broker_fee_paid
                    ? "text-emerald-600"
                    : "text-amber-600"
                    }`}
                >
                  {form.broker_fee_paid
                    ? "Đã thanh toán"
                    : "Chưa thanh toán"}
                </span>
              </div>

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

              {form.broker_fee_paid && (<Input
                label="Ngày thanh toán"
                type="date"
                name="broker_fee_paid_at"
                value={form.broker_fee_paid_at || ""}
                onChange={(e) =>
                  handleFieldChange({
                    target: {
                      name: "broker_fee_paid_at",
                      value: e.target.value,
                    },
                  })
                }
              />)}

            </div>
          </Section>
          <Section title="Ghi chú">
            <textarea
              name="note"
              value={form.note}
              onChange={handleFieldChange}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 min-h-[96px] focus:outline-none focus:border-stone-400 transition"
              placeholder="Ghi chú thêm..."
            />
          </Section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {!homeIdProp && (
              <button
                onClick={handleBack}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 transition"
              >
                <FiArrowLeft size={17} />
              </button>
            )}
            <div>
              <h1 className="text-base font-bold text-stone-800 tracking-tight">
                Lịch sử chốt thuê
              </h1>
              <p className="text-sm text-stone-500">
                {homeIdProp ? `Nhà ${homeNameProp || home?.name || "..."}` : `Phòng ${room?.room_name || "..."}`}
              </p>
            </div>
          </div>

          <button
            onClick={openCreatePage}
            className="flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-sm font-semibold shadow-sm transition active:scale-95"
            title="Chốt thuê mới"
          >
            <FiPlus size={16} />
            <span>Chốt thuê</span>
          </button>
        </div>

        {rentals.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl mx-auto mb-4">
              📋
            </div>
            <p className="text-stone-600 font-medium mb-1">Chưa có lịch sử chốt thuê</p>
            <p className="text-sm text-stone-400">
              {homeIdProp ? "Nhà này chưa có bản ghi chốt thuê nào." : "Bấm \"Chốt thuê\" để thêm khách thuê đầu tiên"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rentals.map((rental) => {
              const isActive = !rental.move_out_date;

              return (
                <div
                  key={rental.id}
                  className={`bg-white border rounded-2xl p-4 shadow-sm border-l-4 ${isActive ? "border-l-blue-600 border-stone-200" : "border-l-stone-300 border-stone-200"
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-stone-800">
                          {rental.renter_name || "Khách chưa cập nhật"}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${rental.broker_fee_paid
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                            }`}
                        >
                          {rental.broker_fee_paid
                            ? "Đã nhận phí"
                            : "Chưa nhận phí"}
                        </span>
                      </div>

                      <div className="mt-2.5 space-y-1.5 text-sm text-stone-600">
                        <div className="flex items-center gap-2">
                          <FiCalendar size={14} className="text-stone-400 flex-shrink-0" />
                          <span>Ngày ở: {formatDate(rental.move_in_date)}</span>
                        </div>
                        {rental.move_out_date && (
                          <div className="flex items-center gap-2">
                            <FiCalendar size={14} className="text-stone-400 flex-shrink-0" />
                            <span>Ngày trả: {formatDate(rental.move_out_date)}</span>
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
                            Phí:{" "}
                            <span className="font-mono tabular-nums font-medium text-stone-700">
                              {formatMoney(rental.broker_fee)} đ
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEditPage(rental)}
                        className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center hover:bg-blue-100 transition"
                        title="Xem"
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(rental.id)}
                        className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition"
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
