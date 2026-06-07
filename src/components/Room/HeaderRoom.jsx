import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import {
    FaFileInvoiceDollar,
    FaMoneyBillWave,
    FaWallet,
    FaChartBar,
} from "react-icons/fa";

export default function Header({ onLogout }) {
    const navigate = useNavigate();
    const { houseId } = useParams();
    return (
        <header className="bg-gray-200 text-white px-3 py-2 flex justify-between items-center m-0">
            <div className="flex gap-2">

                {/* Hóa đơn */}
                <button
                    onClick={() =>
                        navigate(`/invoicesInMonth/${houseId}`)
                    }
                    className="
        flex flex-col items-center justify-center
        w-20 h-16 rounded-xl
        bg-white text-gray-700
        shadow-md hover:shadow-lg
        hover:-translate-y-0.5
        transition-all
      "
                >
                    <FaFileInvoiceDollar
                        size={22}
                        className="text-green-500"
                    />
                    <span className="text-[11px] mt-1">
                        Hóa Đơn
                    </span>
                </button>

                {/* Thu tiền */}
                <button
                    onClick={() =>
                        navigate(`/payment/${houseId}`)
                    }
                    className="
        flex flex-col items-center justify-center
        w-20 h-16 rounded-xl
        bg-white text-gray-700
        shadow-md hover:shadow-lg
        hover:-translate-y-0.5
        transition-all
      "
                >
                    <FaMoneyBillWave
                        size={22}
                        className="text-blue-500"
                    />
                    <span className="text-[11px] mt-1">
                        Thu Tiền
                    </span>
                </button>

                {/* Chi phí */}
                <button
                    onClick={() =>
                        navigate(`/expense/${houseId}`)
                    }
                    className="
        flex flex-col items-center justify-center
        w-20 h-16 rounded-xl
        bg-white text-gray-700
        shadow-md hover:shadow-lg
        hover:-translate-y-0.5
        transition-all
      "
                >
                    <FaWallet
                        size={22}
                        className="text-red-500"
                    />
                    <span className="text-[11px] mt-1">
                        Chi Phí
                    </span>
                </button>

                {/* Báo cáo */}
                <button
                    onClick={() =>
                        navigate(`/statistic/${houseId}`)
                    }
                    className="
        flex flex-col items-center justify-center
        w-20 h-16 rounded-xl
        bg-white text-gray-700
        shadow-md hover:shadow-lg
        hover:-translate-y-0.5
        transition-all
      "
                >
                    <FaChartBar
                        size={22}
                        className="text-yellow-500"
                    />
                    <span className="text-[11px] mt-1">
                        Báo Cáo
                    </span>
                </button>


            </div>
        </header>


    );
}