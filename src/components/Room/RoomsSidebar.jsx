import Button from "../Button.jsx";
import { Link } from "react-router-dom";
export default function RoomsSidebar({ onStartAddProject, homes, onSelectHome, selectedHomeId, onLogout }) {
    return (
        <aside className="w-1/3 px-4 py-8 bg-stone-900 text-stone-50 md:w-72 rounded-r-xl flex flex-col justify-between">

            {/* Top */}
            <div>

                {/* Houses link */}
                <Link
                    to="/houses"
                    className="block mb-5 text-blue-400 hover:text-yellow-300 text-base font-bold"
                >
                    ← Danh Sách Nhà
                </Link>

                
                <div className="mb-4">
                    <Button onClick={onStartAddProject}>
                        Thêm Phòng
                    </Button>
                </div>

                <ul className="space-y-1">

                    {homes.map((project) => {

                        let cssClasses =
                            "w-full text-left px-2 py-1 text-sm rounded-sm hover:text-stone-200 hover:bg-stone-800 leading-tight";

                        if (
                            project.id ===
                            selectedHomeId
                        ) {

                            cssClasses +=
                                " bg-stone-800 text-stone-200";

                        } else {

                            cssClasses +=
                                " text-stone-400";
                        }

                        return (
                            <li key={project.id}>

                                <button
                                    className={cssClasses}
                                    onClick={() =>
                                        onSelectHome(
                                            project.id
                                        )
                                    }
                                >
                                    {project.room_name}
                                </button>

                            </li>
                        );
                    })}

                </ul>

            </div>          

        </aside>
    );
}