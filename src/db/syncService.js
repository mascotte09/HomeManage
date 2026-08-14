import { db } from "./db";
import { supabase } from "../supabase";

// ═══════════════════════════════════════════════
// SYNC SERVICE
// IndexedDB → Supabase
//
// LOCAL → SUPABASE
//     INSERT / UPDATE
//     DELETE → retired = true
//
// QUAN TRỌNG:
//     ❌ KHÔNG PULL SUPABASE → LOCAL
//     Local IndexedDB là nguồn dữ liệu chính.
//
// Import Local:
//     - Không tạo sync_queue
//     - Có thể pause sync trong lúc import
//     - Sau import chỉ những thay đổi tiếp theo
//       mới được PUSH lên Supabase.
// ═══════════════════════════════════════════════

export const syncService = {

    // ═══════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════

    isSyncing: false,

    isPaused: false,

    interval: null,

    dailyTimeout: null,

    dailyInterval: null,

    onlineHandler: null,


    // ═══════════════════════════════════════════
    // PAUSE
    // ═══════════════════════════════════════════

    pause() {

        console.log(
            "⏸️ SYNC TẠM DỪNG"
        );

        this.isPaused = true;
    },


    // ═══════════════════════════════════════════
    // RESUME
    // ═══════════════════════════════════════════

    resume() {

        console.log(
            "▶️ SYNC TIẾP TỤC"
        );

        this.isPaused = false;
    },


    // ═══════════════════════════════════════════
    // SYNC ALL
    //
    // CHỈ PUSH LOCAL → SUPABASE
    // ═══════════════════════════════════════════

    async syncAll() {

        // ───────────────────────────────────────
        // PAUSE
        // ───────────────────────────────────────

        if (this.isPaused) {

            console.log(
                "⏸️ Sync đang PAUSE - bỏ qua"
            );

            return;
        }


        // ───────────────────────────────────────
        // ĐANG SYNC
        // ───────────────────────────────────────

        if (this.isSyncing) {

            console.log(
                "⏳ Sync đang chạy..."
            );

            return;
        }


        // ───────────────────────────────────────
        // OFFLINE
        // ───────────────────────────────────────

        if (!navigator.onLine) {

            console.log(
                "📴 Offline - bỏ qua sync"
            );

            return;
        }


        this.isSyncing = true;


        try {

            console.log(
                "════════════════════════════════"
            );

            console.log(
                "📤 PUSH LOCAL → SUPABASE"
            );

            console.log(
                "════════════════════════════════"
            );


            // ═══════════════════════════════════
            // HOMES
            // ═══════════════════════════════════

            await this.syncTable(
                "homes"
            );


            // ═══════════════════════════════════
            // ROOMS
            // ═══════════════════════════════════

            await this.syncTable(
                "rooms"
            );


            // ═══════════════════════════════════
            // INVOICES
            // ═══════════════════════════════════

            await this.syncTable(
                "invoices"
            );


            // ═══════════════════════════════════
            // EXPENSES
            // ═══════════════════════════════════

            await this.syncTable(
                "expenses"
            );


            console.log(
                "════════════════════════════════"
            );

            console.log(
                "✅ PUSH HOÀN TẤT"
            );

            console.log(
                "🚫 KHÔNG PULL SUPABASE → LOCAL"
            );

            console.log(
                "════════════════════════════════"
            );


        } catch (error) {

            console.error(
                "❌ Sync toàn bộ lỗi:",
                error
            );

        } finally {

            this.isSyncing = false;
        }
    },


    // ═══════════════════════════════════════════
    // GET LOCAL RECORD
    // ═══════════════════════════════════════════

    async getLocalRecord(
        table,
        id
    ) {

        if (
            table === "homes"
        ) {

            return await db.homes.get(id);
        }


        if (
            table === "rooms"
        ) {

            return await db.rooms.get(id);
        }


        if (
            table === "invoices"
        ) {

            return await db.invoices.get(id);
        }


        if (
            table === "expenses"
        ) {

            return await db.expenses.get(id);
        }


        return null;
    },


    // ═══════════════════════════════════════════
    // PUSH LOCAL → SUPABASE
    // ═══════════════════════════════════════════

    async syncTable(
        tableName
    ) {

        if (this.isPaused) {

            console.log(
                `⏸️ ${tableName}: sync đang pause`
            );

            return;
        }


        const queue =
            await db.sync_queue
                .where("table")
                .equals(tableName)
                .sortBy("created_at");


        if (!queue.length) {

            console.log(
                `✓ ${tableName}: không có queue`
            );

            return;
        }


        console.log(
            `📤 ${tableName}: ${queue.length} queue`
        );


        for (
            const item
            of queue
        ) {

            // Nếu Import bắt đầu trong lúc sync
            if (this.isPaused) {

                console.log(
                    `⏸️ Dừng PUSH ${tableName}`
                );

                return;
            }


            try {

                // ═══════════════════════════════
                // DELETE
                // ═══════════════════════════════

                if (
                    item.action === "DELETE"
                ) {

                    console.log(
                        `🗑️ DELETE ${tableName}:`,
                        item.record_id
                    );


                    await this.retireRemoteRecord(
                        item.table,
                        item.record_id
                    );


                    await db.sync_queue.delete(
                        item.id
                    );


                    continue;
                }


                // ═══════════════════════════════
                // INSERT / UPDATE
                // ═══════════════════════════════

                const record =
                    await this.getLocalRecord(
                        tableName,
                        item.record_id
                    );


                // Record không còn Local

                if (!record) {

                    console.warn(
                        `⚠️ ${tableName} ${item.record_id} không còn Local`
                    );


                    await db.sync_queue.delete(
                        item.id
                    );


                    continue;
                }


                // ═══════════════════════════════
                // RETIRED
                // ═══════════════════════════════

                if (
                    record.retired === true
                ) {

                    await db.sync_queue.delete(
                        item.id
                    );

                    continue;
                }


                // ═══════════════════════════════
                // INSERT
                // ═══════════════════════════════

                if (
                    item.action === "INSERT"
                ) {

                    await this.syncInsert(
                        tableName,
                        record
                    );
                }


                // ═══════════════════════════════
                // UPDATE
                // ═══════════════════════════════

                else if (
                    item.action === "UPDATE"
                ) {

                    await this.syncUpdate(
                        tableName,
                        record
                    );
                }


                // ═══════════════════════════════
                // ACTION KHÔNG HỢP LỆ
                // ═══════════════════════════════

                else {

                    console.warn(
                        "⚠️ Action không hợp lệ:",
                        item.action
                    );


                    await db.sync_queue.delete(
                        item.id
                    );


                    continue;
                }


                // ═══════════════════════════════
                // SYNC THÀNH CÔNG
                // ═══════════════════════════════

                await db.sync_queue.delete(
                    item.id
                );


                console.log(
                    `✅ PUSH ${item.action} ${tableName}:`,
                    item.record_id
                );


            } catch (error) {

                console.error(
                    `❌ Sync ${tableName} ${item.record_id}:`,
                    error
                );

                await db.sync_queue.delete(item.id);
            }
        }
    },


    // ═══════════════════════════════════════════
    // RETIRE REMOTE
    //
    // Không DELETE thật trên Supabase.
    // Chỉ retired = true.
    // ═══════════════════════════════════════════

    async retireRemoteRecord(
        table,
        id
    ) {

        const {
            data,
            error
        } = await supabase
            .from(table)
            .update({

                retired: true,

                updated_at:
                    new Date().toISOString()

            })
            .eq(
                "id",
                id
            )
            .select("id");


        if (error) {

            throw error;
        }


        if (
            !data ||
            data.length === 0
        ) {

            console.log(
                `ℹ️ ${table} ${id} không còn active trên Supabase`
            );

            return;
        }


        console.log(
            `🗑️ RETIRE ${table}:`,
            id
        );
    },


    // ═══════════════════════════════════════════
    // INSERT
    // ═══════════════════════════════════════════

    async syncInsert(
        table,
        record
    ) {

        // ═══════════════════════════════
        // ROOM → HOME
        // ═══════════════════════════════

        if (
            table === "rooms"
        ) {

            if (
                !record.home_id
            ) {

                throw new Error(
                    `Room ${record.id} không có home_id`
                );
            }


            const {
                data: home,
                error
            } = await supabase
                .from("homes")
                .select(
                    "id, retired"
                )
                .eq(
                    "id",
                    record.home_id
                )
                .maybeSingle();


            if (error) {

                throw error;
            }


            if (
                !home ||
                home.retired === true
            ) {

                throw new Error(
                    `Home ${record.home_id} chưa tồn tại hoặc đã retired`
                );
            }
        }


        // ═══════════════════════════════
        // INVOICE → ROOM
        // ═══════════════════════════════

        if (
            table === "invoices"
        ) {

            if (
                !record.room_id
            ) {

                throw new Error(
                    `Invoice ${record.id} không có room_id`
                );
            }


            const {
                data: room,
                error
            } = await supabase
                .from("rooms")
                .select(
                    "id, retired"
                )
                .eq(
                    "id",
                    record.room_id
                )
                .maybeSingle();


            if (error) {

                throw error;
            }


            if (
                !room ||
                room.retired === true
            ) {

                throw new Error(
                    `Room ${record.room_id} chưa tồn tại hoặc đã retired`
                );
            }
        }


        // ═══════════════════════════════
        // EXPENSE → HOME
        // ═══════════════════════════════

        if (
            table === "expenses"
        ) {

            if (
                !record.home_id
            ) {

                throw new Error(
                    `Expense ${record.id} không có home_id`
                );
            }


            const {
                data: home,
                error
            } = await supabase
                .from("homes")
                .select(
                    "id, retired"
                )
                .eq(
                    "id",
                    record.home_id
                )
                .maybeSingle();


            if (error) {

                throw error;
            }


            if (
                !home ||
                home.retired === true
            ) {

                throw new Error(
                    `Home ${record.home_id} chưa tồn tại hoặc đã retired`
                );
            }
        }


        // ═══════════════════════════════
        // CLEAN RECORD
        // ═══════════════════════════════

        const cleanRecord =
            this.cleanRecord(
                record
            );


        // ═══════════════════════════════
        // INSERT
        // ═══════════════════════════════

        const {
            error
        } = await supabase
            .from(table)
            .insert(
                cleanRecord
            );


        if (!error) {

            console.log(
                `✅ INSERT ${table}:`,
                record.id
            );

            return;
        }


        // Duplicate
        if (
            error.code === "23505"
        ) {

            console.log(
                `ℹ️ ${table} ${record.id} đã tồn tại`
            );

            return;
        }


        throw error;
    },


    // ═══════════════════════════════════════════
    // UPDATE
    // ═══════════════════════════════════════════

    async syncUpdate(
        table,
        record
    ) {

        const cleanRecord =
            this.cleanRecord(
                record
            );


        const {
            data,
            error
        } = await supabase
            .from(table)
            .update(
                cleanRecord
            )
            .eq(
                "id",
                record.id
            )
            .select("id")
            .maybeSingle();


        if (error) {

            throw error;
        }


        // Không tồn tại → INSERT

        if (!data) {

            console.log(
                `⚠️ ${table} ${record.id} chưa có → INSERT`
            );


            await this.syncInsert(
                table,
                record
            );

            return;
        }


        console.log(
            `✅ UPDATE ${table}:`,
            record.id
        );
    },


    // ═══════════════════════════════════════════
    // CLEAN RECORD
    // ═══════════════════════════════════════════

    cleanRecord(
        record
    ) {

        const data = {
            ...record
        };


        // retired xử lý riêng

        delete data.retired;


        // Không gửi undefined

        Object.keys(data).forEach(
            key => {

                if (
                    data[key] === undefined
                ) {

                    delete data[key];
                }
            }
        );


        return data;
    },


    // ═══════════════════════════════════════════
    // START AUTO SYNC
    //
    // CHỈ PUSH
    // ═══════════════════════════════════════════

    start() {

        this.stop();


        // ═══════════════════════════════════════
        // APP START
        // ═══════════════════════════════════════

        if (
            navigator.onLine &&
            !this.isPaused
        ) {

            this.syncAll();
        }


        // ═══════════════════════════════════════
        // ONLINE EVENT
        // ═══════════════════════════════════════

        this.onlineHandler =
            () => {

                if (
                    this.isPaused
                ) {

                    console.log(
                        "⏸️ Online nhưng sync đang pause"
                    );

                    return;
                }


                console.log(
                    "🌐 Online trở lại"
                );


                this.syncAll();
            };


        window.addEventListener(
            "online",
            this.onlineHandler
        );


        // ═══════════════════════════════════════
        // MỖI 30 GIÂY
        // ═══════════════════════════════════════

        this.interval =
            setInterval(
                () => {

                    if (
                        navigator.onLine &&
                        !this.isPaused
                    ) {

                        this.syncAll();
                    }

                },
                30000
            );


        // ═══════════════════════════════════════
        // DAILY 13:00
        // ═══════════════════════════════════════

        try {

            const now =
                new Date();


            const next =
                new Date(now);


            next.setHours(
                13,
                0,
                0,
                0
            );


            if (
                next <= now
            ) {

                next.setDate(
                    next.getDate() + 1
                );
            }


            const delay =
                next - now;


            this.dailyTimeout =
                setTimeout(
                    () => {

                        if (
                            navigator.onLine &&
                            !this.isPaused
                        ) {

                            this.syncAll();
                        }


                        this.dailyInterval =
                            setInterval(
                                () => {

                                    if (
                                        navigator.onLine &&
                                        !this.isPaused
                                    ) {

                                        this.syncAll();
                                    }

                                },
                                24 *
                                60 *
                                60 *
                                1000
                            );

                    },
                    delay
                );


        } catch (error) {

            console.warn(
                "Không thể tạo daily sync:",
                error
            );
        }
    },


    // ═══════════════════════════════════════════
    // STOP
    // ═══════════════════════════════════════════

    stop() {

        if (
            this.interval
        ) {

            clearInterval(
                this.interval
            );

            this.interval = null;
        }


        if (
            this.dailyTimeout
        ) {

            clearTimeout(
                this.dailyTimeout
            );

            this.dailyTimeout = null;
        }


        if (
            this.dailyInterval
        ) {

            clearInterval(
                this.dailyInterval
            );

            this.dailyInterval = null;
        }


        if (
            this.onlineHandler
        ) {

            window.removeEventListener(
                "online",
                this.onlineHandler
            );

            this.onlineHandler = null;
        }
    }
};