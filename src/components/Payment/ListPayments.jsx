import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { FiArrowLeft, FiChevronDown } from "react-icons/fi";

import { db } from "../../db/db.js";
import { syncService } from "../../db/syncService.js";

import PaymentRecord from "./PaymentRecord.jsx";

// ─────────────────────────────────────────────
// Invoice Card
// ─────────────────────────────────────────────

function InvoiceCard({ invoice, onSelect }) {
  const debt = Number(invoice.debit_amount || 0);

  const isPaid = debt <= 0;

  const displayAmount = isPaid
    ? Number(invoice.total_amount || 0)
    : debt;

  return (
    <button
      onClick={() => onSelect(invoice.id)}
      className="
        w-full text-left
        p-3 rounded-2xl
        border border-stone-200
        bg-white
        hover:border-stone-300
        transition
        active:scale-[0.98]
      "
    >
      <div className="flex items-center justify-between gap-2">

        <div className="flex-1 min-w-0">

          <p className="font-semibold text-stone-800">
            Phòng {invoice.room_number}
          </p>

          <p className="text-xs text-stone-400 mt-0.5">
            {invoice.invoice_create_date
              ? new Date(
                invoice.invoice_create_date
              ).toLocaleDateString("vi-VN")
              : ""}
          </p>

        </div>

        <span
          className={`
            px-2.5 py-1
            rounded-full
            text-xs
            font-medium
            flex-shrink-0
            ${isPaid
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
            }
          `}
        >
          {displayAmount.toLocaleString("vi-VN")} đ
        </span>

      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

export default function ListPayments() {

  const { houseId } = useParams();

  const [state, setState] = useState({
    home: null,
    rooms: [],
    collected: [],
    noCollected: [],
  });

  const [selectedMonth, setSelectedMonth] =
    useState(
      new Date().toISOString().slice(0, 7)
    );

  const [selectedInvoice, setSelectedInvoice] =
    useState(null);

  const [loading, setLoading] =
    useState(true);


  // ═══════════════════════════════════════════
  // LẤY HOME LOCAL
  // ═══════════════════════════════════════════

  const getLocalHome = useCallback(async () => {

    if (!houseId) {
      return null;
    }

    const home =
      await db.homes.get(houseId);

    if (!home) {
      console.warn(
        "⚠️ Không tìm thấy home Local:",
        houseId
      );

      return null;
    }

    if (home.retired === true) {
      return null;
    }

    return home;

  }, [houseId]);


  // ═══════════════════════════════════════════
  // LẤY ROOMS LOCAL
  // ═══════════════════════════════════════════

  const getLocalRooms = useCallback(async () => {

    if (!houseId) {
      return [];
    }

    const rooms =
      await db.rooms
        .where("home_id")
        .equals(houseId)
        .toArray();

    return rooms.filter(
      room => room.retired !== true
    );

  }, [houseId]);


  // ═══════════════════════════════════════════
  // LẤY INVOICES LOCAL
  // ═══════════════════════════════════════════

  const getLocalInvoices = useCallback(async (rooms) => {

    if (!rooms.length) {
      return [];
    }

    const roomIds = new Set(
      rooms.map(room => room.id)
    );

    const invoices =
      await db.invoices.toArray();

    return invoices.filter(
      invoice =>
        roomIds.has(invoice.room_id) &&
        invoice.retired !== true
    );

  }, []);


  // ═══════════════════════════════════════════
  // LOAD LOCAL
  // ═══════════════════════════════════════════

  const loadFromLocal = useCallback(async () => {

    const home =
      await getLocalHome();

    if (!home) {

      setState({
        home: null,
        rooms: [],
        collected: [],
        noCollected: [],
      });

      return false;
    }


    const rooms =
      await getLocalRooms();

    const invoices =
      await getLocalInvoices(
        rooms
      );


    const [
      year,
      month
    ] =
      selectedMonth
        .split("-")
        .map(Number);


    const collected = [];
    const noCollected = [];


    // ─────────────────────────────────────────
    // Ghép invoice + room
    // ─────────────────────────────────────────

    const roomMap =
      new Map(
        rooms.map(
          room => [
            room.id,
            room
          ]
        )
      );


    invoices.forEach(invoice => {

      if (!invoice.invoice_create_date) {
        return;
      }


      const d =
        new Date(
          invoice.invoice_create_date
        );


      if (
        d.getMonth() + 1 !== month ||
        d.getFullYear() !== year
      ) {
        return;
      }


      const room =
        roomMap.get(
          invoice.room_id
        );


      if (!room) {
        return;
      }


      const invoiceWithRoom = {
        ...invoice,
        room_number:
          room.room_name ||
          room.name ||
          "",
      };


      if (
        Number(invoice.debit_amount || 0) <= 0
      ) {

        collected.push(
          invoiceWithRoom
        );

      } else {

        noCollected.push(
          invoiceWithRoom
        );

      }

    });


    // ─────────────────────────────────────────
    // Sort phòng
    // ─────────────────────────────────────────

    const sortFn =
      (a, b) =>
        String(a.room_number || "")
          .localeCompare(
            String(b.room_number || ""),
            undefined,
            {
              numeric: true
            }
          );


    collected.sort(sortFn);

    noCollected.sort(sortFn);


    // ─────────────────────────────────────────
    // Update UI
    // ─────────────────────────────────────────

    setState({
      home,
      rooms,
      collected,
      noCollected,
    });


    return true;

  }, [
    getLocalHome,
    getLocalRooms,
    getLocalInvoices,
    selectedMonth,
  ]);


  // ═══════════════════════════════════════════
  // FETCH
  // ═══════════════════════════════════════════

  const fetchInvoices =
    useCallback(async () => {

      if (!houseId) {
        return;
      }

      setLoading(true);

      try {

        // ─────────────────────────────────────
        // 1. Đọc Local trước
        // ─────────────────────────────────────

        let hasLocal =
          await loadFromLocal();


        // ─────────────────────────────────────
        // 2. Local chưa có home
        // → Sync từ Supabase
        // ─────────────────────────────────────

        if (!hasLocal) {

          console.log(
            "📭 Local chưa có dữ liệu → Sync Supabase"
          );

          if (navigator.onLine) {

            try {

              await syncService.syncAll();

            } catch (error) {

              console.error(
                "❌ Sync thất bại:",
                error
              );

            }

          }

          // ───────────────────────────────────
          // 3. Đọc Local lại
          // ───────────────────────────────────

          hasLocal =
            await loadFromLocal();

        }


        if (!hasLocal) {

          console.log(
            "📭 Không có dữ liệu Local/Supabase"
          );

        }

      } catch (error) {

        console.error(
          "❌ Lỗi load hóa đơn:",
          error
        );

      } finally {

        setLoading(false);

      }

    }, [
      houseId,
      loadFromLocal,
    ]);


  // ═══════════════════════════════════════════
  // INITIAL / MONTH CHANGE
  // ═══════════════════════════════════════════

  useEffect(() => {

    fetchInvoices();

  }, [
    fetchInvoices
  ]);


  // ═══════════════════════════════════════════
  // ĐỔI THÁNG
  // ═══════════════════════════════════════════

  useEffect(() => {

    setSelectedInvoice(null);

  }, [
    selectedMonth
  ]);


  // ═══════════════════════════════════════════
  // CHỌN INVOICE
  // ═══════════════════════════════════════════

  function handleSelectInvoice(
    invoiceId
  ) {

    const invoice =
      [
        ...state.collected,
        ...state.noCollected
      ].find(
        inv =>
          inv.id === invoiceId
      );


    if (invoice) {

      setSelectedInvoice(
        invoice
      );

    }

  }


  const allInvoices = [
    ...state.noCollected,
    ...state.collected
  ];


  // ═══════════════════════════════════════════
  // SAVE PAYMENT
  // LOCAL → QUEUE → SUPABASE
  // ═══════════════════════════════════════════

  const handleSavePayment =
    useCallback(async (
      updatedInvoice
    ) => {

      if (!updatedInvoice?.id) {
        return;
      }


      try {

        const now =
          new Date().toISOString();


        // ─────────────────────────────────────
        // Lấy invoice Local hiện tại
        // ─────────────────────────────────────

        const existing =
          await db.invoices.get(
            updatedInvoice.id
          );


        if (!existing) {

          throw new Error(
            "Không tìm thấy hóa đơn trong Local"
          );

        }


        // ─────────────────────────────────────
        // Update Local
        // ─────────────────────────────────────

        const updated = {

          ...existing,

          debit_amount:
            Number(
              updatedInvoice.debit_amount || 0
            ),

          updated_at:
            now,

        };


        await db.transaction(
          "rw",
          db.invoices,
          db.sync_queue,
          async () => {

            await db.invoices.put(
              updated
            );


            // ───────────────────────────────
            // Kiểm tra queue hiện tại
            // ───────────────────────────────

            const existingQueue =
              await db.sync_queue
                .where("table")
                .equals("invoices")
                .toArray();


            const sameRecordQueue =
              existingQueue.find(
                item =>
                  item.record_id ===
                  updated.id
              );


            // ───────────────────────────────
            // Nếu đã có INSERT
            // thì không tạo UPDATE
            // ───────────────────────────────

            if (sameRecordQueue) {

              if (
                sameRecordQueue.action ===
                "INSERT"
              ) {

                // INSERT sẽ gửi bản mới nhất
                return;

              }


              // Đã có UPDATE
              // → xóa queue cũ
              // → tạo queue mới
              await db.sync_queue.delete(
                sameRecordQueue.id
              );

            }


            // ───────────────────────────────
            // Tạo UPDATE queue
            // ───────────────────────────────

            await db.sync_queue.add({

              table: "invoices",

              record_id:
                updated.id,

              action: "UPDATE",

              created_at:
                now,

            });

          }
        );


        // ─────────────────────────────────────
        // Update UI ngay
        // ─────────────────────────────────────

        await loadFromLocal();


        // ─────────────────────────────────────
        // Đóng màn hình
        // ─────────────────────────────────────

        setSelectedInvoice(
          null
        );


        // ─────────────────────────────────────
        // Nếu online
        // Sync ngay
        // ─────────────────────────────────────

        if (navigator.onLine) {

          syncService
            .syncAll()
            .catch(error => {

              console.error(
                "❌ Sync payment:",
                error
              );

            });

        }

      } catch (error) {

        console.error(
          "❌ Lưu thanh toán thất bại:",
          error
        );

        alert(
          error.message ||
          "Không thể lưu thanh toán"
        );

      }

    }, [
      loadFromLocal
    ]);


  // ═══════════════════════════════════════════
  // PAYMENT RECORD VIEW
  // ═══════════════════════════════════════════

  if (selectedInvoice) {

    return (

      <div
        className="
          min-h-screen
          bg-stone-50
          flex
          flex-col
        "
      >

        <div
          className="
            bg-white
            border-b
            border-stone-200
            px-3
            py-2
            flex
            items-center
            gap-2
            sticky
            top-0
            z-10
          "
        >

          <button
            onClick={() =>
              setSelectedInvoice(null)
            }
            className="
              w-10 h-10
              flex
              items-center
              justify-center
              rounded-full
              hover:bg-stone-100
              text-stone-600
              transition
              flex-shrink-0
            "
            aria-label="Quay lại"
          >

            <FiArrowLeft
              size={20}
            />

          </button>


          <p
            className="
              font-semibold
              text-stone-800
              text-sm
              truncate
            "
          >

            Thu tiền · Phòng{" "}
            {selectedInvoice.room_number}

          </p>

        </div>


        <div
          className="
            flex-1
            p-4
          "
        >

          <PaymentRecord

            invoice={
              selectedInvoice
            }

            onCancel={() =>
              setSelectedInvoice(null)
            }

            onSave={
              handleSavePayment
            }

          />

        </div>

      </div>

    );

  }


  // ═══════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════

  return (

    <div
      className="
        min-h-screen
        bg-stone-50
      "
    >

      <div
        className="
          p-4
          pb-8
        "
      >

        {/* HEADER */}

        <div
          className="
            flex
            items-center
            justify-between
            mb-4
            gap-3
          "
        >

          <h2
            className="
              text-lg
              font-bold
              text-stone-800
            "
          >
            Thu Tiền
          </h2>


          <div
            className="
              relative
            "
          >

            <select
              value={
                selectedMonth
              }
              onChange={
                e =>
                  setSelectedMonth(
                    e.target.value
                  )
              }
              className="
                appearance-none
                pl-3
                pr-8
                py-1.5
                rounded-full
                border
                border-stone-200
                bg-white
                text-sm
                font-medium
                text-stone-700
              "
            >

              {Array.from(
                {
                  length: 24
                },
                (_, i) => {

                  const date =
                    new Date();

                  date.setMonth(
                    date.getMonth() -
                    12 +
                    i
                  );

                  const year =
                    date.getFullYear();

                  const month =
                    String(
                      date.getMonth() + 1
                    ).padStart(
                      2,
                      "0"
                    );

                  const value =
                    `${year}-${month}`;

                  return (

                    <option
                      key={value}
                      value={value}
                    >
                      {month}/{year}
                    </option>

                  );

                }
              )}

            </select>


            <FiChevronDown
              size={14}
              className="
                absolute
                right-2.5
                top-1/2
                -translate-y-1/2
                text-stone-400
                pointer-events-none
              "
            />

          </div>

        </div>


        {/* LOADING */}

        {loading ? (

          <div
            className="
              flex
              justify-center
              py-20
              text-sm
              text-stone-500
            "
          >
            Đang tải...
          </div>

        ) : (

          <>

            {/* SUMMARY */}

            {allInvoices.length > 0 && (

              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                  mb-4
                "
              >

                <div
                  className="
                    bg-white
                    rounded-2xl
                    border
                    border-stone-200
                    p-3
                  "
                >

                  <p
                    className="
                      text-xs
                      text-amber-600
                      font-medium
                      mb-1
                    "
                  >
                    Chưa thu (
                    {state.noCollected.length}
                    )
                  </p>

                  <p
                    className="
                      text-lg
                      font-bold
                      text-stone-800
                    "
                  >

                    {state.noCollected
                      .reduce(
                        (
                          sum,
                          inv
                        ) =>
                          sum +
                          Number(
                            inv.debit_amount ||
                            0
                          ),
                        0
                      )
                      .toLocaleString(
                        "vi-VN"
                      )}

                    {" "}đ

                  </p>

                </div>


                <div
                  className="
                    bg-white
                    rounded-2xl
                    border
                    border-stone-200
                    p-3
                  "
                >

                  <p
                    className="
                      text-xs
                      text-green-600
                      font-medium
                      mb-1
                    "
                  >
                    Đã thu (
                    {state.collected.length}
                    )
                  </p>

                  <p
                    className="
                      text-lg
                      font-bold
                      text-stone-800
                    "
                  >

                    {state.collected
                      .reduce(
                        (
                          sum,
                          inv
                        ) =>
                          sum +
                          Number(
                            inv.total_amount ||
                            0
                          ),
                        0
                      )
                      .toLocaleString(
                        "vi-VN"
                      )}

                    {" "}đ

                  </p>

                </div>

              </div>

            )}


            {/* EMPTY */}

            {allInvoices.length === 0 ? (

              <div
                className="
                  flex
                  flex-col
                  items-center
                  justify-center
                  py-20
                  px-6
                  text-center
                "
              >

                <div
                  className="
                    text-5xl
                    mb-4
                  "
                >
                  💵
                </div>

                <h2
                  className="
                    text-lg
                    font-bold
                    text-stone-700
                    mb-2
                  "
                >
                  Chưa có hóa đơn nào
                </h2>

                <p
                  className="
                    text-sm
                    text-stone-500
                    max-w-xs
                  "
                >
                  Không có hóa đơn nào
                  trong tháng{" "}

                  {selectedMonth.split("-")[1]}
                  /
                  {selectedMonth.split("-")[0]}.

                </p>

              </div>

            ) : (

              <>

                {/* CHƯA THU */}

                {state.noCollected.length > 0 && (

                  <div className="mb-4">

                    <p
                      className="
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wide
                        text-amber-600
                        mb-2
                        px-1
                      "
                    >
                      Chưa thu
                    </p>


                    <div
                      className="
                        space-y-3
                      "
                    >

                      {state.noCollected.map(
                        invoice => (

                          <InvoiceCard
                            key={
                              invoice.id
                            }
                            invoice={
                              invoice
                            }
                            onSelect={
                              handleSelectInvoice
                            }
                          />

                        )
                      )}

                    </div>

                  </div>

                )}


                {/* ĐÃ THU */}

                {state.collected.length > 0 && (

                  <div>

                    <p
                      className="
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wide
                        text-green-600
                        mb-2
                        px-1
                      "
                    >
                      Đã thu
                    </p>


                    <div
                      className="
                        space-y-3
                      "
                    >

                      {state.collected.map(
                        invoice => (

                          <InvoiceCard
                            key={
                              invoice.id
                            }
                            invoice={
                              invoice
                            }
                            onSelect={
                              handleSelectInvoice
                            }
                          />

                        )
                      )}

                    </div>

                  </div>

                )}

              </>

            )}

          </>

        )}

      </div>

    </div>

  );
}