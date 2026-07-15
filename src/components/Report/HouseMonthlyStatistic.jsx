import { useEffect, useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../supabase";
import { useParams } from "react-router-dom";
import html2canvas from "html2canvas";
import { FiDownload, FiTrendingUp, FiClock } from "react-icons/fi";

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
        paidDemiInvoiceCount: 0,
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
            paidDemiInvoiceCount: Number(stat.paid_demi_invoice_count) || 0,
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
        stats.grandTotal > 0
            ? ((stats.paidAmount * 100) / stats.grandTotal).toFixed(1)
            : 0;

    const [monthLabel, yearLabel] = selectedMonth.split("-").reverse();

    // =========================
    // UI
    // =========================
    return (
        <div ref={reportRef} className="bg-slate-50 p-3 rounded-2xl space-y-3">

            {/* HEADER */}
            <div className="flex justify-between items-center gap-2">

                {/* MONTH PICKER */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                    <span className="text-slate-500 text-sm">Tháng</span>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="text-slate-800 font-bold text-sm bg-transparent focus:outline-none"
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
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportExcel}
                        title="Xuất Excel"
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full shadow-sm text-slate-600 hover:bg-slate-100"
                    >
                        <FiDownload size={17} />
                    </button>

                    <button
                        onClick={handleSendImage}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold shadow-sm"
                    >
                        Gửi
                    </button>
                </div>
            </div>

            {/* PROFIT HERO */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-emerald-600 text-sm mb-1">
                    <FiTrendingUp size={16} />
                    <span>Lợi nhuận ròng tháng {monthLabel}/{yearLabel}</span>
                </div>
                <div className="text-3xl font-extrabold text-emerald-700 mb-1">
                    {profit.toLocaleString("vi-VN")} đ
                </div>
                <div className="text-slate-500 text-sm">
                    Doanh thu {stats.grandTotal.toLocaleString("vi-VN")} – Chi phí{" "}
                    {stats.expenseTotal.toLocaleString("vi-VN")}
                </div>
            </div>

            {/* THU TIỀN PROGRESS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-slate-800">Tình hình thu tiền</h3>
                    <span className="text-sm font-semibold text-slate-500">{debtRate}% đã thu</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                    <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(debtRate, 100)}%` }}
                    />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-rose-500 font-medium">
                    <FiClock size={14} />
                    <span>Còn {stats.unpaidAmount.toLocaleString("vi-VN")} đ chưa thu</span>
                </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 gap-2">
                <Kpi title="Doanh Thu" value={stats.grandTotal} color="blue" />


                <Kpi title="Công Nợ" value={stats.unpaidAmount} color="orange" />
            </div>

            {/* BODY */}
            <div className="grid grid-cols-2 gap-2">

                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
                    <h3 className="font-bold text-blue-600 mb-1">Doanh thu</h3>
                    <Row label="Tiền phòng" value={stats.rentalTotal} sub={`${stats.totalInvoice} hóa đơn`} />
                    <Row label="Tiền điện" value={stats.electricityTotal} sub={`${stats.electricityUsed} kWh`} />
                    <Row label="Tiền nước" value={stats.waterTotal} sub={`${stats.waterUsed} m³`} />
                    <Row label="Wifi" value={stats.wifiTotal} />
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
                    <h3 className="font-bold text-orange-600 mb-1">Công nợ</h3>
                    <Row label="Đã thu" value={stats.paidAmount} sub={`${stats.paidInvoiceCount + stats.paidDemiInvoiceCount} hóa đơn`} />
                    <Row label="Còn nợ" value={stats.unpaidAmount} sub={`${stats.unpaidInvoiceCount} hóa đơn`} />
                    <Row label="% Thu" value={`${debtRate}%`} />
                </div>
            </div>

            {/* EXPENSE */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-slate-800">Chi phí</h3>
                    <span className="text-sm text-slate-400">{expenses.length} khoản</span>
                </div>

                {expenses.map((e) => (
                    <div
                        key={e.id}
                        className="flex justify-between items-start text-sm border-l-4 border-rose-400 bg-rose-50/40 rounded-r-lg pl-3 pr-2 py-2 mb-1.5 last:mb-0"
                    >
                        <div>
                            <div className="text-slate-800 font-medium">{e.expenses_type?.type_name}</div>
                            {e.notes ? (
                                <div className="text-slate-500 text-xs">
                                    {e.notes}
                                </div>
                            ) : null}
                            <div className="text-xs text-slate-400">
                                {new Date(e.expense_date).toLocaleDateString("vi-VN")}
                            </div>
                        </div>
                        <div className="text-rose-500 font-semibold whitespace-nowrap">
                            -{Number(e.expense).toLocaleString("vi-VN")}
                        </div>
                    </div>
                ))}

                <div className="flex justify-between pt-2 mt-1 border-t border-slate-100 font-bold text-rose-600">
                    <span>Tổng chi</span>
                    <span>{stats.expenseTotal.toLocaleString("vi-VN")}</span>
                </div>
            </div>
        </div>
    );
}

// =========================
// COMPONENTS
// =========================

const KPI_COLORS = {
    blue: { border: "border-blue-500", text: "text-blue-600" },
    green: { border: "border-emerald-500", text: "text-emerald-600" },
    orange: { border: "border-orange-500", text: "text-orange-600" },
    red: { border: "border-rose-500", text: "text-rose-600" },
};

function Kpi({ title, value, color = "blue" }) {
    const c = KPI_COLORS[color] || KPI_COLORS.blue;
    return (
        <div className={`bg-white border-l-4 ${c.border} border-y border-r border-slate-200 rounded-xl p-2.5 shadow-sm`}>
            <div className="text-slate-500 text-xs mb-1">{title}</div>
            <div className={`font-bold text-sm ${c.text}`}>
                {Number(value).toLocaleString("vi-VN")}
            </div>
        </div>
    );
}

function Row({ label, value, sub }) {
    return (
        <div className="text-slate-800 flex justify-between py-1.5 text-sm border-b border-slate-100 last:border-none">
            <div>
                <div>{label}</div>
                {sub && <div className="text-xs text-slate-400">{sub}</div>}
            </div>
            <div className="font-medium">{typeof value === "number" ? value.toLocaleString("vi-VN") : value}</div>
        </div>
    );
}
