import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { UserStorage } from "./app/utils/userStorage";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const [deviceUUID, setDeviceUUID] = useState("");

  const from = location.state?.from?.pathname || "/app2";

  useEffect(() => {
    const initializeDeviceUUID = async () => {
      const uuid = await UserStorage.getPersistentDeviceUUIDAsync();
      console.log("📱 Device UUID initialized:", uuid);
      setDeviceUUID(uuid);
    };
    initializeDeviceUUID();
  }, []);

  // ✅ Cek cooldown & status reset saat pertama kali load halaman
  useEffect(() => {
    const lastRequest = localStorage.getItem("lastResetRequest");
    if (lastRequest) {
      const diff = Date.now() - parseInt(lastRequest, 10);
      if (diff < 60 * 60 * 1000) {
        setCooldown(60 * 60 * 1000 - diff);
        setResetSuccess(true);
      }
    }
  }, []);

  // ✅ Hitung mundur cooldown
  useEffect(() => {
    if (!cooldown) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (!prev) return null;
        if (prev <= 1000) {
          clearInterval(timer);
          setResetSuccess(false);
          localStorage.removeItem("lastResetRequest");
          return null;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // ✅ FIX: Google Login dengan redirect langsung ke /app2
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app2`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;

    } catch (err) {
      console.error("Google login error:", err);
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  // ✅ Listen for auth state changes (untuk non-OAuth flows)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔄 Auth state changed:", event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const user = session.user;
          
          const isGoogleUser = user.app_metadata?.provider === 'google' || 
                              user.identities?.some(identity => identity.provider === 'google');

          if (!isGoogleUser) {
            try {
              await handleRegularLogin(user);
            } catch (err) {
              console.error("Error handling regular login:", err);
              setError(err.message);
              await supabase.auth.signOut();
            }
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [deviceUUID, navigate]);

  // ✅ Function untuk handle regular email login
  const handleRegularLogin = async (user) => {
    // ✅ Check if profile exists and validate device
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("device_uuid")
      .eq("email", user.email)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!profileData) {
      throw new Error("Email belum terdaftar.");
    }

    // ✅ Validate device UUID
    if (profileData.device_uuid && profileData.device_uuid !== deviceUUID) {
      throw new Error("Akun ini terdaftar di device lain. Gunakan device yang sama atau daftar dengan email baru.");
    }

    // ✅ Update device_uuid if not set
    if (!profileData.device_uuid) {
      await supabase
        .from("profiles")
        .update({ device_uuid: deviceUUID })
        .eq("email", user.email);
    }

    // ✅ Migrate guest data
    await UserStorage.migrateGuestToUser({ user }, deviceUUID);

    // ✅ Bersihkan state reset
    setResetSuccess(false);
    setResetLoading(false);
    setCooldown(null);
    localStorage.removeItem("lastResetRequest");

    // ✅ Redirect dengan navigate untuk email login biasa
    navigate(from, { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      // handleRegularLogin akan dipanggil oleh auth state change listener
      
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Masukkan email dulu untuk reset password.");
      return;
    }
    if (cooldown) return;

    setResetLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://tahfidzku.vercel.app/reset-password.html",
    });

    setResetLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setResetSuccess(true);
      localStorage.setItem("lastResetRequest", Date.now().toString());
      setCooldown(60 * 60 * 1000); // 1 jam
    }
  };

  // ✅ Reset tombol lupa password setelah logout
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setResetSuccess(false);
        setResetLoading(false);
        setCooldown(null);
        localStorage.removeItem("lastResetRequest");
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="container" style={{
      width: "100%",
      maxWidth: "600px",
      padding: "2rem"
    }}>
      
      <Link 
        to="/" 
        style={{
          color: 'black',
          border: 'none',
          borderRadius: '0px',
          textDecoration: 'none',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          display: 'inline-block',
          lineHeight: '1'
        }}
      >
        ← 
      </Link>
      
      <div style={{ textAlign: "center", padding: "0rem" }}>
        <img
          src="/logo.png"
          alt="App Logo"
          style={{ width: "200px", height: "200px", marginBottom: "0rem" }}
        />
      </div>
      <center>
        <h3>Masuk</h3>
      </center>
      <br />

      {/* ✅ TOMBOL GOOGLE */}
      <div style={{ marginBottom: "1rem" }}>
        <button
          className="btn btn-secondary"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          style={{ 
            width: "100%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "white",
            color: "#333",
            fontSize: "1rem",
            cursor: googleLoading ? "not-allowed" : "pointer",
            opacity: googleLoading ? 0.7 : 1
          }}
        >
          {googleLoading ? (
            <>
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid #ccc",
                  borderTop: "2px solid #4285f4",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 1s linear infinite"
                }}
              />
              Memproses...
            </>
          ) : (
            <>
              <img 
                src="https://developers.google.com/identity/images/g-logo.png" 
                alt="Google" 
                style={{ width: "20px", height: "20px" }}
              />
              Masuk dengan Google
            </>
          )}
        </button>
      </div>

      <div style={{ textAlign: "center", margin: "1rem 0", position: "relative" }}>
        <hr style={{ margin: "1.5rem 0", border: "none", borderTop: "1px solid #ddd" }} />
        <span style={{ 
          background: "white", 
          padding: "0 1rem", 
          position: "absolute", 
          top: "50%", 
          left: "50%", 
          transform: "translate(-50%, -50%)",
          color: "#666",
          fontSize: "0.9rem"
        }}>
          atau
        </span>
      </div>

      <form onSubmit={handleLogin} className="form-group">
        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <input
            className="form-control"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            style={{ width: "100%", paddingRight: "2.5rem" }}
          />
        </div>
        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <input
            className="form-control"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={{ width: "100%", paddingRight: "2.5rem" }}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "0.5rem",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <div style={{ marginBottom: "0.5rem" }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Masuk"}
          </button>
          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ marginRight: "0.5rem", marginLeft: "1rem" }}
            />
            Ingat saya
          </label>
        </div>
      </form>

      <p>
        Belum punya akun? <Link to="/register">Daftar</Link>
      </p>

      <button
        type="button"
        onClick={handleForgotPassword}
        disabled={resetLoading || cooldown}
        style={{
          marginTop: "1rem",
          background: "none",
          border: "none",
          cursor: resetLoading || cooldown ? "not-allowed" : "pointer",
          color: resetSuccess ? "green" : "red",
          fontWeight: resetSuccess ? "bold" : "normal",
          display: "flex",
          alignItems: "center",
        }}
      >
        {resetLoading && (
          <span
            style={{
              width: "14px",
              height: "14px",
              border: "2px solid #ccc",
              borderTop: "2px solid blue",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 1s linear infinite",
            }}
          />
        )}
        {resetLoading
          ? "Mengirim..."
          : resetSuccess
            ? "Cek email atau folder spam 📩"
            : "Lupa Password?"}
      </button>

      {resetSuccess && cooldown && (
        <p style={{ color: "red", marginTop: "0.5rem" }}>
          Link reset password hanya berlaku {Math.ceil(cooldown / 60000)} menit
          lagi. Setelah itu Anda bisa kirim ulang.
        </p>
      )}

      {error && <p style={{ color: "red", marginTop:"1rem"}}>{error}</p>}
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <Link 
        to="/admin" 
        style={{
          border: 'none',
          background: "white",
          color: "white",
          textDecoration: "none",
          borderRadius: "6px",
          fontWeight: "bold",
          display: 'flex',
          justifyContent: 'end',
          lineHeight: '1'
        }}
      >
        🔧 
      </Link>
      
    </div>
  );
}