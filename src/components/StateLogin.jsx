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
            alert("Invalid email or password");
            return;
        }

        // Login success
        const user = data[0];

        console.log("Login success:", user.id);

        onLoginSuccess(user);
    }
    function handleReset() {
        resetEmail();
        resetPassword();
    }
    return (
        <form onSubmit={handleSubmit}>
            <h2>Login</h2>

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
                        "Please enter a valid email."
                    }
                />

                <Input
                    label="Password"
                    id="password"
                    type="password"
                    name="password"
                    value={passwordValue}
                    onBlur={handlePasswordBlur}
                    onChange={handlePasswordChange}
                    error={
                        passwordHasInvalid &&
                        "Please enter a password."
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
                    Sign Up Here
                </button>

                {/* Right */}
                <span style={{ display: "flex", gap: "10px" }}>
                    <button
                        type="button"
                        className="button button-flat"
                        onClick={handleReset}
                    >
                        Reset
                    </button>

                    <button
                        className="button"
                        type="submit"
                    >
                        Login
                    </button>
                </span>
            </div>
        </form>
    );
}