import Dexie from "dexie";

export const db = new Dexie("QuanTroDB");

db.version(2).stores({
    // =========================
    // HOMES
    // =========================
    homes: "id, userID, name, created_at, retired",

    // =========================
    // ROOMS
    // =========================
    rooms: "id, home_id, room_name, created_at, updated_at, retired",

    // =========================
    // INVOICES
    // =========================
    invoices: "id, room_id, invoice_create_date, created_at, payment_status, retired",

    // =========================
    // SYNC QUEUE
    // =========================
    sync_queue: "++id, table, record_id, action, created_at"
});