import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";
import { FiShare } from "react-icons/fi";

export default function Photos({ room, open, onClose }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  // NEW: selected photos
  const [selectedPhotos, setSelectedPhotos] = useState([]);


  const fetchPhotos = useCallback(async () => {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("room_id", room.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error.message);
      return;
    }

    setPhotos(data || []);
    setSelectedPhotos([]);
  }, [room.id]);

  useEffect(() => {
    if (open) {
      fetchPhotos();
    }
  }, [open, fetchPhotos]);

  async function handleUploadPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const fileName = `${Date.now()}-${file.name}`;

    // Upload image
    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(fileName, file);

    if (uploadError) {
      console.log(uploadError.message);
      alert("Lỗi upload photo");
      setUploading(false);
      return;
    }

    // Public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("photos").getPublicUrl(fileName);

    // Save DB
    const { error: insertError } = await supabase
      .from("photos")
      .insert([
        {
          room_id: room.id,
          image_url: publicUrl,
        },
      ]);

    if (insertError) {
      console.log(insertError.message);
      alert("Failed to save photo");
      setUploading(false);
      return;
    }

    await fetchPhotos();
    setUploading(false);
  }

  async function handleDeletePhoto(photo) {
    const fileName = photo.image_url.split("/").pop();

    await supabase.storage.from("photos").remove([fileName]);

    const { error } = await supabase
      .from("photos")
      .delete()
      .eq("id", photo.id);

    if (error) {
      console.log(error.message);
      alert("Failed to delete photo");
      return;
    }

    await fetchPhotos();
  }

  // NEW: toggle checkbox
  function handleTogglePhoto(photoId) {
    setSelectedPhotos((prev) => {
      if (prev.includes(photoId)) {
        return prev.filter((id) => id !== photoId);
      }

      return [...prev, photoId];
    });
  }

  async function handleSharePhotos() {
    const selected = photos.filter((p) =>
      selectedPhotos.includes(p.id)
    );

    const files = await Promise.all(
      selected.map(async (photo, index) => {
        const response = await fetch(photo.image_url);

        const blob = await response.blob();

        return new File(
          [blob],
          `photo-${index + 1}.jpg`,
          { type: blob.type }
        );
      })
    );

    if (
      navigator.canShare &&
      navigator.canShare({ files })
    ) {
      await navigator.share({
        title: "Hình ảnh phòng",
        files,
      });
    }
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-stone-800">
            Hình ảnh phòng
          </h2>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-500"
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b">

          <input
            type="file"
            accept="image/*"
            onChange={handleUploadPhoto}
            className="text-sm"
          />

          {photos.length > 0 && (
            <button
              onClick={handleSharePhotos}
              className="flex flex-col items-center text-blue-600 hover:text-blue-700"
            >
              <FiShare size={26} />

              <span className="text-xs mt-1">
                Chia sẻ
              </span>
            </button>
          )}
        </div>

        {/* Loading */}
        {uploading && (
          <div className="px-5 py-3 text-sm text-stone-500">
            Đang tải ảnh...
          </div>
        )}

        {/* Empty */}
        {photos.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            Chưa có hình ảnh nào
          </div>
        ) : (
          <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

            {photos.map((photo) => {
              const selected =
                selectedPhotos.includes(photo.id);

              return (
                <div
                  key={photo.id}
                  className={`
                relative overflow-hidden rounded-xl border bg-white
                transition-all
                ${selected
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-stone-200"}
              `}
                >
                  {/* Image */}
                  <img
                    src={photo.image_url}
                    alt="Room"
                    className="w-full h-44 object-cover"
                  />

                  {/* Checkbox */}
                  <label className="absolute top-2 left-2 bg-white/90 rounded-md p-1 shadow">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        handleTogglePhoto(photo.id)
                      }
                    />
                  </label>

                  {/* Delete */}
                  <button
                    onClick={() =>
                      handleDeletePhoto(photo)
                    }
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full shadow"
                  >
                    🗑
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}