import Signup from "./components/Signup.jsx";
import Login from "./components/StateLogin.jsx";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import ListRooms from './components/Room/ListRooms.jsx'

import { BrowserRouter, Routes, Route } from "react-router-dom";

import HeaderHouse from "./components/House/HeaderHouse";
import HeaderRoom from "./components/Room/HeaderRoom";
import ListHouses from "./components/House/ListHouses";
import InvoicesInMonth from "./components/Invoice/InvoicesInMonth";
import ListExpenses from "./components/Expense/ListExpenses.jsx";
import ListPayments from "./components/Payment/ListPayments.jsx";
import MonthlyStatistic from "./components/House/MonthlyStatistic.jsx";



function App() {
    const [showSignup, setShowSignup] = useState(false);

    const [currentUser, setCurrentUser] =
        useState(undefined);

    useEffect(() => {
        const savedUser =
            localStorage.getItem("currentUser");

        if (savedUser) {
            setCurrentUser(
                JSON.parse(savedUser)
            );
        } else {
            setCurrentUser(null);
        }
    }, []);

    function handleSignupSuccess() {
        setShowSignup(false);
    }

    if (currentUser === undefined) {
        return <div>Loading...</div>;
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
                            <HeaderHouse
                                onLogout={() => {
                                    localStorage.removeItem(
                                        "currentUser"
                                    );

                                    setCurrentUser(null);
                                }}
                            />
                            <ListHouses user_id={currentUser.id} />
                        </>
                    }
                />
                <Route
                    path="/houses"
                    element={
                        <>
                            <HeaderHouse
                                onLogout={async () => {
                                    await supabase.auth.signOut();
                                    setCurrentUser(null);
                                }}
                            />
                            <ListHouses user_id={currentUser.id} />
                        </>
                    }
                />
                <Route path="/rooms/:houseId"
                    element={
                        <>
                            <HeaderRoom
                                onLogout={async () => {
                                    await supabase.auth.signOut();
                                    setCurrentUser(null);
                                }}
                            />
                            <ListRooms />
                        </>
                    } />

                <Route path="/invoicesInMonth/:houseId"
                    element={
                        <>
                            <HeaderRoom
                                onLogout={async () => {
                                    await supabase.auth.signOut();
                                    setCurrentUser(null);
                                }}
                            />
                            <InvoicesInMonth />
                        </>
                    } />
                <Route path="/payment/:houseId"
                    element={
                        <>
                            <HeaderRoom
                                onLogout={async () => {
                                    await supabase.auth.signOut();
                                    setCurrentUser(null);
                                }}
                            />
                            <ListPayments />
                        </>
                    } />

                <Route path="/expense/:houseId"
                    element={
                        <>
                            <HeaderRoom
                                onLogout={async () => {
                                    await supabase.auth.signOut();
                                    setCurrentUser(null);
                                }}
                            />
                            <ListExpenses />
                        </>
                    } />
                <Route path="/statistic/:houseId"
                    element={
                        <>
                            <HeaderRoom
                                onLogout={async () => {
                                    await supabase.auth.signOut();
                                    setCurrentUser(null);
                                }}
                            />
                            <MonthlyStatistic />
                        </>
                    } />
            </Routes>

        </BrowserRouter>
    );
}
export default App;
