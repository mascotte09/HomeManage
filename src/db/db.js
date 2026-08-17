import Dexie from "dexie";

export const db = new Dexie("QuanTroDB");

db.version(4).stores({
    // =========================
    // HOMES
    // =========================
    homes:
        "id, userID, name, created_at, updated_at, retired",

    // =========================
    // ROOMS
    // =========================
    rooms:
        "id, home_id, room_name, created_at, updated_at, retired",

    // =========================
    // INVOICES
    // =========================
    invoices:
        "id, room_id, invoice_create_date, created_at, updated_at, payment_status, retired",

    // =========================
    // EXPENSES
    // =========================
    expenses:
        "id, home_id, expense_date, created_at, updated_at, retired",

    // =========================
    // PHOTOS
    // =========================
    photos:
        "id, room_id, home_id, created_at, retired",

    statistics:
        "id, date, updated_at",

    // =========================
    // SYNC QUEUE
    // =========================
    sync_queue:
        "++id, table, record_id, action, created_at",
});