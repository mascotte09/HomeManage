import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { supabase } from "../../supabase";

export default function NewInvoice({
  room,
  home,
  invoice,  
  onCancel,
  onAdd,
}) {
  const isExistingInvoice = !!invoice;

  const summaryRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [formData, setFormData] = useState({
    current_electricity_number: "",
    new_electricity_number: "",
    current_water_number: "",
    new_water_number: "",
    wifi_amount: "",
    surcharge: "",
    amount_already_pay: "",
    note: "",
  });
  // =========================
  // LOAD INVOICE
  // =========================
  useEffect(() => {
    if (!invoice) return;

    setFormData({
      current_electricity_number:
        invoice.current_electricity_number || "",

      new_electricity_number:
        invoice.new_electricity_number || "",

      current_water_number:
        invoice.current_water_number || "",

      new_water_number:
        invoice.new_water_number || "",

      wifi_amount: invoice.wifi_amount || "",

      surcharge: invoice.surcharge || "",

      amount_already_pay:
        invoice.amount_already_pay || "",

      note: invoice.note || "",
    });
  }, [invoice]);

  // =========================
  // HANDLE INPUT
  // =========================
  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // =========================
  // CALCULATE
  // =========================
  function calculateTotal() {
    const electUsed =
      (Number(formData.new_electricity_number) || 0) -
      (Number(formData.current_electricity_number) || 0);

    const waterUsed =
      (Number(formData.new_water_number) || 0) -
      (Number(formData.current_water_number) || 0);

    const electAmount = electUsed * 3500;

    const waterAmount = waterUsed * 15000;

    const total =
      electAmount +
      waterAmount +
      (Number(formData.wifi_amount) || 0) +
      (Number(formData.surcharge) || 0) -
      (Number(formData.amount_already_pay) || 0);
    
    return {
      electAmount,
      waterAmount,
      total,
    };
  }

  const { electAmount, waterAmount, total } =
    calculateTotal();

// =========================
// QR URL
// =========================
//const [qrLoaded, setQrLoaded] = useState(false);
const qrAmount = total || 0;

const qrContent = encodeURIComponent(
  `${room?.room_renter || ""} Room ${room?.room_number || ""}`
);

const hasBankInfo =
  home?.bank_id && home?.bank_account;

const qrUrl = hasBankInfo
  ? `https://img.vietqr.io/image/${home.bank_id}-${home.bank_account}-compact2.png?amount=${qrAmount}&addInfo=${qrContent}`
  : null;  
  
  async function captureAndShare() {
  if (!summaryRef.current) return;

  // wait QR image render
  await new Promise((resolve) =>
    setTimeout(resolve, 500)
  );

  const canvas = await html2canvas(
    summaryRef.current,
    {
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      scale: 2,
    }
  );

  canvas.toBlob(async (blob) => {
    if (!blob) return;

    const file = new File(
      [blob],
      `invoice-room-${room.room_number}.png`,
      {
        type: "image/png",
      }
    );

    // MOBILE SHARE
    if (
      navigator.canShare?.({
        files: [file],
      })
    ) {
      try {
        await navigator.share({
          files: [file],
          title: "Invoice",
          text: `Invoice Room ${room.room_number}`,
        });
      } catch (e) {
        console.log(e);
      }
    } else {
      // DOWNLOAD FALLBACK
      const link =
        document.createElement("a");

      link.href =
        URL.createObjectURL(blob);

      link.download = `invoice-room-${room.room_number}.png`;

      link.click();
    }

    // OPEN ZALO
    window.open(
      "https://zalo.me/",
      "_blank"
    );
  });
}

  // =========================
  // CREATE
  // =========================
  async function handleCreate() {
    const payload = {
      room_id: room.id,

      current_electricity_number:
        Number(formData.current_electricity_number) ||
        null,

      new_electricity_number:
        Number(formData.new_electricity_number) ||
        null,

      current_water_number:
        Number(formData.current_water_number) || null,

      new_water_number:
        Number(formData.new_water_number) || null,

      invoice_create_date: new Date().toISOString(),

      amount_already_pay:
        Number(formData.amount_already_pay) || null,

      note: formData.note || null,

      surcharge:
        Number(formData.surcharge) || null,

      wifi_amount:
        Number(formData.wifi_amount) || null,

      elect_amount: electAmount,

      water_amount: waterAmount,

      total_amount: total,

      debit_amount: total,
    };

    const { error } = await supabase
      .from("invoices")
      .insert([payload]);

    if (error) {
      alert("Create failed");
      return;
    }
    await captureAndShare();

    onAdd?.();
  }

  // =========================
  // UPDATE
  // =========================
  async function handleUpdate() {
    const payload = {
      current_electricity_number:
        Number(formData.current_electricity_number) ||
        null,

      new_electricity_number:
        Number(formData.new_electricity_number) ||
        null,

      current_water_number:
        Number(formData.current_water_number) || null,

      new_water_number:
        Number(formData.new_water_number) || null,

      amount_already_pay:
        Number(formData.amount_already_pay) || null,

      note: formData.note || null,

      surcharge:
        Number(formData.surcharge) || null,

      wifi_amount:
        Number(formData.wifi_amount) || null,

      elect_amount: electAmount,

      water_amount: waterAmount,

      total_amount: total,

      debit_amount: total,
    };

    const { error } = await supabase
      .from("invoices")
      .update(payload)
      .eq("id", invoice.id);

    if (error) {
      alert("Update failed");
      return;
    }


    await captureAndShare();

    setIsEditing(false);

    onAdd?.();
  }

  // =========================
  // DELETE
  // =========================
  async function handleDelete() {
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoice.id);

    if (error) {
      alert("Delete failed");
      return;
    }


    setShowDeleteModal(false);

    onAdd?.();
  }

  const disabled =
    isExistingInvoice && !isEditing;

  const inputClass =
    "w-full border rounded p-2 bg-white text-black";

  const Field = ({ label, children }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-black">
        {label}
      </label>

      {children}
    </div>
  );

  return (
    <div className="w-full p-6">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold text-black">
          Room {room?.room_number}
        </h2>

        <div className="flex gap-2">

          {isExistingInvoice && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Update
            </button>
          )}

          {isExistingInvoice && isEditing && (
            <button
              onClick={handleUpdate}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Save Update
            </button>
          )}

          {isExistingInvoice && (
            <button
              onClick={() =>
                setShowDeleteModal(true)
              }
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* FORM */}
      <div className="grid grid-cols-2 gap-4">

        <Field label="Current Electricity">
          <input
            name="current_electricity_number"
            value={formData.current_electricity_number}
            onChange={handleChange}
            disabled={disabled}
            className={inputClass}
          />
        </Field>

        <Field label="New Electricity">
          <input
            name="new_electricity_number"
            value={formData.new_electricity_number}
            onChange={handleChange}
            disabled={disabled}
            className={inputClass}
          />
        </Field>

        <Field label="Current Water">
          <input
            name="current_water_number"
            value={formData.current_water_number}
            onChange={handleChange}
            disabled={disabled}
            className={inputClass}
          />
        </Field>

        <Field label="New Water">
          <input
            name="new_water_number"
            value={formData.new_water_number}
            onChange={handleChange}
            disabled={disabled}
            className={inputClass}
          />
        </Field>

        <Field label="Wifi Amount">
          <input
            name="wifi_amount"
            value={formData.wifi_amount}
            onChange={handleChange}
            disabled={disabled}
            className={inputClass}
          />
        </Field>

        <Field label="Surcharge">
          <input
            name="surcharge"
            value={formData.surcharge}
            onChange={handleChange}
            disabled={disabled}
            className={inputClass}
          />
        </Field>

        <Field label="Already Paid">
          <input
            name="amount_already_pay"
            value={formData.amount_already_pay}
            onChange={handleChange}
            disabled={disabled}
            className={inputClass}
          />
        </Field>

        <div className="col-span-2">
          <Field label="Note">
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              disabled={disabled}
              className={`${inputClass} h-24`}
            />
          </Field>
        </div>

      </div>

      {/* SUMMARY */}
      {/* SUMMARY */}
<div
  ref={summaryRef}
  className="mt-6 bg-white border rounded-xl p-6 text-black"
>

  <div className="text-center mb-5">
    <h2 className="text-2xl font-bold">
      HÓA ĐƠN THANH TOÁN
    </h2>

    <div className="text-sm text-gray-500 mt-1">
      Room {room?.room_number}
    </div>
  </div>

  <div className="space-y-2 border-b pb-4">

    <div className="flex justify-between">
      <span>Electric</span>
      <span>{electAmount.toLocaleString()} đ</span>
    </div>

    <div className="flex justify-between">
      <span>Water</span>
      <span>{waterAmount.toLocaleString()} đ</span>
    </div>

    <div className="flex justify-between">
      <span>Wifi</span>
      <span>
        {Number(
          formData.wifi_amount || 0
        ).toLocaleString()} đ
      </span>
    </div>

    <div className="flex justify-between">
      <span>Surcharge</span>
      <span>
        {Number(
          formData.surcharge || 0
        ).toLocaleString()} đ
      </span>
    </div>

    <div className="flex justify-between">
      <span>Already Paid</span>
      <span>
        -
        {Number(
          formData.amount_already_pay || 0
        ).toLocaleString()} đ
      </span>
    </div>

  </div>

  <div className="flex justify-between mt-5 text-xl font-bold">
    <span>Total</span>

    <span className="text-red-600">
      {total.toLocaleString()} đ
    </span>
  </div>

  {/* QR */}
  {qrUrl && (
    <div className="mt-8 flex flex-col items-center">

      <div className="font-semibold mb-2">
        Scan QR To Pay
      </div>

      <img
        src={qrUrl}
        alt="vietqr"
        className="w-56 h-56 border rounded-lg"
      />

      <div className="mt-4 text-center">

        <div className="font-semibold">
          {home?.bank_id}
        </div>

        <div>
          {home?.bank_account}
        </div>

      </div>

    </div>
  )}

  {formData.note && (
    <div className="mt-6 border-t pt-4">
      <div className="font-semibold mb-1">
        Note
      </div>

      <div className="text-gray-700">
        {formData.note}
      </div>
    </div>
  )}

</div>

      {/* BUTTONS */}
      <div className="flex gap-4 mt-6">

        {!isExistingInvoice && (
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create
          </button>
        )}

        <button
          onClick={onCancel}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          Close
        </button>

      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

          <div className="bg-white p-6 rounded w-[400px]">

            <h2 className="text-black font-bold text-lg mb-3">
              Delete Invoice
            </h2>

            <p className="text-gray-600 mb-6">
              Are you sure?
            </p>

            <div className="flex justify-end gap-2">

              <button
                onClick={() =>
                  setShowDeleteModal(false)
                }
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Delete
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}