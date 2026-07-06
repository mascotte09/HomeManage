import { useEffect, useState } from "react";
import { supabase } from "../../supabase.js";
import Input from "../InputVal.jsx";
export default function InvoiceRecord({
  room,
  homeID,
  invoice,
  onCancel,
  onAdd,
}) {
  const [saving, setSaving] = useState(false);
  const [home, setHome] = useState(null);


  const [formData, setFormData] = useState({
    invoice_create_date:
      new Date()
        .toISOString()
        .substring(0, 10),

    rental_amount: "",


    note: "",
  });
  // =========================
  // LOAD INVOICE
  // =========================
  useEffect(() => {
    if (invoice) return;

    setFormData((prev) => ({
      ...prev,
      rental_amount: room?.monthly_rent ?? "",

    }));
  }, [room, invoice]);

  useEffect(() => {
    if (!invoice) return;

    setFormData({
      invoice_create_date:
        invoice.invoice_create_date?.substring(0, 10) ?? "",

      rental_amount:
        invoice.rental_amount ?? "",

      note:
        invoice.note ?? "",
    });
  }, [invoice]);

  // useEffect(() => {
  //   async function fetchInvoiceBalances() {
  //     if (!room?.id) {
  //       return;
  //     }

  //     let query = supabase
  //       .from("invoices")
  //       .select(`
  //         id,
  //         invoice_create_date,
  //         total_amount,
  //         debit_amount
  //       `)
  //       .eq("room_id", room.id)
  //       .neq("debit_amount", 0)
  //       .order("invoice_create_date", {
  //         ascending: true,
  //       });

  //     // if (invoice?.id) {
  //     //   query = query.neq("id", invoice.id);
  //     // }

  //     // const { data, error } = await query;

  //     // if (error) {
  //     //   console.log(error.message);
  //     //   return;
  //     // }

  //   }

  //   fetchInvoiceBalances();
  // }, [room?.id, invoice?.id]);


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
  // CREATE
  // =========================
  async function handleCreate() {
    if (saving) return;

    setSaving(true);
    try {

      const invalidRental =
        Number(formData.rental_amount) === 0 ||
        formData.rental_amount === "";

      if (invalidRental) {
        alert("Vui lòng nhập tiền thuê hợp lệ");
        return;
      }

      const payload = {
        room_id: room.id,


        rental_amount:
          Number(formData.rental_amount) || null,

        invoice_create_date:
          formData.invoice_create_date || null,

        note: formData.note || null,

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
        new_water_number,
        rental_amount
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
              monthly_rent:
                newestInvoice.rental_amount
            })
            .eq("id", room.id);
        }
      }

    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {

    async function checkPreviousInvoice() {

      if (!room?.id) {


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

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">

        {/* HEADER */}
        <div className="px-5 pt-5 pb-4 border-b border-stone-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#146356] mb-1">
            {invoice ? "Cập nhật hóa đơn" : "Tạo hóa đơn mới"}
          </p>
          <h2 className="text-xl font-bold text-stone-800 tracking-tight">
            Phòng {room?.room_name}
          </h2>
          {home?.home_name && (
            <p className="text-sm text-stone-400 mt-0.5">{home.home_name}</p>
          )}
        </div>

        {/* FORM */}
        <div className="flex flex-col gap-4 px-5 py-5">

          <Input
            label={<span>Ngày tạo Hóa Đơn <span className="text-[#B3452F]">*</span></span>}
            type="date"
            value={formData.invoice_create_date}
            onChange={handleChange}
            name="invoice_create_date"
          />

          <Input
            label={<span>Tiền thuê <span className="text-[#B3452F]">*</span></span>}
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

          {/* BUTTONS */}
          <div className="flex gap-3 mt-4 pt-4 border-t border-stone-100">
            <button
              onClick={handleCreate}
              disabled={saving}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition active:scale-[0.98] ${saving
                ? "bg-[#146356]/50 cursor-not-allowed"
                : "bg-[#146356] hover:bg-[#0F4C42] shadow-sm shadow-[#146356]/20"
                }`}
            >
              {saving ? "Đang tính..." : "Tính tiền"}
            </button>
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition disabled:opacity-50"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
