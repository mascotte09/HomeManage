import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

export default function Header({ onLogout }) {
    const navigate = useNavigate();
    const { houseId } = useParams();
    return (
            <header className="bg-gray-800 text-white px-3 py-0 flex justify-between items-center m-0">
   
                {/* <h1 className="text-2xl font-bold tracking-tight">
                    QT
                </h1> */}
   
                <div className="flex gap-2"> 
                    
                    <button
                        onClick={() => navigate(`/invoicesInMonth/${houseId}`)}
                        className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded"
                    >
                        Hóa Đơn
                    </button>
   
                    <button
                        //onClick={() =>  navigate(`/rooms/${houseId}`)}
                        className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded"
                    >
                        Thu Tiền
                    </button>
                    <button
                        onClick={() => navigate(`/expense/${houseId}`)}
                        className="bg-red-500 hover:bg-green-600 px-3 py-1 rounded"
                    >
                        Chi Phí
                    </button>
   
                    <button 
                        onClick={() => navigate(`/statistic/${houseId}`)}
                        className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-black">
                        Báo Cáo
                    </button>
   
                    
                </div>
            </header>
   
   
  );
}