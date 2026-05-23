import { useEffect, useState } from "react";
import { supabase } from '../../supabase'
import RoomsSidebar from "./RoomsSidebar.jsx";
import NewRoom from "./NewRoom.jsx";
import NoProjectSelected from "./NoRoomSelected.jsx";
import SelectedProject from "./SelectedRoom.jsx";

export default function ListRooms({user_id}) {
const [roomsState, setRoomsState] = useState({
        selectedHomeId: undefined,
        rooms: [],
        invoices: [],
    });
    // store homes
    const [homeID, setHomes] = useState('');
   
    // load homes/rooms for this user
    useEffect(() => {
        fetchUserHomes();
    }, []);
   
    async function fetchUserHomes() {
        // Step 1: get homes of this user
        const { data: homesData, error: homesError } = await supabase
            .from("homes")
            .select("id, name")
            .eq("userID", user_id);

        if (homesError) {
            console.log(homesError.message);
            return;
        }

        // no homes found
        if (!homesData || homesData.length === 0) {
           
            setRoomsState((prevState) => {
                return {
                    ...prevState,
                    rooms: [],
                };
            });

            return;
        }
        // save homes into state
        setHomes(homesData[0].id);

        // extract home ids
        const homeIds = homesData.map((home) => home.id);

        // Step 2: get rooms belonging to those homes
        const { data: roomsData, error: roomsError } = await supabase
            .from("rooms")
            .select("*")
            .in("home_id", homeIds);

        if (roomsError) {
            console.log(roomsError.message);
            return;
        }

        // store rooms
        setRoomsState((prevState) => {
            return {
                ...prevState,
                rooms: roomsData || [],
            };
        });
    }
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
        content = <NewRoom homeID={homeID} onAdd={handleAddProject} onCancel={handleCancelAddProject} />;
    } else if (roomsState.selectedHomeId === undefined) {
        content = <NoProjectSelected onStartAddProject={handleStartAddProject} />;
    } else {
        const selectedProject = roomsState.rooms.find(
            (project) => project.id === roomsState.selectedHomeId
        );
        content = (
            <SelectedProject
                room={selectedProject}
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
