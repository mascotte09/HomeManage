import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";

import Input from "../InputVal.jsx";
import InvoiceSummary from "./InvoiceSummary";
import { FiShare, FiX } from "react-icons/fi";

import { invoiceRepository } from "../../db/invoiceRepository.js";
import { roomRepository } from "../../db/roomRepository.js";
import { homeRepository } from "../../db/homeRepository.js";

export default function InvoiceRecord({
  room,
  homeID,
  invoice,
  onCancel,
  onAdd,
}) {
  const [saving, setSaving] = useState(false);

  const [showValidationModal, setShowValidationModal] =
    useState(false);

  const [validationMessage, setValidationMessage] =
    useState("");

  const [showSummaryModal, setShowSummaryModal] =
    useState(false);

  const summaryRef = useRef(null);

  const [unpaidInvoices, setUnpaidInvoices] =
    useState([]);

  const [extraPaidInvoices, setExtraPaidInvoices] =
    useState([]);

  const [home, setHome] = useState(null);

  const [hasPreviousInvoice, setHasPreviousInvoice] =
    useState(false);

  // =========================================================
  // HOME
  // =========================================================
  useEffect(() => {
    async function loadHome() {
      if (!homeID) return;

      try {
        const data =
          await homeRepository.getById(homeID);

        setHome(data);
      } catch (error) {
        console.error(
          "Không thể lấy thông tin nhà:",
          error
        );
      }
    }

    loadHome();
  }, [homeID]);

  // =========================================================
  // FORM
  // =========================================================
  const [formData, setFormData] = useState({
    invoice_create_date: new Date()
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

  // =========================================================
  // LOAD ROOM / NEW INVOICE
  // =========================================================
  useEffect(() => {
    if (invoice) return;

    setFormData((prev) => ({
      ...prev,

      rental_amount:
        room?.monthly_rent ?? "",

      current_electricity_number:
        room?.current_electricity_number ?? "0",

      current_water_number:
        room?.current_water_number ?? "0",

      new_electricity_number: "",

      new_water_number: "",
    }));
  }, [room, invoice]);

  // =========================================================
  // LOAD EXISTING INVOICE
  // =========================================================
  useEffect(() => {
    if (!invoice) return;

    setFormData({
      invoice_create_date:
        invoice.invoice_create_date?.substring(
          0,
          10
        ) ?? "",

      rental_amount:
        invoice.rental_amount ?? "",

      current_electricity_number:
        invoice.current_electricity_number ?? "0",

      new_electricity_number:
        invoice.new_electricity_number ?? "",

      current_water_number:
        invoice.current_water_number ?? "0",

      new_water_number:
        invoice.new_water_number ?? "",

      wifi_amount:
        invoice.wifi_amount ?? "",

      surcharge:
        invoice.surcharge ?? "",

      amount_already_pay:
        invoice.amount_already_pay ?? "",

      note:
        invoice.note ?? "",
    });
  }, [invoice]);

  // =========================================================
  // LOAD BALANCES
  // =========================================================
  useEffect(() => {
    async function loadBalances() {
      if (!room?.id) {
        setUnpaidInvoices([]);
        setExtraPaidInvoices([]);
        return;
      }

      try {
        const {
          unpaidInvoices,
          extraPaidInvoices,
        } =
          await invoiceRepository.getBalances(
            room.id,
            invoice?.id
          );

        setUnpaidInvoices(unpaidInvoices);
        setExtraPaidInvoices(extraPaidInvoices);
      } catch (error) {
        console.error(
          "Không thể lấy công nợ:",
          error
        );
      }
    }

    loadBalances();
  }, [room?.id, invoice?.id]);

  // =========================================================
  // CHECK PREVIOUS INVOICE
  // =========================================================
  useEffect(() => {
  async function checkPreviousInvoice() {
    if (!room?.id) {
      setHasPreviousInvoice(false);
      return;
    }

    try {
      const latestInvoice =
        await invoiceRepository.getLatest(
          room.id,
          invoice?.id
        );

      const hasInvoice = !!latestInvoice;

      setHasPreviousInvoice(hasInvoice);

      // Đang tạo hóa đơn mới
      // → lấy tiền thuê + wifi từ hóa đơn gần nhất
      if (hasInvoice && !invoice?.id) {
        setFormData((prev) => ({
          ...prev,
          rental_amount:
            Number(latestInvoice.rental_amount) || "",
          wifi_amount:
            latestInvoice.wifi_amount ?? "",
        }));
      }
    } catch (error) {
      console.error(
        "Không thể kiểm tra hóa đơn trước:",
        error
      );
    }
  }

  checkPreviousInvoice();
}, [room?.id, invoice?.id]);

  // =========================================================
  // INPUT
  // =========================================================
  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // =========================================================
  // CALCULATE
  // =========================================================
  const isWaterPerPerson =
    !!home?.is_water_per_person;

  const waterPrice =
    Number(home?.water_price) || 0;

  const elecPrice =
    Number(home?.electricity_price) || 0;

  const numPerson =
    Number(room?.num_person) || 0;

  function calculateTotal() {
    const electUsed =
      (Number(
        formData.new_electricity_number
      ) || 0) -
      (Number(
        formData.current_electricity_number
      ) || 0);

    const waterUsed =
      (Number(
        formData.new_water_number
      ) || 0) -
      (Number(
        formData.current_water_number
      ) || 0);

    const electAmount =
      electUsed * elecPrice;

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

  const {
    electAmount,
    waterAmount,
    total,
  } = calculateTotal();

  // =========================================================
  // CAPTURE + SHARE
  // =========================================================
  async function captureAndShare() {
    if (!summaryRef.current) return;

    await new Promise((resolve) =>
      setTimeout(resolve, 500)
    );

    await document.fonts.ready;

    const canvas =
      await html2canvas(summaryRef.current, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        scale: 2,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth:
          document.documentElement
            .scrollWidth,
        windowHeight:
          document.documentElement
            .scrollHeight,
      });

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File(
        [blob],
        `invoice-room-${room?.room_name}.png`,
        {
          type: "image/png",
        }
      );

      if (
        navigator.canShare?.({
          files: [file],
        })
      ) {
        try {
          await navigator.share({
            files: [file],

            title: "Invoice",

            text: `Gởi ${
              room?.room_renter || ""
            } hóa đơn tháng ${
              formData.invoice_create_date?.substring(
                0,
                7
              )
            }`,
          });
        } catch (error) {
          console.log(error);
        }
      } else {
        const link =
          document.createElement("a");

        link.href =
          URL.createObjectURL(blob);

        link.download =
          `invoice-room-${room?.room_name}.png`;

        link.click();

        URL.revokeObjectURL(link.href);
      }
    });
  }

  // =========================================================
  // CREATE / UPDATE
  // =========================================================
  async function handleCreate() {
    if (saving) return;

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------
    const invalidElectricity =
      Number(
        formData.current_electricity_number
      ) >
      Number(
        formData.new_electricity_number
      );

    const emptyElectricity =
      formData.new_electricity_number === "";

    const invalidWater =
      !isWaterPerPerson &&
      Number(
        formData.current_water_number
      ) >
      Number(
        formData.new_water_number
      );

    const emptyWater =
      !isWaterPerPerson &&
      formData.new_water_number === "";

    const invalidRental =
      Number(formData.rental_amount) === 0 ||
      formData.rental_amount === "";

    if (invalidRental) {
      setValidationMessage(
        "❌ Tiền thuê là bắt buộc."
      );

      setShowValidationModal(true);
      return;
    }

    if (emptyElectricity) {
      setValidationMessage(
        "❌ Số điện mới là bắt buộc."
      );

      setShowValidationModal(true);
      return;
    }

    if (invalidElectricity) {
      setValidationMessage(
        "❌ Số điện mới phải lớn hơn hoặc bằng số điện cũ."
      );

      setShowValidationModal(true);
      return;
    }

    if (!isWaterPerPerson && emptyWater) {
      setValidationMessage(
        "❌ Số nước mới là bắt buộc."
      );

      setShowValidationModal(true);
      return;
    }

    if (invalidWater) {
      setValidationMessage(
        "❌ Số nước mới phải lớn hơn hoặc bằng số nước cũ."
      );

      setShowValidationModal(true);
      return;
    }

    setSaving(true);

    try {
      // -----------------------------------------------------
      // PAYLOAD
      // -----------------------------------------------------
      const payload = {
        room_id: room.id,

        current_electricity_number:
          Number(
            formData.current_electricity_number
          ) || null,

        new_electricity_number:
          Number(
            formData.new_electricity_number
          ) || null,

        current_water_number:
          Number(
            formData.current_water_number
          ) || null,

        new_water_number:
          Number(
            formData.new_water_number
          ) || null,

        rental_amount:
          Number(
            formData.rental_amount
          ) || null,

        invoice_create_date:
          formData.invoice_create_date ||
          null,

        amount_already_pay:
          Number(
            formData.amount_already_pay
          ) || 0,

        note:
          formData.note || null,

        surcharge:
          Number(
            formData.surcharge
          ) || null,

        wifi_amount:
          Number(
            formData.wifi_amount
          ) || null,

        elect_amount:
          electAmount,

        water_amount:
          waterAmount,

        total_amount:
          total,

        debit_amount:
          total -
          (Number(
            formData.amount_already_pay
          ) || 0),
      };

      // -----------------------------------------------------
      // SAVE
      // -----------------------------------------------------
      let savedInvoice;

      if (invoice?.id) {
        savedInvoice =
          await invoiceRepository.update(
            invoice.id,
            payload
          );
      } else {
        savedInvoice =
          await invoiceRepository.create(
            payload
          );
      }

      // -----------------------------------------------------
      // GET LATEST INVOICE
      // -----------------------------------------------------
      const newestInvoice =
        await invoiceRepository.getLatestForRoom(
          room.id
        );

      // -----------------------------------------------------
      // UPDATE ROOM METER
      // Only if saved invoice is latest
      // -----------------------------------------------------
      if (
        newestInvoice &&
        savedInvoice &&
        newestInvoice.id === savedInvoice.id
      ) {
        await roomRepository.update(
          room.id,
          {
            current_electricity_number:
              newestInvoice.new_electricity_number,

            current_water_number:
              newestInvoice.new_water_number,

            monthly_rent:
              newestInvoice.rental_amount,
          }
        );
      }

      // -----------------------------------------------------
      // SHOW SUMMARY
      // -----------------------------------------------------
      setShowSummaryModal(true);

    } catch (error) {
      console.error(error);

      alert(
        invoice?.id
          ? "Không thể cập nhật hóa đơn"
          : "Không thể tạo hóa đơn"
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // ERRORS
  // =========================================================
  const electricityError =
    formData.new_electricity_number !== "" &&
    Number(
      formData.current_electricity_number
    ) >
      Number(
        formData.new_electricity_number
      )
      ? "Số điện mới phải lớn hơn hoặc bằng số điện cũ."
      : "";

  const electricityPlaceholder =
    hasPreviousInvoice
      ? `Số cũ: ${
          formData.current_electricity_number ||
          0
        }`
      : "";

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="w-full p-2">

      {/* HEADER */}
      <div className="flex justify-between mb-2">

        <h2 className="text-xl font-bold text-black">
          Phòng số: {room?.room_name}
        </h2>

      </div>

      {/* FORM */}
      <div className="flex flex-col gap-2">

        {/* DATE */}
        <Input
          label={
            <span>
              Ngày tạo Hóa Đơn{" "}
              <span className="text-red-500">
                *
              </span>
            </span>
          }
          type="date"
          value={
            formData.invoice_create_date
          }
          onChange={handleChange}
          name="invoice_create_date"
        />

        {/* RENT */}
        <Input
          label={
            <span>
              Tiền thuê{" "}
              <span className="text-red-500">
                *
              </span>
            </span>
          }
          type="text"
          value={Number(
            formData.rental_amount || 0
          ).toLocaleString("vi-VN")}
          name="rental_amount"
          onChange={(e) => {
            const raw =
              e.target.value.replace(
                /\./g,
                ""
              );

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
              value={
                formData.current_electricity_number
              }
              onChange={handleChange}
            />
          )}

          <div>

            <Input
              label={
                <span>
                  Số Điện Mới{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </span>
              }
              type="number"
              name="new_electricity_number"
              value={
                formData.new_electricity_number
              }
              onChange={handleChange}
              placeholder={
                electricityPlaceholder
              }
              error={electricityError}
            />

          </div>

        </div>

        {/* WATER */}
        {!isWaterPerPerson && (
          <div
            className={
              hasPreviousInvoice
                ? "grid grid-cols-1 gap-3"
                : "grid grid-cols-2 gap-3"
            }
          >

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
                label={
                  <span>
                    Số Nước Mới{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </span>
                }
                type="number"
                name="new_water_number"
                value={
                  formData.new_water_number
                }
                onChange={handleChange}
                placeholder={
                  hasPreviousInvoice
                    ? `Số cũ: ${
                        formData.current_water_number ||
                        0
                      }`
                    : ""
                }
                error={
                  formData.new_water_number !== "" &&
                  Number(
                    formData.current_water_number
                  ) >
                    Number(
                      formData.new_water_number
                    )
                    ? "Số nước mới phải lớn hơn hoặc bằng số nước cũ."
                    : ""
                }
              />

            </div>

          </div>
        )}

        {/* WIFI */}
        <Input
          label="Wifi"
          type="text"
          value={Number(
            formData.wifi_amount || 0
          ).toLocaleString("vi-VN")}
          name="wifi_amount"
          onChange={(e) => {
            const raw =
              e.target.value.replace(
                /\./g,
                ""
              );

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

      {/* =====================================================
          SUMMARY MODAL
      ===================================================== */}
      {showSummaryModal && (

        <div className="
          fixed inset-0
          bg-black/50
          z-50
          flex items-center justify-center
          p-4
        ">

          <div className="
            bg-white
            rounded-2xl
            w-full
            max-w-2xl
            max-h-[90vh]
            overflow-y-auto
            p-4
          ">

            {/* ACTIONS */}
            <div className="
              flex justify-end
              items-start
              gap-5
              mt-4
            ">

              {/* SHARE */}
              <button
                onClick={async () => {

                  const modalEl =
                    summaryRef.current?.closest(
                      ".overflow-y-auto"
                    );

                  if (modalEl) {
                    modalEl.scrollTop = 0;
                  }

                  await new Promise((r) =>
                    requestAnimationFrame(r)
                  );

                  await captureAndShare();

                  setShowSummaryModal(false);

                  onAdd?.();
                }}
                className="
                  flex flex-col
                  items-center
                  text-green-600
                  hover:text-green-700
                  transition
                "
              >
                <FiShare size={26} />

                <span className="text-xs mt-1">
                  Gửi hóa đơn
                </span>
              </button>

              {/* CLOSE */}
              <button
                onClick={() => {
                  setShowSummaryModal(false);
                  onAdd?.();
                }}
                className="
                  flex flex-col
                  items-center
                  text-stone-600
                  hover:text-stone-800
                  transition
                "
              >
                <FiX size={26} />

                <span className="text-xs mt-1">
                  Đóng
                </span>
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
              home={home}
              unpaidInvoices={unpaidInvoices}
              extraPaidInvoices={
                extraPaidInvoices
              }
            />

          </div>

        </div>
      )}

      {/* BUTTONS */}
      <div className="flex gap-4 mt-6">

        <button
          onClick={handleCreate}
          disabled={saving}
          className={`
            px-4 py-2
            rounded
            text-white
            ${
              saving
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }
          `}
        >
          {saving
            ? "Đang tính..."
            : invoice
              ? "Cập nhật"
              : "Tính tiền"}
        </button>

        <button
          onClick={onCancel}
          disabled={saving}
          className="
            bg-gray-300
            px-4 py-2
            rounded
            disabled:opacity-50
          "
        >
          Đóng
        </button>

      </div>

      {/* VALIDATION MODAL */}
      {showValidationModal && (

        <div className="
          fixed inset-0
          bg-black/50
          flex justify-center items-center
          z-50
        ">

          <div className="
            bg-white
            p-6
            rounded
            w-[400px]
            max-w-[90vw]
          ">

            <h2 className="
              text-black
              font-bold
              text-lg
              mb-3
            ">
              Thông báo
            </h2>

            <p className="
              text-gray-600
              mb-6
            ">
              {validationMessage}
            </p>

            <div className="flex justify-end">

              <button
                onClick={() =>
                  setShowValidationModal(false)
                }
                className="
                  bg-red-600
                  text-white
                  px-4 py-2
                  rounded
                "
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