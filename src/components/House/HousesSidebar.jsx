import Button from "../Button.jsx";

export default function HousesSidebar({ onStartAddHouse, homes, onSelectHome, selectedHomeId }) {
    return (
        <aside className="w-1/3 px-4 py-16 bg-stone-900 text-stone-50 md:w-72 rounded-r-xl">
            <h2 className="mb-8 font-bold uppercase md:text-xl text-stone-200">Nhà trọ</h2>
            <div>
                <Button onClick={onStartAddHouse}>Tạo mới</Button>
            </div>

            <ul className="mt-8 -mx-4">
                {homes.map((house) => {
                    let cssClasses =
    "block w-full text-left py-2 px-3 my-1 rounded-md hover:text-stone-200 hover:bg-stone-800";

                    if (house.id === selectedHomeId) {
                        cssClasses += " bg-stone-800 text-stone-200";
                       
                    } else {
                        cssClasses += " text-stone-400";
                    }

                    return (
                        <li key={house.id}>
                            <button className={cssClasses} onClick={() => onSelectHome(house.id)}>
                                {house.name + "-" + house.address}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
}