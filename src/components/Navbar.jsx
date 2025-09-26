// src/components/Navbar.jsx
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
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

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem",
        backgroundColor: "#f8f9fa",
        borderBottom: "1px solid #ddd",
      }}
    >
      <h2 style={{ margin: 0 }}>Tahfidz</h2>
      <button
        onClick={handleLogout}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#dc3545",
          border: "none",
          borderRadius: "4px",
          color: "white",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </nav>
  );
}
