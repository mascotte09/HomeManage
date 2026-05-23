import { useEffect, useState, useCallback  } from "react";
import { supabase } from "../supabase";

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
      alert("Failed to upload photo");
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

  function handleShareToZalo() {
    // only selected photos
    const selected = photos.filter((p) =>
      selectedPhotos.includes(p.id)
    );

    if (selected.length === 0) {
      alert("Please select at least one photo");
      return;
    }

    const allPhotoLinks = selected
      .map((p, index) => `${index + 1}. ${p.image_url}`)
      .join("\n");

    const zaloUrl = `https://zalo.me/share?text=${encodeURIComponent(
      allPhotoLinks
    )}`;

    window.open(zaloUrl, "_blank");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[800px] max-h-[90vh] overflow-y-auto rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold">Room Photos</h2>

          <button
            onClick={onClose}
            className="text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Upload + Share */}
        <div className="flex items-center gap-3 mb-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleUploadPhoto}
          />

          {photos.length > 0 && (
            <button
              onClick={handleShareToZalo}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Share Selected To Zalo
            </button>
          )}
        </div>

        {uploading && (
          <p className="text-sm text-stone-500 mb-4">
            Uploading...
          </p>
        )}

        {/* Photos */}
        {photos.length === 0 ? (
          <p className="text-stone-500">
            No photos uploaded yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="border rounded-lg overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={photo.image_url}
                    alt="Room"
                    className="w-full h-60 object-cover"
                  />

                  {/* Checkbox */}
                  <div className="absolute top-3 left-3 bg-white rounded p-1">
                    <input
                      type="checkbox"
                      checked={selectedPhotos.includes(photo.id)}
                      onChange={() =>
                        handleTogglePhoto(photo.id)
                      }
                    />
                  </div>
                </div>

                <div className="p-3 flex justify-between items-center">
                  <button
                    onClick={() => handleDeletePhoto(photo)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete Photo
                  </button>

                  {selectedPhotos.includes(photo.id) && (
                    <span className="text-sm text-green-600 font-medium">
                      Selected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}