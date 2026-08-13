import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiFileText,
  FiTrash2,
  FiPlus,
  FiArrowLeft,
} from "react-icons/fi";

import { invoiceRepository } from "../../db/invoiceRepository.js";
import { roomRepository } from "../../db/roomRepository.js";
import { homeRepository } from "../../db/homeRepository.js";

import InvoiceRecord from "./InvoiceRecord.jsx";

export default function Invoices() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [home, setHome] = useState(null);
  const [room, setRoom] = useState(null);
  const [invoices, setInvoices] = useState([]);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceRecord, setShowInvoiceRecord] = useState(false);

  const [loading, setLoading] = useState(true);

  // =========================================================
  // FETCH DATA
  // =========================================================
  const fetchData = useCallback(async () => {
    if (!roomId) return;

    setLoading(true);

    try {
      // -------------------------------------------------------
      // ROOM
      // -------------------------------------------------------
      const roomData = await roomRepository.getById(roomId);

      if (!roomData) {
        console.error("Không tìm thấy phòng");
        return;
      }

      setRoom(roomData);

      // -------------------------------------------------------
      // HOME
      // -------------------------------------------------------
      if (roomData.home_id) {
        try {
          const homeData =
            await homeRepository.getById(roomData.home_id);

          setHome(homeData);
        } catch (error) {
          console.error("Không thể lấy nhà:", error);
        }
      }

      // -------------------------------------------------------
      // INVOICES
      // -------------------------------------------------------
      const invoiceData =
        await invoiceRepository.getByRoomId(roomId);

      setInvoices(invoiceData || []);
    } catch (error) {
      console.error("Invoices fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =========================================================
  // BACK
  // =========================================================
  function handleBack() {
    if (room?.home_id) {
      navigate(`/rooms/${room.home_id}`);
    } else {
      navigate(-1);
    }
  }

  // =========================================================
  // VIEW INVOICE
  // =========================================================
  function handleView(invoice) {
    setSelectedInvoice(invoice);
    setShowInvoiceRecord(true);
  }

  // =========================================================
  // ADD INVOICE
  // =========================================================
  function handleAdd() {
    setSelectedInvoice(null);
    setShowInvoiceRecord(true);
  }

  // =========================================================
  // DELETE
  // =========================================================
  async function handleDelete(invoiceId) {
    if (!invoiceId) return;

    const ok = window.confirm(
      "Bạn có chắc muốn xóa hóa đơn này?"
    );

    if (!ok) return;

    try {
      await invoiceRepository.delete(invoiceId);

      setInvoices((prev) =>
        prev.filter((invoice) => invoice.id !== invoiceId)
      );
    } catch (error) {
      console.error(error);
      alert("Không thể xóa hóa đơn");
    }
  }

  // =========================================================
  // FORMAT
  // =========================================================
  function formatDate(dateString) {
    if (!dateString) return "";

    return new Date(dateString).toLocaleDateString("vi-VN");
  }

  function formatMoney(value) {
    return Number(value || 0).toLocaleString("vi-VN");
  }

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="min-h-screen bg-stone-50 p-4">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">

        <div className="flex items-center gap-2 min-w-0">

          <button
            onClick={handleBack}
            className="
              w-9 h-9
              rounded-full
              flex items-center justify-center
              bg-white
              border border-stone-200
              text-stone-600
              hover:bg-stone-100
              transition
              flex-shrink-0
            "
          >
            <FiArrowLeft size={17} />
          </button>

          <h1 className="text-base font-bold text-stone-800 truncate">
            Hóa đơn phòng {room?.room_name || "..."}
          </h1>

        </div>

        <button
          onClick={handleAdd}
          className="
            w-9 h-9
            rounded-full
            flex items-center justify-center
            bg-green-600
            hover:bg-green-700
            text-white
            transition
            active:scale-95
            flex-shrink-0
          "
          title="Tạo hóa đơn mới"
        >
          <FiPlus size={18} />
        </button>

      </div>

      {/* LOADING */}
      {loading ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
          <p className="text-stone-500">
            Đang tải hóa đơn...
          </p>
        </div>
      ) : invoices.length === 0 ? (

        /* EMPTY */
        <div className="
          bg-white
          border border-stone-200
          rounded-2xl
          p-8
          text-center
        ">
          <FiFileText
            size={30}
            className="mx-auto mb-3 text-stone-300"
          />

          <p className="text-stone-500">
            Chưa có hóa đơn
          </p>

          <button
            onClick={handleAdd}
            className="
              mt-4
              px-4 py-2
              rounded-full
              bg-green-600
              hover:bg-green-700
              text-white
              text-sm
              font-medium
            "
          >
            Tạo hóa đơn
          </button>
        </div>

      ) : (

        /* LIST */
        <div className="space-y-3">

          {invoices.map((invoice) => (

            <button
              key={invoice.id}
              onClick={() => handleView(invoice)}
              className="
                w-full
                text-left
                bg-white
                border border-stone-200
                rounded-2xl
                p-4
                hover:border-stone-300
                active:scale-[0.98]
                transition
              "
            >

              <div className="flex items-center justify-between gap-3">

                {/* LEFT */}
                <div className="flex items-center gap-3 min-w-0">

                  <div className="
                    w-10 h-10
                    rounded-xl
                    bg-green-50
                    flex items-center justify-center
                    flex-shrink-0
                  ">
                    <FiFileText
                      size={18}
                      className="text-green-600"
                    />
                  </div>

                  <div className="min-w-0">

                    <div className="font-semibold text-stone-800">
                      {formatDate(
                        invoice.invoice_create_date
                      )}
                    </div>

                    <div
                      className={`
                        text-sm
                        font-medium
                        ${
                          Number(invoice.debit_amount) > 0
                            ? "text-red-500"
                            : Number(invoice.debit_amount) < 0
                              ? "text-green-600"
                              : "text-blue-600"
                        }
                      `}
                    >
                      {Number(invoice.debit_amount) > 0
                        ? `Nợ: ${formatMoney(
                            invoice.debit_amount
                          )} đ`
                        : Number(invoice.debit_amount) < 0
                          ? `Tiền dư: ${formatMoney(
                              Math.abs(
                                invoice.debit_amount
                              )
                            )} đ`
                          : "Đã thanh toán"}
                    </div>

                  </div>

                </div>

                {/* RIGHT */}
                <div className="
                  flex items-center gap-2
                  flex-shrink-0
                ">

                  <span className="
                    px-3 py-1
                    rounded-full
                    bg-green-50
                    text-green-700
                    text-sm
                    font-semibold
                  ">
                    {formatMoney(
                      invoice.total_amount
                    )} đ
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(invoice.id);
                    }}
                    className="
                      w-9 h-9
                      rounded-full
                      bg-red-50
                      text-red-500
                      flex items-center justify-center
                      hover:bg-red-100
                      transition
                    "
                  >
                    <FiTrash2 size={16} />
                  </button>

                </div>

              </div>

            </button>

          ))}

        </div>
      )}

      {/* INVOICE RECORD */}
      {showInvoiceRecord && (

        <div className="
          fixed inset-0
          z-50
          bg-black/40
          flex items-center justify-center
          p-4
        ">

          <div className="
            bg-white
            w-full
            sm:max-w-2xl
            rounded-t-2xl
            sm:rounded-2xl
            overflow-auto
            max-h-[95vh]
          ">

            <InvoiceRecord
              room={room}
              homeID={home?.id || room?.home_id}
              invoice={selectedInvoice}

              onCancel={() => {
                setShowInvoiceRecord(false);
                setSelectedInvoice(null);
              }}

              onAdd={async () => {
                await fetchData();

                setShowInvoiceRecord(false);
                setSelectedInvoice(null);
              }}
            />

          </div>

        </div>

      )}

    </div>
  );
}