import { useState } from 'react'
import { supabase } from '../supabase'
import { sendVerificationEmail } from '../utils/emailService'
import FooterHouse from './House/FooterHouse.jsx'

// Generate a 6-digit numeric code
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export default function Signup({
    onBackToLogin,
    onSignupSuccess,
}) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')

    // Verification step state
    const [step, setStep] = useState('signup') // 'signup' | 'verify'
    const [pendingCode, setPendingCode] = useState(null) // code held in memory until verified
    const [inputCode, setInputCode] = useState('')
    const [sending, setSending] = useState(false)
    const [verifying, setVerifying] = useState(false)

    const passwordsAreNotEqual =
        password !== confirmPassword &&
        confirmPassword.length > 0

    // ─── Step 1: Send verification code (no DB write yet) ──────────────────
    const handleSignup = async (e) => {
        e.preventDefault()
        setMessage('')

        // Verify passwords
        if (password !== confirmPassword) {
            setMessage('Mật khẩu không trùng khớp')
            return
        }

        setSending(true)

        // Check email is not already registered
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .maybeSingle()

        if (checkError) {
            setMessage(checkError.message)
            setSending(false)
            return
        }

        if (existingUser) {
            setMessage('Email này đã được đăng ký.')
            setSending(false)
            return
        }

        const code = generateCode()

        // Send verification email (no insert into "users" yet)
        try {
            await sendVerificationEmail(username, code)
        } catch (err) {
            setMessage('Không thể gửi email xác thực')
            setSending(false)
            return
        }

        setPendingCode(code)
        setSending(false)
        setStep('verify')
        setMessage('Đã gởi mã xác thực đến email của bạn. \nVui lòng kiểm tra trong hộp thư đến hay thư rác và nhập mã để tiếp tục.')
    }

    // ─── Step 2: Confirm code, then create user + home ──────────────────────
    const handleVerify = async (e) => {
        e.preventDefault()
        setMessage('')

        if (!inputCode.trim()) {
            setMessage('Vui lòng nhập mã xác thực')
            return
        }

        setVerifying(true)

        if (pendingCode === null || inputCode.trim() !== pendingCode) {
            setMessage('Mã xác thực không hợp lệ')
            setVerifying(false)
            return
        }

        // Code is correct → create the user (already verified)
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    username,
                    password,
                    verification_code: null,
                    is_verified: true,
                },
            ])
            .select()
            .single()

        if (error) {
            setMessage(error.message)
            setVerifying(false)
            return
        }

        // Create Home using username
        const { error: homeError } = await supabase
            .from('homes')
            .insert([
                {
                    name: username,
                    userID: data.id,
                },
            ])

        if (homeError) {
            setMessage(homeError.message)
            setVerifying(false)
            return
        }

        setMessage('Email đã được xác thực thành công!')
        setVerifying(false)

        // Clear inputs
        setUsername('')
        setPassword('')
        setConfirmPassword('')
        setInputCode('')
        setPendingCode(null)

        // Return to Login page
        onSignupSuccess()
    }

    // ─── Resend code ────────────────────────────────────────────────────────
    const handleResendCode = async () => {
        setMessage('')
        setSending(true)

        const code = generateCode()

        try {
            await sendVerificationEmail(username, code)
            setPendingCode(code)
            setMessage('Mã xác thực mới đã được gửi.')
        } catch (err) {
            setMessage('Không thể gửi email xác thực')
        }

        setSending(false)
    }

    // ─── Render: Step 2 - Verify code ──────────────────────────────────────
    if (step === 'verify') {
        return (
           <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        maxWidth: '500px',
                    }}
                >
                        <form onSubmit={handleVerify}
                        style={{
                            width: '100%',
                            padding: '20px',
                        }}>
                            <div className="control">
                                <label htmlFor="verification-code">
                                    Mã Xác Thực
                                </label>

                                <input
                                    id="verification-code"
                                    type="text"
                                    value={inputCode}
                                    onChange={(e) =>
                                        setInputCode(e.target.value)
                                    }
                                    placeholder="Nhập mã 6 chữ số"
                                    required
                                />
                            </div>

                            <p
                                className="form-actions"
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <button
                                    type="button"
                                    className="button button-flat"
                                    onClick={onBackToLogin}
                                >
                                    Đăng Nhập Lại
                                </button>

                                <span
                                    style={{
                                        display: 'flex',
                                        gap: '10px',
                                    }}
                                >
                                    <button
                                        type="button"
                                        className="button button-flat"
                                        onClick={handleResendCode}
                                        disabled={sending}
                                    >
                                        {sending
                                            ? 'Đang Gửi...'
                                            : 'Gửi Lại Mã'}
                                    </button>

                                    <button
                                        type="submit"
                                        className="button"
                                        disabled={verifying}
                                    >
                                        {verifying
                                            ? 'Đang Xác Thực...'
                                            : 'Xác Thực'}
                                    </button>
                                </span>
                            </p>
                        </form>

                        {/* MESSAGE */}
                        {message && (
                            <div
                                style={{
                                    marginTop: '16px',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    textAlign: 'center',
                                    whiteSpace: 'pre-line',
                                    backgroundColor:
                                        message
                                            .toLowerCase()
                                            .includes('thành công')
                                            ? '#dcfce7'
                                            : '#dbeafe',
                                    color:
                                        message
                                            .toLowerCase()
                                            .includes('thành công')
                                            ? '#166534'
                                            : '#1d4ed8',
                                }}
                            >
                                {message}
                            </div>
                        )}
                    </div>
                </div>

                <FooterHouse />
            </div>
        );
    }

    // ─── Render: Step 1 - Signup form ──────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        maxWidth: '500px',
                    }}
                >
                    <form onSubmit={handleSignup}
                    style={{
                            width: '100%',
                            padding: '20px',
                        }}>
                        <div className="control">
                            <label htmlFor="email">Email</label>

                            <input
                                id="email"
                                type="email"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="control-row">
                            <div className="control">
                                <label htmlFor="password">
                                    Mật Khẩu
                                </label>

                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="control">
                                <label htmlFor="confirm-password">
                                    Xác Nhận Mật Khẩu
                                </label>

                                <input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    required
                                />

                                <div className="control-error">
                                    {passwordsAreNotEqual && (
                                        <p>Mật khẩu phải trùng khớp.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div
                            className="form-actions"
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginTop: "20px",
                            }}
                        >
                            <button
                                type="button"
                                className="button button-flat"
                                onClick={onBackToLogin}
                            >
                                Đăng Nhập
                            </button>

                            <div
                                style={{
                                    display: "flex",
                                    gap: "10px",
                                }}
                            >
                                <button
                                    type="button"
                                    className="button button-flat"
                                    onClick={() => {
                                        setUsername("");
                                        setPassword("");
                                        setConfirmPassword("");
                                        setMessage("");
                                    }}
                                >
                                    Xóa
                                </button>

                                <button
                                    type="submit"
                                    className="button"
                                    disabled={sending}
                                >
                                    {sending
                                        ? "Đang gửi mã..."
                                        : "Đăng Ký"}
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* MESSAGE DƯỚI FORM */}
                    {message && (
                        <div
                            style={{
                                marginTop: "16px",
                                padding: "12px",
                                borderRadius: "10px",
                                textAlign: "center",
                                whiteSpace: "pre-line",
                                backgroundColor:
                                    message
                                        .toLowerCase()
                                        .includes("thành công")
                                        ? "#dcfce7"
                                        : "#fee2e2",
                                color:
                                    message
                                        .toLowerCase()
                                        .includes("thành công")
                                        ? "#166534"
                                        : "#b91c1c",
                            }}
                        >
                            {message}
                        </div>
                    )}
                </div>
            </div>

            <FooterHouse />
        </div>
    );
}
