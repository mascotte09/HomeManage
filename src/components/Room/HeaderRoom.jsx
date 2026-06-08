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
    const menuButtonClass = `
  flex flex-col items-center justify-center
  w-20 h-16 rounded-xl
  bg-gray-200 text-gray-700
  shadow-[0_0_15px_3px_rgba(255,255,255,0.7)]
  hover:shadow-[0_0_25px_6px_rgba(255,255,255,1)]
  hover:-translate-y-1
  transition-all duration-200
`;
    return (
        <header className="bg-gray-700 text-white px-3 py-2 flex justify-center items-center m-0">
            <div className="flex gap-2">

                {/* Hóa đơn */}
                <button
                    onClick={() =>
                        navigate(`/invoicesInMonth/${houseId}`)
                    }
                     className={menuButtonClass}
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
                    onClick={() => navigate(`/payment/${houseId}`)}
                    className={menuButtonClass}
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
                    className={menuButtonClass}
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
                    className={menuButtonClass}
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