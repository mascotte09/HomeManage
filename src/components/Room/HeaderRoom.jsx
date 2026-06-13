import { useNavigate, useParams } from "react-router-dom";
import {
  FiHome,
  FiFileText,
  FiDollarSign,
  FiCreditCard,
  FiBarChart2,
  FiArrowLeft,
} from "react-icons/fi";

const NAV = [
  {
    label: "Phòng",
    icon: FiHome,
    color: "text-stone-600",
    bg: "bg-stone-100",
    path: (id) => `/rooms/${id}`,
  },
  {
    label: "Hóa Đơn",
    icon: FiFileText,
    color: "text-green-600",
    bg: "bg-green-50",
    path: (id) => `/invoicesInMonth/${id}`,
  },
  {
    label: "Thu Tiền",
    icon: FiDollarSign,
    color: "text-blue-600",
    bg: "bg-blue-50",
    path: (id) => `/payment/${id}`,
  },
  {
    label: "Chi Phí",
    icon: FiCreditCard,
    color: "text-red-500",
    bg: "bg-red-50",
    path: (id) => `/expense/${id}`,
  },
  {
    label: "Báo Cáo",
    icon: FiBarChart2,
    color: "text-amber-500",
    bg: "bg-amber-50",
    path: (id) => `/statistic/${id}`,
  },
];

export default function HeaderRoom() {
  const navigate = useNavigate();
  const { houseId } = useParams();

  return (
    <header className="bg-white border-b border-stone-200 flex-shrink-0 m-0 p-0">
      {/* Back strip */}
      <div className="px-4 h-10 flex items-center border-b border-stone-100">
        <button
          onClick={() => navigate("/houses")}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
        >
          <FiArrowLeft size={15} />
          Danh sách nhà
        </button>
      </div>

      {/* Action nav */}
      <div className="flex">
        {NAV.map(({ label, icon: Icon, color, bg, path }) => (
          <button
            key={label}
            onClick={() => navigate(path(houseId))}
            className="flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 hover:bg-stone-50 active:scale-95 transition"
          >
            <span className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon size={16} className={color} />
            </span>
            <span className="text-[11px] font-medium text-stone-600 leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </header>
  );
}
