import { MdLogout, MdSettings, MdHelpOutline, MdStorefront } from "react-icons/md";
export default function Header({ onLogout, onSettings, onHelp, onBrokerPage }) {
    return (
        <header className="bg-white border-b border-stone-200 px-4 h-20 flex justify-between items-center flex-shrink-0">
            <h1 className="text-left text-xl font-bold uppercase text-stone-500">
                🏠 Quản Trọ
            </h1>

            <div className="flex items-center gap-2">
                {onBrokerPage && (
                    <button
                        onClick={onBrokerPage}
                        className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition active:scale-95"
                        title="Trang rao nhà & phòng"
                    >
                        <MdStorefront size={20} />
                    </button>
                )}
                <button
                    onClick={onHelp}
                    className="w-9 h-9 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center hover:bg-stone-200 transition active:scale-95"
                    title="Trợ giúp"
                >
                    <MdHelpOutline size={20} />
                </button>
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
