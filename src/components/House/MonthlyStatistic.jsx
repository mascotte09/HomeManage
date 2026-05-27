import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../supabase";

export default function MonthlyStatistic({
  homeID,
}) {
  const [month, setMonth] = useState(
    new Date().getMonth() + 1
  );

  const [year, setYear] = useState(
    new Date().getFullYear()
  );

  const [stats, setStats] = useState({
    rentalTotal: 0,

    electricityTotal: 0,
    electricityUsed: 0,

    waterTotal: 0,
    waterUsed: 0,

    wifiTotal: 0,

    grandTotal: 0,
  });

  
 const fetchStatistics = useCallback(
  async function () {

    const startDate =
      `${year}-${String(month).padStart(2, "0")}-01`;

    const endDate =
      month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const { data, error } =
      await supabase.rpc(
        "get_monthly_statistics",
        {
          start_date: startDate,
          end_date: endDate,
        }
      );

    if (error) {

      console.log(error);

      return;
    }

    const stat = data?.[0];

    if (!stat) {

      setStats({
        rentalTotal: 0,

        electricityTotal: 0,
        electricityUsed: 0,

        waterTotal: 0,
        waterUsed: 0,

        wifiTotal: 0,

        grandTotal: 0,
      });

      return;
    }

    setStats({
      rentalTotal:
        Number(stat.total_rental) || 0,

      electricityTotal:
        Number(
          stat.total_electricity_amount
        ) || 0,

      electricityUsed:
        Number(
          stat.total_electricity_used
        ) || 0,

      waterTotal:
        Number(
          stat.total_water_amount
        ) || 0,

      waterUsed:
        Number(
          stat.total_water_used
        ) || 0,

      wifiTotal:
        Number(stat.total_wifi) || 0,

      grandTotal:
        Number(stat.total_income) || 0,
    });
  },
  [month, year]
);
useEffect(() => {
  fetchStatistics();
}, [fetchStatistics]);

  return (
    <div className="bg-white rounded-xl border p-6">

      {/* HEADER */}
      <div className="flex gap-3 mb-6">

        <select
          value={month}
          onChange={(e) =>
            setMonth(
              Number(e.target.value)
            )
          }
          className="border rounded px-3 py-2"
        >
          {Array.from(
            { length: 12 },
            (_, i) => (
              <option
                key={i + 1}
                value={i + 1}
              >
                Tháng {i + 1}
              </option>
            )
          )}
        </select>

        <input
          type="number"
          value={year}
          onChange={(e) =>
            setYear(
              Number(e.target.value)
            )
          }
          className="border rounded px-3 py-2 w-28"
        />

      </div>

      {/* STATISTIC */}
      <div className="space-y-4">

        <div className="flex justify-between border-b pb-2">
          <span>Tiền phòng</span>

          <span className="font-semibold">
            {stats.rentalTotal.toLocaleString("vi-VN")} đ
          </span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <div className="flex flex-col">
            <span>Tiền điện</span>

            <span className="text-sm text-gray-500">
              Tổng số điện:
              {" "}
              {stats.electricityUsed}
            </span>
          </div>

          <span className="font-semibold">
            {stats.electricityTotal.toLocaleString("vi-VN")} đ
          </span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <div className="flex flex-col">
            <span>Tiền nước</span>

            <span className="text-sm text-gray-500">
              Tổng số nước:
              {" "}
              {stats.waterUsed}
            </span>
          </div>

          <span className="font-semibold">
            {stats.waterTotal.toLocaleString("vi-VN")} đ
          </span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span>Wifi / Dịch vụ</span>

          <span className="font-semibold">
            {stats.wifiTotal.toLocaleString("vi-VN")} đ
          </span>
        </div>

        <div className="flex justify-between pt-4 text-xl font-bold">
          <span>Tổng thu</span>

          <span className="text-red-600">
            {stats.grandTotal.toLocaleString("vi-VN")} đ
          </span>
        </div>

      </div>

    </div>
  );
}