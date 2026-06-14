import { useInput } from "../hooks/useInput.js";
import { useState } from 'react'

// Components
import Input from "./Input.jsx";
import FooterHouse from "./House/FooterHouse.jsx";

import { supabase } from "../supabase.js";

// Utils
import { isEmail, isNotEmpty } from "../util/validation.js";

export default function Login({ onSignupClick, onLoginSuccess }) {
    const [message, setMessage] = useState('')
    const {
        value: emailValue,
        handleInputChange: handleEmailChange,
        handleInputBlur: handleEmailBlur,
        hasError: emailHasInvalid,
        reset: resetEmail,
    } = useInput("", (value) => {
        return isEmail(value) && isNotEmpty(value);
    });

    const {
        value: passwordValue,
        handleInputChange: handlePasswordChange,
        handleInputBlur: handlePasswordBlur,
        hasError: passwordHasInvalid,
        reset: resetPassword,
    } = useInput("", (value) => {
        return isNotEmpty(value);
    });

    async function handleSubmit(event) {
        event.preventDefault();
        setMessage('')

        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("username", emailValue)
            .eq("password", passwordValue);

        if (error) {
            console.log(error.message);
            setMessage(error.message)
            return;
        }

        // User not found
        if (!data || data.length === 0) {
            setMessage("Email hoặc mật khẩu không chính xác");
            return;
        }

        // Login success
        const user = data[0];
        localStorage.setItem(
            "currentUser",
            JSON.stringify(user)
        );

        console.log("Login success:", user.id);

        onLoginSuccess(user);
    }
    function handleReset() {
        resetEmail();
        resetPassword();
    }
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
                    <form
                        onSubmit={handleSubmit}
                        style={{
                            width: '100%',
                            padding: '20px',
                        }}
                    >
                        {/* FORM */}

                        <div className="control-row">
                            <Input
                                label="Email"
                                id="email"
                                type="email"
                                name="email"
                                value={emailValue}
                                onBlur={handleEmailBlur}
                                onChange={handleEmailChange}
                                error={
                                    emailHasInvalid &&
                                    "Vui lòng nhập một email hợp lệ."
                                }
                            />

                            <Input
                                label="Mật Khẩu"
                                id="password"
                                type="password"
                                name="password"
                                value={passwordValue}
                                onBlur={handlePasswordBlur}
                                onChange={handlePasswordChange}
                                error={
                                    passwordHasInvalid &&
                                    "Vui lòng nhập mật khẩu."
                                }
                            />
                        </div>

                        <div
                            className="form-actions"
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <button
                                type="button"
                                onClick={onSignupClick}
                                className="button button-flat"
                            >
                                Đăng Ký
                            </button>

                            <span
                                style={{
                                    display: "flex",
                                    gap: "10px",
                                }}
                            >
                                <button
                                    type="button"
                                    className="button button-flat"
                                    onClick={handleReset}
                                >
                                    Xóa
                                </button>

                                <button
                                    className="button"
                                    type="submit"
                                >
                                    Đăng Nhập
                                </button>
                            </span>
                        </div>
                    </form>

                    {/* MESSAGE DƯỚI FORM */}
                    {message && (
                        <div
                            style={{
                                marginTop: "12px",
                                padding: "12px",
                                borderRadius: "8px",
                                backgroundColor:
                                    message.toLowerCase().includes("thành công")
                                        ? "#dcfce7"
                                        : "#fee2e2",
                                color:
                                    message.toLowerCase().includes("thành công")
                                        ? "#166534"
                                        : "#b91c1c",
                                textAlign: "center",
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