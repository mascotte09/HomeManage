// Custom hooks
import { useInput } from "../hooks/useInput.js";
import Signup from "./Signup.jsx";
// Components
import Input from "./Input.jsx";

import { supabase } from '../supabase.js'
// Utils
import { isEmail, isNotEmpty, hasMinLength } from "../util/validation.js";
//import { useNavigate } from 'react-router-dom'

export default function Login({ onSignupClick, onLoginSuccess }) {
    // const [enteredEmail, setEnteredEmail] = useState("");
    // const [enteredPassword, setEnteredPassword] = useState("");
   
    const {
        value: emailValue,
        setEnteredValue: setEnteredEmail,
        handleInputChange: handleEmailChange,
        handleInputBlur: handleEmailBlur,
        hasError: emailHasInvalid,
    } = useInput("", (value) => {
        // ...
        return isEmail(value) && isNotEmpty(value);
    });

    const {
        value: passwordValue,
        setEnteredValue: setEnteredPassword,
        handleInputChange: handlePasswordChange,
        handleInputBlur: handlePasswordBlur,
        hasError: passwordHasInvalid,
    } = useInput("", (value) => {        
        //hasMinLength(value, 6) ;
        isNotEmpty(value);
    });

    async function handleSubmit(event) {
        event.preventDefault();
       
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', emailValue)
            .eq('password', passwordValue)

        if (error) {
            console.log(error.message)
            return
        }

        // ❌ user not found
        if (!data || data.length === 0) {
            alert("User is invalid")
            return
        }

        // ✅ user exists
        const user = data[0];
        onLoginSuccess(user);
        console.log("Login success:", user.id)
        // Reset the form
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
                    error={emailHasInvalid && "Please enter a valid email."}
                />

                <Input
                    label="Password"
                    id="password"
                    type="password"
                    name="password"
                    value={passwordValue}
                    onBlur={handlePasswordBlur}
                    onChange={handlePasswordChange}
                    //error={passwordHasInvalid && "Password must be at least 6 characters......"}
                />
            </div>

            <div className="form-actions">
               
                <button className="button button-flat">Reset</button>

                <button
                    className="button"
                    //* Alternative way to submit the form
                    type='button'
                    onClick={handleSubmit}
                >
                    Login
                </button>              
                   
            </div>
           
            <div style={{ marginTop: "12px", display: "flex", gap: "10px",}}>
                <p>Don’t have an account?</p>

                <button onClick={onSignupClick} className="button">
                    Sign Up
                </button>
            </div>
        </form>
    );
}