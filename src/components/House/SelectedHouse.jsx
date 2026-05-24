//import Tasks from "../Invoice/Invoices.jsx";
import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import Input from "../InputVal.jsx";
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
<div className="w-[35rem] mt-10">
    <header className="pb-4 mb-4 border-b border-stone-300">

      {/* Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-md"
          onClick={onDelete}
        >
          Delete
        </button>

        <button
          onClick={handleUpdate}
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded-md"
        >
          Update
        </button>

        <button
          onClick={() => navigate(`/rooms/${house.id}`)}
          className="bg-stone-700 hover:bg-stone-800 text-white text-sm px-3 py-1 rounded-md"
        >
          Phòng
        </button>
      </div>

      <div className="space-y-4">
  <Input
    label="Tên nhà trọ"
    type="text"
    value={name}
    onChange={(e) => setName(e.target.value)}
  />

  <Input
    label="Địa chỉ"
    type="text"
    value={address}
    onChange={(e) => setAddress(e.target.value)}
  />

  <Input
    label="Ngân hàng"
    type="text"
    value={bankID}
    onChange={(e) => setBankID(e.target.value)}
  />

  <Input
    label="Tài khoản"
    type="text"
    value={bankAccount}
    onChange={(e) => setBankAccount(e.target.value)}
  />
</div>

    </header>
  </div>

    </>
  );
}