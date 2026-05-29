import Invoices from "../Invoice/Invoices.jsx";
import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import Input from "../InputVal.jsx";
import Photos from "../Photos.jsx";
import InvoiceRecord from "../Invoice/InvoiceRecord.jsx";
import DeleteInvoiceModal from "../Invoice/DeleteInvoiceModal.jsx";

export default function SelectedRoom({
  homeID,
  room,
  onDelete,
  onAddTask,
  onDeleteTask,
  refreshRooms,
}) {
  const [
    showDeleteInvoiceModal,
    setShowDeleteInvoiceModal,
  ] = useState(false);

  const [
    selectedDeleteInvoiceID,
    setSelectedDeleteInvoiceID,
  ] = useState(null);
  // Check create mode
  const isNew = !room;

  // States
  const [roomName, setRoomName] =
    useState("");

  const [roomRenter, setRoomRenter] =
    useState("");

  const [depositAmount, setDepositAmount] =
    useState(0);

  const [telephone, setTelephone] =
    useState("");

  const [numPerson, setNumPerson] =
    useState(1);

  const [datePay, setDatePay] =
    useState(1);

  const [
    currentElectricityNumber,
    setCurrentElectricityNumber,
  ] = useState(0);

  const [
    currentWaterNumber,
    setCurrentWaterNumber,
  ] = useState(0);

  const [rentDueDate, setRentDueDate] =
    useState("");

  const [status, setStatus] =
    useState(false);

  const [showPhotos, setShowPhotos] =
    useState(false);

  // Invoices
  const [invoices, setInvoices] =
    useState([]);

  const [selectedInvoice, setSelectedInvoice] =
    useState(null);

  const [showInvoiceRecord, setShowInvoiceRecord] =
    useState(false);
    
  // Load selected room
  useEffect(() => {

    setRoomName(
      room?.room_name || ""
    );

    setRoomRenter(
      room?.room_renter || ""
    );

    setDepositAmount(
      room?.deposit_amount || 0
    );

    setTelephone(
      room?.telephone || ""
    );

    setNumPerson(
      room?.num_person || 1
    );

    setDatePay(
      room?.date_pay || 1
    );

    setCurrentElectricityNumber(
      room?.current_electricity_number || 0
    );

    setCurrentWaterNumber(
      room?.current_water_number || 0
    );

    setStatus(
      room?.status || false
    );

    setRentDueDate(
      room?.rent_due_date
        ? room.rent_due_date.substring(0, 10)
        : ""
    );

  }, [room]);

  // Fetch invoices
  useEffect(() => {

    async function fetchInvoices() {

      if (!room?.id) {
        setInvoices([]);
        return;
      }

      const { data, error } =
        await supabase
          .from("invoices")
          .select("*")
          .eq("room_id", room.id)
          .order(
            "invoice_create_date",
            { ascending: false }
          );

      if (error) {

        console.log(error.message);

        return;
      }

      setInvoices(data || []);
    }

    fetchInvoices();

  }, [room]);

  function resetForm() {
    setRoomName("");

    setRoomRenter("");

    setDepositAmount(0);

    setTelephone("");

    setNumPerson(1);

    setDatePay(1);

    setCurrentElectricityNumber(0);

    setCurrentWaterNumber(0);

    setRentDueDate("");

    setStatus(false);
  }
   // Add / Refresh invoice
  function onEditInvoice(invoice) {
    setSelectedInvoice(invoice);
    setShowInvoiceRecord(true);
  }
  function onAddInvoice() {
    setSelectedInvoice(null);
    setShowInvoiceRecord(true);
  }
  // Delete invoice
  async function onDeleteInvoice(
    invoiceID
  ) {

    setSelectedDeleteInvoiceID(invoiceID);

  setShowDeleteInvoiceModal(true);
  }
async function confirmDeleteInvoice() {

  if (!selectedDeleteInvoiceID) {
    return;
  }

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq(
      "id",
      selectedDeleteInvoiceID
    );

  if (error) {

    console.log(error.message);

    alert(
      "Failed to delete invoice"
    );

    return;
  }

  setShowDeleteInvoiceModal(false);

  setSelectedDeleteInvoiceID(null);

  await refreshInvoices();
}
  async function refreshInvoices() {

    if (!room?.id) return;

    const { data, error } =
      await supabase
        .from("invoices")
        .select("*")
        .eq("room_id", room.id)
        .order(
          "invoice_create_date",
          { ascending: false }
        );

    if (error) {

      console.log(error.message);

      return;
    }

    setInvoices(data || []);
  }

  // Save / Update
  async function handleSave() {

    // Validation
    if (!roomName) {

      alert(
        "Please enter room name"
      );

      return;
    }

    const roomData = {
      home_id: homeID,
      room_name: roomName,
      room_renter: roomRenter,
      deposit_amount: depositAmount,
      telephone: telephone,
      num_person: numPerson,
      date_pay: datePay,
      current_electricity_number:
        currentElectricityNumber,
      current_water_number:
        currentWaterNumber,
      rent_due_date: rentDueDate || null,
      status: status,
    };

    // CREATE
    if (isNew) {

      const { error } = await supabase
        .from("rooms")
        .insert([roomData]);

      if (error) {

        console.log(error.message);

        alert(
          "Failed to create room"
        );

        return;
      }
    }

    // UPDATE
    else {

      const { error } = await supabase
        .from("rooms")
        .update(roomData)
        .eq("id", room.id);

      if (error) {

        console.log(error.message);

        alert(
          "Failed to update room"
        );

        return;
      }
    }

    // Refresh list
    await refreshRooms();

    if (isNew) {
      resetForm();

      return;
    }
  }
  async function handleDeleteRoom() {
    if (!room?.id) return;

    const confirmDelete =
      window.confirm("Xóa phòng này?");

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("rooms")
      .delete()
      .eq("id", room.id);

    if (error) {

      console.log(error.message);

      alert("Failed to delete room");

      return;
    }

    await refreshRooms();

    onDelete?.();
  }
  return (
    <>
      <div className="w-full flex flex-col pr-2 pl-0">
        <header className="flex flex-col w-full pb-4 mb-4 border-b border-stone-300">

          {/* Buttons */}
          <div className="flex gap-2 mb-4">            

            {/* LƯU */}
            <button
              onClick={handleSave}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded-md"
            >
              Lưu
            </button>

            {/* XÓA */}
            {!isNew && (
              <button
                onClick={handleDeleteRoom}
                className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-md"
              >
                Xóa
              </button>
            )}

            {/* Photos */}
            {!isNew && (
              <button
                onClick={() => setShowPhotos(true)}
                className="bg-stone-700 hover:bg-stone-800 text-white text-sm px-3 py-1 rounded-md"
              >
                Photos
              </button>
            )}
          </div>

          {/* Form */}
          <div className="flex flex-col items-start gap-2 w-full">

            <Input
              label="Phòng số"
              type="text"
              value={roomName}
              onChange={(e) =>
                setRoomName(
                  e.target.value
                )
              }
            />

            <Input
              label="Người thuê"
              type="text"
              value={roomRenter}
              onChange={(e) =>
                setRoomRenter(
                  e.target.value
                )
              }
            />

            <Input
              label="Tiền cọc"
              type="text"
              value={depositAmount.toLocaleString("vi-VN")}
              onChange={(e) => {

                const rawValue =
                  e.target.value.replace(/\./g, "");

                const numberValue =
                  Number(
                    rawValue.replace(/\D/g, "")
                  );

                setDepositAmount(numberValue);
              }}
            />

            <Input
              label="Số điện thoại"
              type="text"
              value={telephone}
              onChange={(e) =>
                setTelephone(
                  e.target.value
                )
              }
            />

            <Input
              label="Số người"
              type="number"
              value={numPerson}
              onChange={(e) =>
                setNumPerson(
                  Number(
                    e.target.value
                  )
                )
              }
            />

            <Input
              label="Ngày đóng tiền"
              type="number"
              value={datePay}
              onChange={(e) =>
                setDatePay(
                  Number(
                    e.target.value
                  )
                )
              }
            />

            <Input
              label="Số điện"
              type="number"
              value={
                currentElectricityNumber
              }
              onChange={(e) =>
                setCurrentElectricityNumber(
                  Number(
                    e.target.value
                  )
                )
              }
            />

            <Input
              label="Số nước"
              type="number"
              value={
                currentWaterNumber
              }
              onChange={(e) =>
                setCurrentWaterNumber(
                  Number(
                    e.target.value
                  )
                )
              }
            />

            <Input
              label="Ngày hết hạn"
              type="date"
              value={rentDueDate}
              onChange={(e) =>
                setRentDueDate(
                  e.target.value
                )
              }
            />

            {/* Status */}
            <div className="flex items-center gap-2 mt-2 scale-90 origin-top-left">

              <label className="text-xs font-bold uppercase text-stone-500">
                Đã thuê
              </label>

              <input
                type="checkbox"
                checked={status}
                onChange={(e) =>
                  setStatus(
                    e.target.checked
                  )
                }
                className="w-4 h-4"
              />

            </div>

          </div>

        </header>

        {/* Invoices */}
        {!isNew && (
          <Invoices
            homeID={homeID}
            room={room}
            invoices={invoices}
            onAdd={onAddInvoice}
            onEdit={onEditInvoice}
            onDelete={onDeleteInvoice}
          />
        )}


      </div>
      {/* Photos Modal */}
      {!isNew && (
        <Photos
          room={room}
          open={showPhotos}
          onClose={() =>
            setShowPhotos(false)
          }
        />
      )}
      {showInvoiceRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center">

          <div className="bg-white w-full max-w-4xl rounded-xl overflow-auto max-h-[95vh]">

            <InvoiceRecord
              room={room}
              homeID={homeID}
              invoice={selectedInvoice}
              onCancel={() => {

                setShowInvoiceRecord(false);

                setSelectedInvoice(null);
              }}
              onAdd={async () => {

                await refreshInvoices();

                setShowInvoiceRecord(false);

                setSelectedInvoice(null);
              }}
            />

          </div>

        </div>
      )}
      <DeleteInvoiceModal
        open={showDeleteInvoiceModal}
        onClose={() => {

          setShowDeleteInvoiceModal(false);

          setSelectedDeleteInvoiceID(null);
        }}
        onConfirm={confirmDeleteInvoice}
      />
    </>
  );
}