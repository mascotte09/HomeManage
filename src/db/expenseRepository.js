import { db } from "./db";


// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function nowISO() {
    return new Date().toISOString();
}


// ─────────────────────────────────────────────
// EXPENSE REPOSITORY
// ─────────────────────────────────────────────

export const expensesRepository = {

    // ═══════════════════════════════════════════
    // GET ALL
    // ═══════════════════════════════════════════

    async getAll(homeId) {

        if (!homeId) {
            return [];
        }

        return await db.expenses
            .where("home_id")
            .equals(homeId)
            .filter(
                expense =>
                    expense.retired !== true
            )
            .sortBy("expense_date");
    },


    // ═══════════════════════════════════════════
    // GET ONE
    // ═══════════════════════════════════════════

    async getById(id) {

        if (!id) {
            return null;
        }

        const expense =
            await db.expenses.get(id);

        if (
            !expense ||
            expense.retired === true
        ) {
            return null;
        }

        return expense;
    },


    // ═══════════════════════════════════════════
    // CREATE
    // ═══════════════════════════════════════════

    async create(data) {

        const now = nowISO();

        const id =
            data.id || crypto.randomUUID();

        const record = {
            ...data,

            id,

            retired: false,

            created_at:
                data.created_at || now,

            updated_at: now,
        };


        await db.transaction(
            "rw",
            db.expenses,
            db.sync_queue,
            async () => {

                await db.expenses.add(record);

                await db.sync_queue.add({
                    table: "expenses",
                    record_id: id,
                    action: "INSERT",
                    created_at: now,
                });

            }
        );


        return record;
    },


    // ═══════════════════════════════════════════
    // UPDATE
    // ═══════════════════════════════════════════

    async update(id, data) {

        if (!id) {
            throw new Error(
                "expense id không hợp lệ"
            );
        }

        const existing =
            await db.expenses.get(id);

        if (!existing) {
            throw new Error(
                `Không tìm thấy expense ${id}`
            );
        }

        const now = nowISO();

        const record = {
            ...data,

            updated_at: now,

            retired: false,
        };


        await db.transaction(
            "rw",
            db.expenses,
            db.sync_queue,
            async () => {

                await db.expenses.update(
                    id,
                    record
                );

                await db.sync_queue.add({
                    table: "expenses",
                    record_id: id,
                    action: "UPDATE",
                    created_at: now,
                });

            }
        );


        return {
            ...existing,
            ...record,
            id,
        };
    },


    // ═══════════════════════════════════════════
    // RETIRE
    // ═══════════════════════════════════════════

    async retire(id) {

        if (!id) {
            throw new Error(
                "expense id không hợp lệ"
            );
        }

        const existing =
            await db.expenses.get(id);

        if (!existing) {
            throw new Error(
                `Không tìm thấy expense ${id}`
            );
        }

        const now = nowISO();


        await db.transaction(
            "rw",
            db.expenses,
            db.sync_queue,
            async () => {

                // XÓA HẲN LOCAL
                await db.expenses.delete(id);


                // Queue để Supabase:
                // retired = true

                await db.sync_queue.add({
                    table: "expenses",
                    record_id: id,
                    action: "DELETE",
                    created_at: now,
                });

            }
        );
    },


    // ═══════════════════════════════════════════
    // GET BY MONTH
    // ═══════════════════════════════════════════

    async getByMonth(
        homeId,
        year,
        month
    ) {

        if (!homeId) {
            return [];
        }

        const start =
            `${year}-${String(month).padStart(2, "0")}-01`;

        const nextMonth =
            new Date(
                Number(year),
                Number(month),
                1
            );

        const end =
            `${nextMonth.getFullYear()}-${String(
                nextMonth.getMonth() + 1
            ).padStart(2, "0")}-01`;


        return await db.expenses
            .where("home_id")
            .equals(homeId)
            .filter(expense => {

                if (
                    expense.retired === true
                ) {
                    return false;
                }

                if (
                    !expense.expense_date
                ) {
                    return false;
                }

                return (
                    expense.expense_date >= start &&
                    expense.expense_date < end
                );

            })
            .sortBy("expense_date");
    },


    // ═══════════════════════════════════════════
    // TOTAL
    // ═══════════════════════════════════════════

    async getTotal(homeId) {

        const expenses =
            await this.getAll(homeId);

        return expenses.reduce(
            (total, item) =>
                total +
                Number(item.expense || 0),
            0
        );
    },


    // ═══════════════════════════════════════════
    // COUNT
    // ═══════════════════════════════════════════

    async count(homeId) {

        const expenses =
            await this.getAll(homeId);

        return expenses.length;
    },
};