//import Tasks from "../Invoice/Invoices.jsx";
import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
//import Photos from "../Photos.jsx";
import { useNavigate } from "react-router-dom";

export default function SelectedProject({
  house,
  onDelete,
  refreshHouses,
}) {
  const [name, setName] = useState(house?.name || "");
  const [address, setAddress] = useState(house?.address || "");  
  const [bankID, setBankID] = useState(house?.bank_id || "");
  const [bankAccount, setBankAccount] = useState(house?.bank_account || "");
  const navigate = useNavigate();

  useEffect(() => {
    setName(house?.name || "");
    setAddress(house?.address || "");
    setBankID(house?.bank_id || "");
    setBankAccount(house?.bank_account || "");
  }, [house]);

  async function handleUpdate() {
    console.log({
  name,
  address,
  bankID,
  bankAccount,
});
    const { error } = await supabase
      .from("homes")
      .update({
        name: name,
        address: address,
        bank_id: bankID,
        bank_account: bankAccount,
      })
      .eq("id", house.id);

    if (error) {
      console.log(error.message);
      alert("Failed to update house");
      return;
    }

    await refreshHouses();
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
              onClick={() => navigate(`/rooms/${house.id}`)}
              className="bg-stone-700 hover:bg-stone-800 text-white px-4 py-2 rounded"
            >
              Phòng
            </button>
          </div>

          {/* Room Name */}
          <div className="grid grid-cols-[90px_1fr] items-center gap-x-1 mb-4">
            <label className="text-sm font-semibold text-stone-700">
              Tên nhà trọ
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded p-2 text-stone-600"
            />
          </div>

          {/* room_renter */}
          <div className="grid grid-cols-[90px_1fr] items-center gap-x-1 mb-4">
            <label className="text-sm font-semibold text-stone-700">
              Địa chỉ
            </label>

            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border rounded p-2 text-stone-600"
            />
          </div>

          {/* bank_id */}
          <div className="grid grid-cols-[90px_1fr] items-center gap-x-1 mb-4">
            <label className="text-sm font-semibold text-stone-700">
              Ngân hàng
            </label>

            <input
              type="text"
              value={bankID}
              onChange={(e) => setBankID(e.target.value)}
              className="w-full border rounded p-2 text-stone-600"
            />
          </div>

          {/* bankAccount */}
          <div className="grid grid-cols-[90px_1fr] items-center gap-x-1 mb-4">
            <label className="text-sm font-semibold text-stone-700">
              Tài khoản
            </label>

            <input
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              className="w-full border rounded p-2 text-stone-600"
            />
          </div>
        </header>

      </div>

    </>
  );
}