import { useEffect, useState, useCallback } from "react";
import {
  useParams,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { supabase } from "../../supabase";
import { FiArrowLeft, FiSave, FiTrash2 } from "react-icons/fi";
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
  deal_date: new Date().toISOString().slice(0, 10),
  monthly_rent: "",
  deposit: "",
  broker_fee: "",
  broker_fee_paid: false,
  broker_fee_paid_at: "",
  note: "",
};

// Trang chốt thuê độc lập — nhận rentalId qua URL:
//   /broker/rentals/new?homeId=..&roomId=..   -> tạo mới
//   /broker/rentals/:rentalId                 -> xem/sửa bản ghi có sẵn
export default function BrokerRentalForm() {
  const { rentalId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isNew = !rentalId || rentalId === "new";

  const [home, setHome] = useState(null);
  const [room, setRoom] = useState(null);
  const [rental, setRental] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (!isNew) {
        // Xem/sửa: lấy đúng bản ghi theo id, tự suy ra home/room liên quan
        const { data: rentalData, error: rentalError } = await supabase
          .from("room_rentals")
          .select("*")
          .eq("id", rentalId)
          .single();

        if (rentalError || !rentalData) {
          console.error(rentalError?.message);
          setLoading(false);
          return;
        }

        setRental(rentalData);
        setForm({
          renter_name: rentalData.renter_name || "",
          renter_phone: rentalData.renter_phone || "",
          move_in_date: rentalData.move_in_date || "",
          deal_date: rentalData.deal_date || "",
          monthly_rent: rentalData.monthly_rent ?? "",
          deposit: rentalData.deposit ?? "",
          broker_fee: rentalData.broker_fee ?? "",
          broker_fee_paid: rentalData.broker_fee_paid || false,
          broker_fee_paid_at: rentalData.broker_fee_paid_at?.slice(0, 10) || "",
          note: rentalData.note || "",
        });

        if (rentalData.room_id) {
          const { data: roomData } = await supabase
            .from("rooms")
            .select("*")
            .eq("id", rentalData.room_id)
            .single();
          setRoom(roomData || null);

          if (roomData?.home_id) {
            const { data: homeData } = await supabase
              .from("homes")
              .select("*")
              .eq("id", roomData.home_id)
              .single();
            setHome(homeData || null);
          }
        } else if (rentalData.home_id) {
          const { data: homeData } = await supabase
            .from("homes")
            .select("*")
            .eq("id", rentalData.home_id)
            .single();
          setHome(homeData || null);
        }
      } else {
        // Tạo mới: lấy home/room từ query string để set giá mặc định
        const homeIdParam = searchParams.get("homeId");
        const roomIdParam = searchParams.get("roomId");

        let homeData = null;
        let roomData = null;

        if (roomIdParam) {
          const { data } = await supabase
            .from("rooms")
            .select("*")
            .eq("id", roomIdParam)
            .single();
          roomData = data || null;
          setRoom(roomData);
        }

        const homeIdToFetch = homeIdParam || roomData?.home_id;
        if (homeIdToFetch) {
          const { data } = await supabase
            .from("homes")
            .select("*")
            .eq("id", homeIdToFetch)
            .single();
          homeData = data || null;
          setHome(homeData);
        }

        const defaultRent =
          homeData?.property_type === "whole_house"
            ? homeData?.monthly_rent
            : roomData?.monthly_rent;

        setForm({
          ...emptyForm,
          broker_fee: defaultRent ?? "",
          monthly_rent: defaultRent ?? "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isNew, rentalId, searchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleBack() {
    // Quay lại đúng trang đã điều hướng tới đây (list phòng, hoặc trang thống kê...)
    if (location.state?.from) {
      navigate(location.state.from);
    } else {
      navigate(-1);
    }
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
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

    const homeId = home?.id;
    const roomIdVal = room?.id || null;

    if (!homeId && !roomIdVal) {
      alert("Thiếu thông tin nhà/phòng để lưu chốt thuê.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        home_id: homeId,
        room_id: roomIdVal,
        renter_name: form.renter_name.trim(),
        renter_phone: form.renter_phone.trim(),
        move_in_date: form.move_in_date || null,
        deal_date: form.deal_date || null,
        monthly_rent: Number(form.monthly_rent) || 0,
        deposit: Number(form.deposit) || 0,
        broker_fee: Number(form.broker_fee) || 0,
        broker_fee_paid: form.broker_fee_paid,
        broker_fee_paid_at: form.broker_fee_paid_at || null,
        note: form.note.trim(),
      };

      const { error } = rental?.id
        ? await supabase.from("room_rentals").update(payload).eq("id", rental.id)
        : await supabase.from("room_rentals").insert([payload]);

      if (error) throw error;

      if (!rental?.id) {
        if (home?.property_type === "whole_house") {
          await supabase.from("homes").update({ status: true }).eq("id", home.id);
        } else if (room?.id) {
          await supabase.from("rooms").update({ status: true }).eq("id", room.id);
        }
      }

      handleBack();
    } catch (err) {
      console.error(err);
      const message =
        err?.code === "42501" || /row-level security/i.test(err?.message || "")
          ? "Không thể lưu vì bảng room_rentals đang bị chặn bởi RLS. Hãy chạy migration Supabase để cấp quyền cho người dùng đã đăng nhập."
          : "Không thể lưu lịch sử chốt thuê";
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!rental?.id) return;
    const ok = window.confirm("Bạn có chắc muốn xóa chốt thuê này?");
    if (!ok) return;

    const { error } = await supabase
      .from("room_rentals")
      .delete()
      .eq("id", rental.id);

    if (error) {
      alert("Không thể xóa chốt thuê");
      return;
    }
    handleBack();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-stone-400 text-sm">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="flex-1 bg-stone-50 flex flex-col min-h-screen">
      <div className="bg-white border-b border-stone-200 px-3 py-2 flex items-center justify-between gap-2 sticky top-0 z-10">
        <button
          type="button"
          onClick={handleBack}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 transition"
        >
          <FiArrowLeft size={17} />
        </button>

        <div className="flex-1 text-right min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            {isNew ? "Chốt thuê mới" : "Cập nhật chốt thuê"}
          </p>
          <h2 className="text-sm font-semibold text-stone-800 truncate">
            {room
              ? `Phòng ${room.room_name || "..."}`
              : `Nhà ${home?.name || "..."}`}
          </h2>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 transition"
              title="Xóa"
            >
              <FiTrash2 size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className={`h-9 px-4 flex items-center gap-1.5 rounded-full text-white text-sm font-medium transition ${
              saving
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:scale-95"
            }`}
          >
            <FiSave size={15} />
            {saving ? "Đang lưu..." : isNew ? "Lưu" : "Cập nhật"}
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
              onChange={(e) =>
                handleFieldChange({
                  target: { name: "renter_name", value: e.target.value },
                })
              }
            />
            <Input
              label="Số điện thoại"
              type="text"
              value={form.renter_phone}
              onChange={(e) =>
                handleFieldChange({
                  target: { name: "renter_phone", value: e.target.value },
                })
              }
            />
          </div>
        </Section>

        <Section title="Thời gian & giá">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ngày chốt thuê"
              type="date"
              value={form.deal_date}
              onChange={(e) =>
                handleFieldChange({
                  target: { name: "deal_date", value: e.target.value },
                })
              }
            />
            <Input
              label="Ngày ở"
              type="date"
              value={form.move_in_date}
              onChange={(e) =>
                handleFieldChange({
                  target: { name: "move_in_date", value: e.target.value },
                })
              }
            />
            
          </div>

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
                    target: { name: "broker_fee_paid", value: paid },
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
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  form.broker_fee_paid ? "bg-emerald-600" : "bg-stone-300"
                }`}
                aria-label="Toggle trạng thái thanh toán"
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    form.broker_fee_paid ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>

              <span
                className={`text-xs font-medium ${
                  form.broker_fee_paid ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {form.broker_fee_paid ? "Đã thanh toán" : "Chưa thanh toán"}
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

            {form.broker_fee_paid && (
              <Input
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
              />
            )}
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
