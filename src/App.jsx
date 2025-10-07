import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./services/supabase";
import Login from "./pages/Login";
import Register from "./pages/Register";
import App2 from "./pages/app/App2";
import AdminPanel from "./admin/AdminPanel";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ CEK SESSION SAAT APP DIBUKA
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // ✅ LISTEN UNTUK PERUBAHAN AUTH STATE
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
        {/* ✅ JIKA SUDAH LOGIN, REDIRECT KE APP2 */}
        <Route 
          path="/" 
          element={session ? <Navigate to="/app2" /> : <Login />} 
        />
        <Route 
          path="/login" 
          element={session ? <Navigate to="/app2" /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={session ? <Navigate to="/app2" /> : <Register />} 
        />
        
        {/* ✅ JIKA BELUM LOGIN, REDIRECT KE LOGIN */}
        <Route 
          path="/app2/*" 
          element={session ? <App2 /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/admin" 
          element={session ? <AdminPanel /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;