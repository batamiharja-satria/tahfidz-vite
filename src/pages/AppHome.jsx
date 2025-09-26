import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import Navbar from "../components/Navbar";

export default function AppHome() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/"); // kalau tidak ada session, balik ke login
      } else {
        setLoading(false);
      }
    };

    checkSession();

    // listen kalau session berubah (misal logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return <p style={{ padding: "2rem" }}>Loading...</p>;
  }

  return (
    <div>
      <Navbar />
      <div style={{ padding: "2rem" }}>
        <h1>Selamat, Anda berhasil login 🎉</h1>
        <p>Ini halaman utama aplikasi.</p>
      </div>
    </div>
  );
}
