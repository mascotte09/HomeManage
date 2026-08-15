import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../supabase";
import { db } from "../../db/db";
import { FiShare } from "react-icons/fi";

export default function Photos({
  room,
  home,
  open,
  onClose,
  onRoomUpdated,
}) {
  const [photos, setPhotos] = useState([]);

  const [uploading, setUploading] = useState(false);

  const [homeData, setHomeData] = useState(home || null);
  const [roomData, setRoomData] = useState(room || null);

  const [showDescription, setShowDescription] =
    useState(false);

  const [editedDescription, setEditedDescription] =
    useState("");

  const [isShareMode, setIsShareMode] =
    useState(false);

  const [preparedFiles, setPreparedFiles] =
    useState([]);

  const [preparing, setPreparing] =
    useState(false);

  const [selectedPhotos, setSelectedPhotos] =
    useState([]);

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

  const isRoomMode = Boolean(room);
  const isHomeMode = Boolean(home);

  // =========================================================
  // LOAD LOCAL PHOTOS
  //
  // KHÔNG ĐỌC PHOTOS TỪ SUPABASE
  // =========================================================

  const fetchPhotos = useCallback(async () => {
    if (!isRoomMode && !isHomeMode) {
      return;
    }

    try {
      let data = [];

      if (isRoomMode && room?.id) {
        data = await db.photos
          .where("room_id")
          .equals(room.id)
          .toArray();
      } else if (isHomeMode && home?.id) {
        data = await db.photos
          .where("home_id")
          .equals(home.id)
          .toArray();
      }

      // Không hiển thị ảnh đã retired
      data = (data || [])
        .filter((photo) => photo.retired !== true)
        .sort((a, b) => {
          const dateA = new Date(
            a.created_at || 0
          ).getTime();

          const dateB = new Date(
            b.created_at || 0
          ).getTime();

          return dateB - dateA;
        });

      setPhotos(data);
      setSelectedPhotos([]);

    } catch (error) {
      console.error(
        "❌ Load local photos:",
        error
      );
    }
  }, [
    isRoomMode,
    isHomeMode,
    room?.id,
    home?.id,
  ]);

  // =========================================================
  // LOAD LOCAL HOME
  // =========================================================

  const fetchHome = useCallback(async () => {
    const homeId =
      isHomeMode
        ? home?.id
        : room?.home_id;

    if (!homeId) return;

    try {
      const data =
        await db.homes.get(homeId);

      if (data) {
        setHomeData(data);
      }
    } catch (error) {
      console.error(
        "❌ Load local home:",
        error
      );
    }
  }, [
    isHomeMode,
    home?.id,
    room?.home_id,
  ]);

  // =========================================================
  // LOAD LOCAL ROOM
  // =========================================================

  const fetchRoom = useCallback(async () => {
    if (
      !isRoomMode ||
      !room?.id
    ) {
      return;
    }

    try {
      const data =
        await db.rooms.get(room.id);

      if (data) {
        setRoomData(data);
      }
    } catch (error) {
      console.error(
        "❌ Load local room:",
        error
      );
    }
  }, [
    isRoomMode,
    room?.id,
  ]);

  // =========================================================
  // OPEN
  // =========================================================

  useEffect(() => {
    if (!open) return;

    fetchPhotos();
    fetchHome();
    fetchRoom();

  }, [
    open,
    fetchPhotos,
    fetchHome,
    fetchRoom,
  ]);

  // =========================================================
  // RESIZE IMAGE
  // =========================================================

  async function resizeImage(
    file,
    maxWidth = 1600,
    quality = 0.8
  ) {
    return new Promise(
      (resolve, reject) => {
        const img =
          new Image();

        const objectUrl =
          URL.createObjectURL(file);

        img.onload = () => {
          let {
            width,
            height,
          } = img;

          if (
            width <= maxWidth
          ) {
            URL.revokeObjectURL(
              objectUrl
            );

            resolve(file);
            return;
          }

          height =
            (height *
              maxWidth) /
            width;

          width =
            maxWidth;

          const canvas =
            document.createElement(
              "canvas"
            );

          canvas.width =
            width;

          canvas.height =
            height;

          const ctx =
            canvas.getContext(
              "2d"
            );

          if (!ctx) {
            URL.revokeObjectURL(
              objectUrl
            );

            reject(
              new Error(
                "Không tạo được canvas"
              )
            );

            return;
          }

          ctx.drawImage(
            img,
            0,
            0,
            width,
            height
          );

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(
                objectUrl
              );

              if (!blob) {
                reject(
                  new Error(
                    "Resize failed"
                  )
                );

                return;
              }

              const newName =
                file.name.replace(
                  /\.[^/.]+$/,
                  ".jpg"
                );

              resolve(
                new File(
                  [blob],
                  newName,
                  {
                    type:
                      "image/jpeg",
                  }
                )
              );
            },
            "image/jpeg",
            quality
          );
        };

        img.onerror = () => {
          URL.revokeObjectURL(
            objectUrl
          );

          reject(
            new Error(
              "Không thể đọc ảnh"
            )
          );
        };

        img.src =
          objectUrl;
      }
    );
  }

  // =========================================================
  // CREATE SYNC QUEUE
  //
  // LOCAL → sync_queue
  // =========================================================

  async function addSyncQueue(
    table,
    recordId,
    action
  ) {
    if (!db.sync_queue) {
      console.warn(
        "⚠️ db.sync_queue chưa tồn tại"
      );

      return;
    }

    try {
      // Xóa queue cũ cùng record/action
      const oldItems =
        await db.sync_queue
          .where("table")
          .equals(table)
          .filter(
            (item) =>
              item.record_id ===
                recordId &&
              item.action ===
                action
          )
          .toArray();

      for (
        const item
        of oldItems
      ) {
        await db.sync_queue.delete(
          item.id
        );
      }

      await db.sync_queue.add({
        table,
        record_id:
          recordId,
        action,
        created_at:
          new Date().toISOString(),
      });

      console.log(
        `📥 Queue ${action} ${table}:`,
        recordId
      );

    } catch (error) {
      console.error(
        "❌ Add sync queue:",
        error
      );

      throw error;
    }
  }

  // =========================================================
  // UPLOAD PHOTO
  //
  // 1. Resize
  // 2. Upload Supabase Storage
  // 3. Lưu metadata IndexedDB
  // 4. Tạo INSERT queue
  //
  // KHÔNG INSERT TABLE SUPABASE
  // =========================================================

  async function handleUploadPhoto(e) {
    const files =
      Array.from(
        e.target.files || []
      );

    if (
      files.length === 0
    ) {
      return;
    }

    if (
      !isRoomMode &&
      !isHomeMode
    ) {
      alert(
        "Không xác định được phòng hoặc nhà."
      );

      e.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const uploadedPhotos =
        [];

      for (
        const originalFile
        of files
      ) {
        try {
          // =========================================
          // RESIZE
          // =========================================

          const file =
            await resizeImage(
              originalFile,
              1600,
              0.8
            );

          // =========================================
          // PHOTO ID
          // =========================================

          const photoId =
            crypto.randomUUID();

          // =========================================
          // STORAGE PATH
          //
          // Không dùng tên file để tránh trùng.
          // =========================================

          const folder =
            isRoomMode
              ? `rooms/${room.id}`
              : `homes/${home.id}`;

          const storagePath =
            `${folder}/${photoId}.jpg`;

          console.log(
            "📤 Upload:",
            storagePath
          );

          // =========================================
          // SUPABASE STORAGE
          // =========================================

          const {
            error:
              uploadError,
          } =
            await supabase.storage
              .from("photos")
              .upload(
                storagePath,
                file,
                {
                  cacheControl:
                    "3600",
                  upsert: false,
                  contentType:
                    "image/jpeg",
                }
              );

          if (
            uploadError
          ) {
            throw uploadError;
          }

          // =========================================
          // PUBLIC URL
          // =========================================

          const {
            data:
              publicUrlData,
          } =
            supabase.storage
              .from("photos")
              .getPublicUrl(
                storagePath
              );

          const imageUrl =
            publicUrlData?.publicUrl;

          if (
            !imageUrl
          ) {
            throw new Error(
              "Không lấy được URL ảnh"
            );
          }

          // =========================================
          // LOCAL PHOTO
          //
          // Lưu storage_path local.
          //
          // LƯU Ý:
          // bảng Supabase hiện tại chưa có
          // storage_path nên syncService
          // cần clean field này trước khi push.
          // =========================================

          const photo = {
            id: photoId,

            name:
              originalFile.name,

            image_url:
              imageUrl,

            created_at:
              new Date().toISOString(),

            room_id:
              isRoomMode
                ? room.id
                : null,

            home_id:
              isHomeMode
                ? home.id
                : null,

            storage_path:
              storagePath,

            retired:
              false,
          };

          // =========================================
          // LOCAL INDEXEDDB
          // =========================================

          await db.photos.put(
            photo
          );

          // =========================================
          // QUEUE INSERT
          // =========================================

          await addSyncQueue(
            "photos",
            photo.id,
            "INSERT"
          );

          uploadedPhotos.push(
            photo
          );

          console.log(
            "✅ Photo Local:",
            photo.id
          );

        } catch (error) {
          console.error(
            "❌ Upload photo:",
            error
          );
        }
      }

      if (
        uploadedPhotos.length ===
        0
      ) {
        alert(
          "Không thể upload ảnh."
        );

        return;
      }

      // =========================================
      // REFRESH LOCAL
      // =========================================

      await fetchPhotos();

    } catch (error) {
      console.error(
        "❌ Upload photos:",
        error
      );

      alert(
        error?.message ||
        "Upload ảnh thất bại."
      );

    } finally {
      setUploading(false);

      e.target.value = "";
    }
  }

  // =========================================================
  // DELETE PHOTO
  //
  // KHÔNG DELETE SUPABASE
  //
  // Local:
  //     retired = true
  //
  // Queue:
  //     DELETE
  //
  // syncService:
  //     Supabase retired = true
  // =========================================================

  async function handleDeletePhoto(
    photo
  ) {
    if (!photo?.id) {
      return;
    }

    const confirmed =
      window.confirm(
        "Bạn có chắc muốn xóa ảnh này?"
      );

    if (!confirmed) {
      return;
    }

    try {
      // =========================================
      // LOCAL RETIRE
      // =========================================

      await db.photos.update(
        photo.id,
        {
          retired:
            true,

          updated_at:
            new Date().toISOString(),
        }
      );

      // =========================================
      // QUEUE DELETE
      // =========================================

      await addSyncQueue(
        "photos",
        photo.id,
        "DELETE"
      );

      // =========================================
      // REFRESH LOCAL
      // =========================================

      await fetchPhotos();

      console.log(
        "🗑️ Photo retired Local:",
        photo.id
      );

    } catch (error) {
      console.error(
        "❌ Delete photo:",
        error
      );

      alert(
        error?.message ||
        "Không thể xóa ảnh."
      );
    }
  }

  // =========================================================
  // TOGGLE PHOTO
  // =========================================================

  function handleTogglePhoto(
    photoId
  ) {
    setSelectedPhotos(
      (prev) => {
        if (
          prev.includes(
            photoId
          )
        ) {
          return prev.filter(
            (id) =>
              id !== photoId
          );
        }

        return [
          ...prev,
          photoId,
        ];
      }
    );
  }

  // =========================================================
  // PREPARE FILES
  //
  // Lấy ảnh từ Supabase Storage URL
  // để navigator.share()
  // =========================================================

  async function prepareFiles() {
    if (
      selectedPhotos.length ===
      0
    ) {
      alert(
        "Vui lòng chọn ảnh."
      );

      return;
    }

    setPreparing(true);

    try {
      const selected =
        photos.filter(
          (photo) =>
            selectedPhotos.includes(
              photo.id
            )
        );

      const files =
        await Promise.all(
          selected.map(
            async (
              photo,
              index
            ) => {
              const response =
                await fetch(
                  photo.image_url
                );

              if (
                !response.ok
              ) {
                throw new Error(
                  "Không tải được ảnh"
                );
              }

              const blob =
                await response.blob();

              return new File(
                [blob],
                `photo-${index + 1}.jpg`,
                {
                  type:
                    blob.type ||
                    "image/jpeg",
                }
              );
            }
          )
        );

      setPreparedFiles(
        files
      );

      return files;

    } catch (error) {
      console.error(
        "❌ Prepare files:",
        error
      );

      alert(
        "Không thể chuẩn bị ảnh để chia sẻ."
      );

      return [];

    } finally {
      setPreparing(false);
    }
  }

  // =========================================================
  // SAVE DESCRIPTION LOCAL
  //
  // KHÔNG UPDATE SUPABASE
  // =========================================================

  async function saveDescription(
    description
  ) {
    const targetId =
      isRoomMode
        ? room?.id
        : home?.id;

    if (!targetId) {
      return;
    }

    try {
      if (isRoomMode) {
        const current =
          await db.rooms.get(
            targetId
          );

        if (!current) {
          return;
        }

        const updated = {
          ...current,
          description,
          updated_at:
            new Date().toISOString(),
        };

        await db.rooms.put(
          updated
        );

        setRoomData(
          updated
        );

        await addSyncQueue(
          "rooms",
          targetId,
          "UPDATE"
        );

      } else {
        const current =
          await db.homes.get(
            targetId
          );

        if (!current) {
          return;
        }

        const updated = {
          ...current,
          description,
          updated_at:
            new Date().toISOString(),
        };

        await db.homes.put(
          updated
        );

        setHomeData(
          updated
        );

        await addSyncQueue(
          "homes",
          targetId,
          "UPDATE"
        );
      }

      onRoomUpdated?.();

    } catch (error) {
      console.error(
        "❌ Save description:",
        error
      );
    }
  }

  // =========================================================
  // BUILD ROOM DESCRIPTION
  // =========================================================

  function buildRoomDescription() {
    let desc =
      "🏠 Phòng trọ: ";

    const r =
      roomData ||
      room;

    if (
      homeData?.name
    ) {
      desc +=
        `${homeData.name}\n`;
    }

    if (
      homeData?.address
    ) {
      desc +=
        `   • ${homeData.address}, ${r?.room_name || ""}`;
    }

    if (
      r?.area &&
      r.area > 0
    ) {
      desc +=
        `, ${r.area} m²`;
    }

    if (
      r?.monthly_rent &&
      r.monthly_rent > 0
    ) {
      desc +=
        `. Giá: ${Number(
          r.monthly_rent
        ).toLocaleString(
          "vi-VN"
        )}\n`;
    }

    if (r?.amenities) {
      try {
        const amenities =
          typeof r.amenities ===
          "string"
            ? JSON.parse(
                r.amenities
              )
            : r.amenities;

        const amenityList =
          [];

        if (
          amenities.hotWater
        ) {
          amenityList.push(
            "Nước nóng"
          );
        }

        if (
          amenities.airConditioner
        ) {
          amenityList.push(
            "Máy lạnh"
          );
        }

        if (
          amenities.bed
        ) {
          amenityList.push(
            "Giường"
          );
        }

        if (
          amenities.kitchen
        ) {
          amenityList.push(
            "Bếp"
          );
        }

        if (
          amenities.balcony
        ) {
          amenityList.push(
            "Ban công"
          );
        }

        if (
          amenities.window
        ) {
          amenityList.push(
            "Cửa sổ"
          );
        }

        if (
          amenityList.length >
          0
        ) {
          desc +=
            `🎁 Tiện nghi: ${amenityList.join(
              ", "
            )}.\n`;
        }

      } catch {
        // Không làm gì nếu amenities lỗi
      }
    }

    desc +=
      `💡 Phí:\n`;

    desc +=
      `   • Điện: ${Number(
        homeData?.electricity_price ||
        0
      ).toLocaleString(
        "vi-VN"
      )} đ/kWh\n`;

    desc +=
      `   • Nước: ${
        homeData?.is_water_per_person
          ? `${Number(
              homeData?.water_price ||
              0
            ).toLocaleString(
              "vi-VN"
            )} đ/người`
          : `${Number(
              homeData?.water_price ||
              0
            ).toLocaleString(
              "vi-VN"
            )} đ/khối`
      }\n`;

    desc +=
      `   • Dịch vụ (wifi, rác...): ${Number(
        homeData?.service_amount ||
        0
      ).toLocaleString(
        "vi-VN"
      )} đ/phòng\n`;

    return desc;
  }

  // =========================================================
  // BUILD HOME DESCRIPTION
  // =========================================================

  function buildHomeDescription() {
    const h =
      homeData ||
      home;

    if (!h) {
      return "";
    }

    return `
🏡 Cho thuê nhà: ${h.address || ""}
   • Giá: ${Number(
     h.monthly_rent || 0
   ).toLocaleString(
     "vi-VN"
   )}/tháng
   ${
     h.road_type ===
     "frontage"
       ? `• Mặt tiền${
           h.frontage_width
             ? `: Lề đường ${h.frontage_width} m`
             : ""
         }`
       : h.road_type ===
         "alley"
       ? `• Hẻm${
           h.alley_width
             ? `: Hẻm rộng ${h.alley_width} m`
             : ""
         }`
       : ""
   }
   • Diện tích: ${
     h.width || 0
   }m × ${
     h.length || 0
   }m. Số tầng: ${
     h.floors || 1
   }
   - Phòng ngủ: ${
     h.bedrooms || 0
   }
   - WC: ${
     h.bathrooms || 0
   }
   ${
     h.orientation
       ? `- Hướng: ${
           orientationLabels[
             h.orientation
           ] ||
           h.orientation
         }`
       : ""
   }
`.trim();
  }

  // =========================================================
  // SHARE
  // =========================================================

  async function handleSharePhotos() {
    try {
      if (
        selectedPhotos.length ===
        0
      ) {
        alert(
          "Vui lòng chọn ảnh."
        );

        return;
      }

      const target =
        homeData ||
        home;

      const description =
        editedDescription
          ? editedDescription
          : target?.property_type ===
            "whole_house"
          ? buildHomeDescription()
          : buildRoomDescription();

      // =========================================
      // SAVE LOCAL DESCRIPTION
      // =========================================

      await saveDescription(
        description
      );

      // =========================================
      // COPY
      // =========================================

      try {
        await navigator.clipboard.writeText(
          description
        );
      } catch {
        // Clipboard không được hỗ trợ
      }

      // =========================================
      // PREPARE
      // =========================================

      let files =
        preparedFiles;

      if (
        files.length === 0
      ) {
        files =
          await prepareFiles();
      }

      if (
        !files ||
        files.length === 0
      ) {
        return;
      }

      // =========================================
      // SHARE
      // =========================================

      if (
        !navigator.share
      ) {
        alert(
          "Thiết bị không hỗ trợ chia sẻ."
        );

        return;
      }

      const shareData = {
        title:
          "Thông tin phòng trọ",
        text:
          description,
      };

      if (
        navigator.canShare?.({
          files,
        })
      ) {
        shareData.files =
          files;
      }

      await navigator.share(
        shareData
      );

      setShowDescription(
        false
      );

      setEditedDescription(
        ""
      );

      setIsShareMode(
        false
      );

      onClose?.();

    } catch (err) {
      console.log(
        "Share:",
        err
      );

      if (
        err?.name !==
        "AbortError"
      ) {
        alert(
          "Thiết bị hoặc ứng dụng không hỗ trợ chia sẻ ảnh."
        );
      }
    }
  }

  // =========================================================
  // OPEN SHARE
  // =========================================================

  async function openShareDialog() {
    if (
      selectedPhotos.length ===
      0
    ) {
      alert(
        "Vui lòng chọn ít nhất một ảnh."
      );

      return;
    }

    const target =
      homeData ||
      home;

    const description =
      target?.property_type ===
      "whole_house"
        ? homeData?.description ||
          buildHomeDescription()
        : roomData?.description ||
          buildRoomDescription();

    setEditedDescription(
      description
    );

    setIsShareMode(
      true
    );

    setShowDescription(
      true
    );

    await prepareFiles();
  }

  // =========================================================
  // UI
  // =========================================================

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex items-center justify-between px-5 py-4 border-b">

          <h2 className="text-lg font-semibold text-stone-800">
            {isHomeMode
              ? "Hình ảnh nhà trọ"
              : "Hình ảnh phòng"}
          </h2>

          <button
            onClick={onClose}
            className="
              w-8
              h-8
              flex
              items-center
              justify-center
              rounded-full
              hover:bg-stone-100
              text-stone-500
            "
          >
            ✕
          </button>

        </div>

        {/* =====================================================
            TOOLBAR
        ===================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b">

          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={
              handleUploadPhoto
            }
          />

          {photos.length >
            0 && (
            <button
              onClick={
                openShareDialog
              }
              className="
                flex
                flex-col
                items-center
                text-blue-600
                hover:text-blue-700
              "
            >
              <FiShare
                size={26}
              />

              <span className="text-xs mt-1">
                Chia sẻ (
                {
                  selectedPhotos.length
                }
                )
              </span>
            </button>
          )}

        </div>

        {/* =====================================================
            DESCRIPTION DIALOG
        ===================================================== */}

        {showDescription && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">

            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto mx-4">

              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">

                <h3 className="font-semibold text-stone-800">
                  {isShareMode
                    ? "📤 Chỉnh Sửa & Chia Sẻ"
                    : "✏️ Chỉnh Sửa Mô Tả"}
                </h3>

                <button
                  onClick={() => {
                    setShowDescription(
                      false
                    );

                    setEditedDescription(
                      ""
                    );

                    setIsShareMode(
                      false
                    );
                  }}
                  className="
                    text-stone-400
                    hover:text-stone-600
                  "
                >
                  ✕
                </button>

              </div>

              <div className="p-6 space-y-4">

                <div>

                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Mô tả{" "}
                    {isShareMode
                      ? "(sẽ chia sẻ cùng ảnh)"
                      : "(có thể chỉnh sửa)"}
                  </label>

                  <textarea
                    value={
                      editedDescription
                    }
                    onChange={(e) =>
                      setEditedDescription(
                        e.target.value
                      )
                    }
                    className="
                      w-full
                      h-64
                      p-3
                      border
                      border-stone-300
                      rounded-lg
                      font-mono
                      text-sm
                      focus:outline-none
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-200
                    "
                    placeholder="Nhập mô tả..."
                  />

                </div>

                <div className="flex gap-3">

                  <button
                    onClick={() => {
                      const target =
                        homeData ||
                        home;

                      const description =
                        target?.property_type ===
                        "whole_house"
                          ? buildHomeDescription()
                          : buildRoomDescription();

                      setEditedDescription(
                        description
                      );
                    }}
                    className="
                      flex-1
                      px-4
                      py-2
                      bg-stone-200
                      text-stone-800
                      rounded-lg
                      hover:bg-stone-300
                      transition
                      font-medium
                    "
                  >
                    🔄 Tạo lại mô tả
                  </button>

                  {isShareMode ? (
                    <button
                      onClick={
                        handleSharePhotos
                      }
                      disabled={
                        preparing
                      }
                      className="
                        flex-1
                        px-4
                        py-2
                        bg-blue-600
                        text-white
                        rounded-lg
                        hover:bg-blue-700
                        disabled:opacity-50
                      "
                    >
                      {preparing
                        ? "Đang chuẩn bị ảnh..."
                        : "🔗 Chia sẻ ngay"}
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        await saveDescription(
                          editedDescription
                        );

                        try {
                          await navigator.clipboard.writeText(
                            editedDescription
                          );
                        } catch {
                          // ignore
                        }

                        alert(
                          "✅ Mô tả đã lưu và sao chép!"
                        );
                      }}
                      className="
                        flex-1
                        px-4
                        py-2
                        bg-purple-600
                        text-white
                        rounded-lg
                        hover:bg-purple-700
                        transition
                        font-medium
                      "
                    >
                      📋 Lưu & Sao chép
                    </button>
                  )}

                </div>

              </div>

            </div>

          </div>
        )}

        {/* =====================================================
            UPLOADING
        ===================================================== */}

        {uploading && (
          <div className="px-5 py-3 text-sm text-stone-500">
            Đang tải ảnh lên...
          </div>
        )}

        {/* =====================================================
            EMPTY
        ===================================================== */}

        {photos.length ===
        0 ? (
          <div className="py-16 text-center text-stone-400">
            Chưa có hình ảnh nào
          </div>
        ) : (

          /* ===================================================
             PHOTO GRID
          =================================================== */

          <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

            {photos.map(
              (photo) => {
                const selected =
                  selectedPhotos.includes(
                    photo.id
                  );

                return (
                  <div
                    key={
                      photo.id
                    }
                    className={`
                      relative
                      overflow-hidden
                      rounded-xl
                      border
                      bg-white
                      transition-all
                      ${
                        selected
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-stone-200"
                      }
                    `}
                  >

                    <img
                      src={
                        photo.image_url
                      }
                      alt={
                        photo.name ||
                        "Ảnh"
                      }
                      className="
                        w-full
                        h-44
                        object-cover
                      "
                    />

                    {/* CHECKBOX */}

                    <label className="
                      absolute
                      top-2
                      left-2
                      bg-white/90
                      rounded-md
                      p-1
                      shadow
                    ">
                      <input
                        type="checkbox"
                        checked={
                          selected
                        }
                        onChange={() =>
                          handleTogglePhoto(
                            photo.id
                          )
                        }
                      />
                    </label>

                    {/* DELETE */}

                    <button
                      onClick={() =>
                        handleDeletePhoto(
                          photo
                        )
                      }
                      className="
                        absolute
                        top-2
                        right-2
                        bg-red-500
                        hover:bg-red-600
                        text-white
                        w-8
                        h-8
                        rounded-full
                        shadow
                      "
                      title="Xóa ảnh"
                    >
                      🗑
                    </button>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

    </div>
  );
}