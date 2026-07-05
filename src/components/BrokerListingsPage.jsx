import { useEffect, useState } from "react";
import { FiHome, FiUser, FiDollarSign } from "react-icons/fi";
import { supabase } from "../supabase";
import { getUserTypeLabel } from "../utils/userType";

export default function BrokerListingsPage({ user }) {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHouses() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("homes")
        .select("*, rooms(*)")
        .eq("userID", user.id)
        .order("name");

      if (error) {
        console.error(error.message);
        setHouses([]);
      } else {
        setHouses(data || []);
      }

      setLoading(false);
    }

    fetchHouses();
  }, [user?.id]);

  const totalRooms = houses.reduce((sum, house) => sum + (house.rooms?.length || 0), 0);
  const occupiedRooms = houses.reduce(
    (sum, house) => sum + (house.rooms?.filter((room) => room.status).length || 0),
    0
  );

  return (
    <div className="min-h-full bg-stone-50 p-4 pb-24">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
            Trang rao nhà & phòng
          </p>
          <h1 className="mt-2 text-xl font-semibold">
            {getUserTypeLabel(user?.user_type)} • Quản lý tin đăng
          </h1>
          <p className="mt-2 text-sm text-blue-50">
            Đây là nơi bạn có thể xem nhanh các nhà và phòng đang quản lý để chia sẻ với khách thuê.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <p className="text-sm text-stone-500">Tổng nhà</p>
            <p className="mt-1 text-2xl font-semibold text-stone-800">{houses.length}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <p className="text-sm text-stone-500">Tổng phòng</p>
            <p className="mt-1 text-2xl font-semibold text-stone-800">{totalRooms}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <p className="text-sm text-stone-500">Phòng đã thuê</p>
            <p className="mt-1 text-2xl font-semibold text-stone-800">{occupiedRooms}</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
            Đang tải dữ liệu...
          </div>
        ) : houses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
            Chưa có nhà trọ nào để hiển thị trên trang rao dành cho môi giới.
          </div>
        ) : (
          <div className="space-y-3">
            {houses.map((house) => (
              <div key={house.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <FiHome className="text-blue-600" />
                      <h2 className="font-semibold text-stone-800">{house.name}</h2>
                    </div>
                    {house.address && (
                      <p className="mt-1 text-sm text-stone-500">{house.address}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {house.rooms?.length || 0} phòng
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {(house.rooms || []).map((room) => (
                    <div key={room.id} className="flex flex-wrap items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-stone-700">Phòng {room.room_name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                          {room.room_renter && (
                            <span className="inline-flex items-center gap-1">
                              <FiUser size={12} /> {room.room_renter}
                            </span>
                          )}
                          {room.monthly_rent > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <FiDollarSign size={12} /> {Number(room.monthly_rent).toLocaleString("vi-VN")} đ
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${room.status ? "bg-green-100 text-green-700" : "bg-stone-200 text-stone-600"}`}>
                        {room.status ? "Có người" : "Còn trống"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
