export default function Header({ onLogout }) {
  return (
    <header className="bg-gray-200 text-white px-3 py-0 flex justify-between items-center m-0">
   
      <div>
        <h1 className="text-lg font-bold text-stone-800">
          🏠 Quản Trọ
        </h1>

        
      </div>

      <button
        onClick={onLogout}
        className="
          w-10 h-10
          rounded-full
          bg-red-50
          text-red-600
        "
      >
        🚪
      </button>
    </header>
  );
}