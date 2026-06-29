import Signup from "./components/Signup.jsx";
import Login from "./components/StateLogin.jsx";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import RoomPage from './components/Room/RoomPage.jsx'

import { BrowserRouter, Routes, Route } from "react-router-dom";

import HeaderHouse from "./components/House/HeaderHouse";
import FooterHouse from "./components/House/FooterHouse";
import HeaderRoom from "./components/Room/HeaderRoom";
import HousePage from "./components/House/HousePage.jsx";
import InvoicesInMonth from "./components/Invoice/InvoicesInMonth";
import Invoices from "./components/Invoice/Invoices";
import ListExpenses from "./components/Expense/ListExpenses.jsx";
import ListPayments from "./components/Payment/ListPayments.jsx";
import MonthlyStatistic from "./components/Report/HouseMonthlyStatistic.jsx";
import SettingsHouse from "./components/Settings.jsx";

import { useNavigate } from "react-router-dom";



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
                        <div className="flex flex-col h-dvh">
                            <HeaderHouseWithNav
                                onLogout={() => {
                                    localStorage.removeItem(
                                        "currentUser"
                                    );

                                    setCurrentUser(null);
                                }}
                            />
                            <div className="flex-1 overflow-y-auto">
                                <HousePage user_id={currentUser.id} />
                            </div>
                            <FooterHouse />
                        </div>
                    }
                />
                <Route
                    path="/houses"
                    element={
                        <div className="flex flex-col h-dvh">
                            <HeaderHouseWithNav
                                onLogout={async () => {
                                    await supabase.auth.signOut();
                                    setCurrentUser(null);
                                }}
                            />
                            <div className="flex-1 overflow-y-auto">
                                <HousePage user_id={currentUser.id} />
                            </div>
                            <FooterHouse />
                        </div>
                    }
                />

                <Route
                    path="/settings"
                    element={
                        <SettingsHouseWithNav user={currentUser} />
                    }
                />

                {/* RoomPage already includes HeaderRoom internally */}
                <Route path="/rooms/:houseId"
                    element={<RoomPage />} />

                <Route path="/invoicesInMonth/:houseId"
                    element={
                        <div className="flex flex-col h-dvh">
                            <HeaderRoom
                                onLogout={async () => {
                                    await supabase.auth.signOut();
                                    setCurrentUser(null);
                                }}
                            />
                            <div className="flex-1 overflow-y-auto">
                                <InvoicesInMonth />
                            </div>
                        </div>
                    } />

                <Route path="/invoicesRoom/:roomId/:houseId"
                    element={
                        <div className="flex flex-col h-dvh">
                            <HeaderRoom
                                onLogout={async () => {
                                    await supabase.auth.signOut();
                                    setCurrentUser(null);
                                }}
                            />
                            <div className="flex-1 overflow-y-auto">
                                <Invoices />
                            </div>
                        </div>
                    } />
                    
                <Route path="/payment/:houseId"
                    element={
                        <div className="flex flex-col h-dvh">
                            <HeaderRoom
                                onLogout={async () => {
                                    await supabase.auth.signOut();
                                    setCurrentUser(null);
                                }}
                            />
                            <div className="flex-1 overflow-y-auto">
                                <ListPayments />
                            </div>
                        </div>
                    } />

                <Route path="/expense/:houseId"
                    element={
                        <div className="flex flex-col h-dvh">
                            <HeaderRoom
                                onLogout={async () => {
                                    await supabase.auth.signOut();
                                    setCurrentUser(null);
                                }}
                            />
                            <div className="flex-1 overflow-y-auto">
                                <ListExpenses />
                            </div>
                        </div>
                    } />
                <Route path="/statistic/:houseId"
                    element={
                        <div className="flex flex-col h-dvh">
                            <HeaderRoom
                                onLogout={async () => {
                                    await supabase.auth.signOut();
                                    setCurrentUser(null);
                                }}
                            />
                            <div className="flex-1 overflow-y-auto">
                                <MonthlyStatistic />
                            </div>
                        </div>
                    } />
            </Routes>

        </BrowserRouter>
    );
}

// Bọc HeaderHouse để gắn điều hướng sang trang /settings
// (đặt trong file App.jsx vì cần useNavigate, hook chỉ dùng được bên trong BrowserRouter)
function HeaderHouseWithNav({ onLogout }) {
    const navigate = useNavigate();
    return (
        <HeaderHouse
            onLogout={onLogout}
            onSettings={() => navigate("/settings")}
        />
    );
}

// Bọc SettingsHouse để nút "Quay lại" điều hướng về trang chủ
function SettingsHouseWithNav({ user }) {
    const navigate = useNavigate();
    return <SettingsHouse user={user} onBack={() => navigate("/")} />;
}

export default App;
