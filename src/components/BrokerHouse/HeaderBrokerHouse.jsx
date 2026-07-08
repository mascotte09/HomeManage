import { MdLogout, MdSettings } from "react-icons/md";
export default function HeaderBrokerHouse({ onLogout, onSettings, onBrokerPage }) {
    return (
        <header className="bg-white border-b border-stone-200 px-4 h-20 flex justify-between items-center flex-shrink-0">
            <h1 className="text-left text-xl font-bold uppercase text-stone-500">
                🏠 Trợ lý Môi Giới
            </h1>

            <div className="flex items-center gap-2">
                

                <button
                    onClick={onSettings}
                    className="w-9 h-9 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center hover:bg-stone-200 transition active:scale-95"
                    title="Cài đặt"
                >
                    <MdSettings size={20} />
                </button>

                <button
                    onClick={onLogout}
                    className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition active:scale-95"
                    title="Đăng xuất"
                >
                    <MdLogout size={20} />
                </button>
            </div>
        </header>
    );
}
