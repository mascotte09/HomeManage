import { db } from "./db";
import { supabase } from "../supabase";

// =========================================================
// Helpers
// =========================================================

function nowISO() {
  return new Date().toISOString();
}

function toTime(value) {
  if (!value) return 0;

  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
}

function isSameMonth(dateValue, month, year) {
  if (!dateValue) return false;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return (
    date.getMonth() + 1 === Number(month) &&
    date.getFullYear() === Number(year)
  );
}

// =========================================================
// INVOICE REPOSITORY
// =========================================================

export const invoiceRepository = {

  // =======================================================
  // GET ALL INVOICES OF ROOM
  // =======================================================

  async getByRoomId(roomId) {
    if (!roomId) return [];

    const invoices = await db.invoices
      .where("room_id")
      .equals(roomId)
      .toArray();

    return invoices
      .filter(
        (invoice) =>
          invoice.retired !== true
      )
      .sort(
        (a, b) =>
          toTime(
            b.invoice_create_date ||
            b.created_at
          ) -
          toTime(
            a.invoice_create_date ||
            a.created_at
          )
      );
  },


  // =======================================================
  // GET INVOICE OF MONTH
  // =======================================================

  async getInvoiceOfMonth(
    roomId,
    month,
    year
  ) {
    if (!roomId) return null;

    const invoices =
      await this.getByRoomId(roomId);

    const invoice =
      invoices.find((item) =>
        isSameMonth(
          item.invoice_create_date,
          month,
          year
        )
      );

    return invoice || null;
  },


  // =======================================================
  // GET LATEST INVOICE
  // =======================================================

  async getLatest(
    roomId,
    excludeId = null
  ) {
    if (!roomId) return null;

    let invoices =
      await this.getByRoomId(roomId);

    if (excludeId) {
      invoices = invoices.filter(
        (invoice) =>
          invoice.id !== excludeId
      );
    }

    return invoices[0] || null;
  },


  // =======================================================
  // ALIAS
  // InvoiceRecord đang sử dụng hàm này
  // =======================================================

  async getLatestForRoom(
    roomId,
    excludeId = null
  ) {
    return this.getLatest(
      roomId,
      excludeId
    );
  },


  // =======================================================
  // GET BALANCES
  // =======================================================

  async getBalances(
    roomId,
    excludeId = null
  ) {
    if (!roomId) {
      return {
        unpaidInvoices: [],
        extraPaidInvoices: [],
      };
    }

    let invoices =
      await this.getByRoomId(roomId);

    if (excludeId) {
      invoices = invoices.filter(
        (invoice) =>
          invoice.id !== excludeId
      );
    }

    const unpaidInvoices =
      invoices.filter(
        (invoice) =>
          Number(invoice.debit_amount) > 0
      );

    const extraPaidInvoices =
      invoices.filter(
        (invoice) =>
          Number(invoice.debit_amount) < 0
      );

    return {
      unpaidInvoices,
      extraPaidInvoices,
    };
  },


  // =======================================================
  // CREATE
  // =======================================================

  async create(invoice) {
    if (!invoice) {
      throw new Error(
        "Invoice không hợp lệ"
      );
    }

    if (!invoice.room_id) {
      throw new Error(
        "Invoice thiếu room_id"
      );
    }

    // -----------------------------------------------------
    // Kiểm tra Room local
    // -----------------------------------------------------

    const room =
      await db.rooms.get(
        invoice.room_id
      );

    if (!room) {
      throw new Error(
        `Không tìm thấy phòng ${invoice.room_id} trong IndexedDB`
      );
    }

    // -----------------------------------------------------
    // Dùng ID cố định
    // -----------------------------------------------------

    const id =
      invoice.id ||
      crypto.randomUUID();

    const now = nowISO();

    const payload = {
      ...invoice,

      id,

      room_id:
        invoice.room_id,

      created_at:
        invoice.created_at ||
        now,

      updated_at:
        now,

      retired: false,
    };

    // -----------------------------------------------------
    // Transaction
    // -----------------------------------------------------

    await db.transaction(
      "rw",
      db.invoices,
      db.sync_queue,
      async () => {

        await db.invoices.put(
          payload
        );

        await db.sync_queue.add({
          table: "invoices",

          record_id:
            payload.id,

          action: "INSERT",

          created_at: now,
        });

      }
    );

    return payload;
  },


  // =======================================================
  // UPDATE
  // =======================================================

  async update(
    id,
    data
  ) {
    if (!id) {
      throw new Error(
        "invoice id không hợp lệ"
      );
    }

    const existing =
      await db.invoices.get(id);

    if (!existing) {
      throw new Error(
        `Không tìm thấy invoice ${id}`
      );
    }

    const now = nowISO();

    const payload = {
      ...data,

      updated_at: now,
    };

    await db.transaction(
      "rw",
      db.invoices,
      db.sync_queue,
      async () => {

        await db.invoices.update(
          id,
          payload
        );

        await db.sync_queue.add({
          table: "invoices",

          record_id: id,

          action: "UPDATE",

          created_at: now,
        });

      }
    );

    return {
      ...existing,
      ...payload,
      id,
    };
  },


  // =======================================================
  // RETIRE
  // =======================================================

 async retire(id) {
  if (!id) {
    throw new Error("invoice id không hợp lệ");
  }

  const existing = await db.invoices.get(id);

  if (!existing) {
    throw new Error(
      `Không tìm thấy invoice ${id}`
    );
  }

  const now = nowISO();

  await db.transaction(
    "rw",
    db.invoices,
    db.sync_queue,
    async () => {

      // 1. Xóa hẳn invoice khỏi IndexedDB
      await db.invoices.delete(id);

      // 2. Tạo queue để báo Supabase retired = true
      await db.sync_queue.add({
        table: "invoices",
        record_id: id,
        action: "DELETE",
        created_at: now,
      });

    }
  );

  console.log(
    `🗑️ Invoice ${id} đã xóa local, chờ sync Supabase`
  );
},


  // =======================================================
  // DELETE
  // =======================================================
  //
  // Không xóa ngay khỏi local.
  // Đưa DELETE vào sync_queue.
  //
  // Điều này rất quan trọng khi offline.
  // =======================================================

  async delete(id) {
    if (!id) {
      throw new Error(
        "invoice id không hợp lệ"
      );
    }

    const existing =
      await db.invoices.get(id);

    if (!existing) {
      return;
    }

    const now = nowISO();

    await db.transaction(
      "rw",
      db.invoices,
      db.sync_queue,
      async () => {

        // Đánh dấu retired thay vì
        // xóa vật lý ngay lập tức.
        await db.invoices.update(
          id,
          {
            retired: true,

            updated_at: now,
          }
        );

        await db.sync_queue.add({
          table: "invoices",

          record_id: id,

          action: "DELETE",

          created_at: now,
        });

      }
    );
  },


  // =======================================================
  // SYNC ONE ROOM FROM SUPABASE
  // =======================================================

  async syncFromSupabase(roomId) {
    if (!roomId) return [];

    // -----------------------------------------------------
    // Chỉ sync khi online
    // -----------------------------------------------------

    if (
      typeof navigator !== "undefined" &&
      !navigator.onLine
    ) {
      return this.getByRoomId(
        roomId
      );
    }

    // -----------------------------------------------------
    // Lấy invoices từ Supabase
    // -----------------------------------------------------

    const {
      data,
      error,
    } = await supabase
      .from("invoices")
      .select("*")
      .eq("room_id", roomId)
      .order(
        "invoice_create_date",
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        "Không thể lấy invoice từ Supabase:",
        error
      );

      throw error;
    }

    if (!data?.length) {
      return [];
    }

    // -----------------------------------------------------
    // Upsert về IndexedDB
    // -----------------------------------------------------

    await db.transaction(
      "rw",
      db.invoices,
      async () => {

        for (
          const remoteInvoice
          of data
        ) {

          if (!remoteInvoice.id) {
            continue;
          }

          const localInvoice =
            await db.invoices.get(
              remoteInvoice.id
            );

          // -----------------------------------------------
          // LOCAL CHƯA CÓ
          // -----------------------------------------------

          if (!localInvoice) {

            await db.invoices.put(
              remoteInvoice
            );

            continue;
          }

          // -----------------------------------------------
          // LOCAL CÓ
          // -----------------------------------------------

          const remoteUpdated =
            toTime(
              remoteInvoice.updated_at
            );

          const localUpdated =
            toTime(
              localInvoice.updated_at
            );

          // -----------------------------------------------
          // Supabase mới hơn
          // -----------------------------------------------

          if (
            remoteUpdated >
            localUpdated
          ) {

            await db.invoices.put(
              remoteInvoice
            );

            continue;
          }

          // -----------------------------------------------
          // Nếu timestamp bằng nhau
          // -----------------------------------------------
          //
          // Không làm gì.
          //
          // Tránh ghi lại dữ liệu
          // không cần thiết.
          // -----------------------------------------------
        }
      }
    );

    return data;
  },


  // =======================================================
  // SYNC ALL ROOMS OF HOME
  // =======================================================

  async syncAllFromSupabase(
    homeId
  ) {
    if (!homeId) return [];

    // -----------------------------------------------------
    // Offline
    // -----------------------------------------------------

    if (
      typeof navigator !== "undefined" &&
      !navigator.onLine
    ) {
      return [];
    }

    // -----------------------------------------------------
    // Lấy rooms từ Supabase
    // -----------------------------------------------------

    const {
      data: rooms,
      error,
    } = await supabase
      .from("rooms")
      .select("id")
      .eq(
        "home_id",
        homeId
      );

    if (error) {
      console.error(
        "Không thể lấy rooms:",
        error
      );

      throw error;
    }

    if (!rooms?.length) {
      return [];
    }

    const allInvoices = [];

    // -----------------------------------------------------
    // Sync từng room
    // -----------------------------------------------------

    for (
      const room
      of rooms
    ) {

      try {

        const invoices =
          await this.syncFromSupabase(
            room.id
          );

        allInvoices.push(
          ...invoices
        );

      } catch (error) {

        console.error(
          `Sync invoice phòng ${room.id} thất bại:`,
          error
        );

      }
    }

    return allInvoices;
  },


  // =======================================================
  // GET ALL LOCAL INVOICES
  // =======================================================

  async getAll() {

    const invoices =
      await db.invoices.toArray();

    return invoices.filter(
      (invoice) =>
        invoice.retired !== true
    );
  },


  // =======================================================
  // GET BY ID
  // =======================================================

  async getById(id) {
    if (!id) return null;

    const invoice =
      await db.invoices.get(id);

    if (
      !invoice ||
      invoice.retired === true
    ) {
      return null;
    }

    return invoice;
  },
};