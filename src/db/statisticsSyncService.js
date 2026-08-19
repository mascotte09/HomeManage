import { db } from "./db";
import { supabase } from "../supabase";

const SYNC_INTERVAL = 1000;
const DAYS = 5;


// =====================================================
// NOTIFICATION
// =====================================================

async function showStatisticsNotification(remote) {

    const title =
        "📊 Thống kê đã thay đổi";

    const body =
        `${remote.date}\n` +
        `User: ${remote.users} | ` +
        `Home: ${remote.homes} | ` +
        `Room: ${remote.rooms} | ` +
        `Invoice: ${remote.invoices}`;


    try {

        // ==========================================
        // ƯU TIÊN SERVICE WORKER
        // ==========================================

        if ("serviceWorker" in navigator) {

            const registration =
                await navigator.serviceWorker.ready;

            if (registration) {

                await registration.showNotification(
                    title,
                    {
                        body,
                        icon: "/logo192.png",
                        badge: "/logo192.png",
                        tag: "statistics-update",
                        renotify: true,
                    }
                );

                console.log(
                    "🔔 Notification gửi qua Service Worker"
                );

                return;
            }
        }


        // ==========================================
        // FALLBACK
        // ==========================================

        if (
            "Notification" in window &&
            Notification.permission === "granted"
        ) {

            new Notification(
                title,
                {
                    body,
                    icon: "/logo192.png",
                }
            );

            console.log(
                "🔔 Notification gửi trực tiếp"
            );
        }

    } catch (error) {

        console.error(
            "❌ Không thể gửi notification:",
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
    // LOCAL
    // =====================================================

    async getLocalStatistics() {

        return await db.statistics
            .orderBy("id")
            .toArray();
    },


    // =====================================================
    // TODAY
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

        if (!local || !remote) {
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
    // SAVE LOCAL
    // =====================================================

    async saveLocalStatistics(rows) {

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

        if (this.isSyncing) {
            return;
        }


        if (!navigator.onLine) {

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


            // ==========================================
            // LOCAL
            // ==========================================

            const localRows =
                await this.getLocalStatistics();


            // ==========================================
            // SUPABASE
            // ==========================================

            const remoteRows =
                await this.fetchStatistics();


            // ==========================================
            // TODAY
            // ==========================================

            const todayId =
                this.getTodayId();


            const remoteToday =
                remoteRows.find(
                    row =>
                        row.id === todayId
                );


            if (!remoteToday) {

                console.warn(
                    "⚠️ Không tìm thấy statistics hôm nay"
                );

                return;
            }


            const localToday =
                localRows.find(
                    row =>
                        row.id === todayId
                );


            // ==========================================
            // LẦN ĐẦU
            // ==========================================

            if (!localToday) {

                console.log(
                    "🆕 Chưa có statistics hôm nay"
                );

                await this.saveLocalStatistics(
                    remoteRows
                );

                return;
            }


            // ==========================================
            // SO SÁNH
            // ==========================================

            const changed =
                this.isDayDifferent(
                    localToday,
                    remoteToday
                );


            if (!changed) {

                console.log(
                    "✓ Statistics hôm nay không thay đổi"
                );

                return;
            }


            // ==========================================
            // THAY ĐỔI
            // ==========================================

            console.log(
                "🔔 Statistics hôm nay đã thay đổi"
            );


            // ==========================================
            // NOTIFICATION
            // ==========================================

            await showStatisticsNotification(
                remoteToday
            );


            // ==========================================
            // SAVE LOCAL
            // ==========================================

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


        this.sync();


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

        if (this.interval) {

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