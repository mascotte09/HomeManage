import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../supabase";
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiEye,
  FiCalendar,
  FiPhone,
  FiHome,
} from "react-icons/fi";

export default function BrokerInvoices({ homeId: homeIdProp, homeName: homeNameProp }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [home, setHome] = useState(null);
  const [room, setRoom] = useState(null);
  const [rentals, setRentals] = useState([]);

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

  // Điều hướng sang trang chốt thuê tách riêng, kèm homeId/roomId để trang đó
  // biết đang tạo cho nhà/phòng nào, và "from" để biết quay lại đâu sau khi lưu.
  function openCreatePage() {
    const params = new URLSearchParams();
    const targetHomeId = home?.id || homeIdProp || room?.home_id;
    if (targetHomeId) params.set("homeId", targetHomeId);
    if (roomId) params.set("roomId", roomId);

    navigate(`/broker/rentals/new?${params.toString()}`, {
      state: { from: location.pathname },
    });
  }

  function openEditPage(rental) {
    navigate(`/broker/rentals/${rental.id}`, {
      state: { from: location.pathname },
    });
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
