import { db } from "./db";

export const roomRepository = {

  // ─────────────────────────────────────────────
  // Lấy danh sách phòng theo nhà
  // ─────────────────────────────────────────────
  async getByHomeId(homeId) {

    if (!homeId) return [];

    const rooms = await db.rooms
      .where("home_id")
      .equals(homeId)
      .filter((room) => room.retired !== true)
      .toArray();

    return rooms.sort((a, b) =>
      String(a.room_name || "").localeCompare(
        String(b.room_name || ""),
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        }
      )
    );
  },


  // ─────────────────────────────────────────────
  // Lấy 1 phòng
  // ─────────────────────────────────────────────
  async getById(id) {

    if (!id) return null;

    return await db.rooms.get(id);
  },


  // ─────────────────────────────────────────────
  // Tạo phòng
  // ─────────────────────────────────────────────
  async create(room) {

    const payload = {
      ...room,

      id: room.id || crypto.randomUUID(),

      retired: false,

      created_at:
        room.created_at ||
        new Date().toISOString(),

      updated_at:
        new Date().toISOString(),
    };

    await db.transaction(
      "rw",
      db.rooms,
      db.sync_queue,
      async () => {

        await db.rooms.add(payload);

        await db.sync_queue.add({
          table: "rooms",
          record_id: payload.id,
          action: "INSERT",
          created_at: new Date().toISOString(),
        });

      }
    );

    return payload;
  },


  // ─────────────────────────────────────────────
  // Cập nhật phòng
  // ─────────────────────────────────────────────
  async update(id, data) {

    if (!id) {
      throw new Error("room id không hợp lệ");
    }

    const payload = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    await db.transaction(
      "rw",
      db.rooms,
      db.sync_queue,
      async () => {

        await db.rooms.update(id, payload);

        await db.sync_queue.add({
          table: "rooms",
          record_id: id,
          action: "UPDATE",
          created_at: new Date().toISOString(),
        });

      }
    );
  },


  // ─────────────────────────────────────────────
  // Xóa mềm phòng
  // ─────────────────────────────────────────────
  async retire(id) {

    if (!id) {
      throw new Error("room id không hợp lệ");
    }

    await db.transaction(
      "rw",
      db.rooms,
      db.sync_queue,
      async () => {

        await db.rooms.update(id, {
          retired: true,
          updated_at: new Date().toISOString(),
        });

        await db.sync_queue.add({
          table: "rooms",
          record_id: id,
          action: "DELETE",
          created_at: new Date().toISOString(),
        });

      }
    );
  },
};