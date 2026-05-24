import { useState } from 'react'
import { supabase } from '../supabase'

export default function Signup({
    onBackToLogin,
    onSignupSuccess,
}) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')

    const passwordsAreNotEqual =
        password !== confirmPassword &&
        confirmPassword.length > 0

    const handleSignup = async (e) => {
        e.preventDefault()

        // Verify passwords
        if (password !== confirmPassword) {
            setMessage('Passwords do not match')
            return
        }

        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    username,
                    password,
                },
            ])
            .select()
            .single()

        if (error) {
            setMessage(error.message)
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
            return
        }

        setMessage('User registered + Home created successfully!')

        // Clear inputs
        setUsername('')
        setPassword('')
        setConfirmPassword('')

        // Return to Login page
        onSignupSuccess()
    }

    return (
        <div style={{ padding: '20px' }}>
            <form onSubmit={handleSignup}>
                <div className="control">
                    <label htmlFor="email">Email</label>

                    <input
                        id="email"
                        type="email"
                        value={username}
                        onChange={(e) =>
                            setUsername(e.target.value)
                        }
                        required
                    />
                </div>

                <div className="control-row">
                    <div className="control">
                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="control">
                        <label htmlFor="confirm-password">
                            Confirm Password
                        </label>

                        <input
                            id="confirm-password"
                            type="password"
                            name="confirm-password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(
                                    e.target.value
                                )
                            }
                            required
                        />

                        <div className="control-error">
                            {passwordsAreNotEqual && (
                                <p>
                                    Passwords must match.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <p
                    className="form-actions"
                    style={{
                        display: 'flex',
                        justifyContent:
                            'space-between',
                        alignItems: 'center',
                    }}
                >
                    {/* Left */}
                    <button
                        type="button"
                        className="button button-flat"
                        onClick={onBackToLogin}
                    >
                        Login Again
                    </button>

                    {/* Right */}
                    <span
                        style={{
                            display: 'flex',
                            gap: '10px',
                        }}
                    >
                        <button
                            type="button"
                            className="button button-flat"
                            onClick={() => {
                                setUsername('')
                                setPassword('')
                                setConfirmPassword('')
                                setMessage('')
                            }}
                        >
                            Reset
                        </button>

                        <button
                            type="submit"
                            className="button"
                        >
                            Sign up
                        </button>
                    </span>
                </p>
            </form>

            <p>{message}</p>
        </div>
    )
}