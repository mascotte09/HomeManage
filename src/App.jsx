import Signup from "./components/Signup.jsx";
import Login from "./components/StateLogin.jsx";
import { useState } from "react";
import ListRooms from './components/Room/ListRooms.jsx'

import { BrowserRouter, Routes, Route } from "react-router-dom";

import HeaderHouse from "./components/House/HeaderHouse";
import HeaderRoom from "./components/Room/HeaderRoom";
import ListHouses from "./components/House/ListHouses";
import InvoicesInMonth from "./components/Invoice/InvoicesInMonth";

function App() {
    const [showSignup, setShowSignup] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    console.debug(showSignup, isLoggedIn);
    
    function handleSignupSuccess() {
        setShowSignup(false);
    }

    // User not logged in
    if (!currentUser) {
        // Show Signup page
        if (showSignup) {
            return (
                <Signup
                    onBackToLogin={() => setShowSignup(false)}
                    onSignupSuccess={handleSignupSuccess}
                />
            );
        }

        // Show Login page
        return (
            <Login
                onSignupClick={() => setShowSignup(true)}
                onLoginSuccess={(user) => {
                    setCurrentUser(user);
                    setIsLoggedIn(true);
                }}
            />
        );
    }

    // User logged in    
    return (
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <>
                                <HeaderHouse onLogout={() => {
                                    setCurrentUser(null);
                                    setIsLoggedIn(false);
                                }}/>
                                <ListHouses user_id={currentUser.id} />
                            </>
                        }
                    />
                    <Route
                        path="/houses"
                        element={
                            <>
                                <HeaderHouse onLogout={() => {
                                    setCurrentUser(null);
                                    setIsLoggedIn(false);
                                }}/>
                                <ListHouses user_id={currentUser.id} />
                            </>
                        }
                    />
                    <Route path="/rooms/:houseId" 
                        element={
                            <>
                                <HeaderRoom onLogout={() => {
                                    setCurrentUser(null);
                                    setIsLoggedIn(false);
                                }}/>
                                <ListRooms />
                            </>
                        } />
    
                    <Route path="/invoicesInMonth/:houseId" 
                        element={
                            <>
                                <HeaderRoom onLogout={() => {
                                    setCurrentUser(null);
                                    setIsLoggedIn(false);
                                }}/>
                                <InvoicesInMonth />
                            </>
                        } />
                </Routes>
    
            </BrowserRouter>
        );
}

   
export default App;
