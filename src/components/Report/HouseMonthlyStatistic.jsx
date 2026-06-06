import { useEffect, useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../supabase";
import { useParams } from "react-router-dom";
import html2canvas from "html2canvas";
export default function MonthlyStatistic() {
    const { houseId } = useParams();

    const reportRef = useRef(null);

    // ✅ NEW: YYYY-MM
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        return `${y}-${m}`;
    });

    const [expenses, setExpenses] = useState([]);

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

    // =========================
    // FETCH DATA
    // =========================
    const fetchStatistics = useCallback(async () => {
        const [year, month] = selectedMonth.split("-");

        const startDate = `${year}-${month}-01`;

        const endDate =
            month === "12"
                ? `${Number(year) + 1}-01-01`
                : `${year}-${String(Number(month) + 1).padStart(2, "0")}-01`;

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
    }, [selectedMonth, houseId]);

    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    const handleSendImage = async () => {
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2, // ảnh nét hơn
                useCORS: true,
            });

            const blob = await new Promise((resolve) =>
                canvas.toBlob(resolve, "image/png")
            );

            const file = new File(
                [blob],
                `BaoCao_${selectedMonth}.png`,
                { type: "image/png" }
            );

            // 👉 MOBILE SHARE (Zalo / Messenger / Telegram)
            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: "Báo cáo tháng",
                    text: `Báo cáo ${selectedMonth}`,
                    files: [file],
                });
                return;
            }

            // 👉 DESKTOP FALLBACK
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Capture error:", err);
            alert("Không thể chụp màn hình");
        }
    };
    // =========================
    // EXPORT EXCEL + SHARE
    // =========================
    const handleExportExcel = async () => {
        const rows = [
            ["Chỉ tiêu", "Giá trị"],
            ["Doanh thu", stats.grandTotal],
            ["Tiền phòng", stats.rentalTotal],
            ["Tiền điện", stats.electricityTotal],
            ["Tiền nước", stats.waterTotal],
            ["Wifi", stats.wifiTotal],
            ["Đã thu", stats.paidAmount],
            ["Còn nợ", stats.unpaidAmount],
            ["Chi phí", stats.expenseTotal],
            ["Lợi nhuận", stats.grandTotal - stats.expenseTotal],
        ];

        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "BaoCao");

        const buffer = XLSX.write(wb, {
            bookType: "xlsx",
            type: "array",
        });

        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const file = new File(
            [blob],
            `BaoCao_${selectedMonth}.xlsx`,
            { type: blob.type }
        );

        const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

        if (
            isMobile &&
            navigator.share &&
            navigator.canShare?.({ files: [file] })
        ) {
            try {
                await navigator.share({
                    title: "Báo cáo Excel",
                    files: [file],
                });
                return;
            } catch (err) {
                console.log("Share failed:", err);
            }
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
    };

    // =========================
    // COMPUTED
    // =========================
    const profit = stats.grandTotal - stats.expenseTotal;

    const debtRate =
        stats.paidAmount > 0
            ? ((stats.paidAmount * 100) / stats.grandTotal).toFixed(1)
            : 0;

    // =========================
    // UI
    // =========================
    return (
        <div ref={reportRef} className="bg-gray-50 p-2 rounded-xl space-y-2">

            {/* HEADER */}
            <div className="flex justify-between items-center">
                
                

                {/* MONTH PICKER */}
                <div className="flex items-center gap-2 bg-slate-50 border rounded-lg px-2 py-1">
                    <div className="text-black">Tháng</div>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="text-black border rounded px-2 py-1 bg-white"
                    >
                        {Array.from({ length: 24 }, (_, i) => {
                            const date = new Date();
                            date.setMonth(date.getMonth() - 12 + i);

                            const y = date.getFullYear();
                            const m = String(date.getMonth() + 1).padStart(2, "0");
                            const value = `${y}-${m}`;

                            return (
                                <option key={value} value={value}>
                                    {m}/{y}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* BUTTONS */}
                <div className="flex gap-2">
                    <button
                        onClick={handleSendImage}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                    >
                        Gửi
                    </button>

                    <button
                        onClick={handleExportExcel}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                    >
                        In Excel
                    </button>
                </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-4 gap-2">
                <Kpi title="D.Thu" value={stats.grandTotal} color="text-blue-600" />
                <Kpi title="Chi" value={stats.expenseTotal} color="text-red-600" />
                <Kpi title="Lãi" value={profit} color="text-green-600" />
                <Kpi title="Nợ" value={stats.unpaidAmount} color="text-orange-600" />
            </div>

            {/* BODY */}
            <div className="grid grid-cols-2 gap-2">

                <div className="bg-white border rounded-lg p-2">
                    <h3 className="font-semibold text-blue-600">Doanh thu</h3>
                    <Row label="Tiền phòng" value={stats.rentalTotal} sub={`${stats.totalInvoice} hóa đơn`} />
                    <Row label="Tiền điện" value={stats.electricityTotal} sub={`${stats.electricityUsed} kWh`}/>
                    <Row label="Tiền nước" value={stats.waterTotal} sub={`${stats.waterUsed} m³`}/>
                    <Row label="Wifi" value={stats.wifiTotal} />
                </div>

                <div className="bg-white border rounded-lg p-2">
                    <h3 className="font-semibold text-orange-600">Công nợ</h3>
                    <Row label="Đã thu" value={stats.paidAmount} sub={`${stats.paidInvoiceCount} hóa đơn`}/>
                    <Row label="Còn nợ" value={stats.unpaidAmount} sub={`${stats.unpaidInvoiceCount} hóa đơn`}/>
                    <Row label="% Thu" value={`${debtRate}%`} />
                </div>
            </div>

            {/* EXPENSE */}
            <div className="bg-white border rounded-lg p-2">
                <h3 className="font-semibold text-red-600">Chi phí</h3>

                {expenses.map((e) => (
                    <div key={e.id} className="flex justify-between text-sm border-b py-1">
                        <div>
                            <div className="text-black">{e.expenses_type?.type_name}</div>
                            <div className="text-xs text-gray-500">
                                {new Date(e.expense_date).toLocaleDateString("vi-VN")}
                            </div>
                        </div>
                        <div className="text-red-500">
                            -{Number(e.expense).toLocaleString("vi-VN")}
                        </div>
                    </div>
                ))}

                <div className="flex justify-between pt-2 font-bold text-red-600">
                    <span>Tổng chi</span>
                    <span>{stats.expenseTotal.toLocaleString("vi-VN")}</span>
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

// =========================
// COMPONENTS
// =========================

function Kpi({ title, value, color }) {
    return (
        <div className="bg-green-100 border rounded-lg p-2 flex flex-col items-center">
            <div className="text-black">{title}</div>
            <div className={`font-bold ${color}`}>
                {Number(value).toLocaleString("vi-VN")}
            </div>
        </div>
    );
}

function Row({ label, value, sub }) {
    return (
        <div className="text-black flex justify-between py-1 text-sm border-b last:border-none">
            <div>
                <div>{label}</div>
                {sub && <div className="text-xs text-gray-500">{sub}</div>}
            </div>
            <div>{typeof value === "number" ? value.toLocaleString("vi-VN") : value}</div>
        </div>
    );
}