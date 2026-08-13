import { useState, useEffect, useRef } from "react";
import { homeRepository } from "../../db/homeRepository";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiSave,
  FiGrid,
  FiTrash2,
} from "react-icons/fi";

import Input from "../InputVal.jsx";
import DeleteModal from "../DeleteModal.jsx";

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-3">

      <div className="px-4 pt-3 pb-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          {title}
        </p>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {children}
      </div>

    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SelectedHouse({
  userID,
  house,
  onBack,
  refreshHouses,
}) {
  const navigate = useNavigate();

  const isNew = !house;

  // ── State ──────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [name, setName] = useState("");

  const [address, setAddress] = useState("");

  const [bankID, setBankID] = useState("");

  const [bankAccount, setBankAccount] = useState("");

  const [electricityPrice, setElectricityPrice] =
    useState(3500);

  const [waterPrice, setWaterPrice] =
    useState(100000);

  const [isWaterPerPerson, setIsWaterPerPerson] =
    useState(false);

  // ── Banks ──────────────────────────────────────────────────────────────────
  const banks = [
    { code: "ABBANK", name: "ABBank" },
    { code: "ACB", name: "ACB" },
    { code: "AGRIBANK", name: "Agribank" },
    { code: "BACABANK", name: "Bac A Bank" },
    { code: "BAOVIETBANK", name: "BaoViet Bank" },
    { code: "BIDV", name: "BIDV" },
    { code: "BVBANK", name: "BVBank" },
    { code: "CAKE", name: "Cake by VPBank" },
    { code: "CIMB", name: "CIMB Bank" },
    { code: "COOPBANK", name: "Co-opBank" },
    { code: "DBS", name: "DBS Bank" },
    { code: "EXIMBANK", name: "Eximbank" },
    { code: "GPBANK", name: "GPBank" },
    { code: "HDBANK", name: "HDBank" },
    { code: "HONGLEONG", name: "Hong Leong Bank" },
    { code: "HSBC", name: "HSBC Việt Nam" },
    { code: "INDOVINA", name: "Indovina Bank (IVB)" },
    { code: "KBANK", name: "KBank" },
    { code: "KIENLONGBANK", name: "KienlongBank" },
    { code: "LPBANK", name: "LPBank" },
    { code: "MBBANK", name: "MB Bank" },
    { code: "MSB", name: "MSB" },
    { code: "NAMABANK", name: "Nam A Bank" },
    { code: "NCB", name: "NCB" },
    { code: "OCEANBANK", name: "OceanBank" },
    { code: "OCB", name: "OCB" },
    { code: "PGBANK", name: "PGBank" },
    { code: "PUBLICBANK", name: "Public Bank Việt Nam" },
    { code: "PVCOMBANK", name: "PVcomBank" },
    { code: "SACOMBANK", name: "Sacombank" },
    { code: "SAIGONBANK", name: "Saigonbank" },
    { code: "SEABANK", name: "SeABank" },
    { code: "SHB", name: "SHB" },
    { code: "SHINHAN", name: "Shinhan Bank" },
    { code: "STANDARDCHARTERED", name: "Standard Chartered" },
    { code: "TCB", name: "Techcombank" },
    { code: "TIMO", name: "Timo by BVBank" },
    { code: "TPBANK", name: "TPBank" },
    { code: "UBANK", name: "Ubank by VPBank" },
    { code: "UOB", name: "UOB Việt Nam" },
    { code: "VIB", name: "VIB" },
    { code: "VIETBANK", name: "VietBank" },
    { code: "VCB", name: "Vietcombank" },
    { code: "CTG", name: "VietinBank" },
    { code: "VPBANK", name: "VPBank" },
    { code: "VRB", name: "VRB" },
    { code: "WOORI", name: "Woori Bank" },
  ];

  // ── Initial values ─────────────────────────────────────────────────────────
  const initialRef = useRef(null);

  useEffect(() => {
    const initial = {
      name: house?.name ?? "",
      address: house?.address ?? "",

      bankID: house?.bank_id ?? "",
      bankAccount: house?.bank_account ?? "",

      electricityPrice:
        house?.electricity_price ?? 3500,

      waterPrice:
        house?.water_price ?? 100000,

      isWaterPerPerson:
        house?.is_water_per_person ?? false,
    };

    setName(initial.name);
    setAddress(initial.address);

    setBankID(initial.bankID);
    setBankAccount(initial.bankAccount);

    setElectricityPrice(
      initial.electricityPrice
    );

    setWaterPrice(
      initial.waterPrice
    );

    setIsWaterPerPerson(
      initial.isWaterPerPerson
    );

    initialRef.current = initial;

  }, [house]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function parseCurrency(value) {
    if (value === null || value === undefined) {
      return 0;
    }

    return Number(
      String(value)
        .replace(/\./g, "")
        .replace(/\D/g, "")
    ) || 0;
  }

  // ── Dirty check ────────────────────────────────────────────────────────────
  function isDirty() {
    const initial = initialRef.current;

    if (!initial) {
      return false;
    }

    return (
      name !== initial.name ||
      address !== initial.address ||
      bankID !== initial.bankID ||
      bankAccount !== initial.bankAccount ||
      electricityPrice !==
        initial.electricityPrice ||
      waterPrice !==
        initial.waterPrice ||
      isWaterPerPerson !==
        initial.isWaterPerPerson
    );
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (saving) {
      return;
    }

    if (!name.trim()) {
      alert("Vui lòng nhập tên nhà trọ");
      return;
    }

    if (!userID && isNew) {
      alert("Không xác định được người dùng");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        // Create → UUID mới
        // Update → giữ nguyên ID
        id: isNew
          ? crypto.randomUUID()
          : house.id,

        // Create dùng userID truyền vào.
        // Update ưu tiên userID hiện tại của house.
        userID:
          house?.userID ??
          userID,

        name: name.trim(),

        address: address.trim(),

        name_owner:
          house?.name_owner ?? "",

        available_rooms:
          house?.available_rooms ?? 0,

        electricity_price:
          electricityPrice,

        water_price:
          waterPrice,

        is_water_per_person:
          isWaterPerPerson,

        service_amount:
          house?.service_amount ?? 100000,

        bank_id:
          bankID.trim(),

        bank_account:
          bankAccount.trim(),

        phone_owner:
          house?.phone_owner ?? "",

        width:
          house?.width ?? null,

        length:
          house?.length ?? null,

        floors:
          house?.floors ?? 1,

        bedrooms:
          house?.bedrooms ?? 0,

        bathrooms:
          house?.bathrooms ?? 0,

        frontage_width:
          house?.frontage_width ?? null,

        alley_width:
          house?.alley_width ?? null,

        road_type:
          house?.road_type ?? "frontage",

        property_type:
          house?.property_type ?? "room",

        orientation:
          house?.orientation ?? "",

        monthly_rent:
          house?.monthly_rent ?? 0,

        status:
          house?.status ?? false,

        description:
          house?.description ?? "",

        // Không làm record đang retired sống lại
        retired:
          house?.retired ?? false,

        // Create → ngày hiện tại
        // Update → giữ nguyên ngày tạo
        created_at:
          house?.created_at ??
          new Date().toISOString(),
      };

      // ── CREATE ────────────────────────────────────────────────────────────
      if (isNew) {

        await homeRepository.create(
          payload
        );

      }
      // ── UPDATE ────────────────────────────────────────────────────────────
      else {

        await homeRepository.update(
          house.id,
          payload
        );

      }

      // Refresh danh sách Home từ IndexedDB
      if (refreshHouses) {
        await refreshHouses();
      }

      // Quay lại danh sách
      onBack();

    } catch (error) {

      console.error(
        "Lỗi lưu nhà trọ:",
        error
      );

      alert(
        isNew
          ? "Không thể tạo nhà trọ"
          : "Không thể cập nhật nhà trọ"
      );

    } finally {

      setSaving(false);

    }
  }

  // ── Retire house ───────────────────────────────────────────────────────────
  async function handleConfirmDelete() {
    if (!house?.id) {
      return;
    }

    if (saving) {
      return;
    }

    setSaving(true);

    try {

      await homeRepository.retire(
        house.id
      );

      if (refreshHouses) {
        await refreshHouses();
      }

      setShowDeleteModal(false);

      onBack();

    } catch (error) {

      console.error(
        "Lỗi xóa nhà trọ:",
        error
      );

      alert(
        "Không thể xóa nhà trọ"
      );

    } finally {

      setSaving(false);

    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-stone-50 pb-6">

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-stone-200 px-3 py-2 flex items-center justify-between gap-2 sticky top-0 z-10">

          {/* Back */}
          <button
            onClick={onBack}
            disabled={saving}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 transition text-stone-600 flex-shrink-0 disabled:opacity-50"
            aria-label="Quay lại"
          >
            <FiArrowLeft size={20} />
          </button>

          {/* Title */}
          <p className="flex-1 font-semibold text-stone-800 text-sm truncate">
            {isNew
              ? "Tạo nhà trọ mới"
              : name || "Chi tiết nhà trọ"}
          </p>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">

            {/* Manage rooms */}
            {!isNew && (
              <button
                onClick={() =>
                  navigate(
                    `/rooms/${house.id}`
                  )
                }
                disabled={saving}
                className="h-9 px-3 flex items-center gap-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition text-sm font-medium disabled:opacity-50"
              >
                <FiGrid size={15} />
                <span>Phòng</span>
              </button>
            )}

            {/* Delete */}
            {!isNew && (
              <button
                onClick={() =>
                  setShowDeleteModal(true)
                }
                disabled={saving}
                className="h-9 px-3 flex items-center gap-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition text-sm font-medium disabled:opacity-50"
              >
                <FiTrash2 size={15} />
                <span>Xóa</span>
              </button>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={
                saving ||
                (!isNew && !isDirty())
              }
              className={`
                h-9 px-4 flex items-center gap-1.5
                rounded-full text-white text-sm font-medium
                transition
                ${
                  saving ||
                  (!isNew && !isDirty())
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 active:scale-95"
                }
              `}
            >
              <FiSave size={15} />

              <span>
                {saving
                  ? "Đang lưu..."
                  : "Lưu"}
              </span>

            </button>

          </div>
        </div>

        {/* ── Form body ───────────────────────────────────────────────────── */}
        <div className="p-4">

          {/* Basic information */}
          <Section title="Thông tin cơ bản">

            <Input
              label="Tên nhà trọ"
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

            <Input
              label="Địa chỉ"
              type="text"
              value={address}
              onChange={(e) =>
                setAddress(e.target.value)
              }
            />

          </Section>

          {/* Service prices */}
          <Section title="Giá dịch vụ">

            <Input
              label="Giá điện (đ/kWh)"
              type="text"
              value={electricityPrice.toLocaleString(
                "vi-VN"
              )}
              onChange={(e) =>
                setElectricityPrice(
                  parseCurrency(
                    e.target.value
                  )
                )
              }
            />

            {/* Water type */}
            <div>

              <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 block mb-2">
                Cách tính nước
              </label>

              <div className="flex gap-5">

                <label className="flex items-center gap-2 cursor-pointer">

                  <input
                    type="radio"
                    checked={!isWaterPerPerson}
                    onChange={() =>
                      setIsWaterPerPerson(false)
                    }
                    className="accent-blue-600"
                  />

                  <span className="text-sm text-stone-700">
                    Theo khối
                  </span>

                </label>

                <label className="flex items-center gap-2 cursor-pointer">

                  <input
                    type="radio"
                    checked={isWaterPerPerson}
                    onChange={() =>
                      setIsWaterPerPerson(true)
                    }
                    className="accent-blue-600"
                  />

                  <span className="text-sm text-stone-700">
                    Theo người
                  </span>

                </label>

              </div>

            </div>

            <Input
              label={
                isWaterPerPerson
                  ? "Giá nước (đ/người)"
                  : "Giá nước (đ/khối)"
              }
              type="text"
              value={waterPrice.toLocaleString(
                "vi-VN"
              )}
              onChange={(e) =>
                setWaterPrice(
                  parseCurrency(
                    e.target.value
                  )
                )
              }
            />

          </Section>

          {/* Bank */}
          <Section title="Ngân hàng (in kèm mã thanh toán trên hóa đơn)">

            <div>

              <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 block mb-2">
                Ngân hàng
              </label>

              <select
                value={bankID}
                onChange={(e) =>
                  setBankID(e.target.value)
                }
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >

                <option value="">
                  -- Chọn ngân hàng --
                </option>

                {banks.map((bank) => (
                  <option
                    key={bank.code}
                    value={bank.code}
                  >
                    {bank.name}
                  </option>
                ))}

              </select>

            </div>

            <Input
              label="Số tài khoản"
              type="text"
              value={bankAccount}
              onChange={(e) =>
                setBankAccount(
                  e.target.value
                )
              }
            />

          </Section>

        </div>
      </div>

      {/* ── Delete modal ──────────────────────────────────────────────────── */}
      <DeleteModal
        open={showDeleteModal}
        title="Xóa nhà trọ"
        message={`Bạn có chắc muốn xóa "${name}"? Thao tác này không thể hoàn tác.`}
        onClose={() =>
          setShowDeleteModal(false)
        }
        onConfirm={
          handleConfirmDelete
        }
      />

    </>
  );
}