import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useTheme } from "../hooks/useTheme";

export default function Layout() {
  const { theme, toggle } = useTheme();

  return (
    <div className="flex h-screen bg-surface dark:bg-surface-dark">
      <Sidebar theme={theme} onToggleTheme={toggle} />
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
