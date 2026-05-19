import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Punch from "./pages/Punch";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/Admin";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/punch" element={<Punch />} />
      <Route path="/employee-dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;