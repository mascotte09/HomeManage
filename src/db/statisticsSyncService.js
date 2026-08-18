import { db } from "./db";
import { supabase } from "../supabase";

const SYNC_INTERVAL = 1000; // 100 giây
const DAYS = 5;

// =====================================================
// NOTIFICATION
// =====================================================

function showStatisticsNotification(remote) {

    if (
        typeof window === "undefined" ||
        !("Notification" in window)
    ) {
        return;
    }

    // Chỉ thông báo nếu user đã cấp quyền
    if (
        Notification.permission !== "granted"
    ) {
        return;
    }

    try {

        new Notification(
            "📊 Thống kê đã thay đổi",
            {
                body:
                    `${remote.date}\n` +
                    `User: ${remote.users} | ` +
                    `Home: ${remote.homes} | ` +
                    `Room: ${remote.rooms} | ` +
                    `Invoice: ${remote.invoices}`,

                icon: "/logo192.png",
            }
        );

    } catch (error) {

        console.warn(
            "Không thể gửi notification:",
            error
        );
    }
}


// =====================================================
// SERVICE
// =====================================================

export const statisticsSyncService = {

    interval: null,

    isSyncing: false,


    // =====================================================
    // LẤY 5 NGÀY GẦN NHẤT
    // =====================================================

    async fetchStatistics() {

        const result = [];

        for (
            let i = DAYS - 1;
            i >= 0;
            i--
        ) {

            const day = new Date();

            day.setDate(
                day.getDate() - i
            );


            // ---------------------------------------------
            // YYYY-MM-DD
            // ---------------------------------------------

            const year =
                day.getFullYear();

            const month =
                String(
                    day.getMonth() + 1
                ).padStart(2, "0");

            const date =
                String(
                    day.getDate()
                ).padStart(2, "0");

            const dateId =
                `${year}-${month}-${date}`;


            // ---------------------------------------------
            // GỌI RPC
            // ---------------------------------------------

            const {
                data,
                error
            } = await supabase.rpc(
                "get_dashboard_stats_by_date",
                {
                    target_date: dateId,
                }
            );


            if (error) {

                throw error;
            }


            const stats =
                data?.[0] || {};


            result.push({

                id: dateId,

                date:
                    day.toLocaleDateString(
                        "vi-VN"
                    ),

                users:
                    Number(
                        stats.users_count || 0
                    ),

                homes:
                    Number(
                        stats.homes_count || 0
                    ),

                rooms:
                    Number(
                        stats.rooms_count || 0
                    ),

                invoices:
                    Number(
                        stats.invoices_count || 0
                    ),

                updated_at:
                    new Date().toISOString(),
            });
        }


        return result;
    },


    // =====================================================
    // ĐỌC LOCAL
    // =====================================================

    async getLocalStatistics() {

        return await db.statistics
            .orderBy("id")
            .toArray();
    },


    // =====================================================
    // TÌM NGÀY HÔM NAY
    // =====================================================

    getTodayId() {

        const today =
            new Date();

        const year =
            today.getFullYear();

        const month =
            String(
                today.getMonth() + 1
            ).padStart(2, "0");

        const date =
            String(
                today.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${date}`;
    },


    // =====================================================
    // SO SÁNH
    // =====================================================

    isDayDifferent(
        local,
        remote
    ) {

        if (
            !local ||
            !remote
        ) {
            return false;
        }


        return (

            Number(local.users) !==
                Number(remote.users)

            ||

            Number(local.homes) !==
                Number(remote.homes)

            ||

            Number(local.rooms) !==
                Number(remote.rooms)

            ||

            Number(local.invoices) !==
                Number(remote.invoices)
        );
    },


    // =====================================================
    // LƯU LOCAL
    // =====================================================

    async saveLocalStatistics(
        rows
    ) {

        await db.transaction(
            "rw",
            db.statistics,
            async () => {

                await db.statistics.clear();

                await db.statistics.bulkPut(
                    rows
                );
            }
        );
    },


    // =====================================================
    // SYNC
    // =====================================================

    async sync() {

        // ---------------------------------------------
        // Không chạy đồng thời
        // ---------------------------------------------

        if (
            this.isSyncing
        ) {
            return;
        }


        // ---------------------------------------------
        // Offline
        // ---------------------------------------------

        if (
            !navigator.onLine
        ) {

            console.log(
                "📴 Offline → bỏ qua Statistics Sync"
            );

            return;
        }


        this.isSyncing = true;


        try {

            console.log(
                "📊 Kiểm tra Statistics..."
            );


            // =================================================
            // 1. LOCAL
            // =================================================

            const localRows =
                await this.getLocalStatistics();


            // =================================================
            // 2. SUPABASE
            // =================================================

            const remoteRows =
                await this.fetchStatistics();


            // =================================================
            // 3. LẤY HÔM NAY
            // =================================================

            const todayId =
                this.getTodayId();


            const remoteToday =
                remoteRows.find(
                    row =>
                        row.id ===
                        todayId
                );


            if (
                !remoteToday
            ) {

                console.warn(
                    "⚠️ Không tìm thấy statistics hôm nay"
                );

                return;
            }


            // =================================================
            // 4. TÌM HÔM NAY TRONG LOCAL
            // =================================================

            const localToday =
                localRows.find(
                    row =>
                        row.id ===
                        todayId
                );


            // =================================================
            // 5. LẦN ĐẦU CHƯA CÓ LOCAL
            // =================================================

            if (
                !localToday
            ) {

                console.log(
                    "🆕 Chưa có statistics hôm nay → lưu local"
                );

                await this.saveLocalStatistics(
                    remoteRows
                );

                // Không notification lần đầu
                return;
            }


            // =================================================
            // 6. KIỂM TRA THAY ĐỔI
            // =================================================

            const changed =
                this.isDayDifferent(
                    localToday,
                    remoteToday
                );


            if (
                !changed
            ) {

                console.log(
                    "✓ Statistics hôm nay không thay đổi"
                );

                return;
            }


            // =================================================
            // 7. CÓ THAY ĐỔI
            // =================================================

            console.log(
                "🔔 Statistics hôm nay đã thay đổi"
            );


            // =================================================
            // 8. NOTIFICATION
            // =================================================

            showStatisticsNotification(
                remoteToday
            );


            // =================================================
            // 9. CẬP NHẬT LOCAL
            // =================================================

            await this.saveLocalStatistics(
                remoteRows
            );


            console.log(
                "✅ Statistics đã cập nhật Local"
            );


        } catch (error) {

            console.error(
                "❌ Statistics Sync lỗi:",
                error
            );

        } finally {

            this.isSyncing = false;
        }
    },


    // =====================================================
    // START
    // =====================================================

    start() {

        this.stop();


        console.log(
            "▶️ Statistics Sync Service started"
        );


        // Kiểm tra ngay
        this.sync();


        // Sau đó mỗi 100 giây
        this.interval =
            setInterval(
                () => {

                    this.sync();

                },
                SYNC_INTERVAL
            );
    },


    // =====================================================
    // STOP
    // =====================================================

    stop() {

        if (
            this.interval
        ) {

            clearInterval(
                this.interval
            );

            this.interval = null;
        }


        console.log(
            "⏹️ Statistics Sync Service stopped"
        );
    },
};