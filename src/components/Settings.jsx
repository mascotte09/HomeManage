import { useState, useEffect, useRef } from 'react'
import { MdArrowBack, MdPerson, MdLock, MdChevronRight, MdClose, MdDownload, MdUpload } from 'react-icons/md'
import { supabase } from '../supabase.js'
import FooterHouse from './House/FooterHouse.jsx'
import { MdBarChart } from 'react-icons/md'

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

    const findExistingRecord = async (table, fieldName, fieldValue, additionalFilters = {}) => {
        if (!table || !fieldName || fieldValue === undefined || fieldValue === null || fieldValue === '') {
            return null
        }

        let query = supabase
            .from(table)
            .select('id')
            .eq(fieldName, fieldValue)
            .limit(1)

        for (const [filterField, filterValue] of Object.entries(additionalFilters)) {
            if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
                query = query.eq(filterField, filterValue)
            }
        }

        const { data, error } = await query

        if (error) {
            throw error
        }

        return data?.[0] ?? null
    }

    const handleExportUserData = async () => {
        if (!user?.id) {
            setToast('Không tìm thấy thông tin người dùng đang đăng nhập.')
            return
        }

        setIsExporting(true)
        try {
            const { data: homes, error: homesError } = await supabase
                .from('homes')
                .select('*')
                .eq('userID', user.id)

            if (homesError) throw homesError

            const homeIds = (homes || []).map((home) => home.id).filter(Boolean)
            let rooms = []
            let invoices = []
            let expenses = []

            if (homeIds.length > 0) {
                const { data: roomsData, error: roomsError } = await supabase
                    .from('rooms')
                    .select('*')
                    .in('home_id', homeIds)

                if (roomsError) throw roomsError
                rooms = roomsData || []

                const roomIds = rooms.map((room) => room.id).filter(Boolean)
                if (roomIds.length > 0) {
                    const { data: invoiceData, error: invoiceError } = await supabase
                        .from('invoices')
                        .select('*')
                        .in('room_id', roomIds)

                    if (invoiceError) throw invoiceError
                    invoices = invoiceData || []
                }

                const { data: expenseData, error: expenseError } = await supabase
                    .from('expenses')
                    .select('*')
                    .in('home_id', homeIds)

                if (expenseError) throw expenseError
                expenses = expenseData || []
            }

            const payload = {
                exportedAt: new Date().toISOString(),
                userId: user.id,
                username: user.username,
                homes,
                rooms,
                invoices,
                expenses,
            }

            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `user-data-${user.username || user.id}.json`
            link.click()
            window.URL.revokeObjectURL(url)
            setToast('Đã xuất dữ liệu thành công.')
        } catch (error) {
            console.error(error)
            setToast(error.message || 'Không thể xuất dữ liệu.')
        } finally {
            setIsExporting(false)
        }
    }

    const handleImportUserData = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!user?.id) {
            setToast('Không tìm thấy thông tin người dùng đang đăng nhập.')
            return
        }

        setIsImporting(true)
        try {
            const text = await file.text()
            const payload = JSON.parse(text)

            if (!payload || !Array.isArray(payload.homes)) {
                throw new Error('File không đúng định dạng dữ liệu.')
            }

            const homeIdMap = new Map()
            const createdHomes = []
            for (const home of payload.homes || []) {
                const homeKey = getRecordValue(home, ['id', 'home_id', 'homeID'])
                if (!homeKey) continue

                const normalizedHome = sanitizeRecord(home, { userID: user.id })
                const existingHome = await findExistingRecord('homes', 'name', normalizedHome.name, { userID: user.id })

                if (existingHome) {
                    homeIdMap.set(homeKey, existingHome.id)
                    continue
                }

                const { data: insertedHomes, error: insertHomeError } = await supabase
                    .from('homes')
                    .insert([normalizedHome])
                    .select()

                if (insertHomeError) throw insertHomeError
                const insertedHome = insertedHomes?.[0]
                if (!insertedHome) continue
                homeIdMap.set(homeKey, insertedHome.id)
                createdHomes.push(insertedHome)
            }

            const roomIdMap = new Map()
            for (const room of payload.rooms || []) {
                const roomHomeKey = getRecordValue(room, ['home_id', 'homeID'])
                const homeId = homeIdMap.get(roomHomeKey)
                if (!homeId) continue

                const normalizedRoom = sanitizeRecord(room, { home_id: homeId })
                const existingRoom = await findExistingRecord('rooms', 'room_name', normalizedRoom.room_name, { home_id: homeId })

                if (existingRoom) {
                    const roomKey = getRecordValue(room, ['id', 'room_id', 'roomID'])
                    if (roomKey) roomIdMap.set(roomKey, existingRoom.id)
                    continue
                }

                const { data: insertedRooms, error: insertRoomError } = await supabase
                    .from('rooms')
                    .insert([normalizedRoom])
                    .select()

                if (insertRoomError) throw insertRoomError
                const insertedRoom = insertedRooms?.[0]
                if (!insertedRoom) continue
                const roomKey = getRecordValue(room, ['id', 'room_id', 'roomID'])
                if (roomKey) roomIdMap.set(roomKey, insertedRoom.id)
            }

            for (const invoice of payload.invoices || []) {
                const invoiceRoomKey = getRecordValue(invoice, ['room_id', 'roomID'])
                const roomId = roomIdMap.get(invoiceRoomKey)
                if (!roomId) continue

                const normalizedInvoice = sanitizeRecord(invoice, { room_id: roomId })
                const existingInvoice = await findExistingRecord('invoices', 'invoice_create_date', normalizedInvoice.invoice_create_date, { room_id: roomId })

                if (existingInvoice) {
                    continue
                }

                const { error: insertInvoiceError } = await supabase
                    .from('invoices')
                    .insert([normalizedInvoice])
                    .select()

                if (insertInvoiceError) throw insertInvoiceError
            }

            for (const expense of payload.expenses || []) {
                const homeId = homeIdMap.get(expense.home_id)
                if (!homeId) continue

                const normalizedExpense = sanitizeRecord(expense, { home_id: homeId })
                const existingExpense = await findExistingRecord('expenses', 'description', normalizedExpense.description)

                if (existingExpense) {
                    continue
                }

                const { error: insertExpenseError } = await supabase
                    .from('expenses')
                    .insert([normalizedExpense])
                    .select()

                if (insertExpenseError) throw insertExpenseError
            }

            setToast(`Đã nhập dữ liệu thành công cho ${createdHomes.length} nhà.`)
        } catch (error) {
            console.error(error)
            setToast(error.message || 'Không thể nhập dữ liệu.')
        } finally {
            setIsImporting(false)
            event.target.value = ''
        }
    }

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
                                {isExporting ? 'Đang xuất...' : 'Xuất dữ liệu'}
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
                                {isImporting ? 'Đang nhập...' : 'Nhập dữ liệu'}
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
