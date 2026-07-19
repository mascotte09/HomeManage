import { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabase'
import { sendVerificationEmail } from '../utils/emailService'
import { normalizeUserType } from '../utils/userType'
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
    const [userType, setUserType] = useState('landlord')
    const [message, setMessage] = useState('')

    // Verification step state
    const [step, setStep] = useState('signup') // 'signup' | 'verify'
    const [pendingCode, setPendingCode] = useState(null) // code held in memory until verified
    const [inputCode, setInputCode] = useState('')
    const [sending, setSending] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [cooldown, setCooldown] = useState(0) // seconds remaining before resend allowed

    // Ref guard chống double-submit ngay lập tức (không phụ thuộc re-render)
    const isSubmittingRef = useRef(false)

    const RESEND_COOLDOWN_SECONDS = 60

    // Key cố định (KHÔNG theo email) -> đổi email khác cũng không bypass được cooldown
    const COOLDOWN_KEY = 'signup_otp_cooldown'

    // Lấy thông tin OTP đã gửi gần nhất (nếu còn trong cooldown)
    const getStoredOtp = () => {
        const raw = localStorage.getItem(COOLDOWN_KEY)
        if (!raw) return null
        try {
            const { code, email, sentAt } = JSON.parse(raw)
            const elapsed = (Date.now() - sentAt) / 1000
            const remaining = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed)
            return { code, email, remaining: remaining > 0 ? remaining : 0 }
        } catch {
            return null
        }
    }

    const markCodeSent = (email, code) => {
        localStorage.setItem(
            COOLDOWN_KEY,
            JSON.stringify({ code, email, sentAt: Date.now() })
        )
    }

    // Đếm ngược cooldown để cập nhật UI
    useEffect(() => {
        if (cooldown <= 0) return
        const timer = setInterval(() => {
            setCooldown((c) => (c > 1 ? c - 1 : 0))
        }, 1000)
        return () => clearInterval(timer)
    }, [cooldown])

    const passwordsAreNotEqual =
        password !== confirmPassword &&
        confirmPassword.length > 0

    // ─── Step 1: Send verification code (no DB write yet) ──────────────────
    const handleSignup = async (e) => {
        e.preventDefault()
        if (isSubmittingRef.current) return
        isSubmittingRef.current = true
        setMessage('')

        // Verify passwords
        if (password !== confirmPassword) {
            setMessage('Mật khẩu không trùng khớp')
            isSubmittingRef.current = false
            return
        }

        // Chặn gửi mail mới nếu vừa gửi gần đây - kể cả khi user đổi sang
        // email khác để né cooldown (cooldown này KHÔNG theo email)
        const stored = getStoredOtp()
        if (stored && stored.remaining > 0) {
            if (stored.email.toLowerCase() === username.toLowerCase()) {
                // Cùng email đã gửi trước đó -> cho vào lại bước verify với mã cũ
                setPendingCode(stored.code)
                setCooldown(stored.remaining)
                setStep('verify')
                setMessage(`Mã xác thực đã được gửi trước đó. Vui lòng kiểm tra email, hoặc đợi ${stored.remaining}s để gửi lại.`)
            } else {
                // Email khác với lần gửi trước -> không gửi mail mới, yêu cầu đợi
                setMessage(`Bạn vừa yêu cầu mã xác thực cho một email khác. Vui lòng đợi ${stored.remaining}s trước khi đăng ký với email khác.`)
            }
            isSubmittingRef.current = false
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
            isSubmittingRef.current = false
            return
        }

        if (existingUser) {
            setMessage('Email này đã được đăng ký.')
            setSending(false)
            isSubmittingRef.current = false
            return
        }

        const code = generateCode()

        // Send verification email (no insert into "users" yet)
        try {
            await sendVerificationEmail(username, code)
        } catch (err) {
            setMessage('Không thể gửi email xác thực')
            setSending(false)
            isSubmittingRef.current = false
            return
        }

        setPendingCode(code)
        markCodeSent(username, code)
        setCooldown(RESEND_COOLDOWN_SECONDS)
        setSending(false)
        isSubmittingRef.current = false
        setStep('verify')
        setMessage(`Đã gởi mã xác thực đến email của bạn: ${username}. \nVui lòng kiểm tra trong hộp thư đến hay thư rác và nhập mã để tiếp tục.`)
    }

    // ─── Step 2: Confirm code, then create user + home ──────────────────────
    const handleVerify = async (e) => {
        e.preventDefault()
        if (isSubmittingRef.current) return
        isSubmittingRef.current = true
        setMessage('')

        if (!inputCode.trim()) {
            setMessage('Vui lòng nhập mã xác thực')
            isSubmittingRef.current = false
            return
        }

        setVerifying(true)

        if (pendingCode === null || inputCode.trim() !== pendingCode) {
            setMessage('Mã xác thực không hợp lệ')
            setVerifying(false)
            isSubmittingRef.current = false
            return
        }

        // Code is correct → create the user (already verified)
        const { error } = await supabase
            .from('users')
            .insert([
                {
                    username,
                    password,
                    verification_code: null,
                    is_verified: true,
                    user_type: normalizeUserType(userType),
                },
            ])
            .select()
            .single()

        if (error) {
            setMessage(error.message)
            setVerifying(false)
            isSubmittingRef.current = false
            return
        }

        // Create Home using username
        // const { error: homeError } = await supabase
        //     .from('homes')
        //     .insert([
        //         {
        //             name: username,
        //             userID: data.id,
        //         },
        //     ])

        // if (homeError) {
        //     setMessage(homeError.message)
        //     setVerifying(false)
        //     isSubmittingRef.current = false
        //     return
        // }

        setMessage('Email đã được xác thực thành công!')
        setVerifying(false)
        isSubmittingRef.current = false

        // Clear inputs
        setUsername('')
        setPassword('')
        setConfirmPassword('')
        setUserType('landlord')
        setInputCode('')
        setPendingCode(null)

        // Return to Login page
        onSignupSuccess()
    }

    // ─── Resend code ────────────────────────────────────────────────────────
    const handleResendCode = async () => {
        if (cooldown > 0) return
        setMessage('')
        setSending(true)

        const code = generateCode()

        try {
            await sendVerificationEmail(username, code)
            setPendingCode(code)
            markCodeSent(username, code)
            setCooldown(RESEND_COOLDOWN_SECONDS)
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
                                    Đăng Nhập
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
                                        disabled={sending || cooldown > 0}
                                    >
                                        {sending
                                            ? 'Đang Gửi...'
                                            : cooldown > 0
                                                ? `Gửi Lại Mã (${cooldown}s)`
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

                        <fieldset className="border border-gray-500 rounded-xl p-2">
                            <legend className="px-2 text-gray-200 font-medium">
                                Vai trò
                            </legend>

                            <div className="flex flex-wrap gap-6 text-gray-200">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="userType"
                                        value="landlord"
                                        checked={userType === "landlord"}
                                        onChange={(e) => setUserType(e.target.value)}
                                        className="accent-blue-500"
                                    />
                                    <span>Chủ trọ</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="userType"
                                        value="broker"
                                        checked={userType === "broker"}
                                        onChange={(e) => setUserType(e.target.value)}
                                        className="accent-blue-500"
                                    />
                                    <span>Môi giới</span>
                                </label>
                            </div>
                        </fieldset>

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
                                        setUserType("landlord");
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
