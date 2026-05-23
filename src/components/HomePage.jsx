import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./HeaderHome";
import ListRooms from "./Room/ListRooms";
import ListInvoices from "./Invoice/ListInvoices";

export default function HomePage({ user }) {

    return (
        <BrowserRouter>

            <Header />

            <Routes>

                <Route
                    path="/"
                    element={<ListRooms user_id={user.id} />}
                />

                <Route
                    path="/rooms"
                    element={<ListRooms user_id={user.id} />}
                />

                <Route
                    path="/invoices"
                    element={<ListInvoices user_id={user.id} />}
                />

            </Routes>

        </BrowserRouter>
    );
}