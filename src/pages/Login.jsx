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

  // ✅ Handle Google Login
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${from}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;

    } catch (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  // ✅ Listen for auth state changes to handle Google signup
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const user = session.user;
          
          // ✅ Check if user signed in with Google (OAuth)
          const isGoogleUser = user.app_metadata?.provider === 'google' || 
                              user.identities?.some(identity => identity.provider === 'google');

          if (isGoogleUser) {
            try {
              // ✅ Check if profile already exists
              const { data: existingProfile, error: profileError } = await supabase
                .from("profiles")
                .select("id, device_uuid")
                .eq("email", user.email)
                .maybeSingle();

              if (profileError) throw profileError;

              // ✅ If profile doesn't exist, create one (Google signup)
              if (!existingProfile) {
                const { error: insertError } = await supabase
                  .from("profiles")
                  .insert({
                    id: user.id,
                    email: user.email,
                    device_uuid: deviceUUID,
                    status: [false, false, false, false, false, false, false, true, true, true],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  });

                if (insertError) {
                  // If insert fails due to duplicate, try update
                  if (insertError.code === '23505') {
                    const { error: updateError } = await supabase
                      .from("profiles")
                      .update({ 
                        device_uuid: deviceUUID,
                        updated_at: new Date().toISOString()
                      })
                      .eq("email", user.email);

                    if (updateError) throw updateError;
                  } else {
                    throw insertError;
                  }
                }
              } else {
                // ✅ Profile exists, validate device UUID
                if (existingProfile.device_uuid && existingProfile.device_uuid !== deviceUUID) {
                  await supabase.auth.signOut();
                  throw new Error("Akun Google ini terdaftar di device lain. Gunakan device yang sama.");
                }

                // ✅ Update device_uuid if not set
                if (!existingProfile.device_uuid) {
                  await supabase
                    .from("profiles")
                    .update({ device_uuid: deviceUUID })
                    .eq("email", user.email);
                }
              }

              // ✅ Migrate guest data
              await UserStorage.migrateGuestToUser(session, deviceUUID);

              setGoogleLoading(false);
              
              // ✅ Redirect to app
              navigate(from, { replace: true });

            } catch (err) {
              console.error("Error handling Google signup:", err);
              setError(err.message);
              setGoogleLoading(false);
              await supabase.auth.signOut();
            }
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [deviceUUID, navigate, from]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 🔹 Step 1: Cek device UUID di database
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("device_uuid")
        .eq("email", email)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        throw new Error("Email belum terdaftar.");
      }

      // 🔹 Step 2: Validasi device UUID
      if (profileData.device_uuid && profileData.device_uuid !== deviceUUID) {
        throw new Error("Akun ini terdaftar di device lain. Gunakan device yang sama atau daftar dengan email baru.");
      }

      // 🔹 Step 3: Login dengan Supabase Auth
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      // ✅ MIGRASIKAN DATA DARI GUEST KE USER
      const guestDeviceUUID = deviceUUID; // UUID sebelum login
      await UserStorage.migrateGuestToUser(loginData.session, guestDeviceUUID);

      // 🔹 Step 4: Jika device_uuid belum ada, update dengan device UUID saat ini
      if (!profileData.device_uuid) {
        await supabase
          .from("profiles")
          .update({ device_uuid: deviceUUID })
          .eq("email", email);
      }

      // ✅ Bersihkan semua state reset setelah login sukses
      setResetSuccess(false);
      setResetLoading(false);
      setCooldown(null);
      localStorage.removeItem("lastResetRequest");

      setLoading(false);
      
      // ✅ REDIRECT KE HALAMAN SEBELUMNYA ATAU BERANDA
      navigate(from, { replace: true });
      
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
    padding: "2rem" }}>
      
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
              Loading...
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