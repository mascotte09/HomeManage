
import { useState } from 'react'
import { supabase } from '../supabase'

export default function Signup() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleSignup = async (e) => {
  e.preventDefault()

  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        username,
        password
      }
    ])
    .select()
    .single()

  if (error) {
    setMessage(error.message)
    return
  }

  // 1. Create Home using username
  const { error: homeError } = await supabase
    .from('homes')
    .insert([
      {
        name: username,
        userID: data.id
      }
    ])

  if (homeError) {
    setMessage(homeError.message)
    return
  }

  setMessage('User registered + Home created successfully!')

  setUsername('')
  setPassword('')
}

  return (
    <div style={{ padding: '20px' }}>
     

      <form onSubmit={handleSignup}>
        <div className="control">
            <label htmlFor="email">Email</label>
            <input id="email" value={username}
            onChange={(e) => setUsername(e.target.value)}required />
        </div>
       

    <div className="control-row">
            <div className="control">
                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    name="password"
                    value={password}
                onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                />
            </div>

            <div className="control">
                <label htmlFor="confirm-password">Confirm Password</label>
                <input id="confirm-password" type="password" name="confirm-password" required />
           
                {/* <div className="control-error">{passwordsAreNotEqual && <p>Passwords must match.</p>}</div> */}
            </div>
        </div>        

        <p className="form-actions">
                 <button type="reset" className="button button-flat">
                     Reset
                 </button>

                 <button type="submit" className="button">
                     Sign up
                 </button>
             </p>
       
      </form>

      <p>{message}</p>
    </div>
  )
}