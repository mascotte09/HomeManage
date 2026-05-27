import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../supabase";

import RoomsSidebar from "./RoomsSidebar.jsx";
import NoProjectSelected from "./NoRoomSelected.jsx";
import SelectedRoom from "./SelectedRoom.jsx";

import { useParams } from "react-router-dom";

export default function ListRooms() {

    const [roomsState, setRoomsState] =
        useState({
            selectedRoomId: undefined,
            rooms: [],
            invoices: [],
        });

    const { houseId } = useParams();

    // Fetch rooms
    const fetchRooms = useCallback(
        async () => {

            const {
                data: roomsData,
                error: roomsError,
            } = await supabase
                .from("rooms")
                .select("*")
                .eq("home_id", houseId);

            if (roomsError) {
                console.log(
                    roomsError.message
                );
                return;
            }

            setRoomsState((prev) => ({
                ...prev,
                rooms: roomsData || [],
            }));
        },
        [houseId]
    );

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    // Select room
    function handleSelectProject(id) {

        setRoomsState((prev) => ({
            ...prev,
            selectedRoomId: id,
        }));
    }

    // Start add
    function handleStartAddProject() {

        setRoomsState((prev) => ({
            ...prev,
            selectedRoomId: null,
        }));
    }

    // Cancel add
    function handleCancelAddProject() {

        setRoomsState((prev) => ({
            ...prev,
            selectedRoomId: undefined,
        }));
    }

    // Delete room
    function handleDeleteRoom() {

        setRoomsState((prev) => ({
            ...prev,
            selectedRoomId: undefined,
            rooms: prev.rooms.filter(
                (room) =>
                    room.id !==
                    prev.selectedRoomId
            ),
        }));
    }

    let content;

    // CREATE ROOM
    if (
        roomsState.selectedRoomId ===
        null
    ) {

        content = (
            <SelectedRoom
                homeID={houseId}
                onDelete={
                    handleCancelAddProject
                }
                refreshRooms={fetchRooms}
            />
        );
    }

    // NOTHING SELECTED
    else if (
        roomsState.selectedRoomId ===
        undefined
    ) {

        content = (
            <NoProjectSelected
                onStartAddProject={
                    handleStartAddProject
                }
            />
        );
    }

    // SELECTED ROOM
    else {

        const selectedRoom =
            roomsState.rooms.find(
                (room) =>
                    room.id ===
                    roomsState.selectedRoomId
            );

        content = (
            <SelectedRoom
                homeID={houseId}
                room={selectedRoom}
                onDelete={
                    handleDeleteRoom
                }
                refreshRooms={
                    fetchRooms
                }
            />
        );
    }

    return (
        <div className="h-screen flex flex-col m-0 p-0">

            <main className="flex flex-1 w-full gap-2">

                <RoomsSidebar
                    onStartAddProject={
                        handleStartAddProject
                    }
                    homes={
                        roomsState.rooms
                    }
                    onSelectHome={
                        handleSelectProject
                    }
                    selectedHomeId={
                        roomsState.selectedRoomId
                    }
                />

                {content}

            </main>
        </div>
    );
}