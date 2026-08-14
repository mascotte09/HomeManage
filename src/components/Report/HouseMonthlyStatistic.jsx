import { useEffect, useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { useParams } from "react-router-dom";
import html2canvas from "html2canvas";
import {
    FiDownload,
    FiTrendingUp,
    FiClock,
} from "react-icons/fi";

import { db } from "../../db/db";

export default function HouseMonthlyStatistic() {

    const { houseId } = useParams();

    const reportRef = useRef(null);


    // =========================================================
    // THÁNG ĐANG CHỌN
    // =========================================================

    const [selectedMonth, setSelectedMonth] = useState(() => {

        const d = new Date();

        const y = d.getFullYear();

        const m = String(
            d.getMonth() + 1
        ).padStart(2, "0");

        return `${y}-${m}`;
    });


    // =========================================================
    // EXPENSES
    // =========================================================

    const [expenses, setExpenses] = useState([]);


    // =========================================================
    // STATS
    // =========================================================

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


    // =========================================================
    // RESET STATS
    // =========================================================

    const resetStats = useCallback(() => {

        setExpenses([]);

        setStats({

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

    }, []);


    // =========================================================
    // FETCH STATISTICS - LOCAL ONLY
    // =========================================================

    const fetchStatistics = useCallback(async () => {

        try {

            if (!houseId) {

                console.warn(
                    "⚠️ Không có houseId"
                );

                resetStats();

                return;
            }


            // =================================================
            // XÁC ĐỊNH THÁNG
            // =================================================

            const [
                year,
                month
            ] = selectedMonth.split("-");


            const startDate =
                new Date(
                    Number(year),
                    Number(month) - 1,
                    1,
                    0,
                    0,
                    0,
                    0
                );


            const endDate =
                Number(month) === 12

                    ? new Date(
                        Number(year) + 1,
                        0,
                        1,
                        0,
                        0,
                        0,
                        0
                    )

                    : new Date(
                        Number(year),
                        Number(month),
                        1,
                        0,
                        0,
                        0,
                        0
                    );


            // =================================================
            // 1. LẤY ROOMS LOCAL
            // =================================================

            const allRooms =
                await db.rooms.toArray();


            const rooms =
                allRooms.filter(room => {

                    if (
                        room.retired === true
                    ) {
                        return false;
                    }

                    return (
                        String(room.home_id) ===
                        String(houseId)
                    );
                });


            const roomIds =
                new Set(
                    rooms
                        .map(
                            room => room.id
                        )
                        .filter(Boolean)
                );


            // =================================================
            // 2. LẤY INVOICES LOCAL
            // =================================================

            const allInvoices =
                await db.invoices.toArray();


            const invoices =
                allInvoices.filter(invoice => {

                    // -----------------------------------------
                    // Chỉ lấy invoice thuộc room của nhà
                    // -----------------------------------------

                    if (
                        !roomIds.has(
                            invoice.room_id
                        )
                    ) {

                        return false;
                    }


                    // -----------------------------------------
                    // Không lấy retired
                    // -----------------------------------------

                    if (
                        invoice.retired === true
                    ) {

                        return false;
                    }


                    // -----------------------------------------
                    // Không có ngày
                    // -----------------------------------------

                    if (
                        !invoice.invoice_create_date
                    ) {

                        return false;
                    }


                    const invoiceDate =
                        new Date(
                            invoice.invoice_create_date
                        );


                    // -----------------------------------------
                    // Lọc theo tháng
                    // -----------------------------------------

                    return (
                        invoiceDate >= startDate &&
                        invoiceDate < endDate
                    );
                });


            // =================================================
            // 3. TÍNH INVOICE
            // =================================================

            let totalInvoice = 0;

            let paidInvoiceCount = 0;

            let paidDemiInvoiceCount = 0;

            let paidAmount = 0;

            let unpaidInvoiceCount = 0;

            let unpaidAmount = 0;

            let rentalTotal = 0;

            let electricityTotal = 0;

            let electricityUsed = 0;

            let waterTotal = 0;

            let waterUsed = 0;

            let wifiTotal = 0;

            let grandTotal = 0;


            for (
                const invoice
                of invoices
            ) {

                // ---------------------------------------------
                // Tổng hóa đơn
                // ---------------------------------------------

                totalInvoice++;


                const debit =
                    Number(
                        invoice.debit_amount
                    ) || 0;


                const total =
                    Number(
                        invoice.total_amount
                    ) || 0;


                // ---------------------------------------------
                // Đã thanh toán đủ
                //
                // debit <= 0
                // ---------------------------------------------

                if (
                    debit <= 0
                ) {

                    paidInvoiceCount++;
                }


                // ---------------------------------------------
                // Thanh toán một phần
                //
                // debit > 0
                // debit < total
                // ---------------------------------------------

                if (
                    debit > 0 &&
                    debit < total
                ) {

                    paidDemiInvoiceCount++;
                }


                // ---------------------------------------------
                // Đã thu
                //
                // total - debit
                // ---------------------------------------------

                paidAmount += Math.max(
                    total - debit,
                    0
                );


                // ---------------------------------------------
                // Còn nợ
                // ---------------------------------------------

                if (
                    debit > 0
                ) {

                    unpaidInvoiceCount++;

                    unpaidAmount += debit;
                }


                // ---------------------------------------------
                // Tiền phòng
                // ---------------------------------------------

                rentalTotal +=
                    Number(
                        invoice.rental_amount
                    ) || 0;


                // ---------------------------------------------
                // Tiền điện
                // ---------------------------------------------

                electricityTotal +=
                    Number(
                        invoice.elect_amount
                    ) || 0;


                // ---------------------------------------------
                // Điện sử dụng
                // ---------------------------------------------

                const newElectricity =
                    Number(
                        invoice.new_electricity_number
                    ) || 0;


                const currentElectricity =
                    Number(
                        invoice.current_electricity_number
                    ) || 0;


                electricityUsed +=
                    newElectricity -
                    currentElectricity;


                // ---------------------------------------------
                // Tiền nước
                // ---------------------------------------------

                waterTotal +=
                    Number(
                        invoice.water_amount
                    ) || 0;


                // ---------------------------------------------
                // Nước sử dụng
                // ---------------------------------------------

                const newWater =
                    Number(
                        invoice.new_water_number
                    ) || 0;


                const currentWater =
                    Number(
                        invoice.current_water_number
                    ) || 0;


                waterUsed +=
                    newWater -
                    currentWater;


                // ---------------------------------------------
                // WIFI
                // ---------------------------------------------

                wifiTotal +=
                    Number(
                        invoice.wifi_amount
                    ) || 0;


                // ---------------------------------------------
                // Tổng doanh thu
                // ---------------------------------------------

                grandTotal += total;
            }


            // =================================================
            // 4. LẤY EXPENSE LOCAL
            // =================================================

            const allExpenses =
                await db.expenses.toArray();


            let expensesData =
                allExpenses.filter(expense => {

                    // -----------------------------------------
                    // Đúng nhà
                    // -----------------------------------------

                    if (
                        String(expense.home_id) !==
                        String(houseId)
                    ) {

                        return false;
                    }


                    // -----------------------------------------
                    // Không lấy retired
                    // -----------------------------------------

                    if (
                        expense.retired === true
                    ) {

                        return false;
                    }


                    // -----------------------------------------
                    // Có ngày
                    // -----------------------------------------

                    if (
                        !expense.expense_date
                    ) {

                        return false;
                    }


                    const expenseDate =
                        new Date(
                            expense.expense_date
                        );


                    // -----------------------------------------
                    // Đúng tháng
                    // -----------------------------------------

                    return (
                        expenseDate >= startDate &&
                        expenseDate < endDate
                    );
                });


            // =================================================
            // 5. JOIN EXPENSE TYPE LOCAL
            // =================================================
            //
            // Nếu db không có expenses_type
            // thì bỏ qua.
            // =================================================

            try {

                if (
                    db.expenses_type
                ) {

                    const expenseTypes =
                        await db.expenses_type.toArray();


                    const expenseTypeMap =
                        new Map(
                            expenseTypes.map(
                                type => [
                                    type.id,
                                    type.type_name
                                ]
                            )
                        );


                    expensesData =
                        expensesData.map(
                            expense => ({

                                ...expense,

                                expenses_type: {

                                    type_name:
                                        expenseTypeMap.get(
                                            expense.expense_type_id
                                        ) || "",
                                },
                            })
                        );
                }

            } catch (error) {

                console.warn(
                    "⚠️ Không thể JOIN expenses_type local:",
                    error
                );
            }


            // =================================================
            // 6. TỔNG CHI PHÍ
            // =================================================

            const expenseTotal =
                expensesData.reduce(
                    (
                        sum,
                        item
                    ) => {

                        return (
                            sum +
                            (
                                Number(
                                    item.expense
                                ) || 0
                            )
                        );

                    },
                    0
                );


            // =================================================
            // 7. SET EXPENSES
            // =================================================

            setExpenses(
                expensesData
            );


            // =================================================
            // 8. SET STATS
            // =================================================

            setStats({

                rentalTotal,

                totalInvoice,

                paidInvoiceCount,

                paidDemiInvoiceCount,

                paidAmount,

                unpaidInvoiceCount,

                unpaidAmount,

                electricityTotal,

                electricityUsed,

                waterTotal,

                waterUsed,

                wifiTotal,

                expenseTotal,

                grandTotal,
            });


            // =================================================
            // DEBUG
            // =================================================

            console.log(
                "📊 MONTHLY STATISTIC LOCAL",
                {

                    houseId,

                    selectedMonth,

                    rooms:
                        rooms.length,

                    invoices:
                        invoices.length,

                    expenses:
                        expensesData.length,

                    totalInvoice,

                    rentalTotal,

                    electricityTotal,

                    electricityUsed,

                    waterTotal,

                    waterUsed,

                    wifiTotal,

                    paidAmount,

                    unpaidAmount,

                    expenseTotal,

                    grandTotal,
                }
            );


        } catch (error) {

            console.error(
                "❌ Lỗi thống kê Local:",
                error
            );

            resetStats();
        }

    }, [
        selectedMonth,
        houseId,
        resetStats
    ]);


    // =========================================================
    // LOAD
    // =========================================================

    useEffect(() => {

        fetchStatistics();

    }, [
        fetchStatistics
    ]);


    // =========================================================
    // GỬI ẢNH
    // =========================================================

    const handleSendImage = async () => {

        try {

            if (
                !reportRef.current
            ) {

                return;
            }


            const canvas =
                await html2canvas(
                    reportRef.current,
                    {
                        scale: 2,
                        useCORS: true,
                    }
                );


            const blob =
                await new Promise(
                    resolve =>
                        canvas.toBlob(
                            resolve,
                            "image/png"
                        )
                );


            if (!blob) {

                throw new Error(
                    "Không tạo được ảnh"
                );
            }


            const file =
                new File(
                    [
                        blob
                    ],
                    `BaoCao_${selectedMonth}.png`,
                    {
                        type: "image/png"
                    }
                );


            // =================================================
            // MOBILE SHARE
            // =================================================

            if (
                navigator.share &&
                navigator.canShare?.({
                    files: [file]
                })
            ) {

                await navigator.share({

                    title:
                        "Báo cáo tháng",

                    text:
                        `Báo cáo ${selectedMonth}`,

                    files: [
                        file
                    ],
                });

                return;
            }


            // =================================================
            // DESKTOP DOWNLOAD
            // =================================================

            const url =
                URL.createObjectURL(
                    blob
                );


            const a =
                document.createElement(
                    "a"
                );


            a.href = url;

            a.download =
                file.name;

            a.click();


            URL.revokeObjectURL(
                url
            );

        } catch (error) {

            console.error(
                "❌ Capture error:",
                error
            );

            alert(
                "Không thể chụp màn hình"
            );
        }
    };


    // =========================================================
    // EXPORT EXCEL
    // =========================================================

    const handleExportExcel = async () => {

        try {

            const rows = [

                [
                    "Chỉ tiêu",
                    "Giá trị"
                ],

                [
                    "Doanh thu",
                    stats.grandTotal
                ],

                [
                    "Tiền phòng",
                    stats.rentalTotal
                ],

                [
                    "Tiền điện",
                    stats.electricityTotal
                ],

                [
                    "Tiền nước",
                    stats.waterTotal
                ],

                [
                    "Wifi",
                    stats.wifiTotal
                ],

                [
                    "Đã thu",
                    stats.paidAmount
                ],

                [
                    "Còn nợ",
                    stats.unpaidAmount
                ],

                [
                    "Chi phí",
                    stats.expenseTotal
                ],

                [
                    "Lợi nhuận",
                    profit
                ],
            ];


            const ws =
                XLSX.utils.aoa_to_sheet(
                    rows
                );


            const wb =
                XLSX.utils.book_new();


            XLSX.utils.book_append_sheet(
                wb,
                ws,
                "BaoCao"
            );


            const buffer =
                XLSX.write(
                    wb,
                    {
                        bookType: "xlsx",
                        type: "array",
                    }
                );


            const blob =
                new Blob(
                    [
                        buffer
                    ],
                    {
                        type:
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    }
                );


            const file =
                new File(
                    [
                        blob
                    ],
                    `BaoCao_${selectedMonth}.xlsx`,
                    {
                        type:
                            blob.type
                    }
                );


            const isMobile =
                /Android|iPhone|iPad/i.test(
                    navigator.userAgent
                );


            // =================================================
            // MOBILE SHARE
            // =================================================

            if (
                isMobile &&
                navigator.share &&
                navigator.canShare?.({
                    files: [file]
                })
            ) {

                try {

                    await navigator.share({

                        title:
                            "Báo cáo Excel",

                        files: [
                            file
                        ],
                    });

                    return;

                } catch (error) {

                    console.log(
                        "Share failed:",
                        error
                    );
                }
            }


            // =================================================
            // DOWNLOAD
            // =================================================

            const url =
                URL.createObjectURL(
                    blob
                );


            const a =
                document.createElement(
                    "a"
                );


            a.href = url;

            a.download =
                file.name;

            a.click();


            URL.revokeObjectURL(
                url
            );

        } catch (error) {

            console.error(
                "❌ Export Excel error:",
                error
            );

            alert(
                "Không thể xuất Excel"
            );
        }
    };


    // =========================================================
    // COMPUTED
    // =========================================================

    const profit =
        stats.grandTotal -
        stats.expenseTotal;


    const debtRate =
        stats.grandTotal > 0

            ? (
                (
                    stats.paidAmount *
                    100
                ) /
                stats.grandTotal
            ).toFixed(1)

            : 0;


    const [
        monthLabel,
        yearLabel
    ] =
        selectedMonth
            .split("-")
            .reverse();


    // =========================================================
    // UI
    // =========================================================

    return (

        <div
            ref={reportRef}
            className="bg-slate-50 p-3 rounded-2xl space-y-3"
        >

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex justify-between items-center gap-2">

                {/* MONTH PICKER */}

                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">

                    <span className="text-slate-500 text-sm">
                        Tháng
                    </span>


                    <select
                        value={selectedMonth}
                        onChange={(e) =>
                            setSelectedMonth(
                                e.target.value
                            )
                        }
                        className="text-slate-800 font-bold text-sm bg-transparent focus:outline-none"
                    >

                        {Array.from(
                            {
                                length: 24
                            },
                            (_, i) => {

                                const date =
                                    new Date();


                                date.setMonth(
                                    date.getMonth() -
                                    12 +
                                    i
                                );


                                const y =
                                    date.getFullYear();


                                const m =
                                    String(
                                        date.getMonth() +
                                        1
                                    ).padStart(
                                        2,
                                        "0"
                                    );


                                const value =
                                    `${y}-${m}`;


                                return (

                                    <option
                                        key={value}
                                        value={value}
                                    >
                                        {m}/{y}
                                    </option>

                                );
                            }
                        )}

                    </select>

                </div>


                {/* BUTTONS */}

                <div className="flex items-center gap-2">

                    <button
                        onClick={
                            handleExportExcel
                        }
                        title="Xuất Excel"
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full shadow-sm text-slate-600 hover:bg-slate-100"
                    >
                        <FiDownload
                            size={17}
                        />
                    </button>


                    <button
                        onClick={
                            handleSendImage
                        }
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold shadow-sm"
                    >
                        Gửi
                    </button>

                </div>

            </div>


            {/* =================================================
                PROFIT HERO
            ================================================= */}

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">

                <div className="flex items-center gap-1.5 text-emerald-600 text-sm mb-1">

                    <FiTrendingUp
                        size={16}
                    />

                    <span>
                        Lợi nhuận ròng tháng{" "}
                        {monthLabel}/{yearLabel}
                    </span>

                </div>


                <div className="text-3xl font-extrabold text-emerald-700 mb-1">

                    {profit.toLocaleString(
                        "vi-VN"
                    )}{" "}
                    đ

                </div>


                <div className="text-slate-500 text-sm">

                    Doanh thu{" "}
                    {stats.grandTotal.toLocaleString(
                        "vi-VN"
                    )}{" "}

                    – Chi phí{" "}

                    {stats.expenseTotal.toLocaleString(
                        "vi-VN"
                    )}

                </div>

            </div>


            {/* =================================================
                THU TIỀN
            ================================================= */}

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">

                <div className="flex justify-between items-center mb-2">

                    <h3 className="font-bold text-slate-800">
                        Tình hình thu tiền
                    </h3>


                    <span className="text-sm font-semibold text-slate-500">

                        {debtRate}%
                        {" "}đã thu

                    </span>

                </div>


                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">

                    <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                            width: `${Math.min(
                                Number(debtRate),
                                100
                            )}%`
                        }}
                    />

                </div>


                <div className="flex items-center gap-1.5 text-sm text-rose-500 font-medium">

                    <FiClock
                        size={14}
                    />

                    <span>

                        Còn{" "}

                        {stats.unpaidAmount.toLocaleString(
                            "vi-VN"
                        )}{" "}

                        đ chưa thu

                    </span>

                </div>

            </div>


            {/* =================================================
                BODY
            ================================================= */}

            <div className="grid grid-cols-2 gap-2">

                {/* =================================================
                    DOANH THU
                ================================================= */}

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

                    <div className="bg-blue-50 text-center py-2.5 border-b border-blue-100">

                        <h3 className="font-bold text-blue-600 text-sm">
                            Doanh thu
                        </h3>


                        <div className="font-extrabold text-blue-600 text-lg">

                            {stats.grandTotal.toLocaleString(
                                "vi-VN"
                            )}

                        </div>

                    </div>


                    <div className="px-2 py-2">

                        <Row
                            label="Tiền phòng"
                            value={
                                stats.rentalTotal
                            }
                            sub={`${stats.totalInvoice} hóa đơn`}
                        />


                        <Row
                            label="Tiền điện"
                            value={
                                stats.electricityTotal
                            }
                            sub={`${stats.electricityUsed} kWh`}
                        />


                        <Row
                            label="Tiền nước"
                            value={
                                stats.waterTotal
                            }
                            sub={`${stats.waterUsed} m³`}
                        />


                        <Row
                            label="Wifi"
                            value={
                                stats.wifiTotal
                            }
                        />

                    </div>

                </div>


                {/* =================================================
                    CÔNG NỢ
                ================================================= */}

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

                    <div className="bg-orange-50 text-center py-2.5 border-b border-orange-100">

                        <h3 className="font-bold text-orange-600 text-sm">
                            Công nợ
                        </h3>


                        <div className="font-extrabold text-orange-600 text-lg">

                            {stats.unpaidAmount.toLocaleString(
                                "vi-VN"
                            )}

                        </div>

                    </div>


                    <div className="px-2 py-2">

                        <Row
                            label="Đã thu"
                            value={
                                stats.paidAmount
                            }
                            sub={`${stats.paidInvoiceCount + stats.paidDemiInvoiceCount} hóa đơn`}
                        />


                        <Row
                            label="Còn nợ"
                            value={
                                stats.unpaidAmount
                            }
                            sub={`${stats.unpaidInvoiceCount} hóa đơn`}
                        />


                        <Row
                            label="% Thu"
                            value={`${debtRate}%`}
                        />

                    </div>

                </div>

            </div>


            {/* =================================================
                EXPENSE
            ================================================= */}

            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">

                <div className="flex justify-between items-center mb-1">

                    <h3 className="font-bold text-slate-800">
                        Chi phí
                    </h3>


                    <span className="text-sm text-slate-400">

                        {expenses.length}
                        {" "}khoản

                    </span>

                </div>


                {expenses.length === 0 && (

                    <div className="text-center text-sm text-slate-400 py-3">

                        Không có chi phí trong tháng này

                    </div>

                )}


                {expenses.map(
                    expense => (

                        <div
                            key={expense.id}
                            className="flex justify-between items-start text-sm border-l-4 border-rose-400 bg-rose-50/40 rounded-r-lg pl-3 pr-2 py-2 mb-1.5 last:mb-0"
                        >

                            <div>

                                <div className="text-slate-800 font-medium">

                                    {
                                        expense
                                            .expenses_type
                                            ?.type_name
                                    }

                                </div>


                                {expense.notes && (

                                    <div className="text-slate-500 text-xs">

                                        {
                                            expense.notes
                                        }

                                    </div>

                                )}


                                <div className="text-xs text-slate-400">

                                    {expense.expense_date
                                        ? new Date(
                                            expense.expense_date
                                        ).toLocaleDateString(
                                            "vi-VN"
                                        )
                                        : ""
                                    }

                                </div>

                            </div>


                            <div className="text-rose-500 font-semibold whitespace-nowrap">

                                -

                                {(
                                    Number(
                                        expense.expense
                                    ) || 0
                                ).toLocaleString(
                                    "vi-VN"
                                )}

                            </div>

                        </div>

                    )
                )}


                <div className="flex justify-between pt-2 mt-1 border-t border-slate-100 font-bold text-rose-600">

                    <span>
                        Tổng chi
                    </span>


                    <span>

                        {stats.expenseTotal.toLocaleString(
                            "vi-VN"
                        )}

                    </span>

                </div>

            </div>

        </div>
    );
}


// =========================================================
// ROW
// =========================================================

function Row({
    label,
    value,
    sub
}) {

    return (

        <div className="text-slate-800 flex justify-between items-start gap-1 py-1.5 text-sm border-b border-slate-100 last:border-none">

            <div className="min-w-0">

                <div className="truncate">
                    {label}
                </div>


                {sub && (

                    <div className="text-xs text-slate-400 truncate">

                        {sub}

                    </div>

                )}

            </div>


            <div className="font-medium whitespace-nowrap flex-shrink-0">

                {
                    typeof value === "number"

                        ? value.toLocaleString(
                            "vi-VN"
                        )

                        : value
                }

            </div>

        </div>
    );
}