import { useEffect, useState, useCallback  } from "react";
import { supabase } from '../../supabase'
import HousesSidebar from "./HousesSidebar.jsx";
import NewHouse from "./NewHouse.jsx";
import NoHouseSelected from "./NoHouseSelected.jsx";
import SelectedHouse from "./SelectedHouse.jsx";

export default function ListHouses({user_id}) {
    const [housesState, setHousesState] = useState({
            selectedHomeId: undefined,
            houses: [],
        });
    // store homes
    //const [userID, setHomes] = useState('');
   
    const fetchUserHomes = useCallback(async () => {
        // Step 1: get homes of this user
        const { data: homesData, error: homesError } = await supabase
            .from("homes")
            .select("*")
            .eq("userID", user_id);

        if (homesError) {
            console.log(homesError.message);
            return;
        }

        // no homes found
        if (!homesData || homesData.length === 0) {
            setHousesState((prevState) => ({
                ...prevState,
                houses: [],
            }));

            return;
        }

        // store houses
        setHousesState((prevState) => ({
            ...prevState,
            houses: homesData || [],
        }));
    }, [user_id]);

    useEffect(() => {
        fetchUserHomes();
    }, [fetchUserHomes]);

    // * Project handlers
    function handleSelectHouse(id) {
        setHousesState((prevState) => {
            return { ...prevState, selectedHomeId: id };
        });
    }

    function handleStartAddHouse() {
        setHousesState((prevState) => {
            return { ...prevState, selectedHomeId: null };
        });
    }

    function handleCancelAddHouse() {
        setHousesState((prevState) => {
            return { ...prevState, selectedHomeId: undefined };
        });
    }

    function handleAddHouse(houseData) {
        setHousesState((prevState) => {
            return { ...prevState, selectedHomeId: undefined, houses: [...prevState.houses, houseData] };
        });
    }

    function handleDeleteHome() {
        setHousesState((prevState) => {
            return {
                ...prevState,
                selectedHomeId: undefined,
                houses: prevState.houses.filter((home) => home.id !== prevState.selectedHomeId),
            };
        });
    }

   

    let content;
    if (housesState.selectedHomeId === null) {
        content = <NewHouse userID={user_id} onAdd={handleAddHouse} onCancel={handleCancelAddHouse} />;
    } else if (housesState.selectedHomeId === undefined) {
        content = <NoHouseSelected onStartAddHouse={handleStartAddHouse} />;
    } else {
        const selectedHouse = housesState.houses.find(
            (project) => project.id === housesState.selectedHomeId
        );
        content = (
            <SelectedHouse
                house={selectedHouse}
                onDelete={handleDeleteHome}
                refreshHouses={fetchUserHomes}
            />
        );
    }

    return (
        <div className="h-screen flex flex-col m-0 p-0">

        {/* Main Content */}
        <main className="flex-1 flex gap-2 mt-0 pt-0">

            <HousesSidebar
                onStartAddHouse={handleStartAddHouse}
                homes={housesState.houses}
                onSelectHome={handleSelectHouse}
                selectedHomeId={housesState.selectedHomeId}
            />

            {content}

        </main>
    </div>
    )
}
