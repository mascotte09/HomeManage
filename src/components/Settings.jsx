import { useState, useRef } from 'react'
import { MdArrowBack, MdPerson, MdLock, MdChevronRight, MdClose, MdDownload, MdUpload } from 'react-icons/md'
import { supabase } from '../supabase.js'
import FooterHouse from './House/FooterHouse.jsx'
import { MdBarChart } from 'react-icons/md'
import { db } from "../db/db.js";
import { syncService } from "./../db/syncService";
import StatisticsDialog from './Setting/Statistics.jsx'
export default function Settings({ user, onBack }) {
    const [showChangePassword, setShowChangePassword] = useState(false)
    const [toast, setToast] = useState('')
    const [showStatistics, setShowStatistics] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const importInputRef = useRef(null)

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

    if (!file) {
        setToast("Vui lòng chọn file JSON.");
        return;
    }

    if (!user?.id) {
        setToast("Không tìm thấy người dùng đang đăng nhập.");
        return;
    }

    setIsImporting(true);

    syncService.pause();

    try {

        console.log("📥 BẮT ĐẦU IMPORT");

        // =========================================
        // ĐỌC FILE JSON
        // =========================================

        const text = await file.text();

        const payload = JSON.parse(text);

        // =========================================
        // LẤY DATA
        // =========================================

        const homes = Array.isArray(payload.homes)
            ? payload.homes
            : [];

        const rooms = Array.isArray(payload.rooms)
            ? payload.rooms
            : [];

        const invoices = Array.isArray(payload.invoices)
            ? payload.invoices
            : [];

        const expenses = Array.isArray(payload.expenses)
            ? payload.expenses
            : [];

        console.log("🏠 Homes:", homes.length);
        console.log("🚪 Rooms:", rooms.length);
        console.log("🧾 Invoices:", invoices.length);
        console.log("💰 Expenses:", expenses.length);

        // =========================================
        // IMPORT LOCAL
        // =========================================

        await db.transaction(
            "rw",
            db.homes,
            db.rooms,
            db.invoices,
            db.expenses,
            db.sync_queue,

            async () => {

                // =====================================
                // HOMES
                // =====================================

                for (const home of homes) {

                    if (!home.id) continue;

                    await db.homes.put({
                        ...home,
                        retired: false,
                    });

                    await db.sync_queue.add({
                        table: "homes",
                        record_id: home.id,
                        action: "INSERT",
                        created_at: Date.now(),
                    });
                }

                // =====================================
                // ROOMS
                // =====================================

                for (const room of rooms) {

                    if (!room.id) continue;

                    await db.rooms.put({
                        ...room,
                        retired: false,
                    });

                    await db.sync_queue.add({
                        table: "rooms",
                        record_id: room.id,
                        action: "INSERT",
                        created_at: Date.now(),
                    });
                }

                // =====================================
                // INVOICES
                // =====================================

                for (const invoice of invoices) {

                    if (!invoice.id) continue;

                    await db.invoices.put({
                        ...invoice,
                        retired: false,
                    });

                    await db.sync_queue.add({
                        table: "invoices",
                        record_id: invoice.id,
                        action: "INSERT",
                        created_at: Date.now(),
                    });
                }

                // =====================================
                // EXPENSES
                // =====================================

                for (const expense of expenses) {

                    if (!expense.id) continue;

                    await db.expenses.put({
                        ...expense,
                        retired: false,
                    });

                    await db.sync_queue.add({
                        table: "expenses",
                        record_id: expense.id,
                        action: "INSERT",
                        created_at: Date.now(),
                    });
                }
            }
        );

        // =========================================
        // IMPORT LOCAL HOÀN TẤT
        // =========================================

        console.log("✅ IMPORT LOCAL HOÀN TẤT");

        // =========================================
        // PUSH LOCAL → SUPABASE
        // =========================================

        syncService.resume();

        if (navigator.onLine) {

            console.log(
                "📤 PUSH dữ liệu import lên Supabase..."
            );

            await syncService.syncAll();

            console.log(
                "✅ PUSH HOÀN TẤT"
            );

        } else {

            console.log(
                "📴 Offline - chỉ lưu Local"
            );
        }

        setToast(
            `Import thành công: ${homes.length} nhà, ${rooms.length} phòng, ${invoices.length} hóa đơn, ${expenses.length} chi phí.`
        );

        // reset input để lần sau có thể chọn lại cùng file
        event.target.value = "";

    } catch (error) {

        console.error(
            "❌ IMPORT ERROR:",
            error
        );

        setToast(
            error?.message ||
            "Không thể import dữ liệu."
        );

    } finally {

        syncService.resume();

        setIsImporting(false);
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
    e.preventDefault();
    setMessage("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        setMessage("Vui lòng điền đầy đủ thông tin");
        return;
    }

    if (newPassword !== confirmNewPassword) {
        setMessage("Mật khẩu mới không trùng khớp");
        return;
    }

    if (newPassword.length < 6) {
        setMessage("Mật khẩu mới phải có ít nhất 6 ký tự");
        return;
    }

    if (!user?.id) {
        setMessage("Không xác định được tài khoản");
        return;
    }

    setSaving(true);

    try {
        // =====================================================
        // GỌI RPC ĐỔI PASSWORD
        //
        // Không UPDATE trực tiếp bảng users từ React.
        // PostgreSQL sẽ tự kiểm tra:
        // 1. user_id có tồn tại không
        // 2. password hiện tại có đúng không
        // 3. chỉ được đổi password của chính user_id được truyền vào
        // =====================================================

        const { data, error } = await supabase.rpc(
            "change_user_password",
            {
                p_user_id: user.id,
                p_current_password: currentPassword,
                p_new_password: newPassword,
            }
        );

        if (error) {
            console.error(
                "Change password RPC error:",
                error
            );

            setMessage(
                error.message ||
                "Không thể đổi mật khẩu"
            );

            return;
        }

        // RPC nên trả true khi đổi thành công
        if (data !== true) {
            setMessage(
                "Không thể đổi mật khẩu. Mật khẩu hiện tại có thể không đúng."
            );

            return;
        }

        // =====================================================
        // THÀNH CÔNG
        // =====================================================

        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");

        setMessage("Đổi mật khẩu thành công");

        onSuccess?.();

    } catch (error) {

        console.error(
            "Change password error:",
            error
        );

        setMessage(
            error?.message ||
            "Có lỗi xảy ra khi đổi mật khẩu"
        );

    } finally {

        setSaving(false);
    }
};

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
