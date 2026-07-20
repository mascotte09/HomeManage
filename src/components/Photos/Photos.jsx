import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../supabase";
import { FiShare } from "react-icons/fi";

export default function Photos({ room, home, open, onClose, onRoomUpdated }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [homeData, setHomeData] = useState(home || null);
  const [roomData, setRoomData] = useState(room || null);
  const [showDescription, setShowDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [isShareMode, setIsShareMode] = useState(false);
  const [preparedFiles, setPreparedFiles] = useState([]);
  const [preparing, setPreparing] = useState(false);
  const orientationLabels = {
    east: "Đông",
    west: "Tây",
    south: "Nam",
    north: "Bắc",
    northeast: "Đông Bắc",
    northwest: "Tây Bắc",
    southeast: "Đông Nam",
    southwest: "Tây Nam",
  };

  const [selectedPhotos, setSelectedPhotos] = useState([]);

  async function prepareFiles() {
    setPreparing(true);
    const selected = photos.filter((p) => selectedPhotos.includes(p.id));

    const files = await Promise.all(
      selected.map(async (photo, index) => {
        const response = await fetch(photo.image_url);
        const blob = await response.blob();
        return new File([blob], `photo-${index + 1}.jpg`, { type: blob.type });
      })
    );

    setPreparedFiles(files);
    setPreparing(false);
  }

  const isRoomMode = Boolean(room);
  const isHomeMode = Boolean(home);

  const fetchPhotos = useCallback(async () => {
    if (!isRoomMode && !isHomeMode) return;

    const query = supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false });

    const filtered = isRoomMode
      ? query.eq("room_id", room.id)
      : query.eq("home_id", home.id);

    const { data, error } = await filtered;

    if (error) {
      console.log(error.message);
      return;
    }

    setPhotos(data || []);
    setSelectedPhotos([]);
  }, [isRoomMode, isHomeMode, room?.id, home?.id]);

  const fetchHome = useCallback(async () => {
    const homeId = isHomeMode ? home?.id : room?.home_id;

    if (!homeId) return;

    const { data, error } = await supabase
      .from("homes")
      .select("*")
      .eq("id", homeId)
      .single();

    if (error) {
      console.log(error.message);
      return;
    }

    setHomeData(data);
  }, [isHomeMode, home?.id, room?.home_id]);

  // Luôn lấy dữ liệu room mới nhất (bao gồm amenities), tránh dùng prop room bị cũ
  const fetchRoom = useCallback(async () => {
    if (!isRoomMode || !room?.id) return;

    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", room.id)
      .single();

    if (error) {
      console.log(error.message);
      return;
    }

    setRoomData(data);
  }, [isRoomMode, room?.id]);

  useEffect(() => {
    if (open) {
      fetchPhotos();
      fetchHome();
      fetchRoom();
    }
  }, [open, fetchPhotos, fetchHome, fetchRoom]);

  async function handleUploadPhoto(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const photosToInsert = [];

      for (const originalFile of files) {
        const file = await resizeImage(originalFile);

        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(fileName, file);

        if (uploadError) {
          console.error(uploadError.message);
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("photos").getPublicUrl(fileName);

        const payload = {
          image_url: publicUrl,
        };

        if (isRoomMode) {
          payload.room_id = room.id;
        } else if (isHomeMode) {
          payload.home_id = home.id;
        }

        photosToInsert.push(payload);
      }

      if (photosToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("photos")
          .insert(photosToInsert);

        if (insertError) {
          console.error(insertError.message);
          alert("Failed to save photos.");
        }
      }

      await fetchPhotos();
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
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
  async function resizeImage(file, maxWidth = 1600, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        if (width <= maxWidth) {
          resolve(file);
          URL.revokeObjectURL(img.src);
          return;
        }

        height = (height * maxWidth) / width;
        width = maxWidth;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(img.src);

            if (!blob) {
              reject(new Error("Resize failed"));
              return;
            }

            resolve(
              new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
                type: "image/jpeg",
              })
            );
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
  function handleTogglePhoto(photoId) {
    setSelectedPhotos((prev) => {
      if (prev.includes(photoId)) {
        return prev.filter((id) => id !== photoId);
      }

      return [...prev, photoId];
    });
  }
  async function saveDescription(description) {
    const targetTable = isRoomMode ? "rooms" : "homes";
    const targetId = isRoomMode ? room.id : home.id;
    const { error } = await supabase
      .from(targetTable)
      .update({ description })
      .eq("id", targetId);

    if (error) {
      console.log(error.message);
    }
    if (isRoomMode) {
      setRoomData((prev) => ({
        ...prev,
        description,
      }));
    } else {
      setHomeData((prev) => ({
        ...prev,
        description,
      }));
    }
    onRoomUpdated?.();
  }
  function buildRoomDescription() {
    let desc = "🏠 Phòng trọ: ";
    const r = roomData || room; // luôn dùng dữ liệu room mới nhất, không dùng prop cũ

    if (homeData?.name) {
      desc += `${homeData.name}\n`;
    }
    if (homeData.address) desc += `   • ${homeData.address}, ${r.room_name}`;
    if (r?.area && r.area > 0) {
      desc += `, ${r.area} m²`;
    }
    if (r?.monthly_rent && r.monthly_rent > 0) {
      desc += `. Giá: ${r.monthly_rent.toLocaleString("vi-VN")}\n`;
    }

    if (r?.amenities) {
      try {
        const amenities = typeof r.amenities === 'string' ? JSON.parse(r.amenities) : r.amenities;
        const amenityList = [];

        if (amenities.hotWater) amenityList.push("Nước nóng");
        if (amenities.airConditioner) amenityList.push("Máy lạnh");
        if (amenities.bed) amenityList.push("Giường");
        if (amenities.kitchen) amenityList.push("Bếp");
        if (amenities.balcony) amenityList.push("Ban công");
        if (amenities.window) amenityList.push("Cửa sổ");
        if (amenityList.length > 0) {
          desc += `🎁 Tiện nghi: ${amenityList.join(", ")}.\n`;
        }
      } catch (e) {
        // Skip if parse error
      }
    }
    desc += `💡 Phí:\n`;
    desc += `   • Điện: ${Number(homeData.electricity_price || 0).toLocaleString("vi-VN")} đ/kWh\n`;
    desc += `   • Nước: ${homeData.is_water_per_person
      ? `${Number(homeData.water_price || 0).toLocaleString("vi-VN")} đ/người`
      : `${Number(homeData.water_price || 0).toLocaleString("vi-VN")} đ/khối`
      }\n`;
    desc += `   • Dịch vụ (wifi, rác...): ${Number(homeData.service_amount || 0).toLocaleString("vi-VN")} đ/phòng\n`;

    return desc;
  }

  function buildHomeDescription() {
    const h = homeData || home; // luôn dùng dữ liệu mới nhất (đã fetch/cập nhật), không dùng prop cũ
    return `
    🏡 Cho thuê nhà: ${h.address}
   • Giá: ${Number(h.monthly_rent || 0).toLocaleString("vi-VN")}/tháng
   ${h.road_type === "frontage"
        ? `• Mặt tiền${h.frontage_width ? `: Lề đường ${h.frontage_width} m` : ""}`
        : h.road_type === "alley"
          ? `• Hẻm${h.alley_width ? `: Hẻm rộng ${h.alley_width} m` : ""}`
          : ""
      }
   • Diện tích: ${h.width || 0}m × ${h.length || 0}m. Số tầng: ${h.floors || 1}
    - Phòng ngủ: ${h.bedrooms || 0}
    - WC: ${h.bathrooms || 0}
    ${h.orientation ? `- Hướng: ${orientationLabels[h.orientation]}\n` : ""}
    `.trim();
  }

  async function handleSharePhotos() {
    try {
      const description = editedDescription
        ? editedDescription
        : (homeData || home).property_type === "whole_house"
          ? buildHomeDescription()
          : buildRoomDescription();

      await saveDescription(description);

      await navigator.clipboard.writeText(description);

      if (preparedFiles.length === 0) {
        alert("Vui lòng chọn ảnh");
        return;
      }

      await navigator.share({
        files: preparedFiles,
        title: "Thông tin phòng trọ",
        text: description,
      });

      // Đóng dialog sau khi chia sẻ thành công
      const handleFocus = () => {
        setShowDescription(false);
        setEditedDescription("");
        setIsShareMode(false);
        onClose?.();

        window.removeEventListener("focus", handleFocus);
      };

      window.addEventListener("focus", handleFocus);

    } catch (err) {
      console.log(err);

      if (err.name !== "AbortError") {
        alert("Thiết bị hoặc ứng dụng không hỗ trợ chia sẻ ảnh.");
      }
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">

        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-stone-800">
            {isHomeMode ? "Hình ảnh nhà trọ" : "Hình ảnh phòng"}
          </h2>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-500"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b">

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUploadPhoto}
          />

          {photos.length > 0 && (
            <button
              onClick={() => {
                if ((homeData || home)?.property_type === "whole_house") {
                  setEditedDescription(
                    homeData?.description || buildHomeDescription()
                  );
                } else {
                  setEditedDescription(
                    roomData?.description || buildRoomDescription()
                  );
                }
                setIsShareMode(true);
                setShowDescription(true);
                prepareFiles();
              }}
              className="flex flex-col items-center text-blue-600 hover:text-blue-700"
            >
              <FiShare size={26} />
              <span className="text-xs mt-1">
                Chia sẻ ({selectedPhotos.length})
              </span>
            </button>
          )}
        </div>

        {showDescription && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto mx-4">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h3 className="font-semibold text-stone-800">
                  {isShareMode ? "📤 Chỉnh Sửa & Chia Sẻ" : "✏️ Chỉnh Sửa Mô Tả Phòng"}
                </h3>
                <button
                  onClick={() => {
                    setShowDescription(false);
                    setEditedDescription("");
                    setIsShareMode(false);
                  }}
                  className="text-stone-400 hover:text-stone-600"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Mô tả {isShareMode ? "(sẽ chia sẻ cùng ảnh)" : "(có thể chỉnh sửa)"}:
                  </label>
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="w-full h-64 p-3 border border-stone-300 rounded-lg font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Nhập mô tả..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const description =
                        (homeData || home).property_type === "whole_house"
                          ? buildHomeDescription()
                          : buildRoomDescription();

                      setEditedDescription(description);
                    }}
                    className="flex-1 px-4 py-2 bg-stone-200 text-stone-800 rounded-lg hover:bg-stone-300 transition font-medium"
                  >
                    🔄 Tạo lại mô tả
                  </button>
                  {isShareMode ? (
                    <button
                      onClick={handleSharePhotos}
                      disabled={preparing}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {preparing
                        ? "Đang chuẩn bị ảnh..."
                        : "🔗 Chia sẻ ngay"}
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        await saveDescription(editedDescription);
                        navigator.clipboard.writeText(editedDescription);
                        alert("✅ Mô tả đã sao chép vào clipboard!");
                      }}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                    >
                      📋 Sao chép
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {uploading && (
          <div className="px-5 py-3 text-sm text-stone-500">
            Đang tải ảnh...
          </div>
        )}

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
                  <img
                    src={photo.image_url}
                    alt="Room"
                    className="w-full h-44 object-cover"
                  />

                  <label className="absolute top-2 left-2 bg-white/90 rounded-md p-1 shadow">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        handleTogglePhoto(photo.id)
                      }
                    />
                  </label>

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
