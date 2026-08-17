import { db } from "./db";
import { supabase } from "../supabase";

const SYNC_INTERVAL = 100000; // 100 giây
const DAYS = 5;

export const statisticsSyncService = {
    interval: null,
    isSyncing: false,

    // =====================================================
    // LẤY 5 NGÀY GẦN NHẤT
    //
    // Mỗi ngày chỉ lấy số lượng phát sinh của chính ngày đó
    // =====================================================

    async fetchStatistics() {
        const result = [];

        for (let i = DAYS - 1; i >= 0; i--) {
            const day = new Date();

            day.setDate(day.getDate() - i);

            // Dùng local date để tạo ID
            const year = day.getFullYear();
            const month = String(day.getMonth() + 1).padStart(2, "0");
            const date = String(day.getDate()).padStart(2, "0");

            const dateId = `${year}-${month}-${date}`;

            // RPC chỉ nhận ngày
            const {
                data,
                error
            } = await supabase.rpc(
                "get_dashboard_stats_by_date",
                {
                    target_date: dateId
                }
            );

            if (error) {
                throw error;
            }

            const stats = data?.[0] || {};

            result.push({
                id: dateId,

                date: day.toLocaleDateString(
                    "vi-VN"
                ),

                users: Number(
                    stats.users_count || 0
                ),

                homes: Number(
                    stats.homes_count || 0
                ),

                rooms: Number(
                    stats.rooms_count || 0
                ),

                invoices: Number(
                    stats.invoices_count || 0
                ),

                updated_at:
                    new Date().toISOString()
            });
        }

        return result;
    },


    // =====================================================
    // LẤY LOCAL
    // =====================================================

    async getLocalStatistics() {
        return await db.statistics
            .orderBy("id")
            .toArray();
    },


    // =====================================================
    // SO SÁNH 1 NGÀY
    //
    // Chỉ dùng để kiểm tra ngày cuối cùng
    // =====================================================

    isDayDifferent(local, remote) {
        if (!local || !remote) {
            return true;
        }

        return (
            Number(local.users) !==
                Number(remote.users) ||

            Number(local.homes) !==
                Number(remote.homes) ||

            Number(local.rooms) !==
                Number(remote.rooms) ||

            Number(local.invoices) !==
                Number(remote.invoices)
        );
    },


    // =====================================================
    // NOTIFICATION
    // =====================================================

    async notify(remote) {
        if (!("Notification" in window)) {
            return;
        }

        try {
            if (
                Notification.permission ===
                "default"
            ) {
                await Notification.requestPermission();
            }

            if (
                Notification.permission !==
                "granted"
            ) {
                return;
            }

            new Notification(
                "📊 Thống kê đã thay đổi",
                {
                    body:
                        `${remote.date}: ` +
                        `User ${remote.users} | ` +
                        `Home ${remote.homes} | ` +
                        `Room ${remote.rooms} | ` +
                        `Invoice ${remote.invoices}`,

                    icon: "/logo192.png"
                }
            );

        } catch (error) {
            console.warn(
                "Không thể gửi notification:",
                error
            );
        }
    },


    // =====================================================
    // LƯU 5 NGÀY VÀO LOCAL
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

        // Không cho chạy đồng thời
        if (this.isSyncing) {
            return;
        }

        // Offline
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

            // =================================================
            // 1. LẤY LOCAL
            // =================================================

            const localRows =
                await this.getLocalStatistics();


            // =================================================
            // 2. LẤY SUPABASE
            // =================================================

            const remoteRows =
                await this.fetchStatistics();


            // =================================================
            // 3. NGÀY CUỐI CÙNG
            //
            // remoteRows:
            //
            // [0] 4 ngày trước
            // [1] 3 ngày trước
            // [2] 2 ngày trước
            // [3] hôm qua
            // [4] hôm nay
            // =================================================

            const remoteToday =
                remoteRows[
                    remoteRows.length - 1
                ];

            const localToday =
                localRows.find(
                    row =>
                        row.id ===
                        remoteToday.id
                );


            // =================================================
            // 4. KIỂM TRA HÔM NAY CÓ THAY ĐỔI KHÔNG
            // =================================================

            const todayChanged =
                this.isDayDifferent(
                    localToday,
                    remoteToday
                );


            if (todayChanged) {

                console.log(
                    "🔔 Statistics hôm nay thay đổi"
                );

            } else {

                console.log(
                    "✓ Statistics hôm nay không thay đổi"
                );
            }


            // =================================================
            // 5. LƯU 5 NGÀY MỚI VÀO LOCAL
            // =================================================

            await this.saveLocalStatistics(
                remoteRows
            );


            // =================================================
            // 6. CHỈ NOTIFICATION NẾU HÔM NAY THAY ĐỔI
            // =================================================

            if (todayChanged) {

                await this.notify(
                    remoteToday
                );
            }


            console.log(
                "✅ Statistics Sync hoàn tất"
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

        // Kiểm tra ngay khi mở app
        this.sync();


        // Sau đó kiểm tra mỗi 5 giây
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
    }
};