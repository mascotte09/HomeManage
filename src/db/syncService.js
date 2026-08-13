import { db } from "./db";
import { supabase } from "../supabase";

// ═══════════════════════════════════════════════
// SYNC SERVICE
// IndexedDB ⇄ Supabase
//
// PUSH:
// Local thay đổi → sync_queue → Supabase
//
// PULL:
// Supabase → Local
//
// DELETE:
// Local xóa hẳn
// → queue DELETE
// → Supabase UPDATE retired = true
//
// Không DELETE thật trên Supabase.
// Không tạo duplicate.
// Không pull record retired=true.
// Không pull đè record đang chờ PUSH.
// ═══════════════════════════════════════════════

export const syncService = {

    isSyncing: false,

    interval: null,
    dailyTimeout: null,
    dailyInterval: null,
    onlineHandler: null,


    // ═════════════════════════════════════════════
    // SYNC ALL
    // ═════════════════════════════════════════════

    async syncAll() {

        if (this.isSyncing) {

            console.log("⏳ Sync đang chạy...");

            return;
        }

        if (!navigator.onLine) {

            console.log("📴 Offline - bỏ qua sync");

            return;
        }

        this.isSyncing = true;

        try {

            console.log("════════════════════════════");
            console.log("🔄 BẮT ĐẦU ĐỒNG BỘ");
            console.log("════════════════════════════");


            // ═══════════════════════════════════════
            // 1. PUSH
            // ═══════════════════════════════════════

            console.log("📤 PUSH HOMES");

            await this.syncTable("homes");


            console.log("📤 PUSH ROOMS");

            await this.syncTable("rooms");


            console.log("📤 PUSH INVOICES");

            await this.syncTable("invoices");


            // ═══════════════════════════════════════
            // 2. PULL
            // ═══════════════════════════════════════

            console.log("📥 PULL HOMES");

            await this.pullTable("homes");


            console.log("📥 PULL ROOMS");

            await this.pullTable("rooms");


            console.log("📥 PULL INVOICES");

            await this.pullTable("invoices");


            console.log("════════════════════════════");
            console.log("✅ ĐỒNG BỘ HOÀN TẤT");
            console.log("════════════════════════════");

        } catch (error) {

            console.error(
                "❌ Sync toàn bộ lỗi:",
                error
            );

        } finally {

            this.isSyncing = false;
        }
    },


    // ═════════════════════════════════════════════
    // GET LOCAL RECORD
    // ═════════════════════════════════════════════

    async getLocalRecord(table, id) {

        if (table === "homes") {

            return await db.homes.get(id);
        }

        if (table === "rooms") {

            return await db.rooms.get(id);
        }

        if (table === "invoices") {

            return await db.invoices.get(id);
        }

        return null;
    },


    // ═════════════════════════════════════════════
    // PUSH LOCAL → SUPABASE
    // ═════════════════════════════════════════════

    async syncTable(tableName) {

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


        for (const item of queue) {

            try {

                // ═══════════════════════════════
                // DELETE
                //
                // QUAN TRỌNG:
                // DELETE phải xử lý TRƯỚC khi
                // lấy record local.
                //
                // Vì record đã bị xóa khỏi
                // IndexedDB.
                // ═══════════════════════════════

                if (item.action === "DELETE") {

                    console.log(
                        `🗑️ DELETE ${tableName} ${item.record_id} → retired=true`
                    );


                    try {

                        await this.retireRemoteRecord(
                            item.table,
                            item.record_id
                        );


                        // Chỉ xóa queue khi
                        // Supabase thành công

                        await db.sync_queue.delete(
                            item.id
                        );


                        console.log(
                            `✅ FIN DELETE ${tableName} ${item.record_id}`
                        );

                    } catch (error) {

                        console.error(
                            `❌ DELETE ${tableName} ${item.record_id} thất bại:`,
                            error
                        );

                        /*
                         * KHÔNG xóa queue.
                         *
                         * Lần sync sau sẽ thử lại.
                         */

                    }

                    continue;
                }


                // ═══════════════════════════════
                // INSERT / UPDATE
                //
                // Các action này bắt buộc
                // phải còn record local.
                // ═══════════════════════════════

                const record =
                    await this.getLocalRecord(
                        tableName,
                        item.record_id
                    );


                if (!record) {

                    console.log(
                        `⚠️ ${tableName} ${item.record_id} không còn local`
                    );

                    await db.sync_queue.delete(
                        item.id
                    );

                    continue;
                }


                // ═══════════════════════════════
                // RECORD RETIRED
                // ═══════════════════════════════

                if (
                    record.retired === true
                ) {

                    console.log(
                        `⏭️ Bỏ qua ${tableName} ${record.id} vì retired`
                    );

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
                        `⚠️ Action không hợp lệ: ${item.action}`
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
                    `✓ Queue hoàn thành: ${item.action} ${tableName} ${item.record_id}`
                );


            } catch (error) {

                console.error(
                    `❌ Sync ${tableName} ${item.record_id}:`,
                    error
                );

                /*
                 * KHÔNG xóa queue.
                 *
                 * Lần sync sau sẽ thử lại.
                 */
            }
        }
    },


    // ═════════════════════════════════════════════
    // RETIRE REMOTE
    // Supabase: retired = true
    // ═════════════════════════════════════════════

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
            .eq("id", id)
            .select("id");


        if (error) {

            throw error;
        }


        /*
         * Không tìm thấy record trên Supabase
         *
         * Có thể record đã retired trước đó.
         * Không cần báo lỗi.
         */

        if (!data || data.length === 0) {

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


    // ═════════════════════════════════════════════
    // INSERT
    // ═════════════════════════════════════════════

    async syncInsert(
        table,
        record
    ) {

        // ═══════════════════════════════════════
        // ROOM PHẢI CÓ HOME
        // ═══════════════════════════════════════

        if (
            table === "rooms"
        ) {

            if (!record.home_id) {

                throw new Error(
                    `Room ${record.id} không có home_id`
                );
            }


            const {
                data: home,
                error
            } = await supabase
                .from("homes")
                .select("id, retired")
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


        // ═══════════════════════════════════════
        // INVOICE PHẢI CÓ ROOM
        // ═══════════════════════════════════════

        if (
            table === "invoices"
        ) {

            if (!record.room_id) {

                throw new Error(
                    `Invoice ${record.id} không có room_id`
                );
            }


            const {
                data: room,
                error
            } = await supabase
                .from("rooms")
                .select("id, retired")
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


        // ═══════════════════════════════════════
        // INSERT
        // ═══════════════════════════════════════

        const cleanRecord =
            this.cleanRecord(record);


        const {
            error
        } = await supabase
            .from(table)
            .insert(cleanRecord);


        if (!error) {

            console.log(
                `✅ INSERT ${table}:`,
                record.id
            );

            return;
        }


        // ═══════════════════════════════════════
        // DUPLICATE
        // ═══════════════════════════════════════

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


    // ═════════════════════════════════════════════
    // UPDATE
    // ═════════════════════════════════════════════

    async syncUpdate(
        table,
        record
    ) {

        const cleanRecord =
            this.cleanRecord(record);


        const {
            data,
            error
        } = await supabase
            .from(table)
            .update(cleanRecord)
            .eq(
                "id",
                record.id
            )
            .select("id")
            .maybeSingle();


        if (error) {

            throw error;
        }


        // ═══════════════════════════════════════
        // CHƯA CÓ TRÊN SUPABASE
        // ═══════════════════════════════════════

        if (!data) {

            console.log(
                `⚠️ UPDATE ${table} ${record.id} không có trên Supabase → INSERT`
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


    // ═════════════════════════════════════════════
    // CLEAN RECORD
    // ═════════════════════════════════════════════

    cleanRecord(record) {

        const data = {
            ...record
        };


        /*
         * retired được xử lý riêng.
         */

        delete data.retired;


        /*
         * Không gửi undefined
         */

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


    // ═════════════════════════════════════════════
    // PULL SUPABASE → LOCAL
    // ═════════════════════════════════════════════

    async pullTable(tableName) {

        let query =
            supabase
                .from(tableName)
                .select("*");


        /*
         * CHỈ LẤY RECORD ĐANG ACTIVE
         *
         * retired = true
         * sẽ không được pull về local.
         */

        query =
            query.eq(
                "retired",
                false
            );


        const {
            data,
            error
        } = await query;


        if (error) {

            throw error;
        }


        if (
            !data ||
            !data.length
        ) {

            console.log(
                `✓ ${tableName}: không có record active`
            );

            return;
        }


        console.log(
            `📥 ${tableName}: ${data.length} record active`
        );


        // ═══════════════════════════════════════
        // QUEUE ĐANG CHỜ PUSH
        // ═══════════════════════════════════════

        const queue =
            await db.sync_queue
                .where("table")
                .equals(tableName)
                .toArray();


        const pendingIds =
            new Set(
                queue.map(
                    item => item.record_id
                )
            );


        // ═══════════════════════════════════════
        // PULL TỪNG RECORD
        // ═══════════════════════════════════════

        for (
            const remoteRecord
            of data
        ) {

            // ─────────────────────────────────
            // RECORD ĐANG CHỜ PUSH
            // ─────────────────────────────────

            if (
                pendingIds.has(
                    remoteRecord.id
                )
            ) {

                console.log(
                    `⏭️ Bỏ qua ${tableName} ${remoteRecord.id} đang chờ PUSH`
                );

                continue;
            }


            // ─────────────────────────────────
            // LOCAL
            // ─────────────────────────────────

            const localRecord =
                await this.getLocalRecord(
                    tableName,
                    remoteRecord.id
                );


            // ═══════════════════════════════════
            // LOCAL CHƯA CÓ
            // ═══════════════════════════════════

            if (!localRecord) {

                await this.putLocal(
                    tableName,
                    remoteRecord
                );


                console.log(
                    `⬇️ PULL ${tableName}:`,
                    remoteRecord.id
                );


                continue;
            }


            // ═══════════════════════════════════
            // SO SÁNH updated_at
            // ═══════════════════════════════════

            const remoteTime =
                remoteRecord.updated_at
                    ? new Date(
                        remoteRecord.updated_at
                    ).getTime()
                    : 0;


            const localTime =
                localRecord.updated_at
                    ? new Date(
                        localRecord.updated_at
                    ).getTime()
                    : 0;


            // ═══════════════════════════════════
            // SUPABASE MỚI HƠN
            // ═══════════════════════════════════

            if (
                remoteTime > localTime
            ) {

                await this.putLocal(
                    tableName,
                    remoteRecord
                );


                console.log(
                    `🔄 SUPABASE → LOCAL ${tableName}:`,
                    remoteRecord.id
                );
            }
        }
    },


    // ═════════════════════════════════════════════
    // PUT SUPABASE → LOCAL
    // ═════════════════════════════════════════════

    async putLocal(
        tableName,
        record
    ) {

        /*
         * Không dùng repository
         * vì repository có thể tạo sync_queue.
         */


        if (
            tableName === "homes"
        ) {

            await db.homes.put({
                ...record,
                retired: false
            });

            return;
        }


        if (
            tableName === "rooms"
        ) {

            await db.rooms.put({
                ...record,
                retired: false
            });

            return;
        }


        if (
            tableName === "invoices"
        ) {

            await db.invoices.put({
                ...record,
                retired: false
            });

            return;
        }
    },


    // ═════════════════════════════════════════════
    // START AUTO SYNC
    // ═════════════════════════════════════════════

    start() {

        // Tránh start nhiều lần

        this.stop();


        // ═══════════════════════════════════════
        // APP START
        // ═══════════════════════════════════════

        if (
            navigator.onLine
        ) {

            this.syncAll();
        }


        // ═══════════════════════════════════════
        // ONLINE
        // ═══════════════════════════════════════

        this.onlineHandler =
            () => {

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
        // 30 GIÂY
        // ═══════════════════════════════════════

        this.interval =
            setInterval(
                () => {

                    if (
                        navigator.onLine
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
                            navigator.onLine
                        ) {

                            this.syncAll();
                        }


                        this.dailyInterval =
                            setInterval(
                                () => {

                                    if (
                                        navigator.onLine
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


    // ═════════════════════════════════════════════
    // STOP
    // ═════════════════════════════════════════════

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