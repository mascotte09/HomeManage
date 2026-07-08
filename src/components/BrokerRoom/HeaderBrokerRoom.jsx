import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiCreditCard,
  FiBarChart2,
  FiArrowLeft,
} from "react-icons/fi";

const NAV = [
  {
    label: "Chốt Thuê",
    icon: FiGrid,
    color: "text-stone-600",
    bg: "bg-stone-100",
    path: (id) => `/rooms/${id}`,
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

export default function HeaderRoom({ backPath = "/houses" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { houseId } = useParams();

  // Determine which button is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-blue-200 flex-shrink-0 m-0 p-0 shadow-sm">
      {/* Back strip */}
      <div className="px-4 h-10 flex items-center border-b border-blue-100 bg-white/50">
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 active:scale-95 transition"
        >
          <FiArrowLeft size={15} />
          Danh sách nhà
        </button>
      </div>

      {/* Action nav */}
      <div className="flex">
        {NAV.map(({ label, icon: Icon, color, bg, path }) => {
          const active = isActive(path(houseId));
          return (
            <button
              key={label}
              onClick={() => navigate(path(houseId))}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 transition relative group ${
                active
                  ? "bg-white/70 border-b-2 border-blue-600"
                  : "hover:bg-white/40 active:scale-95"
              }`}
            >
              <span className={`w-8 h-8 rounded-lg ${active ? "bg-blue-100 shadow-md" : bg} flex items-center justify-center transition-all`}>
                <Icon size={16} className={active ? "text-blue-600 font-bold" : color} />
              </span>
              <span className={`text-[11px] font-medium leading-tight transition-all ${
                active ? "text-blue-600 font-bold" : "text-stone-600"
              }`}>
                {active && "⭐ "}
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
