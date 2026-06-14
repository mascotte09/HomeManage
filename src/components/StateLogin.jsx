// Custom hooks
import { useInput } from "../hooks/useInput.js";

// Components
import Input from "./Input.jsx";

import { supabase } from "../supabase.js";

// Utils
import { isEmail, isNotEmpty } from "../util/validation.js";

export default function Login({ onSignupClick, onLoginSuccess }) {
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

        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("username", emailValue)
            .eq("password", passwordValue);

        if (error) {
            console.log(error.message);
            return;
        }

        // User not found
        if (!data || data.length === 0) {
            alert("Email hoặc mật khẩu không chính xác");
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
        <form onSubmit={handleSubmit}>
            {/* <h2>Đăng Nhập</h2> */}

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
                {/* Left */}
                <button
                    type="button"
                    onClick={onSignupClick}
                    className="button button-flat"
                >
                    Đăng Ký
                </button>

                {/* Right */}
                <span style={{ display: "flex", gap: "10px" }}>
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
    );
}