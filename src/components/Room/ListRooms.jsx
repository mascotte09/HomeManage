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
                .eq("home_id", houseId)
                .order("room_name", {
                    ascending: true,
                });

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

    // Delete room
    async function handleDeleteRoom() {

        const roomId =
            roomsState.selectedRoomId;

        if (!roomId) return;

        // GET PHOTOS
        const {
            data: photos,
            error: photosFetchError,
        } = await supabase
            .from("photos")
            .select("*")
            .eq("room_id", roomId);

        if (photosFetchError) {

            console.log(
            photosFetchError.message
            );

            return;
        }

        // DELETE FILES IN STORAGE
        for (const photo of photos || []) {

            if (!photo.image_url) continue;

            // EXTRACT FILE PATH
            const path =
            photo.image_url.split(
                "/storage/v1/object/public/roomphotos/"
            )[1];

            if (!path) continue;

            const {
            error: storageError,
            } = await supabase.storage
            .from("roomphotos")
            .remove([path]);

            if (storageError) {

            console.log(
                storageError.message
            );
            }
        }

        // DELETE PHOTO RECORDS
        const {
            error: photosDeleteError,
        } = await supabase
            .from("photos")
            .delete()
            .eq("room_id", roomId);

        if (photosDeleteError) {

            console.log(
            photosDeleteError.message
            );

            return;
        }

        // DELETE ROOM
        const { error } = await supabase
            .from("rooms")
            .delete()
            .eq("id", roomId);

        if (error) {

            console.log(error.message);

            alert("Failed to delete room");

            return;
        }

        // UPDATE STATE
        setRoomsState((prev) => ({
            ...prev,

            selectedRoomId: undefined,

            rooms: prev.rooms.filter(
            (room) =>
                room.id !== roomId
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
                    handleDeleteRoom
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