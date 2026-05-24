export default function Header({ onLogout }) {
    return (
            <header className="bg-gray-800 text-white px-3 py-0 flex justify-between items-center m-0">
   
                <h1 className="text-2xl font-bold">
                    Quản Trọ
                </h1>
   
                <div className="flex gap-3">
      
                    <button className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded text-black">
                        Reports
                    </button>
   
                    <button
                        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
                        onClick={onLogout}
                    >
                        Logout
                    </button>
   
                </div>
            </header>
  );
}