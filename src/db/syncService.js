import { db } from "./db";
import { supabase } from "../supabase";

// ═══════════════════════════════════════════════
// SYNC SERVICE
//
// IndexedDB → Supabase
//
// LOCAL là nguồn dữ liệu chính.
//
// INSERT / UPDATE
//     → PUSH lên Supabase
//
// DELETE
//     → retired = true
//
// PHOTOS:
//     - File ảnh thật nằm trên Supabase Storage
//     - Metadata nằm trong IndexedDB
//     - Sync metadata → Supabase table photos
//
// ❌ KHÔNG PULL SUPABASE → LOCAL
//
// Import:
//     - pause()
//     - import dữ liệu vào IndexedDB
//     - resume()
//     - dữ liệu import KHÔNG tự tạo queue
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

        console.log("⏸️ SYNC TẠM DỪNG");

        this.isPaused = true;
    },


    // ═══════════════════════════════════════════
    // RESUME
    // ═══════════════════════════════════════════

    resume() {

        console.log("▶️ SYNC TIẾP TỤC");

        this.isPaused = false;
    },


    // ═══════════════════════════════════════════
    // SYNC ALL
    //
    // LOCAL → SUPABASE
    // ═══════════════════════════════════════════

    async syncAll() {

        if (this.isPaused) {

            console.log(
                "⏸️ Sync đang PAUSE - bỏ qua"
            );

            return;
        }


        if (this.isSyncing) {

            console.log(
                "⏳ Sync đang chạy..."
            );

            return;
        }


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

            await this.syncTable("homes");


            // ═══════════════════════════════════
            // ROOMS
            // ═══════════════════════════════════

            await this.syncTable("rooms");


            // ═══════════════════════════════════
            // PHOTOS
            //
            // Photos phải sau homes / rooms
            // ═══════════════════════════════════

            await this.syncTable("photos");


            // ═══════════════════════════════════
            // INVOICES
            // ═══════════════════════════════════

            await this.syncTable("invoices");


            // ═══════════════════════════════════
            // EXPENSES
            // ═══════════════════════════════════

            await this.syncTable("expenses");


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

    async getLocalRecord(table, id) {

        if (table === "homes") {

            return await db.homes.get(id);
        }


        if (table === "rooms") {

            return await db.rooms.get(id);
        }


        if (table === "photos") {

            return await db.photos.get(id);
        }


        if (table === "invoices") {

            return await db.invoices.get(id);
        }


        if (table === "expenses") {

            return await db.expenses.get(id);
        }


        return null;
    },


    // ═══════════════════════════════════════════
    // PUSH LOCAL → SUPABASE
    // ═══════════════════════════════════════════

    async syncTable(tableName) {

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


        for (const item of queue) {

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

                if (item.action === "DELETE") {

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
                // GET LOCAL
                // ═══════════════════════════════

                const record =
                    await this.getLocalRecord(
                        tableName,
                        item.record_id
                    );


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

                if (record.retired === true) {

                    await this.retireRemoteRecord(
                        tableName,
                        record.id
                    );


                    await db.sync_queue.delete(
                        item.id
                    );


                    continue;
                }


                // ═══════════════════════════════
                // INSERT
                // ═══════════════════════════════

                if (item.action === "INSERT") {

                    await this.syncInsert(
                        tableName,
                        record
                    );
                }


                // ═══════════════════════════════
                // UPDATE
                // ═══════════════════════════════

                else if (item.action === "UPDATE") {

                    await this.syncUpdate(
                        tableName,
                        record
                    );
                }


                // ═══════════════════════════════
                // INVALID ACTION
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
                // SUCCESS
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

                // Giữ queue lại để lần sync sau
                // thử lại.
                //
                // KHÔNG delete queue khi lỗi.
            }
        }
    },


    // ═══════════════════════════════════════════
    // RETIRE REMOTE
    //
    // Không DELETE thật.
    // retired = true
    // ═══════════════════════════════════════════

    async retireRemoteRecord(table, id) {

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

            // PHOTOS có thể không có
            // updated_at nếu schema chưa thêm.
            //
            // Xử lý riêng bên dưới.
            if (table === "photos") {

                const {
                    error: photoError
                } = await supabase
                    .from("photos")
                    .update({
                        retired: true
                    })
                    .eq("id", id)
                    .select("id");


                if (photoError) {

                    throw photoError;
                }


                console.log(
                    `🗑️ RETIRE photos:`,
                    id
                );

                return;
            }


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
    //
    // Nếu ID đã tồn tại:
    //     → UPDATE
    //
    // Nếu chưa tồn tại:
    //     → INSERT
    // ═══════════════════════════════════════════

    async syncInsert(table, record) {

        // ═══════════════════════════════
        // ROOM → HOME
        // ═══════════════════════════════

        if (table === "rooms") {

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
                .eq("id", record.home_id)
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
        // PHOTO → ROOM
        // ═══════════════════════════════

        if (
            table === "photos" &&
            record.room_id
        ) {

            const {
                data: room,
                error
            } = await supabase
                .from("rooms")
                .select("id, retired")
                .eq("id", record.room_id)
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
        // PHOTO → HOME
        // ═══════════════════════════════

        if (
            table === "photos" &&
            record.home_id
        ) {

            const {
                data: home,
                error
            } = await supabase
                .from("homes")
                .select("id, retired")
                .eq("id", record.home_id)
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

        if (table === "invoices") {

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
                .eq("id", record.room_id)
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

        if (table === "expenses") {

            if (!record.home_id) {

                throw new Error(
                    `Expense ${record.id} không có home_id`
                );
            }


            const {
                data: home,
                error
            } = await supabase
                .from("homes")
                .select("id, retired")
                .eq("id", record.home_id)
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
        // CLEAN
        // ═══════════════════════════════

        const cleanRecord =
            this.cleanRecord(record);


        // ═══════════════════════════════
        // UPSERT
        //
        // Có ID → UPDATE
        // Chưa có ID → INSERT
        // ═══════════════════════════════

        const {
            data,
            error
        } = await supabase
            .from(table)
            .upsert(
                cleanRecord,
                {
                    onConflict: "id"
                }
            )
            .select("id")
            .maybeSingle();


        if (error) {

            throw error;
        }


        console.log(
            `✅ UPSERT ${table}:`,
            record.id
        );


        return data;
    },


    // ═══════════════════════════════════════════
    // UPDATE
    //
    // Nếu không tồn tại:
    //     → INSERT / UPSERT
    // ═══════════════════════════════════════════

    async syncUpdate(table, record) {

        const cleanRecord =
            this.cleanRecord(record);


        const {
            data,
            error
        } = await supabase
            .from(table)
            .update(cleanRecord)
            .eq("id", record.id)
            .select("id")
            .maybeSingle();


        if (error) {

            throw error;
        }


        // Không tồn tại
        // → INSERT

        if (!data) {

            console.log(
                `⚠️ ${table} ${record.id} chưa có → UPSERT`
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

    cleanRecord(record) {

        const data = {
            ...record
        };


        // retired xử lý riêng
        delete data.retired;


        // storage_path chỉ dùng Local
        // Không có trong Supabase photos
        delete data.storage_path;


        // Không gửi undefined

        Object.keys(data).forEach(
            (key) => {

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
    // ═══════════════════════════════════════════

    start() {

        this.stop();


        // ═══════════════════════════════
        // APP START
        // ═══════════════════════════════

        if (
            navigator.onLine &&
            !this.isPaused
        ) {

            this.syncAll();
        }


        // ═══════════════════════════════
        // ONLINE
        // ═══════════════════════════════

        this.onlineHandler =
            () => {

                if (this.isPaused) {

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


        // ═══════════════════════════════
        // MỖI 30 GIÂY
        // ═══════════════════════════════

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


        // ═══════════════════════════════
        // DAILY 13:00
        // ═══════════════════════════════

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


            if (next <= now) {

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

        if (this.interval) {

            clearInterval(
                this.interval
            );

            this.interval = null;
        }


        if (this.dailyTimeout) {

            clearTimeout(
                this.dailyTimeout
            );

            this.dailyTimeout = null;
        }


        if (this.dailyInterval) {

            clearInterval(
                this.dailyInterval
            );

            this.dailyInterval = null;
        }


        if (this.onlineHandler) {

            window.removeEventListener(
                "online",
                this.onlineHandler
            );

            this.onlineHandler = null;
        }
    }
};