// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AppHome from "./pages/AppHome";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/app" element={<AppHome />} />
        {/* ❌ Hapus ResetPassword, karena sekarang pakai reset-password.html */}
      </Routes>
    </Router>
  );
}
