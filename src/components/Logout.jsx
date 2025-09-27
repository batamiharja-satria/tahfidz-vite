// src/components/Navbar.jsx
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    // langsung pindah ke login dulu
    navigate("/");

    // biarin signOut jalan di background
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err.message);
    }
  };

  return <span onClick={handleLogout}>KELUAR</span>;
}
