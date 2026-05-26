import Button from "../Button.jsx";

export default function HousesSidebar({
    onStartAddHouse,
    homes,
    onSelectHome,
    selectedHomeId,
}) {

    return (

        <aside className="w-1/3 px-4 py-8 bg-stone-900 text-stone-50 md:w-72 rounded-r-xl flex flex-col">

            {/* Top */}
            <div>

                <h2 className="mb-5 text-lg font-bold uppercase text-stone-200">
                    Nhà trọ
                </h2>

                <div className="mb-4">
                    <Button onClick={onStartAddHouse}>
                        Tạo mới
                    </Button>
                </div>

                <ul className="space-y-1">

                    {homes.map((house) => {

                        let cssClasses =
                            "w-full text-left px-2 py-1 text-sm rounded-sm hover:text-stone-200 hover:bg-stone-800 leading-tight";

                        if (
                            house.id ===
                            selectedHomeId
                        ) {

                            cssClasses +=
                                " bg-stone-800 text-stone-200";

                        } else {

                            cssClasses +=
                                " text-stone-400";
                        }

                        return (
                            <li key={house.id}>

                                <button
                                    className={cssClasses}
                                    onClick={() =>
                                        onSelectHome(
                                            house.id
                                        )
                                    }
                                >
                                    {house.name}
                                </button>

                            </li>
                        );
                    })}

                </ul>

            </div>

        </aside>
    );
}