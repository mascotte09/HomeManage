import Tasks from "../Invoice/Invoices.jsx";
import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import Photos from "../Photos.jsx";

export default function SelectedProject({
  room,
  onDelete,
  tasks,
  onAddTask,
  onDeleteTask,
  refreshRooms,
}) {
  const [roomName, setRoomName] = useState(room?.room_name || "");
  const [room_renter, setRoomRenter] = useState(room?.room_renter || "");
  const [showPhotos, setShowPhotos] = useState(false);

  useEffect(() => {
    setRoomName(room?.room_name || "");
    setRoomRenter(room?.room_renter || "");
  }, [room.id]);

  async function handleUpdate() {
    const { error } = await supabase
      .from("rooms")
      .update({
        room_name: roomName,
        room_renter: room_renter,
      })
      .eq("id", room.id);

    if (error) {
      console.log(error.message);
      alert("Failed to update room");
      return;
    }

    await refreshRooms();
    alert("Room updated successfully");
  }

  return (
    <>
      <div className="w-[35rem] mt-16">
        <header className="pb-4 mb-4 border-b-2 border-stone-300">
          {/* Buttons */}
          <div className="flex justify-left gap-3 mb-6">
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              onClick={onDelete}
            >
              Delete
            </button>

            <button
              onClick={handleUpdate}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Update
            </button>

            <button
              onClick={() => setShowPhotos(true)}
              className="bg-stone-700 hover:bg-stone-800 text-white px-4 py-2 rounded"
            >
              Photos
            </button>
          </div>

          {/* Room Name */}
          <div className="grid grid-cols-[90px_1fr] items-center gap-x-1 mb-4">
            <label className="text-sm font-semibold text-stone-700">
              Room Name
            </label>

            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full border rounded p-2 text-stone-600"
            />
          </div>

          {/* room_renter */}
          <div className="grid grid-cols-[90px_1fr] items-center gap-x-1 mb-4">
            <label className="text-sm font-semibold text-stone-700">
              Tenant
            </label>

            <input
              type="text"
              value={room_renter}
              onChange={(e) => setRoomRenter(e.target.value)}
              className="w-full border rounded p-2 text-stone-600"
            />
          </div>
        </header>

        <Tasks
          tasks={tasks}
          onAdd={onAddTask}
          onDelete={onDeleteTask}
        />
      </div>

      {/* Photos Modal */}
      <Photos
        room={room}
        open={showPhotos}
        onClose={() => setShowPhotos(false)}
      />
    </>
  );
}