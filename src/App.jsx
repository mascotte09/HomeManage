import Header from "./components/Header.jsx";
import HeaderHome from "./components/HeaderHome.jsx";
import Signup from "./components/Signup.jsx";
// import Login from "./components/Login.jsx";
import Login from "./components/StateLogin.jsx";
import { useState } from "react";
//import { supabase } from './supabase'
//import ListRooms from './components/Room/ListRooms.jsx'
//import ListInvoices from './components/Invoice/ListInvoices.jsx'
//import { Routes, Route } from 'react-router-dom'

function App() {
    const [showSignup, setShowSignup] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    //const [currentUser, setCurrentUser] = useState(null);

    return (
        <>      
           
             {!isLoggedIn ? <Header /> : <HeaderHome />}
            <main>
                {showSignup ? (
                    <Signup />
                )  : (
                    <Login
                        onSignupClick={() => setShowSignup(true)}
                        onLoginSuccess={(user) => {
                            //setCurrentUser(user);
                            setIsLoggedIn(true);
                        }}
                    />
                )}
            </main>
        </>
    );
}

export default App;

// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit dddd<code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;
