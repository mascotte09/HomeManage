import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./HeaderRoom";
import ListRooms from "./ListRooms";
export default function RoomPage({ user }) {

    return (
        <BrowserRouter>

            <Header />

            <Routes>

                <Route
                    path="/"
                    element={<ListRooms  />}
                />

                <Route
                    path="/rooms"
                    element={<ListRooms  />}
                />

            </Routes>

        </BrowserRouter>
    );
}