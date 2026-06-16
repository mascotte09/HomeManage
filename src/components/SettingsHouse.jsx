import { useState } from 'react'
import { MdArrowBack, MdPerson, MdLock, MdChevronRight, MdClose } from 'react-icons/md'
import { supabase } from '../supabase'
import FooterHouse from './House/FooterHouse.jsx'

export default function Settings({ user, onBack }) {
    const [showChangePassword, setShowChangePassword] = useState(false)
    const [toast, setToast] = useState('')

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
