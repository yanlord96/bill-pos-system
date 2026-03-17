import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Tables from "./pages/Tables";
import Menu from "./pages/Menu";
import Clients from "./pages/Clients";
import Sessions from "./pages/Sessions";
import SessionDetail from "./pages/SessionDetail";
import CreateOrder from "./pages/CreateOrder";
import Orders from "./pages/Orders";
import QuickOrder from "./pages/QuickOrder";
import Financial from "./pages/Financial";
import Login from "./pages/Login";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/tables" element={<Tables />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/sessions/:id" element={<SessionDetail />} />
        <Route path="/sessions/:id/order" element={<CreateOrder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/new" element={<QuickOrder />} />
        <Route
          path="/financial"
          element={
            <ProtectedRoute requiredRole="owner">
              <Financial />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
