import { useEffect, useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../supabase";
import html2canvas from "html2canvas";
import {
    FiShare2,
    FiDownload,
    FiChevronLeft,
    FiChevronRight,
    FiTrendingUp,
    FiCheckCircle,
    FiClock,
} from "react-icons/fi";

export default function BrokerMonthlyStatistic() {
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        // App này KHÔNG dùng Supabase Auth để đăng nhập (xem Login.jsx: tự query
        // bảng "users" rồi lưu vào localStorage "currentUser"), nên không thể lấy
        // user qua supabase.auth.getUser()/getSession() — luôn trả về null.
        try {
            const stored = localStorage.getItem("currentUser");
            if (stored) {
                const currentUser = JSON.parse(stored);
                setUserId(currentUser?.id ?? null);
            }
        } catch (err) {
            console.log("Không đọc được currentUser trong localStorage:", err);
        }
    }, []);

    const reportRef = useRef(null);
    const [sending, setSending] = useState(false);

    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        return `${y}-${m}`;
    });

    const [expenses, setExpenses] = useState([]);
    const [rentals, setRentals] = useState([]);
    const [feeTab, setFeeTab] = useState("unreceived"); // tab đang xem: 'received' | 'unreceived'
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        brokerTotal: 0,
        brokerReceived: 0,
        brokerUnreceived: 0,
        expenseTotal: 0,
        grandTotal: 0, // = brokerTotal - expenseTotal (lợi nhuận ròng)
    });

    // =========================
    // FETCH DATA
    // =========================
    const fetchStatistics = useCallback(async () => {
        if (!userId) return; // chưa có userId thì chưa fetch, tránh query null/sai

        setLoading(true);
        const [year, month] = selectedMonth.split("-");

        const startDate = `${year}-${month}-01`;
        const endDate =
            month === "12"
                ? `${Number(year) + 1}-01-01`
                : `${year}-${String(Number(month) + 1).padStart(2, "0")}-01`;

        // Chi phí: lọc theo user sở hữu nhà
        const { data: expensesData, error: expensesError } = await supabase
            .from("expenses")
            .select(`
                *,
                expenses_type(type_name),
                homes!inner(userID, name, address)
            `)
            .eq("homes.userID", userId)
            .gte("expense_date", startDate)
            .lt("expense_date", endDate);
        if (expensesError) console.log(expensesError.message);

        const expenseTotal = (expensesData || []).reduce(
            (sum, item) => sum + Number(item.expense || 0),
            0
        );

        setExpenses(expensesData || []);

        // Hoa hồng: lọc theo user sở hữu nhà, lấy kèm địa chỉ để hiển thị danh sách
        const { data, error } = await supabase
            .from("room_rentals")
            .select(`
                id,
                broker_fee,
                broker_fee_paid,
                deal_date,
                homes!inner (
                    userID,
                    name,
                    address
                )
            `)
            .eq("homes.userID", userId)
            .gte("deal_date", startDate)
            .lt("deal_date", endDate);

        if (error) {
            console.log(error.message);
            setLoading(false);
            return;
        }

        setRentals(data || []);

        const statistics = (data || []).reduce(
            (acc, item) => {
                const fee = Number(item.broker_fee || 0);

                if (item.broker_fee_paid) {
                    acc.received += fee;
                } else {
                    acc.unreceived += fee;
                }

                acc.total += fee;
                return acc;
            },
            { total: 0, received: 0, unreceived: 0 }
        );

        const brokerTotal = Number(statistics.total) || 0;
        const expenseTotalNum = Number(expenseTotal) || 0;

        setStats({
            brokerTotal,
            brokerReceived: Number(statistics.received) || 0,
            brokerUnreceived: Number(statistics.unreceived) || 0,
            expenseTotal: expenseTotalNum,
            grandTotal: brokerTotal - expenseTotalNum, // lợi nhuận ròng, tính đúng 1 lần
        });

        setLoading(false);
    }, [selectedMonth, userId]);

    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    // =========================
    // MONTH NAVIGATION
    // =========================
    function shiftMonth(delta) {
        const [y, m] = selectedMonth.split("-").map(Number);
        const d = new Date(y, m - 1 + delta, 1);
        const ny = d.getFullYear();
        const nm = String(d.getMonth() + 1).padStart(2, "0");
        setSelectedMonth(`${ny}-${nm}`);
    }

    const [mYear, mMonth] = selectedMonth.split("-");

    // =========================
    // SHARE AS IMAGE
    // =========================
    const handleSendImage = async () => {
        setSending(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#f5f5f4",
            });

            const blob = await new Promise((resolve) =>
                canvas.toBlob(resolve, "image/png")
            );

            const file = new File([blob], `BaoCao_${selectedMonth}.png`, {
                type: "image/png",
            });

            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: "Báo cáo tháng",
                    text: `Báo cáo ${mMonth}/${mYear}`,
                    files: [file],
                });
                return;
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Capture error:", err);
            alert("Không thể chụp màn hình");
        } finally {
            setSending(false);
        }
    };

    // =========================
    // EXPORT EXCEL
    // =========================
    const handleExportExcel = () => {
        const summarySheet = XLSX.utils.json_to_sheet([
            { "Chỉ số": "Tổng hoa hồng", "Số tiền": stats.brokerTotal },
            { "Chỉ số": "Đã nhận", "Số tiền": stats.brokerReceived },
            { "Chỉ số": "Chưa nhận (công nợ)", "Số tiền": stats.brokerUnreceived },
            { "Chỉ số": "Tổng chi phí", "Số tiền": -stats.expenseTotal },
            { "Chỉ số": "Lợi nhuận ròng", "Số tiền": stats.grandTotal },
        ]);

        const expenseSheet = XLSX.utils.json_to_sheet(
            expenses.map((e) => ({
                "Tên nhà": e.homes?.name || "",
                "Loại chi phí": e.expenses_type?.type_name || "",
                "Ghi chú": e.notes || "",
                "Ngày": new Date(e.expense_date).toLocaleDateString("vi-VN"),
                "Số tiền": Number(e.expense || 0),
            }))
        );

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, summarySheet, "Tổng quan");
        XLSX.utils.book_append_sheet(wb, expenseSheet, "Chi phí");

        XLSX.writeFile(wb, `BaoCao_${selectedMonth}.xlsx`);
    };

    // =========================
    // COMPUTED
    // =========================
    const profit = stats.grandTotal; // đã tính đúng 1 lần trong fetchStatistics
    const isProfitPositive = profit >= 0;

    const collectionRate =
        stats.brokerTotal > 0
            ? (stats.brokerReceived / stats.brokerTotal) * 100
            : 0;

    // =========================
    // UI
    // =========================
    return (
        <div className="max-w-xl mx-auto pb-6">
            {/* HEADER: chọn tháng + hành động */}
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl px-1 py-1 shadow-sm">
                    <button
                        onClick={() => shiftMonth(-1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 active:bg-stone-200"
                        aria-label="Tháng trước"
                    >
                        <FiChevronLeft size={16} />
                    </button>
                    <span className="px-2 text-sm font-semibold text-stone-800 whitespace-nowrap">
                        Tháng {mMonth}/{mYear}
                    </span>
                    <button
                        onClick={() => shiftMonth(1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 active:bg-stone-200"
                        aria-label="Tháng sau"
                    >
                        <FiChevronRight size={16} />
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleExportExcel}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 shadow-sm"
                        aria-label="Xuất Excel"
                    >
                        <FiDownload size={16} />
                    </button>
                    <button
                        onClick={handleSendImage}
                        disabled={sending}
                        className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium shadow-sm"
                    >
                        <FiShare2 size={15} />
                        {sending ? "Đang chụp..." : "Gửi"}
                    </button>
                </div>
            </div>

            <div ref={reportRef} className="bg-stone-100 p-3 rounded-2xl space-y-3">
                {loading ? (
                    <div className="py-16 text-center text-stone-400 text-sm">
                        Đang tải dữ liệu...
                    </div>
                ) : (
                    <>
                        {/* HERO: lợi nhuận ròng */}
                        <div
                            className={`rounded-2xl p-4 border ${isProfitPositive
                                ? "bg-emerald-50 border-emerald-200"
                                : "bg-red-50 border-red-200"
                                }`}
                        >
                            <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500 mb-1">
                                <FiTrendingUp
                                    className={isProfitPositive ? "text-emerald-600" : "text-red-500"}
                                    size={14}
                                />
                                Lợi nhuận ròng tháng {mMonth}/{mYear}
                            </div>
                            <div
                                className={`text-2xl font-extrabold ${isProfitPositive ? "text-emerald-700" : "text-red-600"
                                    }`}
                            >
                                {profit.toLocaleString("vi-VN")} đ
                            </div>
                            <div className="text-[11px] text-stone-500 mt-1">
                                Hoa hồng {stats.brokerTotal.toLocaleString("vi-VN")} − Chi phí{" "}
                                {stats.expenseTotal.toLocaleString("vi-VN")}
                            </div>
                        </div>

                        {/* CÔNG NỢ: tỷ lệ đã thu */}
                        <div className="bg-white border border-stone-200 rounded-2xl p-3.5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-stone-700">
                                    Tình hình thu hoa hồng
                                </span>
                                <span className="text-xs font-semibold text-stone-500">
                                    {collectionRate.toFixed(0)}% đã thu
                                </span>
                            </div>
                            <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all"
                                    style={{ width: `${Math.min(collectionRate, 100)}%` }}
                                />
                            </div>
                            {stats.brokerUnreceived > 0 && (
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600">
                                    <FiClock size={13} />
                                    Còn {stats.brokerUnreceived.toLocaleString("vi-VN")} đ công nợ
                                    chưa thu
                                </div>
                            )}
                        </div>

                        {/* KPI */}
                        <div className="grid grid-cols-3 gap-2">
                            <Kpi
                                icon={<FiTrendingUp size={14} />}
                                title="Tổng hoa hồng"
                                value={stats.brokerTotal}
                                accent="border-l-blue-500"
                                valueColor="text-blue-700"
                            />
                            <Kpi
                                icon={<FiCheckCircle size={14} />}
                                title="Đã nhận"
                                value={stats.brokerReceived}
                                accent="border-l-emerald-500"
                                valueColor="text-emerald-700"
                            />
                            <Kpi
                                icon={<FiClock size={14} />}
                                title="Công nợ"
                                value={stats.brokerUnreceived}
                                accent="border-l-red-500"
                                valueColor="text-red-600"
                            />
                        </div>

                        {/* DANH SÁCH HOA HỒNG: đã nhận / chưa nhận */}
                        <div className="bg-white border border-stone-200 rounded-2xl p-3.5">
                            <div className="flex items-center justify-between mb-2.5">
                                <h3 className="text-sm font-semibold text-stone-700">
                                    Danh sách hoa hồng
                                </h3>
                            </div>

                            {/* Tab switch */}
                            <div className="flex gap-1 bg-stone-100 rounded-lg p-1 mb-2.5">
                                <button
                                    onClick={() => setFeeTab("unreceived")}
                                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition ${
                                        feeTab === "unreceived"
                                            ? "bg-white text-red-600 shadow-sm"
                                            : "text-stone-500"
                                    }`}
                                >
                                    <FiClock size={12} />
                                    Chưa nhận (
                                    {rentals.filter((r) => !r.broker_fee_paid).length})
                                </button>
                                <button
                                    onClick={() => setFeeTab("received")}
                                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition ${
                                        feeTab === "received"
                                            ? "bg-white text-emerald-700 shadow-sm"
                                            : "text-stone-500"
                                    }`}
                                >
                                    <FiCheckCircle size={12} />
                                    Đã nhận (
                                    {rentals.filter((r) => r.broker_fee_paid).length})
                                </button>
                            </div>

                            {/* Danh sách theo tab */}
                            {(() => {
                                const list = rentals.filter((r) =>
                                    feeTab === "received"
                                        ? r.broker_fee_paid
                                        : !r.broker_fee_paid
                                );

                                if (list.length === 0) {
                                    return (
                                        <div className="py-6 text-center text-stone-400 text-xs">
                                            {feeTab === "received"
                                                ? "Chưa có khoản nào đã nhận"
                                                : "Không còn khoản nào chưa nhận"}
                                        </div>
                                    );
                                }

                                return list.map((r) => (
                                    <div
                                        key={r.id}
                                        className={`flex justify-between items-start gap-2 text-sm border-l-4 rounded-md px-2.5 py-2 mb-1.5 last:mb-0 ${
                                            r.broker_fee_paid
                                                ? "border-l-emerald-400 bg-emerald-50/50"
                                                : "border-l-red-400 bg-red-50/50"
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <div className="text-stone-800 font-medium truncate">
                                                {r.homes?.name
                                                    ? `${r.homes.name} • ${r.homes?.address || "Không rõ địa chỉ"}`
                                                    : r.homes?.address || "Không rõ địa chỉ"}
                                            </div>
                                            <div className="text-[11px] text-stone-400 mt-0.5">
                                                {new Date(r.deal_date).toLocaleDateString("vi-VN")}
                                            </div>
                                        </div>
                                        <div
                                            className={`font-medium whitespace-nowrap ${
                                                r.broker_fee_paid
                                                    ? "text-emerald-700"
                                                    : "text-red-600"
                                            }`}
                                        >
                                            {Number(r.broker_fee || 0).toLocaleString("vi-VN")}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>

                        {/* EXPENSE */}
                        <div className="bg-white border border-stone-200 rounded-2xl p-3.5">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-sm font-semibold text-stone-700">Chi phí</h3>
                                <span className="text-xs text-stone-400">
                                    {expenses.length} khoản
                                </span>
                            </div>

                            {expenses.length === 0 ? (
                                <div className="py-6 text-center text-stone-400 text-xs">
                                    Không có chi phí trong tháng này
                                </div>
                            ) : (
                                expenses.map((e) => (
                                    <div
                                        key={e.id}
                                        className="flex justify-between items-start gap-2 text-sm border-b border-stone-100 py-2 last:border-none"
                                    >
                                        <div className="min-w-0">
                                            <div className="text-stone-800 font-medium truncate">
                                                {e.homes?.name
                                                    ? `${e.homes.name} • ${e.expenses_type?.type_name || "Khác"}`
                                                    : e.expenses_type?.type_name || "Khác"}
                                            </div>
                                            {e.homes?.address && (
                                                <div className="text-stone-400 text-[11px] truncate">
                                                    {e.homes.address}
                                                </div>
                                            )}
                                            {e.notes && (
                                                <div className="text-stone-500 text-xs truncate">
                                                    {e.notes}
                                                </div>
                                            )}
                                            <div className="text-[11px] text-stone-400 mt-0.5">
                                                {new Date(e.expense_date).toLocaleDateString("vi-VN")}
                                            </div>
                                        </div>
                                        <div className="text-red-500 font-medium whitespace-nowrap">
                                            −{Number(e.expense).toLocaleString("vi-VN")}
                                        </div>
                                    </div>
                                ))
                            )}

                            <div className="flex justify-between pt-2 mt-1 border-t border-stone-200 font-semibold text-red-600 text-sm">
                                <span>Tổng chi</span>
                                <span>{stats.expenseTotal.toLocaleString("vi-VN")}</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// =========================
// COMPONENTS
// =========================

function Kpi({ icon, title, value, accent, valueColor }) {
    return (
        <div
            className={`bg-white border border-stone-200 border-l-4 ${accent} rounded-xl p-2.5 flex flex-col gap-1`}
        >
            <div className="flex items-center gap-1 text-[11px] text-stone-500">
                {icon}
                <span className="truncate">{title}</span>
            </div>
            <div className={`font-bold text-sm ${valueColor}`}>
                {Number(value).toLocaleString("vi-VN")}
            </div>
        </div>
    );
}
