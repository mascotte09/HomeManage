import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../supabase";
import { useParams } from "react-router-dom";

export default function MonthlyStatistic() {
    const { houseId } = useParams();

    const [expenses, setExpenses] = useState([]);

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const [stats, setStats] = useState({
        rentalTotal: 0,
        totalInvoice: 0,

        paidInvoiceCount: 0,
        paidAmount: 0,

        unpaidInvoiceCount: 0,
        unpaidAmount: 0,

        electricityTotal: 0,
        electricityUsed: 0,

        waterTotal: 0,
        waterUsed: 0,

        wifiTotal: 0,

        expenseTotal: 0,
        grandTotal: 0,
    });

    const fetchStatistics = useCallback(async () => {
        const startDate = `${year}-${String(month).padStart(2, "0")}-01`;

        const endDate =
            month === 12
                ? `${year + 1}-01-01`
                : `${year}-${String(month + 1).padStart(2, "0")}-01`;

        const { data: expensesData } = await supabase
            .from("expenses")
            .select(`*, expenses_type(type_name)`)
            .eq("home_id", houseId)
            .gte("expense_date", startDate)
            .lt("expense_date", endDate);

        const expenseTotal = (expensesData || []).reduce(
            (sum, item) => sum + Number(item.expense || 0),
            0
        );

        setExpenses(expensesData || []);

        const { data } = await supabase.rpc("get_monthly_statistics", {
            p_home_id: houseId,
            start_date: startDate,
            end_date: endDate,
        });

        const stat = data?.[0];

        if (!stat) return;

        setStats({
            rentalTotal: Number(stat.total_rental) || 0,
            totalInvoice: Number(stat.total_invoice) || 0,

            paidInvoiceCount: Number(stat.paid_invoice_count) || 0,
            paidAmount: Number(stat.paid_amount) || 0,

            unpaidInvoiceCount: Number(stat.unpaid_invoice_count) || 0,
            unpaidAmount: Number(stat.unpaid_amount) || 0,

            electricityTotal: Number(stat.total_electricity_amount) || 0,
            electricityUsed: Number(stat.total_electricity_used) || 0,

            waterTotal: Number(stat.total_water_amount) || 0,
            waterUsed: Number(stat.total_water_used) || 0,

            wifiTotal: Number(stat.total_wifi) || 0,

            expenseTotal,
            grandTotal: Number(stat.total_income) || 0,
        });
    }, [month, year, houseId]);

    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    const profit = stats.grandTotal - stats.expenseTotal;

    return (
        <div className="bg-gray-50 p-2 rounded-xl space-y-2">

            {/* HEADER */}
            <div className="flex gap-2 text-black">
                <div className="flex items-center gap-2 bg-slate-50 border rounded-lg px-2 py-1">
                    <span className="text-base font-semibold text-gray-800">
                        Tháng báo cáo:
                    </span>
                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="border rounded px-2 py-1 bg-white"
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                Tháng {i + 1}
                            </option>
                        ))}
                    </select>

                    <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="border rounded px-2 py-1 w-24 bg-white"
                    />
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-4 gap-2">
                <Kpi title="Thu" value={stats.grandTotal} color="text-blue-600" />
                <Kpi title="Chi" value={stats.expenseTotal} color="text-red-600" />
                <Kpi title="Lãi" value={profit} color="text-green-600" />
                <Kpi title="Nợ" value={stats.unpaidAmount} color="text-orange-600" />
            </div>

            {/* BODY */}
            <div className="grid grid-cols-2 gap-2">

                {/* DOANH THU */}
                <div className="bg-white border rounded-lg p-2 space-y-1">
                    <h3 className="font-semibold text-blue-600">Doanh thu</h3>

                    <Row label="Tiền phòng" value={stats.rentalTotal} sub={`${stats.totalInvoice} hóa đơn`} />
                    <Row label="Tiền điện" value={stats.electricityTotal} sub={`${stats.electricityUsed} kWh`} />
                    <Row label="Tiền nước" value={stats.waterTotal} sub={`${stats.waterUsed} m³`} />
                    <Row label="Wifi" value={stats.wifiTotal} />

                </div>

                {/* CÔNG NỢ */}
                <div className="bg-white border rounded-lg p-2 space-y-1">
                    <h3 className="font-semibold text-orange-600">Công nợ</h3>

                    <Row label="Còn nợ" value={stats.unpaidAmount} />
                    <Row label="Số phòng nợ" value={stats.unpaidInvoiceCount} />
                    <Row label="Đã thu" value={stats.paidAmount} />
                </div>

            </div>

            {/* EXPENSE */}
            <div className="bg-white border rounded-lg p-2">
                <h3 className="font-semibold text-red-600 mb-1">Chi phí</h3>

                <div className="space-y-1">
                    {expenses.map((e) => (
                        <div key={e.id} className="flex justify-between text-sm border-b py-1">
                            <div>
                                <div className="text-base text-black">{e.expenses_type?.type_name}</div>
                                <div className="text-xs text-gray-500">
                                    {new Date(e.expense_date).toLocaleDateString("vi-VN")}
                                </div>
                            </div>

                            <div className="text-red-500 font-medium">
                                -{Number(e.expense).toLocaleString("vi-VN")}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between pt-2 font-bold text-red-600">
                    <span>Tổng chi</span>
                    <span>{stats.expenseTotal.toLocaleString("vi-VN")} </span>
                </div>
            </div>

            {/* PROFIT */}
            <div className="bg-green-100 border border-green-500 rounded-lg p-3 flex justify-between">
                <span className="font-bold text-green-800">Lợi nhuận</span>
                <span className="font-extrabold text-green-700">
                    {profit.toLocaleString("vi-VN")}
                </span>
            </div>

        </div>
    );
}

/* KPI CARD */
function Kpi({ title, value, color }) {
    return (
        <div className="bg-green-100 border rounded-lg p-2 shadow-sm">
            <div className="text-base text-black">{title}</div>
            <div className={`text-ms font-bold ${color}`}>
                {Number(value).toLocaleString("vi-VN")}
            </div>
        </div>
    );
}

/* ROW */
function Row({ label, value, sub }) {
    return (
        <div className="flex justify-between items-center py-1 text-sm border-b last:border-none">
            <div>
                <div className="text-base text-black">{label}</div>
                {sub && <div className="text-ms text-gray-500">{sub}</div>}
            </div>

            <div className="font-medium text-black">
                {typeof value === "number"
                    ? value.toLocaleString("vi-VN")
                    : value}
            </div>
        </div>
    );
}