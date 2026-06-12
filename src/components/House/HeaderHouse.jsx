import { MdLogout } from "react-icons/md";
export default function Header({ onLogout }) {
    return (
        <header className="bg-white border-b border-stone-200 px-4 h-12 flex justify-between items-center flex-shrink-0">
            <h1 className="text-base font-semibold text-stone-800">
                🏠 Quản Trọ
            </h1>

            <button
                onClick={onLogout}
                className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition active:scale-95"
                title="Đăng xuất"
            >
                <MdLogout size={20} />
            </button>
        </header>
    );
}
