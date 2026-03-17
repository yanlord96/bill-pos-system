import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  TableProperties,
  UtensilsCrossed,
  Users,
  Clock,
  ShoppingCart,
  Wallet,
  ChevronDown,
  ChevronRight,
  LogOut,
  CircleDot,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const allMainLinks = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/sessions", label: "Sessions", icon: Clock },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/financial", label: "Financial", icon: Wallet, ownerOnly: true },
];

const managementLinks = [
  { to: "/tables", label: "Tables", icon: TableProperties },
  { to: "/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/clients", label: "Clients", icon: Users },
];

interface Props {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function Sidebar({ theme, onToggleTheme }: Props) {
  const [managementOpen, setManagementOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const mainLinks = allMainLinks.filter(
    (link) => !link.ownerOnly || user?.role === "owner"
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-[280px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen">
      {/* Brand */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
          <CircleDot className="text-white" size={22} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">BILL HOUSE</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Your Billiard POS</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4 overflow-y-auto space-y-6">
        {/* Main Section */}
        <div className="space-y-1">
          {mainLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-primary-500 text-white shadow-sm shadow-primary-200 dark:shadow-primary-900/30"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200"
                }`
              }
            >
              <link.icon size={20} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Management Section */}
        <div>
          <button
            onClick={() => setManagementOpen(!managementOpen)}
            className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hover:text-gray-500 dark:hover:text-gray-400"
          >
            <span>Management</span>
            {managementOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {managementOpen && (
            <div className="mt-1 space-y-1">
              {managementLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? "bg-primary-500 text-white shadow-sm shadow-primary-200 dark:shadow-primary-900/30"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200"
                    }`
                  }
                >
                  <link.icon size={20} />
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom User Info + Theme Toggle + Logout */}
      <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800">
        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 mb-2"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-primary-500">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.username}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
