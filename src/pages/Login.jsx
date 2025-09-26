import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { Link, useNavigate } from "react-router-dom";

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
          setResetSuccess(false); // ⛔ otomatis hilang setelah 1 jam
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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      if (!rememberMe) {
        localStorage.removeItem("sb-" + supabase.supabaseKey + "-auth-token");
      }

      // ✅ Bersihkan semua state reset setelah login sukses
      setResetSuccess(false);
      setResetLoading(false);
      setCooldown(null);
      localStorage.removeItem("lastResetRequest");

      navigate("/app");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Masukkan email dulu untuk reset password.");
      return;
    }
    if (cooldown) return; // ❌ Masih cooldown

    setResetLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:5173/reset-password.html",
    });

    setResetLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setResetSuccess(true);
      localStorage.setItem("lastResetRequest", Date.now().toString());
      setCooldown(60 * 60 * 1000); // ⏱️ set 1 jam
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
    <div className="container" style={{ padding: "2rem" }}>
      <div style={{ padding: "0.0rem", textAlign: "center" }}>
        <img
          src="/logo.png"
          alt="App Logo"
          style={{ width: "200px", height: "200px", marginBottom: "0rem" }}
        />
      </div>
      <center>
        <h3>Masuk</h3>
      </center>
      <br></br>
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
              style={{ marginRight: "0.5rem", marginLeft: "1.0rem" }}
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

      {/* ℹ️ Pesan kalau masih cooldown */}
      {resetSuccess && cooldown && (
        <p style={{ color: "red", marginTop: "0.5rem" }}>
          Link reset password hanya berlaku {Math.ceil(cooldown / 60000)} menit
          lagi. Setelah itu Anda bisa kirim ulang.
        </p>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}