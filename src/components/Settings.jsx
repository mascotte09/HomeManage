import { useState, useEffect, useRef } from 'react'
import { MdArrowBack, MdPerson, MdLock, MdChevronRight, MdClose, MdDownload, MdUpload } from 'react-icons/md'
import { supabase } from '../supabase.js'
import FooterHouse from './House/FooterHouse.jsx'
import { MdBarChart } from 'react-icons/md'
import { db } from "../db/db.js";
import { syncService } from "./../db/syncService";
export default function Settings({ user, onBack }) {
    const [showChangePassword, setShowChangePassword] = useState(false)
    const [toast, setToast] = useState('')
    const [showStatistics, setShowStatistics] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const importInputRef = useRef(null)

    const sanitizeRecord = (record, overrides = {}) => {
        if (!record) return record
        const { id, created_at, updated_at, deleted_at, ...rest } = record
        return { ...rest, ...overrides }
    }

    const getRecordValue = (record, fieldNames) => {
        if (!record) return undefined
        for (const fieldName of fieldNames) {
            const value = record[fieldName]
            if (value !== undefined && value !== null && value !== '') {
                return value
            }
        }
        return undefined
    }

    const handleExportUserData = async () => {
        if (!user?.id) {
            setToast('Không tìm thấy thông tin người dùng đang đăng nhập.')
            return
        }

        setIsExporting(true)

        try {
            // ═══════════════════════════════════════
            // LẤY DỮ LIỆU TỪ LOCAL - INDEXEDDB
            // KHÔNG ĐỌC SUPABASE
            // ═══════════════════════════════════════

            const homes = await db.homes
                .filter(home =>
                    home.userID === user.id &&
                    home.retired !== true
                )
                .toArray()

            const homeIds = homes
                .map(home => home.id)
                .filter(Boolean)

            // ───────────────────────────────────────
            // ROOMS
            // ───────────────────────────────────────

            let rooms = []

            if (homeIds.length > 0) {
                rooms = await db.rooms
                    .filter(room =>
                        homeIds.includes(room.home_id) &&
                        room.retired !== true
                    )
                    .toArray()
            }

            // ───────────────────────────────────────
            // INVOICES
            // ───────────────────────────────────────

            const roomIds = rooms
                .map(room => room.id)
                .filter(Boolean)

            let invoices = []

            if (roomIds.length > 0) {
                invoices = await db.invoices
                    .filter(invoice =>
                        roomIds.includes(invoice.room_id) &&
                        invoice.retired !== true
                    )
                    .toArray()
            }

            // ───────────────────────────────────────
            // EXPENSES
            // ───────────────────────────────────────

            let expenses = []

            if (homeIds.length > 0) {
                expenses = await db.expenses
                    .filter(expense =>
                        homeIds.includes(expense.home_id) &&
                        expense.retired !== true
                    )
                    .toArray()
            }

            // ═══════════════════════════════════════
            // TẠO FILE BACKUP
            // ═══════════════════════════════════════

            const payload = {
                exportedAt: new Date().toISOString(),

                // Thông tin tài khoản
                userId: user.id,
                username: user.username,

                // Dữ liệu LOCAL
                homes,
                rooms,
                invoices,
                expenses,
            }

            console.log('📦 EXPORT LOCAL:', {
                homes: homes.length,
                rooms: rooms.length,
                invoices: invoices.length,
                expenses: expenses.length,
            })

            const blob = new Blob(
                [
                    JSON.stringify(
                        payload,
                        null,
                        2
                    )
                ],
                {
                    type: 'application/json'
                }
            )

            const url =
                window.URL.createObjectURL(blob)

            const link =
                document.createElement('a')

            link.href = url

            link.download =
                `user-data-${user.username || user.id}.json`

            document.body.appendChild(link)

            link.click()

            document.body.removeChild(link)

            window.URL.revokeObjectURL(url)

            setToast(
                `Đã sao lưu Local: ${homes.length} nhà, ${rooms.length} phòng, ${invoices.length} hóa đơn, ${expenses.length} khoản chi.`
            )

        } catch (error) {

            console.error(
                '❌ EXPORT LOCAL ERROR:',
                error
            )

            setToast(
                error.message ||
                'Không thể sao lưu dữ liệu.'
            )

        } finally {

            setIsExporting(false)

        }
    }

    const handleImportUserData = async (event) => {

        const file = event.target.files?.[0];

        if (!file) return;

        if (!user?.id) {
            setToast(
                "Không tìm thấy thông tin người dùng đang đăng nhập."
            );
            return;
        }

        setIsImporting(true);

        // =====================================================
        // KHÓA AUTO SYNC
        // =====================================================

        syncService.pause();

        try {

            // =====================================================
            // 1. ĐỌC FILE
            // =====================================================

            const text = await file.text();

            const payload = JSON.parse(text);

            if (
                !payload ||
                !Array.isArray(payload.homes)
            ) {

                throw new Error(
                    "File không đúng định dạng dữ liệu."
                );
            }


            console.log(
                "📦 IMPORT LOCAL:",
                {
                    homes: payload.homes?.length || 0,
                    rooms: payload.rooms?.length || 0,
                    invoices: payload.invoices?.length || 0,
                    expenses: payload.expenses?.length || 0,
                }
            );


            // =====================================================
            // 2. KIỂM TRA DATABASE
            // =====================================================

            console.log(
                "📚 Dexie tables:",
                db.tables.map(
                    table => table.name
                )
            );


            if (!db.homes) {
                throw new Error(
                    "Dexie chưa có bảng homes."
                );
            }

            if (!db.rooms) {
                throw new Error(
                    "Dexie chưa có bảng rooms."
                );
            }

            if (!db.invoices) {
                throw new Error(
                    "Dexie chưa có bảng invoices."
                );
            }

            if (!db.expenses) {
                throw new Error(
                    "Dexie chưa có bảng expenses."
                );
            }


            // =====================================================
            // 3. MAP ID
            // =====================================================

            const homeIdMap = new Map();

            const roomIdMap = new Map();


            let importedHomes = 0;
            let importedRooms = 0;
            let importedInvoices = 0;
            let importedExpenses = 0;


            // =====================================================
            // 4. IMPORT LOCAL
            //
            // KHÔNG:
            // - supabase
            // - sync_queue
            // - repository
            // - syncService.syncAll()
            //
            // CHỈ:
            // - db.homes
            // - db.rooms
            // - db.invoices
            // - db.expenses
            // =====================================================

            await db.transaction(
                "rw",
                db.homes,
                db.rooms,
                db.invoices,
                db.expenses,
                async () => {


                    // =================================================
                    // 4.1 HOMES
                    // =================================================

                    for (
                        const home
                        of payload.homes
                    ) {

                        const homeKey =
                            getRecordValue(
                                home,
                                [
                                    "id",
                                    "home_id",
                                    "homeID",
                                ]
                            );


                        if (!homeKey) {

                            console.warn(
                                "⚠️ Home không có ID:",
                                home
                            );

                            continue;
                        }


                        const normalizedHome =
                            sanitizeRecord(
                                home,
                                {
                                    userID: user.id,
                                    retired: false,
                                }
                            );


                        // =============================================
                        // TÌM HOME CŨ
                        // =============================================

                        const existingHomes =
                            await db.homes
                                .filter(
                                    h =>
                                        h.userID === user.id &&
                                        h.name ===
                                        normalizedHome.name &&
                                        h.retired !== true
                                )
                                .toArray();


                        // =============================================
                        // XÓA HOME CŨ + DỮ LIỆU CON
                        // =============================================

                        for (
                            const existingHome
                            of existingHomes
                        ) {

                            const oldHomeId =
                                existingHome.id;


                            console.log(
                                "🔄 THAY THẾ HOME:",
                                {
                                    id: oldHomeId,
                                    name: existingHome.name,
                                }
                            );


                            // =========================================
                            // ROOMS CŨ
                            // =========================================

                            const oldRooms =
                                await db.rooms
                                    .filter(
                                        room =>
                                            room.home_id ===
                                            oldHomeId
                                    )
                                    .toArray();


                            const oldRoomIds =
                                oldRooms.map(
                                    room => room.id
                                );


                            // =========================================
                            // INVOICES CŨ
                            // =========================================

                            if (
                                oldRoomIds.length > 0
                            ) {

                                const oldInvoices =
                                    await db.invoices
                                        .filter(
                                            invoice =>
                                                oldRoomIds.includes(
                                                    invoice.room_id
                                                )
                                        )
                                        .toArray();


                                for (
                                    const invoice
                                    of oldInvoices
                                ) {

                                    await db.invoices.delete(
                                        invoice.id
                                    );
                                }


                                console.log(
                                    `🧾 Xóa ${oldInvoices.length} invoice cũ`
                                );
                            }


                            // =========================================
                            // ROOMS CŨ
                            // =========================================

                            for (
                                const room
                                of oldRooms
                            ) {

                                await db.rooms.delete(
                                    room.id
                                );
                            }


                            console.log(
                                `🚪 Xóa ${oldRooms.length} room cũ`
                            );


                            // =========================================
                            // EXPENSES CŨ
                            // =========================================

                            const oldExpenses =
                                await db.expenses
                                    .filter(
                                        expense =>
                                            expense.home_id ===
                                            oldHomeId
                                    )
                                    .toArray();


                            for (
                                const expense
                                of oldExpenses
                            ) {

                                await db.expenses.delete(
                                    expense.id
                                );
                            }


                            console.log(
                                `💰 Xóa ${oldExpenses.length} expense cũ`
                            );


                            // =========================================
                            // HOME CŨ
                            // =========================================

                            await db.homes.delete(
                                oldHomeId
                            );


                            console.log(
                                "🏠 Xóa home cũ:",
                                oldHomeId
                            );
                        }


                        // =============================================
                        // INSERT HOME MỚI
                        // =============================================

                        await db.homes.put({

                            ...normalizedHome,

                            id: homeKey,

                            userID: user.id,

                            retired: false,
                        });


                        homeIdMap.set(
                            homeKey,
                            homeKey
                        );


                        importedHomes++;


                        console.log(
                            "🏠 IMPORT HOME:",
                            homeKey,
                            normalizedHome.name
                        );
                    }


                    // =================================================
                    // 4.2 ROOMS
                    // =================================================

                    for (
                        const room
                        of payload.rooms || []
                    ) {

                        const roomKey =
                            getRecordValue(
                                room,
                                [
                                    "id",
                                    "room_id",
                                    "roomID",
                                ]
                            );


                        const roomHomeKey =
                            getRecordValue(
                                room,
                                [
                                    "home_id",
                                    "homeID",
                                ]
                            );


                        if (
                            !roomKey ||
                            !roomHomeKey
                        ) {

                            console.warn(
                                "⚠️ Room thiếu ID/home_id:",
                                room
                            );

                            continue;
                        }


                        const homeId =
                            homeIdMap.get(
                                roomHomeKey
                            );


                        if (!homeId) {

                            console.warn(
                                "⚠️ Không tìm thấy Home cho Room:",
                                {
                                    roomId: roomKey,
                                    homeId: roomHomeKey,
                                }
                            );

                            continue;
                        }


                        const normalizedRoom =
                            sanitizeRecord(
                                room,
                                {
                                    home_id: homeId,
                                    retired: false,
                                }
                            );


                        await db.rooms.put({

                            ...normalizedRoom,

                            id: roomKey,

                            home_id: homeId,

                            retired: false,
                        });


                        roomIdMap.set(
                            roomKey,
                            roomKey
                        );


                        importedRooms++;


                        console.log(
                            "🚪 IMPORT ROOM:",
                            roomKey,
                            "home:",
                            homeId
                        );
                    }


                    // =================================================
                    // 4.3 INVOICES
                    // =================================================

                    for (
                        const invoice
                        of payload.invoices || []
                    ) {

                        const invoiceKey =
                            getRecordValue(
                                invoice,
                                [
                                    "id",
                                    "invoice_id",
                                    "invoiceID",
                                ]
                            );


                        const invoiceRoomKey =
                            getRecordValue(
                                invoice,
                                [
                                    "room_id",
                                    "roomID",
                                ]
                            );


                        if (
                            !invoiceKey ||
                            !invoiceRoomKey
                        ) {

                            console.warn(
                                "⚠️ Invoice thiếu ID/room_id:",
                                invoice
                            );

                            continue;
                        }


                        const roomId =
                            roomIdMap.get(
                                invoiceRoomKey
                            );


                        if (!roomId) {

                            console.warn(
                                "⚠️ Không tìm thấy Room cho Invoice:",
                                {
                                    invoiceId:
                                        invoiceKey,

                                    roomId:
                                        invoiceRoomKey,
                                }
                            );

                            continue;
                        }


                        const normalizedInvoice =
                            sanitizeRecord(
                                invoice,
                                {
                                    room_id: roomId,
                                    retired: false,
                                }
                            );


                        await db.invoices.put({

                            ...normalizedInvoice,

                            id: invoiceKey,

                            room_id: roomId,

                            retired: false,
                        });


                        importedInvoices++;


                        console.log(
                            "🧾 IMPORT INVOICE:",
                            invoiceKey,
                            "room:",
                            roomId
                        );
                    }


                    // =================================================
                    // 4.4 EXPENSES
                    // =================================================

                    for (
                        const expense
                        of payload.expenses || []
                    ) {

                        const expenseKey =
                            getRecordValue(
                                expense,
                                [
                                    "id",
                                    "expense_id",
                                    "expenseID",
                                ]
                            );


                        const expenseHomeKey =
                            getRecordValue(
                                expense,
                                [
                                    "home_id",
                                    "homeID",
                                ]
                            );


                        if (
                            !expenseKey ||
                            !expenseHomeKey
                        ) {

                            console.warn(
                                "⚠️ Expense thiếu ID/home_id:",
                                expense
                            );

                            continue;
                        }


                        const homeId =
                            homeIdMap.get(
                                expenseHomeKey
                            );


                        if (!homeId) {

                            console.warn(
                                "⚠️ Không tìm thấy Home cho Expense:",
                                {
                                    expenseId:
                                        expenseKey,

                                    homeId:
                                        expenseHomeKey,
                                }
                            );

                            continue;
                        }


                        const normalizedExpense =
                            sanitizeRecord(
                                expense,
                                {
                                    home_id: homeId,
                                    retired: false,
                                }
                            );


                        await db.expenses.put({

                            ...normalizedExpense,

                            id: expenseKey,

                            home_id: homeId,

                            retired: false,
                        });


                        importedExpenses++;


                        console.log(
                            "💰 IMPORT EXPENSE:",
                            expenseKey,
                            "home:",
                            homeId
                        );
                    }

                }
            );


            // =====================================================
            // 5. KIỂM TRA LOCAL SAU IMPORT
            // =====================================================

            const localHomes =
                await db.homes.count();

            const localRooms =
                await db.rooms.count();

            const localInvoices =
                await db.invoices.count();

            const localExpenses =
                await db.expenses.count();


            console.log(
                "════════════════════════════════"
            );

            console.log(
                "✅ IMPORT LOCAL HOÀN TẤT"
            );

            console.log({
                imported: {
                    homes: importedHomes,
                    rooms: importedRooms,
                    invoices: importedInvoices,
                    expenses: importedExpenses,
                },

                local: {
                    homes: localHomes,
                    rooms: localRooms,
                    invoices: localInvoices,
                    expenses: localExpenses,
                }
            });

            console.log(
                "🚫 KHÔNG PUSH SUPABASE"
            );

            console.log(
                "🚫 KHÔNG PULL SUPABASE"
            );

            console.log(
                "🚫 KHÔNG TẠO SYNC QUEUE"
            );

            console.log(
                "════════════════════════════════"
            );


            setToast(
                `Đã khôi phục Local: ${importedHomes} nhà, ${importedRooms} phòng, ${importedInvoices} hóa đơn, ${importedExpenses} khoản chi.`
            );


        } catch (error) {

            console.error(
                "❌ IMPORT LOCAL ERROR:",
                error
            );


            setToast(
                error.message ||
                "Không thể khôi phục dữ liệu."
            );


        } finally {

            // =====================================================
            // MỞ KHÓA AUTO SYNC
            // =====================================================

            syncService.resume();

            setIsImporting(false);

            event.target.value = "";
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <header className="bg-white border-b border-stone-200 px-4 h-20 flex items-center gap-3 flex-shrink-0">
                <button
                    onClick={onBack}
                    className="w-9 h-9 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center hover:bg-stone-200 transition active:scale-95"
                    title="Quay lại"
                >
                    <MdArrowBack size={20} />
                </button>
                <h1 className="text-left text-2xl font-bold uppercase text-stone-500">
                    Cài Đặt
                </h1>
            </header>

            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    paddingTop: '40px',
                }}
            >
                <div style={{ width: '100%', maxWidth: '500px', padding: '0 20px' }}>
                    {/* THÔNG TIN USER */}
                    <div
                        style={{
                            padding: '20px',
                            border: '1px solid #e7e5e4',
                            borderRadius: '12px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                        }}
                    >
                        <div
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                backgroundColor: '#f5f5f4',
                                color: '#78716c',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <MdPerson size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '12px', color: '#a8a29e', margin: 0 }}>
                                Tài khoản
                            </p>
                            <p style={{ fontSize: '16px', fontWeight: 600, color: '#44403c', margin: 0 }}>
                                {user?.username}
                            </p>
                        </div>
                    </div>

                    {/* MENU CHỨC NĂNG */}
                    <div
                        style={{
                            border: '1px solid #e7e5e4',
                            borderRadius: '12px',
                            overflow: 'hidden',
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setShowChangePassword(true)}
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                background: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                            }}
                            className="hover:bg-stone-50 transition"
                        >
                            <div
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    backgroundColor: '#f5f5f4',
                                    color: '#78716c',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <MdLock size={18} />
                            </div>
                            <span style={{ flex: 1, fontSize: '15px', fontWeight: 500, color: '#44403c' }}>
                                Đổi Mật Khẩu
                            </span>
                            <MdChevronRight size={20} color="#a8a29e" />
                        </button>
                        <button
                            type="button"
                            onClick={handleExportUserData}
                            disabled={isExporting}
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                background: 'white',
                                border: 'none',
                                borderTop: '1px solid #e7e5e4',
                                cursor: 'pointer',
                                textAlign: 'left',
                                opacity: isExporting ? 0.7 : 1,
                            }}
                            className="hover:bg-stone-50 transition"
                        >
                            <div
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    backgroundColor: '#f5f5f4',
                                    color: '#78716c',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <MdDownload size={18} />
                            </div>
                            <span style={{ flex: 1, fontSize: '15px', fontWeight: 500, color: '#44403c' }}>
                                {isExporting ? 'Đang sao lưu...' : 'Sao lưu dữ liệu'}
                            </span>
                            <MdChevronRight size={20} color="#a8a29e" />
                        </button>

                        <button
                            type="button"
                            onClick={() => importInputRef.current?.click()}
                            disabled={isImporting}
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                background: 'white',
                                border: 'none',
                                borderTop: '1px solid #e7e5e4',
                                cursor: 'pointer',
                                textAlign: 'left',
                                opacity: isImporting ? 0.7 : 1,
                            }}
                            className="hover:bg-stone-50 transition"
                        >
                            <div
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    backgroundColor: '#f5f5f4',
                                    color: '#78716c',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <MdUpload size={18} />
                            </div>
                            <span style={{ flex: 1, fontSize: '15px', fontWeight: 500, color: '#44403c' }}>
                                {isImporting ? 'Đang khôi phục...' : 'Khôi phục dữ liệu'}
                            </span>
                            <MdChevronRight size={20} color="#a8a29e" />
                        </button>

                        <input
                            ref={importInputRef}
                            type="file"
                            accept="application/json"
                            onChange={handleImportUserData}
                            style={{ display: 'none' }}
                        />

                        {user?.is_admin && (
                            <button
                                type="button"
                                onClick={() => setShowStatistics(true)}
                                style={{
                                    width: '100%',
                                    padding: '16px 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    background: 'white',
                                    border: 'none',
                                    borderTop: '1px solid #e7e5e4',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                                className="hover:bg-stone-50 transition"
                            >
                                <div
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        backgroundColor: '#f5f5f4',
                                        color: '#78716c',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <MdBarChart size={18} />
                                </div>

                                <span
                                    style={{
                                        flex: 1,
                                        fontSize: '15px',
                                        fontWeight: 500,
                                        color: '#44403c',
                                    }}
                                >
                                    Thống kê
                                </span>

                                <MdChevronRight size={20} color="#a8a29e" />
                            </button>
                        )}
                    </div>

                    {toast && (
                        <div
                            style={{
                                marginTop: '16px',
                                padding: '12px',
                                borderRadius: '10px',
                                textAlign: 'center',
                                backgroundColor: '#dcfce7',
                                color: '#166534',
                            }}
                        >
                            {toast}
                        </div>
                    )}
                </div>
            </div>

            <FooterHouse />

            {showChangePassword && (
                <ChangePasswordDialog
                    user={user}
                    onClose={() => setShowChangePassword(false)}
                    onSuccess={() => {
                        setShowChangePassword(false)
                        setToast('Đổi mật khẩu thành công!')
                        setTimeout(() => setToast(''), 4000)
                    }}
                />
            )}

            {
                showStatistics && (
                    <StatisticsDialog
                        onClose={() => setShowStatistics(false)}
                    />
                )
            }
        </div>
    )
}

function ChangePasswordDialog({ user, onClose, onSuccess }) {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')
    const [message, setMessage] = useState('')
    const [saving, setSaving] = useState(false)

    const passwordsAreNotEqual =
        newPassword !== confirmNewPassword && confirmNewPassword.length > 0

    const handleChangePassword = async (e) => {
        e.preventDefault()
        setMessage('')

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setMessage('Vui lòng điền đầy đủ thông tin')
            return
        }

        if (newPassword !== confirmNewPassword) {
            setMessage('Mật khẩu mới không trùng khớp')
            return
        }

        if (newPassword.length < 6) {
            setMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
            return
        }

        setSaving(true)

        // Verify current password
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('id, password')
            .eq('id', user.id)
            .single()

        if (fetchError) {
            setMessage(fetchError.message)
            setSaving(false)
            return
        }

        if (existingUser.password !== currentPassword) {
            setMessage('Mật khẩu hiện tại không đúng')
            setSaving(false)
            return
        }

        // Update password
        const { data: updatedRows, error: updateError } = await supabase
            .from('users')
            .update({ password: newPassword })
            .eq('id', user.id)
            .select()

        if (updateError) {
            setMessage(updateError.message)
            setSaving(false)
            return
        }

        // Supabase trả error = null cả khi RLS chặn update (0 dòng bị đổi).
        // Phải kiểm tra updatedRows để biết update có thực sự xảy ra không.
        if (!updatedRows || updatedRows.length === 0) {
            setMessage(
                'Không thể lưu mật khẩu mới. Có thể do quyền truy cập (RLS) trên bảng users đang chặn cập nhật.'
            )
            setSaving(false)
            return
        }

        setCurrentPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
        setSaving(false)
        onSuccess()
    }

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                zIndex: 50,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '440px',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                    }}
                >
                    <h2
                        style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            color: '#44403c',
                            margin: 0,
                        }}
                    >
                        Đổi Mật Khẩu
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center hover:bg-stone-200 transition active:scale-95"
                        title="Đóng"
                    >
                        <MdClose size={18} />
                    </button>
                </div>

                <form onSubmit={handleChangePassword}>
                    <div className="control">
                        <label htmlFor="current-password">Mật Khẩu Hiện Tại</label>
                        <input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="control">
                        <label htmlFor="new-password">Mật Khẩu Mới</label>
                        <input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="control">
                        <label htmlFor="confirm-new-password">
                            Xác Nhận Mật Khẩu Mới
                        </label>
                        <input
                            id="confirm-new-password"
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            required
                        />
                        <div className="control-error">
                            {passwordsAreNotEqual && <p>Mật khẩu phải trùng khớp.</p>}
                        </div>
                    </div>

                    <div
                        className="form-actions"
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            marginTop: '20px',
                        }}
                    >
                        <button
                            type="button"
                            className="button button-flat"
                            onClick={onClose}
                        >
                            Hủy
                        </button>
                        <button type="submit" className="button" disabled={saving}>
                            {saving ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
                        </button>
                    </div>
                </form>

                {message && (
                    <div
                        style={{
                            marginTop: '16px',
                            padding: '12px',
                            borderRadius: '10px',
                            textAlign: 'center',
                            whiteSpace: 'pre-line',
                            backgroundColor: message.toLowerCase().includes('thành công')
                                ? '#dcfce7'
                                : '#fee2e2',
                            color: message.toLowerCase().includes('thành công')
                                ? '#166534'
                                : '#b91c1c',
                        }}
                    >
                        {message}
                    </div>
                )}
            </div>
        </div>
    )
}
function StatisticsDialog({ onClose }) {

    const [loading, setLoading] = useState(true)
    const [rows, setRows] = useState([])
    // const [invoiceByMonth, setInvoiceByMonth] = useState([]);
    const cellStyle = {
        textAlign: "center",
        padding: "10px",
        border: "1px solid #e7e5e4"
    };

    const headerStyle = {
        ...cellStyle,
        background: "#f5f5f4",
        fontWeight: 600
    };
    useEffect(() => {
        load()
    }, [])

    async function load() {

        const result = []

        for (let i = 2; i >= 0; i--) {
            const day = new Date()
            day.setDate(day.getDate() - i)

            const start = new Date(day)
            start.setHours(0, 0, 0, 0)

            const end = new Date(day)
            end.setHours(23, 59, 59, 999)
            const { data } = await supabase.rpc("get_dashboard_stats", {
                start_date: start.toISOString(),
                end_date: end.toISOString(),
            });

            const { users_count, homes_count, rooms_count, invoices_count } = data[0];
            result.push({
                date: start.toLocaleDateString("vi-VN"),
                users: users_count || 0,
                homes: homes_count || 0,
                rooms: rooms_count || 0,
                invoices: invoices_count || 0
            })
        }

        setRows(result)
        setLoading(false)
    }

    return (

        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.45)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 100
            }}
        >

            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: "95%",
                    maxWidth: 700,
                    background: "#fff",
                    borderRadius: 16,
                    padding: 20
                }}
            >

                <h2 style={{ marginBottom: 20 }}>
                    Thống kê 5 ngày gần nhất
                </h2>

                {loading ? (

                    <p>Đang tải...</p>

                ) : (

                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse"
                        }}
                    >

                        <thead>

                            <tr>
                                <th style={headerStyle}>Ngày</th>
                                <th style={headerStyle}>Usr</th>
                                <th style={headerStyle}>Ho</th>
                                <th style={headerStyle}>Ro</th>
                                <th style={headerStyle}>Inv</th>
                            </tr>

                        </thead>

                        <tbody>

                            {rows.map(r => (

                                <tr key={r.date}>

                                    <td style={cellStyle}>{r.date}</td>
                                    <td style={cellStyle}>{r.users}</td>
                                    <td style={cellStyle}>{r.homes}</td>
                                    <td style={cellStyle}>{r.rooms}</td>
                                    <td style={cellStyle}>{r.invoices}</td>
                                </tr>

                            ))}

                        </tbody>

                    </table>

                )}
                {/* <h2 style={{ marginTop: 30, marginBottom: 15 }}>
                    Số hóa đơn theo tháng
                </h2>

                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse"
                    }}
                >
                    <thead>
                        <tr>
                            <th style={headerStyle}>Tháng</th>
                            <th style={headerStyle}>Số hóa đơn</th>
                        </tr>
                    </thead>

                    <tbody>
                        {invoiceByMonth.map(item => (
                            <tr key={item.month}>
                                <td style={cellStyle}>{item.month}</td>
                                <td style={cellStyle}>{item.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table> */}
            </div>
        </div>

    )

}
