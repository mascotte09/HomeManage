import Signup from "./components/Signup.jsx";
import Login from "./components/StateLogin.jsx";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import RoomPage from './components/Room/RoomPage.jsx'
import BrokerRoomPage from './components/BrokerRoom/BrokerRoomPage.jsx';

import { BrowserRouter, Routes, Route } from "react-router-dom";

import HeaderHouse from "./components/House/HeaderHouse";
import HeaderBrokerHouse from "./components/BrokerHouse/HeaderBrokerHouse.jsx";
import FooterHouse from "./components/House/FooterHouse";
import HeaderRoom from "./components/Room/HeaderRoom";
import BrokerHeaderRoom from "./components/BrokerRoom/HeaderBrokerRoom.jsx";
import VacantRoomsPage from "./components/BrokerRoom/VacantRoomsPage.jsx";
import HousePage from "./components/House/HousePage.jsx";
import InvoicesInMonth from "./components/Invoice/InvoicesInMonth";
import Invoices from "./components/Invoice/Invoices";
import BrokerInvoices from "./components/BrokerInvoice/BrokerInvoices";
import BrokerInvoicesHouse from "./components/BrokerInvoice/BrokerInvoicesHouse";
import ListExpenses from "./components/Expense/ListExpenses.jsx";
import ListPayments from "./components/Payment/ListPayments.jsx";
import MonthlyStatistic from "./components/Report/HouseMonthlyStatistic.jsx";
import BrokerMonthlyStatistic from "./components/Report/BrokerMonthlyStatistic.jsx";
import SettingsHouse from "./components/Settings.jsx";
import Help from "./components/Help.jsx";
import BrokerHousePage from "./components/BrokerHouse/BrokerHousePage.jsx";
import BrokerRentalForm from "./components/BrokerInvoice/BrokerRentalForm.jsx";
import { normalizeUserType } from "./utils/userType";

import { useNavigate } from "react-router-dom";


function App() {
    const [showSignup, setShowSignup] = useState(false);
    const [currentUser, setCurrentUser] = useState(undefined);

    useEffect(() => {
        const savedUser = localStorage.getItem("currentUser");
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setCurrentUser({
                ...parsedUser,
                user_type: normalizeUserType(parsedUser.user_type),
            });
        } else {
            setCurrentUser(null);
        }
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem("currentUser");
        setCurrentUser(null);
    };

    function handleSignupSuccess() {
        setShowSignup(false);
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* ── Route công khai, không cần login ── */}
                <Route path="/vacantRooms/:houseId" element={<VacantRoomsPage />} />

                {/* ── Tất cả route còn lại đi qua gate login ── */}
                <Route
                    path="/*"
                    element={
                        <AuthGate
                            currentUser={currentUser}
                            showSignup={showSignup}
                            setShowSignup={setShowSignup}
                            handleSignupSuccess={handleSignupSuccess}
                            handleLogout={handleLogout}
                            setCurrentUser={setCurrentUser}
                        />
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

// ─── Gate login cho toàn bộ app (trừ route public) ─────────────────────────
function AuthGate({
    currentUser,
    showSignup,
    setShowSignup,
    handleSignupSuccess,
    handleLogout,
    setCurrentUser,
}) {
    if (currentUser === undefined) {
        return <div>Loading...</div>;
    }

    if (!currentUser) {
        if (showSignup) {
            return (
                <Signup
                    onBackToLogin={() => setShowSignup(false)}
                    onSignupSuccess={handleSignupSuccess}
                />
            );
        }
        return (
            <Login
                onSignupClick={() => setShowSignup(true)}
                onLoginSuccess={(user) => setCurrentUser(user)}
            />
        );
    }

    const isBroker = normalizeUserType(currentUser?.user_type) === "broker";
    const RoomPageView = isBroker ? BrokerRoomPage : RoomPage;
    const RoomHeaderView = isBroker ? BrokerHeaderRoom : HeaderRoom;

    return (
        <Routes>
            <Route
                path="/"
                element={
                    <div className="flex flex-col h-dvh">
                        <HeaderHouseWithNav
                            onLogout={handleLogout}
                            showBrokerPage={isBroker}
                            isBroker={isBroker}
                        />
                        <div className="flex-1 overflow-y-auto">
                            {isBroker ? (
                                <BrokerHousePage user_id={currentUser.id} />
                            ) : (
                                <HousePage user_id={currentUser.id} />
                            )}
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
                            onLogout={handleLogout}
                            showBrokerPage={isBroker}
                            isBroker={isBroker}
                        />
                        <div className="flex-1 overflow-y-auto">
                            {isBroker ? (
                                <BrokerHousePage user_id={currentUser.id} />
                            ) : (
                                <HousePage user_id={currentUser.id} />
                            )}
                        </div>
                        <FooterHouse />
                    </div>
                }
            />
            <Route path="/settings" element={<SettingsHouseWithNav user={currentUser} />} />
            <Route path="/help" element={<HelpHouseWithNav user={currentUser} />} />
            <Route
                path="/broker"
                element={
                    <div className="flex flex-col h-dvh">
                        <HeaderHouseWithNav
                            onLogout={handleLogout}
                            showBrokerPage={isBroker}
                            isBroker={isBroker}
                        />
                        <div className="flex-1 overflow-y-auto">
                            <BrokerHousePage user_id={currentUser.id} />
                        </div>
                        <FooterHouse />
                    </div>
                }
            />
            <Route path="/broker/rooms/:houseId" element={<BrokerRoomPage />} />
            <Route
                path="/broker/invoices/:houseId"
                element={
                    <div className="flex flex-col h-dvh">
                        <RoomHeaderView backPath={isBroker ? "/broker" : "/houses"} onLogout={handleLogout} />
                        <div className="flex-1 overflow-y-auto">
                            <BrokerInvoicesHouse />
                        </div>
                    </div>
                }
            />
            <Route
                path="/broker/rentals/:rentalId"
                element={
                    <div className="flex flex-col h-dvh">
                        <RoomHeaderView backPath={isBroker ? "/broker" : "/houses"} onLogout={handleLogout} />
                        <div className="flex-1 overflow-y-auto">
                            <BrokerRentalForm />
                        </div>
                    </div>
                }
            />
            <Route path="/rooms/:houseId" element={<RoomPageView />} />
            <Route
                path="/invoicesInMonth/:houseId"
                element={
                    <div className="flex flex-col h-dvh">
                        <RoomHeaderView backPath={isBroker ? "/broker" : "/houses"} onLogout={handleLogout} />
                        <div className="flex-1 overflow-y-auto">
                            <InvoicesInMonth />
                        </div>
                    </div>
                }
            />
            <Route
                path="/invoicesRoom/:roomId/:houseId"
                element={
                    <div className="flex flex-col h-dvh">
                        <RoomHeaderView backPath={isBroker ? "/broker" : "/houses"} onLogout={handleLogout} />
                        <div className="flex-1 overflow-y-auto">
                            {isBroker ? <BrokerInvoices /> : <Invoices />}
                        </div>
                    </div>
                }
            />
            <Route
                path="/payment/:houseId"
                element={
                    <div className="flex flex-col h-dvh">
                        <RoomHeaderView backPath={isBroker ? "/broker" : "/houses"} onLogout={handleLogout} />
                        <div className="flex-1 overflow-y-auto">
                            <ListPayments />
                        </div>
                    </div>
                }
            />
            <Route
                path="/expense/:houseId"
                element={
                    <div className="flex flex-col h-dvh">
                        <RoomHeaderView backPath={isBroker ? "/broker" : "/houses"} onLogout={handleLogout} />
                        <div className="flex-1 overflow-y-auto">
                            <ListExpenses />
                        </div>
                    </div>
                }
            />
            <Route
                path="/statistic/:houseId"
                element={
                    <div className="flex flex-col h-dvh">
                        <RoomHeaderView backPath={isBroker ? "/broker" : "/houses"} onLogout={handleLogout} />
                        <div className="flex-1 overflow-y-auto">
                            <MonthlyStatistic />
                        </div>
                    </div>
                }
            />
            <Route
                path="/broker_statistic/:houseId"
                element={
                    <div className="flex flex-col h-dvh">
                        <RoomHeaderView backPath={isBroker ? "/broker" : "/houses"} onLogout={handleLogout} />
                        <div className="flex-1 overflow-y-auto">
                            <BrokerMonthlyStatistic />
                        </div>
                    </div>
                }
            />
        </Routes>
    );
}

// Bọc HeaderHouse để gắn điều hướng sang trang /settings
// (đặt trong file App.jsx vì cần useNavigate, hook chỉ dùng được bên trong BrowserRouter)
function HeaderHouseWithNav({ onLogout, showBrokerPage = false, isBroker = false }) {
    const navigate = useNavigate();

    if (isBroker) {
        return (
            <HeaderBrokerHouse
                onLogout={onLogout}
                onSettings={() => navigate("/settings")}
                onHelp={() => navigate("/help")}
            />
        );
    }

    return (
        <HeaderHouse
            onLogout={onLogout}
            onSettings={() => navigate("/settings")}
            onHelp={() => navigate("/help")}
        />
    );
}

// Bọc SettingsHouse để nút "Quay lại" điều hướng về trang chủ
function SettingsHouseWithNav({ user, onLogout, isBroker = false }) {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col h-dvh">
            {/* <HeaderHouseWithNav
                onLogout={onLogout}
                isBroker={isBroker}
            /> */}
            <div className="flex-1 overflow-y-auto">
                <SettingsHouse
                    user={user}
                    onBack={() => navigate("/")}
                />
            </div>
            <FooterHouse />
        </div>
    );
}

function HelpHouseWithNav({ user, onLogout, isBroker }) {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col h-dvh">
            {/* <HeaderHouseWithNav
                onLogout={onLogout}
                isBroker={isBroker}
            /> */}
            <div className="flex-1 overflow-y-auto">
                <Help
                    user={user}
                    onBack={() => navigate("/")}
                />
            </div>
            <FooterHouse />
        </div>
    );
}

export default App;
