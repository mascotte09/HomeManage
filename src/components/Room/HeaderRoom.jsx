import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

export default function Header() {
    const navigate = useNavigate();
    const { houseId } = useParams();
    return (
            <header className="bg-gray-800 text-white px-3 py-0 flex justify-between items-center m-0">
   
                <h1 className="text-2xl font-bold">
                    Room Management
                </h1>
   
                <div className="flex gap-3">
   
                    <button
                        onClick={() =>  navigate(`/rooms/${houseId}`)}
                        className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
                    >
                        Rooms
                    </button>
   
                    <button
                        onClick={() => navigate(`/invoicesInMonth/${houseId}`)}
                        className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded"
                    >
                        Invoices
                    </button>
   
                    <button className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded">
                        Tenants
                    </button>
   
                    <button className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded text-black">
                        Reports
                    </button>
   
                    <button className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">
                        Logout
                    </button>
   
                </div>
            </header>
   
   
  );
}