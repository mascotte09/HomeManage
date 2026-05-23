import { useEffect, useState, useCallback } from "react";
import { supabase } from '../../supabase'
import InvoicesSidebar from "./InvoicesSidebar.jsx";
import NewInvoice from "./NewInvoice.jsx";
import NoInvoiceSelected from "./NoInvoiceSelected.jsx";
import SelectedInvoice from "./SelectedInvoice.jsx";

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
   
    const fetchUserHomes = useCallback(async () => {
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
    }, [user_id]);
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

    function handleAddProject(projectData) {
        const newRoom = { ...projectData, id: Math.random() };

        setRoomsState((prevState) => {
            return { ...prevState, selectedHomeId: undefined, rooms: [...prevState.rooms, newRoom] };
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

    let content;
    if (roomsState.selectedHomeId === null) {
        content = <NewInvoice homeID={homeID} onAdd={handleAddProject} onCancel={handleCancelAddProject} />;
    } else if (roomsState.selectedHomeId === undefined) {
        content = <NoInvoiceSelected onStartAddProject={handleStartAddProject} />;
    } else {
        const selectedProject = roomsState.rooms.find(
            (project) => project.id === roomsState.selectedHomeId
        );
        content = (
            <SelectedInvoice
                project={selectedProject}
                onDelete={handleDeleteHome}
                tasks={roomsState.invoices}
            />
        );
    }

    return (
        <div className="h-screen flex flex-col m-0 p-0">

        {/* Main Content */}
        <main className="flex-1 flex gap-6 mt-0 pt-0">

            <InvoicesSidebar
                onStartAddProject={handleStartAddProject}
                projects={roomsState.rooms}
                onSelectProject={handleSelectProject}
                selectedHomeId={roomsState.selectedHomeId}
            />

            {content}

        </main>
    </div>
    )
}