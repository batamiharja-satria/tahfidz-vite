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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 🔹 Step 1: Cek apakah email terdaftar
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("device_uuid, status, created_at")
        .eq("email", email)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) throw new Error("Email belum terdaftar.");

      // 🔹 Step 2: Enhanced Device UUID Recovery System
      if (profileData.device_uuid && profileData.device_uuid !== deviceUUID) {
        console.log('🔄 Device UUID mismatch, starting recovery...');
        
        // ✅ Coba recovery device berdasarkan fingerprint
        const recoveryResult = await UserStorage.enhancedDeviceRecovery(email, deviceUUID);
        
        if (recoveryResult.success) {
          // ✅ RECOVERY BERHASIL - Update device UUID di database
          console.log('✅ Device recovery successful:', recoveryResult.reason);
          
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ device_uuid: deviceUUID })
            .eq("email", email);
            
          if (updateError) {
            console.warn('⚠️ Failed to update device UUID, but continuing login...');
            // Lanjutkan login meskipun update gagal
          } else {
            console.log('✅ Device UUID updated in database');
          }
        } else {
          // ❌ RECOVERY GAGAL - Benar-benar device berbeda
          console.log('❌ Device recovery failed:', recoveryResult.reason);
          throw new Error(
            "Akun ini terdaftar di device lain. " +
            "Gunakan device yang sama atau daftar dengan email baru. " +
            "Jika ini device Anda, hapus semua data browser dan coba lagi."
          );
        }
      }

      // 🔹 Step 3: Login dengan Supabase Auth
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      // 🔹 Step 4: Simpan device history untuk recovery future
      if (!profileData.device_uuid || profileData.device_uuid !== deviceUUID) {
        // Update device UUID jika belum ada atau berubah
        await supabase
          .from("profiles")
          .update({ device_uuid: deviceUUID })
          .eq("email", email);
      }

      // 🔹 Step 5: SIMPAN DEVICE HISTORY UNTUK MASA DEPAN
      await UserStorage.saveDeviceHistory(deviceUUID, email);

      // 🔹 Step 6: Migrasi data guest → user
      await UserStorage.migrateGuestToUser(loginData.session, deviceUUID);

      // Cleanup
      setResetSuccess(false);
      setResetLoading(false);
      setCooldown(null);
      localStorage.removeItem("lastResetRequest");

      setLoading(false);
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