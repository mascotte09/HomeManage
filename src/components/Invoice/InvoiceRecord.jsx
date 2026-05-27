import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { supabase } from "../../supabase";
import Input from "../InputVal.jsx";

export default function InvoiceRecord({
  room,
  homeID,
  invoice,  
  onCancel,
  onAdd,
}) {
  const isExistingInvoice = !!invoice;
  
  const summaryRef = useRef(null);

  //const [isEditing, setIsEditing] = useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [home, setHome] = useState(null);

  const isWaterPerPerson =
      home?.is_water_per_person;
  const waterPrice =
    Number(home?.water_price) || 0;

  const elecPrice =
      Number(home?.electricity_price) || 0;
  const numPerson =
      Number(home?.numPerson) || 0;
  const [formData, setFormData] = useState({
    invoice_create_date:
      new Date()
        .toISOString()
        .substring(0, 10),

      rental_amount: "",

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
    if (!invoice) {
      setFormData((prev) => ({
        ...prev,

        current_electricity_number:
          room?.current_electricity_number || "",

        current_water_number:
          room?.current_water_number || "",
      }));

      return;
    }

    setFormData({
      invoice_create_date:
        invoice.invoice_create_date
          ? invoice.invoice_create_date.substring(0, 10)
          : "",

      rental_amount:
        invoice.rental_amount || "",

      current_electricity_number:
        invoice.current_electricity_number || "",

      new_electricity_number:
        invoice.new_electricity_number || "",

      current_water_number:
        invoice.current_water_number || "",

      new_water_number:
        invoice.new_water_number || "",

      wifi_amount:
        invoice.wifi_amount || "",

      surcharge:
        invoice.surcharge || "",

      amount_already_pay:
        invoice.amount_already_pay || "",

      note:
        invoice.note || "",
    });
  }, [invoice, room]);

  useEffect(() => {
   async function fetchHome() {
      console.debug("Home ID:" + homeID);
      if (!homeID) {
        return;
      }

      const { data, error } =
        await supabase
          .from("homes")
          .select("*")
          .eq("id", homeID)
          .single();

      if (error) {

        console.log(error.message);

        return;
      }

      setHome(data);
    }

    fetchHome();

  }, [homeID]);

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

    const electAmount = electUsed * elecPrice;

    const waterAmount = isWaterPerPerson
        ? numPerson * waterPrice
        : waterUsed * waterPrice;

    const total =
     (Number(formData.rental_amount) || 0) +
      electAmount +
      waterAmount +
      (Number(formData.wifi_amount) || 0) +
      (Number(formData.surcharge) || 0);
    
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
    if ((Number(formData.current_electricity_number) > Number(formData.new_electricity_number)) ||
      (Number(formData.current_water_number) > Number(formData.new_water_number))) {
      return
    }
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
      rental_amount:
        Number(formData.rental_amount) || null,

      invoice_create_date:
        formData.invoice_create_date || null,

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
    if ((Number(formData.current_electricity_number) > Number(formData.new_electricity_number)) ||
      (Number(formData.current_water_number) > Number(formData.new_water_number))) {
      return
    }
    const payload = {
      rental_amount:
        Number(formData.rental_amount) || null,
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

    //setIsEditing(false);

    onAdd?.();
  }
  const [hasPreviousInvoice, setHasPreviousInvoice] = useState(false);

  useEffect(() => {

  async function checkPreviousInvoice() {

    if (!room?.id) {

      setHasPreviousInvoice(false);

      return;
    }

    let query = supabase
      .from("invoices")
      .select(`
        id,
        rental_amount,
        new_electricity_number,
        new_water_number
      `)
      .eq("room_id", room.id)
      .order(
        "invoice_create_date",
        { ascending: false }
      );

    // exclude current invoice
    if (invoice?.id) {

      query = query.neq(
        "id",
        invoice.id
      );
    }

    const { data, error } =
      await query.limit(1);

    if (error) {

      console.log(error.message);

      return;
    }

    const latestInvoice =
      data?.[0];

    const hasInvoice =
      !!latestInvoice;

    setHasPreviousInvoice(
      hasInvoice
    );

    // CREATE NEW INVOICE
    if (
      hasInvoice &&
      !invoice
    ) {

      setFormData((prev) => ({
        ...prev,

        rental_amount: 
          Number(latestInvoice.rental_amount) || null,
        current_electricity_number:
          latestInvoice.new_electricity_number || "",
        current_water_number:
          latestInvoice.new_water_number || "",
      }));
    }
  }
  checkPreviousInvoice();

}, [room, invoice]);

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

  
  

  return (
    <div className="w-full p-6">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold text-black">
          Room {room?.room_name}
        </h2>

        <div className="flex gap-2">
          
        
          {isExistingInvoice && (
            <button
              onClick={handleUpdate}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
                Update
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
      <div className="flex flex-col gap-3 mt-4">

        <Input
          label="Invoice Date"
          type="date"
          value={formData.invoice_create_date}          
          onChange={handleChange}
          name="invoice_create_date"
        />

        <Input
          label="Rental Amount"
          type="text"
          value={Number(
            formData.rental_amount || 0
          ).toLocaleString("vi-VN")}
          
          name="rental_amount"
          onChange={(e) => {

            const raw =
              e.target.value.replace(/\./g, "");

            const number =
              Number(
                raw.replace(/\D/g, "")
              );

            setFormData((prev) => ({
              ...prev,
              rental_amount: number,
            }));
          }}
        />

        {/* ELECTRIC */}
        <div
          className={
            hasPreviousInvoice
              ? "grid grid-cols-1 gap-3"
              : "grid grid-cols-2 gap-3"
          }
        >

          {!hasPreviousInvoice && (
          <>
            <Input
              label="Số Điện Cũ"
              type="number"
              name="current_electricity_number"
              value={
                formData.current_electricity_number
              }
              onChange={handleChange}
              
            />

            <Input
              label="Số Nước Cũ"
              type="number"
              name="current_water_number"
              value={
                formData.current_water_number
              }
              onChange={handleChange}
              
            />
          </>
        )}
       

        </div>

        {/* WATER */}
        <div
          className={
            isWaterPerPerson
              ? "grid grid-cols-1 gap-3"
              : "grid grid-cols-2 gap-3"
          }
        >

          <Input
            label="Số Điện Mới"
            type="number"
            name="new_electricity_number"
            value={
              formData.new_electricity_number
            }
            onChange={handleChange}
            
            placeholder={
              hasPreviousInvoice
                ? `Current: ${
                    formData.current_electricity_number || 0
                  }`
                : ""
            }
            error={
              Number(formData.new_electricity_number) != "" &&
              Number(formData.current_electricity_number) >
              Number(formData.new_electricity_number)
                ? "Số điện mới phải lớn hơn hoặc bằng số điện cũ."
                : ""
            }            
          />
        
          {!isWaterPerPerson && (
            <Input
              label="Số Nước Mới"
              type="number"
              name="new_water_number"
              value={
                formData.new_water_number
              }
              onChange={handleChange}
              
              placeholder={
                hasPreviousInvoice
                  ? `Current: ${
                      formData.current_water_number || 0
                    }`
                  : ""
              }
              error={
                Number(formData.new_water_number) != "" &&
                Number(formData.current_water_number) >
                Number(formData.new_water_number)
                  ? "Số nước mới phải lớn hơn hoặc bằng số nước cũ."
                  : ""
              }
            />
          )}
          
        </div>

        <Input
          label="Wifi Amount"
          type="text"
          value={Number(
            formData.wifi_amount || 0
          ).toLocaleString("vi-VN")}
          
          name="wifi_amount"
          onChange={(e) => {

            const raw =
              e.target.value.replace(/\./g, "");

            const number =
              Number(
                raw.replace(/\D/g, "")
              );

            setFormData((prev) => ({
              ...prev,
              wifi_amount: number,
            }));
          }}
        />


        <div className="flex flex-col gap-1">

          <label className="text-xs font-semibold text-black">
            Note
          </label>

          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            
            className="w-full border rounded p-2 bg-white text-black h-24"
          />

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
      Phòng: {room?.room_name}
    </div>
  </div>

  <div className="space-y-2 border-b pb-4">
    <div className="flex justify-between">
      <span>1. Tiền Phòng</span>

      <span>
        {Number(
          formData.rental_amount || 0
        ).toLocaleString()} đ
      </span>
    </div>
    <div className="flex justify-between">
      <div className="flex flex-col">      
        <span>2. Tiền Điện</span>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>
            Số cũ:{" "}
            {formData.current_electricity_number || 0}
          </span>
          <span>
            Số mới:{" "}
            {formData.new_electricity_number || 0}
          </span>
        </div>

        <span className="text-sm text-gray-500">
          {Number(formData.new_electricity_number) - Number(formData.current_electricity_number)} × {elecPrice.toLocaleString()} đ
        </span>

      </div>

      <span>
        {electAmount.toLocaleString()} đ
      </span>
    </div>

    <div className="flex justify-between">
      <div className="flex flex-col">      
        <span>3. Tiền Điện</span>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>
            Số cũ:{" "}
            {formData.current_water_number || 0}
          </span>
          <span>
            Số mới:{" "}
            {formData.new_water_number || 0}
          </span>
        </div>

        <span className="text-sm text-gray-500">
          {Number(formData.new_water_number) - Number(formData.current_water_number)} × {waterPrice.toLocaleString()} đ
        </span>
      </div>

      <span>
        {waterAmount.toLocaleString()} đ
      </span>
    </div>
    

    <div className="flex justify-between">
      <div className="flex flex-col">
        <span>4. Tiền Dịch Vụ</span>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>
            Wifi, rác...
          </span>          
        </div>
      </div>
      
      <span>
        {Number(
          formData.wifi_amount || 0
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