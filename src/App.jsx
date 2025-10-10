import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { supabase } from "./services/supabase";
import Login from "./pages/Login";
import Register from "./pages/Register";
import App2 from "./pages/app/App2";
import AdminPanel from "./admin/AdminPanel";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Memuat...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* ✅ PERBAIKAN: Hapus duplikasi route untuk /app2 */}
        <Route path="/" element={<App2 session={session} />} />
        <Route path="/app2/*" element={<App2 session={session} />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;