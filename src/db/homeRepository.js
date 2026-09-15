import { db } from "./db";

export const homeRepository = {

  async getByUserId(userID) {

    if (!userID) return [];

    const homes = await db.homes
      .where("userID")
      .equals(userID)
      .filter(home => home.retired !== true)
      .toArray();

    for (const home of homes) {

      home.rooms = await db.rooms
        .where("home_id")
        .equals(home.id)
        .filter(room => room.retired !== true)
        .toArray();

    }

    // Giống order("name") của Supabase
    homes.sort((a, b) =>
      (a.name || "").localeCompare(
        b.name || "",
        "vi"
      )
    );

    return homes;
  },

  async getById(id) {

    const home = await db.homes.get(id);

    if (!home) return null;

    home.rooms = await db.rooms
      .where("home_id")
      .equals(home.id)
      .filter(room => room.retired !== true)
      .toArray();

    return home;
  },

  async create(home) {

    await db.transaction(
      "rw",
      db.homes,
      db.sync_queue,
      async () => {

        await db.homes.add(home);

        await db.sync_queue.add({
          table: "homes",
          record_id: home.id,
          action: "INSERT",
          created_at: new Date().toISOString()
        });

      }
    );

    return home;
  },

  async update(id, data) {

    await db.transaction(
      "rw",
      db.homes,
      db.sync_queue,
      async () => {

        await db.homes.update(id, data);

        await db.sync_queue.add({
          table: "homes",
          record_id: id,
          action: "UPDATE",
          created_at: new Date().toISOString()
        });

      }
    );

  },

  async retire(id) {

    const now = new Date().toISOString();

    await db.transaction(
      "rw",
      db.homes,
      db.sync_queue,
      async () => {

        const existing = await db.homes.get(id);

        if (!existing) {
          return;
        }

        await db.homes.update(id, {
          retired: true,
          updated_at: now,
        });

        await db.sync_queue.add({
          table: "homes",
          record_id: id,
          action: "DELETE",
          created_at: now,
        });
      }
    );
  }

};