import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiSave,
  FiHome,
} from "react-icons/fi";
import Input from "../InputVal.jsx";
import DeleteModal from "../DeleteModal.jsx";

export default function SelectedHouse({
  userID,
  house,
  onDelete,
  onBack,
  refreshHouses,
}) {
  const navigate = useNavigate();

  const isNew = !house;

  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] =
    useState("");

  const [bankID, setBankID] =
    useState("");

  const [bankAccount, setBankAccount] =
    useState("");

  const [
    electricityPrice,
    setElectricityPrice,
  ] = useState(3500);

  const [waterPrice, setWaterPrice] =
    useState(100000);

  const [
    isWaterPerPerson,
    setIsWaterPerPerson,
  ] = useState(false);

  useEffect(() => {
    setName(house?.name || "");

    setAddress(
      house?.address || ""
    );

    setBankID(
      house?.bank_id || ""
    );

    setBankAccount(
      house?.bank_account || ""
    );

    setElectricityPrice(
      house?.electricity_price || 3500
    );

    setWaterPrice(
      house?.water_price || 100000
    );

    setIsWaterPerPerson(
      house?.is_water_per_person || false
    );
  }, [house]);

  async function handleSave() {
    if (saving) return;

    setSaving(true);

    try {
      if (!name.trim()) {
        alert("Vui lòng nhập tên nhà trọ");
        return;
      }

      const homeData = {
        userID,
        name,
        address,
        bank_id: bankID,
        bank_account: bankAccount,
        electricity_price:
          electricityPrice,
        water_price: waterPrice,
        is_water_per_person:
          isWaterPerPerson,
      };

      if (isNew) {
        const { error } =
          await supabase
            .from("homes")
            .insert([homeData]);

        if (error) throw error;
      } else {
        const { error } =
          await supabase
            .from("homes")
            .update(homeData)
            .eq("id", house.id);

        if (error) throw error;
      }

      await refreshHouses();

      if (isNew) {
        onDelete?.();
      }
    } catch (error) {
      console.log(error);

      alert(
        isNew
          ? "Không thể tạo nhà trọ"
          : "Không thể cập nhật nhà trọ"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!house?.id) return;

    const { error } = await supabase
      .from("homes")
      .delete()
      .eq("id", house.id);

    if (error) {
      console.log(error.message);

      alert("Không thể xóa nhà trọ");

      return;
    }

    await refreshHouses();

    setShowDeleteModal(false);

  }

  return (
    <>
      <div className="flex-1 p-3 md:p-5 overflow-y-auto">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-3 mb-4">

          <div className="flex items-center justify-between">

            {/* Back */}
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100"
            >
              <FiArrowLeft size={20} />
            </button>

            <div className="flex gap-2">

              {/* Rooms */}
              {!isNew && (
                <button
  onClick={() => navigate(`/rooms/${house.id}`)}
  className="
    h-10 px-3
    flex items-center gap-2
    rounded-full
    bg-blue-600 text-white
    shadow-md
    hover:bg-blue-700
    transition
  "
>
  <FiHome size={18} />
  <span className="text-sm font-medium">
    Quản Lý Phòng
  </span>
</button>
              )}

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving}
                className={`
          w-10 h-10 rounded-full flex items-center justify-center text-white
          ${saving
                    ? "bg-gray-400"
                    : "bg-blue-600 hover:bg-blue-700"
                  }
        `}
                title="Lưu"
              >
                <FiSave size={18} />
              </button>

            </div>

          </div>

        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 mb-4">

          <h3 className="font-semibold text-stone-700 mb-4">
            Thông tin nhà trọ
          </h3>

          <div className="space-y-3">

            <Input
              label="Tên nhà trọ"
              type="text"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
            />

            <Input
              label="Địa chỉ"
              type="text"
              value={address}
              onChange={(e) =>
                setAddress(
                  e.target.value
                )
              }
            />

          </div>

        </div>

        {/* Utility Prices */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 mb-4">

          <h3 className="font-semibold text-stone-700 mb-4">
            Giá dịch vụ
          </h3>

          <div className="space-y-3">

            <Input
              label="Giá điện"
              type="text"
              value={electricityPrice.toLocaleString(
                "vi-VN"
              )}
              onChange={(e) => {
                const value = Number(
                  e.target.value
                    .replace(/\./g, "")
                    .replace(/\D/g, "")
                );

                setElectricityPrice(
                  value
                );
              }}
            />

            <div>
              <label className="text-xs font-bold uppercase text-stone-500 block mb-2">
                Cách tính nước
              </label>

              <div className="flex gap-4">

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={
                      !isWaterPerPerson
                    }
                    onChange={() =>
                      setIsWaterPerPerson(
                        false
                      )
                    }
                  />

                  <span>
                    Theo khối
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={
                      isWaterPerPerson
                    }
                    onChange={() =>
                      setIsWaterPerPerson(
                        true
                      )
                    }
                  />

                  <span>
                    Theo người
                  </span>
                </label>

              </div>

            </div>

            <Input
              label={
                isWaterPerPerson
                  ? "Giá nước / người"
                  : "Giá nước / khối"
              }
              type="text"
              value={waterPrice.toLocaleString(
                "vi-VN"
              )}
              onChange={(e) => {
                const value = Number(
                  e.target.value
                    .replace(/\./g, "")
                    .replace(/\D/g, "")
                );

                setWaterPrice(
                  value
                );
              }}
            />

          </div>

        </div>

        {/* Banking */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4">

          <h3 className="font-semibold text-stone-700 mb-4">
            Thông tin thanh toán
          </h3>

          <div className="space-y-3">

            <Input
              label="Ngân hàng"
              type="text"
              value={bankID}
              onChange={(e) =>
                setBankID(
                  e.target.value
                )
              }
            />

            <Input
              label="Số tài khoản"
              type="text"
              value={bankAccount}
              onChange={(e) =>
                setBankAccount(
                  e.target.value
                )
              }
            />

          </div>

        </div>

      </div>

      <DeleteModal
        open={showDeleteModal}
        title="Xóa nhà trọ"
        message="Bạn có chắc muốn xóa nhà trọ này không?"
        onClose={() =>
          setShowDeleteModal(false)
        }
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}