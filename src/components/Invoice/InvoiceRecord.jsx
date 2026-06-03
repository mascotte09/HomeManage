import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { supabase } from "../../supabase";
import Input from "../InputVal.jsx";
import InvoiceSummary from "./InvoiceSummary";
import ElectricMeterOCR from "./ElectricMeterOCR";
export default function InvoiceRecord({
  room,
  homeID,
  invoice,
  onCancel,
  onAdd,
}) {
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const summaryRef = useRef(null);

  //const [isEditing, setIsEditing] = useState(false);
  const [home, setHome] = useState(null);

  const isWaterPerPerson =
    home?.is_water_per_person;
  const waterPrice =
    Number(home?.water_price) || 0;

  const elecPrice =
    Number(home?.electricity_price) || 0;
  const numPerson =
    Number(room?.num_person) || 0;
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
    });
  }

  // =========================
  // CREATE
  // =========================
  async function handleCreate() {
    const invalidElectricity =
      Number(formData.current_electricity_number) >
      Number(formData.new_electricity_number);

    const invalidWater =
      !isWaterPerPerson &&
      Number(formData.current_water_number) >
      Number(formData.new_water_number);

    const invalidRental =
      Number(formData.rental_amount) === 0;

    if (
      invalidRental ||
      invalidElectricity ||
      invalidWater
    ) {
      setValidationMessage("Nhập lại dữ liệu.");
      setShowValidationModal(true);
      return;
    }
    const payload = {
      room_id: room.id,

      current_electricity_number:
        Number(formData.current_electricity_number) || null,

      new_electricity_number:
        Number(formData.new_electricity_number) || null,

      current_water_number:
        Number(formData.current_water_number) || null,

      new_water_number:
        Number(formData.new_water_number) || null,

      rental_amount:
        Number(formData.rental_amount) || null,

      invoice_create_date:
        formData.invoice_create_date || null,

      amount_already_pay:
        Number(formData.amount_already_pay) || 0,

      note: formData.note || null,

      surcharge:
        Number(formData.surcharge) || null,

      wifi_amount:
        Number(formData.wifi_amount) || null,

      elect_amount: electAmount,

      water_amount: waterAmount,

      total_amount: total,

      debit_amount:
        total -
        (Number(formData.amount_already_pay) || 0),
    };

    let error = null;
    let savedInvoice = null;

    // UPDATE
    if (invoice?.id) {
      const result = await supabase
        .from("invoices")
        .update(payload)
        .eq("id", invoice.id)
        .select()
        .single();

      error = result.error;
      savedInvoice = result.data;
    }

    // CREATE
    else {
      const result = await supabase
        .from("invoices")
        .insert([payload])
        .select()
        .single();

      error = result.error;
      savedInvoice = result.data;
    }

    if (error) {
      console.log(error.message);

      alert(
        invoice?.id
          ? "Update failed"
          : "Create failed"
      );

      return;
    }

    // Tìm hóa đơn mới nhất của phòng
    const {
      data: newestInvoice,
      error: newestError,
    } = await supabase
      .from("invoices")
      .select(`
      id,
      new_electricity_number,
      new_water_number
    `)
      .eq("room_id", room.id)
      .order(
        "invoice_create_date",
        { ascending: false }
      )
      .order(
        "created_at",
        { ascending: false }
      )
      .limit(1)
      .single();

    if (newestError) {
      console.log(newestError.message);
    } else {
      // Chỉ cập nhật chỉ số phòng nếu
      // hóa đơn vừa lưu là hóa đơn mới nhất
      if (
        newestInvoice &&
        newestInvoice.id === savedInvoice.id
      ) {
        await supabase
          .from("rooms")
          .update({
            current_electricity_number:
              newestInvoice.new_electricity_number,

            current_water_number:
              newestInvoice.new_water_number,
          })
          .eq("id", room.id);
      }
    }

    setShowSummaryModal(true);
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
        wifi_amount`)
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
          wifi_amount:
            latestInvoice.wifi_amount || "",
        }));
      }
    }
    checkPreviousInvoice();

  }, [room, invoice]);

  const electricityError =
    formData.new_electricity_number !== "" &&
      Number(formData.current_electricity_number) >
      Number(formData.new_electricity_number)
      ? "Số điện mới phải lớn hơn hoặc bằng số điện cũ."
      : "";

  const electricityPlaceholder = hasPreviousInvoice
    ? `Số cũ: ${formData.current_electricity_number || 0}`
    : "";

  return (
    <div className="w-full p-3">

      {/* HEADER */}
      <div className="flex justify-between mb-3">
        <h2 className="text-xl font-bold text-black">
          Phòng số: {room?.room_name}
        </h2>
      </div>

      {/* FORM */}
      <div className="flex flex-col gap-2">

        <Input
          label="Ngày tạo Hóa Đơn"
          type="date"
          value={formData.invoice_create_date}
          onChange={handleChange}
          name="invoice_create_date"
        />

        <Input
          label="Tiền thuê"
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
            <Input
              label="Số Điện Cũ"
              type="number"
              name="current_electricity_number"
              value={formData.current_electricity_number}
              onChange={handleChange}
            />
          )}

          <div>
            <Input
              label="Số Điện Mới"
              type="number"
              name="new_electricity_number"
              value={formData.new_electricity_number}
              onChange={handleChange}
              placeholder={electricityPlaceholder}
              error={electricityError}
            />

            <ElectricMeterOCR
              onDetected={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  new_electricity_number: value,
                }))
              }
            />
          </div>
        </div>

        {/* WATER */}
        <div
          className={
            hasPreviousInvoice
              ? "grid grid-cols-1 gap-3"
              : "grid grid-cols-2 gap-3"
          }
        >

          {!isWaterPerPerson && (
            <>
              {!hasPreviousInvoice && (
                <Input
                  label="Số Nước Cũ"
                  type="number"
                  name="current_water_number"
                  value={
                    formData.current_water_number
                  }
                  onChange={handleChange}
                />
              )}
              <div>
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
                      ? `Số cũ: ${formData.current_water_number || 0
                      }`
                      : ""
                  }
                  error={
                    formData.new_water_number !== "" &&
                      Number(formData.current_water_number) >
                      Number(formData.new_water_number)
                      ? "Số nước mới phải lớn hơn hoặc bằng số nước cũ."
                      : ""
                  }
                />
              </div>

            </>
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
      </div>

      {showSummaryModal && (

        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">


          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4">
            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() => {
                  setShowSummaryModal(false);
                  // close page too
                  onAdd?.();
                }}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Đóng
              </button>

              <button
                onClick={async () => {
                  await captureAndShare();

                  setShowSummaryModal(false);

                  onAdd?.();
                }}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Gửi Hóa Đơn
              </button>

            </div>
            <InvoiceSummary
              summaryRef={summaryRef}
              formData={formData}
              room={room}
              electAmount={electAmount}
              waterAmount={waterAmount}
              total={total}
              elecPrice={elecPrice}
              waterPrice={waterPrice}
              qrUrl={qrUrl}
              home={home}
            />
          </div>
        </div>
      )}
      {/* BUTTONS */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Tính Tiền
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          Close
        </button>
      </div>


      {/* Validation MODAL */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

          <div className="bg-white p-6 rounded w-[400px]">

            <h2 className="text-black font-bold text-lg mb-3">
              Thông báo
            </h2>

            <p className="text-gray-600 mb-6">
              {validationMessage}
            </p>

            <div className="flex justify-end">

              <button
                onClick={() =>
                  setShowValidationModal(false)
                }
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                OK
              </button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}