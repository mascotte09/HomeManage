import { useEffect, useState, useCallback  } from "react";
import { supabase } from '../../supabase'
import RoomsSidebar from "./RoomsSidebar.jsx";
import NewRoom from "./NewRoom.jsx";
import NoProjectSelected from "./NoRoomSelected.jsx";
import SelectedProject from "./SelectedRoom.jsx";
import { useParams } from "react-router-dom";

export default function ListRooms() {
    const [roomsState, setRoomsState] = useState({
            selectedHomeId: undefined,
            rooms: [],
            invoices: [],
        });
    // store homes
    //const [homeID, setHomes] = useState('');
    const { houseId } = useParams();

    const fetchUserHomes = useCallback(async () => {
       
        // get rooms belonging to house id
        const { data: roomsData, error: roomsError } = await supabase
            .from("rooms")
            .select("*")
            .eq("home_id", houseId);

        if (roomsError) {
            console.log(roomsError.message);
            return;
        }

        // store rooms
        setRoomsState((prevState) => ({
            ...prevState,
            rooms: roomsData || [],
        }));
    }, [houseId]);

    useEffect(() => {
        fetchUserHomes();
    }, [fetchUserHomes]);

    // * Project handlers
    function handleSelectProject(id) {
        setRoomsState((prevState) => {
            return { ...prevState, selectedHomeId: id };
        });
    }

    function handleStartAddProject() {
        setRoomsState((prevState) => {
            return { ...prevState, selectedHomeId: null };
        });
    }

    function handleCancelAddProject() {
        setRoomsState((prevState) => {
            return { ...prevState, selectedHomeId: undefined };
        });
    }

    function handleAddProject(houseData) {
        setRoomsState((prevState) => {
            return { ...prevState, selectedHomeId: undefined, rooms: [...prevState.rooms, houseData] };
        });
    }

    function handleDeleteHome() {
        setRoomsState((prevState) => {
            return {
                ...prevState,
                selectedHomeId: undefined,
                rooms: prevState.rooms.filter((home) => home.id !== prevState.selectedHomeId),
            };
        });
    }

    // * Task handlers
    function handleAddTask(text) {
        const newTask = { text: text, projectId: roomsState.selectedHomeId, id: Math.random() };

        setRoomsState((prevState) => {
            return { ...prevState, invoices: [newTask, ...prevState.invoices] };
        });
    }

    function handleDeleteTask(id) {
        setRoomsState((prevState) => {
            return {
                ...prevState,
                invoices: prevState.invoices.filter((invoices) => invoices.id !== id),
            };
        });
    }

    let content;
    if (roomsState.selectedHomeId === null) {
        content = <NewRoom homeID={houseId} onAdd={handleAddProject} onCancel={handleCancelAddProject} />;
    } else if (roomsState.selectedHomeId === undefined) {
        content = <NoProjectSelected onStartAddProject={handleStartAddProject} />;
    } else {
        const selectedRoom = roomsState.rooms.find(
            (room) => room.id === roomsState.selectedHomeId
        );
        content = (
            <SelectedProject
                room={selectedRoom}
                onDelete={handleDeleteHome}
                tasks={roomsState.invoices}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                refreshRooms={fetchUserHomes}
            />
        );
    }

    return (
        <div className="h-screen flex flex-col m-0 p-0">

        {/* Main Content */}
        <main className="flex-1 flex gap-6 mt-0 pt-0">

            <RoomsSidebar
                onStartAddProject={handleStartAddProject}
                homes={roomsState.rooms}
                onSelectHome={handleSelectProject}
                selectedHomeId={roomsState.selectedHomeId}
            />

            {content}

        </main>
    </div>
    )
}
