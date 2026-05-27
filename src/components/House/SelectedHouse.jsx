import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import Input from "../InputVal.jsx";
import { useNavigate } from "react-router-dom";

export default function SelectedProject({
  userID,
  house,
  onDelete,
  refreshHouses,
}) {

  // Create mode
  const isNew = !house;

  const navigate = useNavigate();

  // States
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

  // Load selected house
  useEffect(() => {

    setName(
      house?.name || ""
    );

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

  // Save / Update
  async function handleSave() {

    // Validation
    if (!name) {

      alert(
        "Please enter house name"
      );

      return;
    }

    const homeData = {
      userID: userID,
      name: name,
      address: address,
      bank_id: bankID,
      bank_account: bankAccount,
      electricity_price:
        electricityPrice,
      water_price: waterPrice,
      is_water_per_person:
        isWaterPerPerson,
    };

    // CREATE
    if (isNew) {

      const { error } = await supabase
        .from("homes")
        .insert([homeData]);

      if (error) {

        console.log(error.message);

        alert(
          "Failed to create house"
        );

        return;
      }
    }

    // UPDATE
    else {

      const { error } = await supabase
        .from("homes")
        .update(homeData)
        .eq("id", house.id);

      if (error) {

        console.log(error.message);

        alert(
          "Failed to update house"
        );

        return;
      }
    }

    // Refresh
    await refreshHouses();

    // Close create form
    if (isNew) {
      onDelete();
    }
  }

  return (
    <>
      <div className="ml-0 flex flex-col items-start w-full pr-2">

        <header className="flex flex-col items-start pb-4 mb-4 border-b border-stone-300 w-full">

          {/* Buttons */}
          <div className="flex gap-2 mb-4">

            {/* Cancel / Delete */}
            <button
              className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-md"
              onClick={onDelete}
            >
              {isNew
                ? "Cancel"
                : "Delete"}
            </button>

            {/* Save / Update */}
            <button
              onClick={handleSave}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded-md"
            >
              {isNew
                ? "Save"
                : "Update"}
            </button>

            {/* Rooms */}
            {!isNew && (
              <button
                onClick={() =>
                  navigate(
                    `/rooms/${house.id}`
                  )
                }
                className="bg-stone-700 hover:bg-stone-800 text-white text-sm px-3 py-1 rounded-md"
              >
                Phòng
              </button>
            )}

          </div>

          {/* Form */}
          <div className="flex flex-col items-start gap-2 w-full">

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

            {/* Price Section */}
            <div className="w-full py-3 my-2 border-t border-b border-stone-300">

              {/* Electricity */}
              <div className="mb-3">

                <Input
                  label="Giá điện"
                  type="text"
                  value={electricityPrice.toLocaleString("vi-VN")}
                  onChange={(e) => {

                    const rawValue =
                      e.target.value.replace(
                        /\./g,
                        ""
                      );

                    const numberValue =
                      Number(
                        rawValue.replace(
                          /\D/g,
                          ""
                        )
                      );

                    setElectricityPrice(
                      numberValue
                    );
                  }}
                />

              </div>

              {/* Water Type */}
              <div className="flex flex-col items-start gap-1 w-full mb-3">

                <label className="text-left text-xs font-bold uppercase text-stone-500">
                  Cách tính nước
                </label>

                <div className="flex gap-4 mt-1">

                  {/* Theo khối */}
                  <label className="flex items-center gap-1 text-sm text-stone-600">

                    <input
                      type="radio"
                      checked={!isWaterPerPerson}
                      onChange={() =>
                        setIsWaterPerPerson(
                          false
                        )
                      }
                    />

                    Tính khối
                  </label>

                  {/* Theo người */}
                  <label className="flex items-center gap-1 text-sm text-stone-600">

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

                    Đầu người
                  </label>

                </div>

              </div>

              {/* Water Price */}
              <Input
                label={
                  isWaterPerPerson
                    ? "Giá nước theo người"
                    : "Giá nước theo khối"
                }
                type="text"
                value={waterPrice.toLocaleString("vi-VN")}
                onChange={(e) => {

                  const rawValue =
                    e.target.value.replace(
                      /\./g,
                      ""
                    );

                  const numberValue =
                    Number(
                      rawValue.replace(
                        /\D/g,
                        ""
                      )
                    );

                  setWaterPrice(
                    numberValue
                  );
                }}
              />

            </div>

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
              label="Tài khoản"
              type="text"
              value={bankAccount}
              onChange={(e) =>
                setBankAccount(
                  e.target.value
                )
              }
            />

          </div>

        </header>
      </div>
    </>
  );
}