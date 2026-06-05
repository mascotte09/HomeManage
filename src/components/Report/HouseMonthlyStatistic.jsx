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

    const StatRow = ({ label, value, sub, valueClass = "" }) => (
        <div className="flex items-center justify-between py-1.5 border-b text-black">
        <div>
            <div className="text-sm">{label}</div>

            {sub && (
                <div className="text-[11px] text-gray-500 leading-tight">
                    {sub}
                </div>
            )}
        </div>

        <div className={`font-semibold text-sm ${valueClass}`}>
            {value}
        </div>
    </div>
    );

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

        const { data } = await supabase.rpc(
            "get_monthly_statistics",
            {
                p_home_id: houseId,
                start_date: startDate,
                end_date: endDate,
            }
        );

        const stat = data?.[0];

        if (!stat) {
            setStats((prev) => ({
                ...prev,
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
                expenseTotal,
                grandTotal: 0,
            }));
            return;
        }

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

    return (
        <div className="bg-white rounded-xl border p-4 space-y-4">

            {/* HEADER */}
            <div className="flex gap-2 text-black mb-2">
                <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="border rounded px-2 py-1.5"
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
                    className="border rounded px-3 py-2 w-28"
                />
            </div>

            {/* DOANH THU */}
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-200 space-y-0.5">

                <h3 className="font-bold text-blue-700 text-lg">
                    Doanh thu
                </h3>

                <StatRow
                    label={`Tiền phòng (${stats.totalInvoice} hóa đơn)`}
                    value={`${stats.rentalTotal.toLocaleString("vi-VN")} đ`}
                    valueClass="text-blue-700"
                />

                <StatRow
                    label="Tiền điện"
                    sub={`${stats.electricityUsed} kWh`}
                    value={`${stats.electricityTotal.toLocaleString("vi-VN")} đ`}
                    valueClass="text-blue-700"
                />

                <StatRow
                    label="Tiền nước"
                    sub={`${stats.waterUsed} m³`}
                    value={`${stats.waterTotal.toLocaleString("vi-VN")} đ`}
                    valueClass="text-blue-700"
                />

                <StatRow
                    label="Wifi / Dịch vụ"
                    value={`${stats.wifiTotal.toLocaleString("vi-VN")} đ`}
                    valueClass="text-blue-700"
                />

                <div className="flex justify-between pt-2 font-bold text-blue-800">
                    <span>Tổng thu</span>
                    <span>
                        {stats.grandTotal.toLocaleString("vi-VN")} đ
                    </span>
                </div>
            </div>

            {/* CÔNG NỢ */}
            <div className="bg-orange-50 rounded-lg p-2 border border-orange-200 space-y-0.5">

                <h3 className="font-bold text-orange-700 text-lg">
                    Công nợ
                </h3>

                <StatRow
                    label="Tổng tiền còn nợ"
                    value={`${stats.unpaidAmount.toLocaleString("vi-VN")} đ`}
                    valueClass="text-red-600"
                />

                <StatRow
                    label="Hóa đơn chưa thanh toán"
                    value={stats.unpaidInvoiceCount}
                />

                <StatRow
                    label="Đã thu được"
                    value={`${stats.paidAmount.toLocaleString("vi-VN")} đ`}
                    valueClass="text-green-600"
                />

                <StatRow
                    label="Đã thanh toán"
                    value={`${stats.paidInvoiceCount}/${stats.totalInvoice}`}
                    valueClass="text-green-600"
                />
            </div>

            {/* CHI PHÍ */}
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">

                <h3 className="font-bold text-red-700 text-lg mb-2">
                    Chi phí
                </h3>

                <div className="space-y-1">
                    {expenses.map((expense) => (
                        <div
                            key={expense.id}
                            className="flex justify-between items-center py-1.5 border-b"
                        >
                            <div>
                                <div className="text-black">
                                    {expense.expenses_type?.type_name ||
                                        expense.type_other_expense}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {new Date(expense.expense_date).toLocaleDateString("vi-VN")}
                                </div>
                            </div>

                            <div className="font-semibold text-red-500">
                                -{Number(expense.expense).toLocaleString("vi-VN")} đ
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between pt-3 font-bold text-red-700">
                    <span>Tổng chi phí</span>
                    <span>
                        {stats.expenseTotal.toLocaleString("vi-VN")} đ
                    </span>
                </div>
            </div>

            {/* LỢI NHUẬN */}
            <div className="bg-green-100 border-2 border-green-500 rounded-xl p-3 flex justify-between items-center">
                <span className="text-xl font-bold text-green-900">
                    Lợi nhuận
                </span>

                <span className="text-2xl font-extrabold text-green-700">
                    {(
                        stats.grandTotal - stats.expenseTotal
                    ).toLocaleString("vi-VN")} đ
                </span>
            </div>
        </div>
    );
}