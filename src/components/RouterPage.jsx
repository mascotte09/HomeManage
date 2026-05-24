import { BrowserRouter, Routes, Route } from "react-router-dom";

import HeaderHouse from "./House/HeaderHouse";
import HeaderRoom from "./Room/HeaderRoom";
import ListHouses from "./House/ListHouses";
import InvoicesInMonth from "./Invoice/InvoicesInMonth";

import ListRooms from "./Room/ListRooms";
export default function RouterPage({ user }) {

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        <>
                            <HeaderHouse />
                            <ListHouses user_id={user.id} />
                        </>
                    }
                />
                <Route
                    path="/houses"
                    element={
                        <>
                            <HeaderHouse />
                            <ListHouses user_id={user.id} />
                        </>
                    }
                />
                <Route path="/rooms/:houseId" 
                    element={
                        <>
                            <HeaderRoom />
                            <ListRooms />
                        </>
                    } />

                <Route path="/invoicesInMonth/:houseId" 
                    element={
                        <>
                            <HeaderRoom />
                            <InvoicesInMonth />
                        </>
                    } />
            </Routes>

        </BrowserRouter>
    );
}