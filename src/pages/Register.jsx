import React, { useState } from "react";
import { supabase } from "../services/supabase";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    // 🔹 Step 1: cek apakah email sudah ada di profiles
    const { data: existingUser, error: checkError } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      setLoading(false);
      setError("Terjadi kesalahan saat memeriksa email.");
      return;
    }

    if (existingUser) {
      setLoading(false);
      setError("Email sudah terdaftar, silakan login.");
      return;
    }

    // 🔹 Step 2: lanjut daftar user baru
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "https://tahfidzku.vercel.app/verified.html",
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data?.user) {
      setInfo("Silakan cek email Anda dan lakukan verifikasi sebelum login.");
    } else {
      setInfo("Jika email valid, link verifikasi telah dikirim.");
    }

    // 🔹 Reset form
    setEmail("");
    setPassword("");

    // 🔹 Auto redirect ke login setelah 60 detik
    setTimeout(() => navigate("/"), 60000);
  };

  return (
    <div className="container" style={{ padding: "2rem" }}>
      <div style={{ textAlign: "center", padding: "0rem" }}>
        <img
          src="/logo.png"
          alt="App Logo"
          style={{ width: "200px", height: "200px", marginBottom: "0rem" }}
        />
      </div>
      <center>
        <h3>Daftar</h3>
      </center>
      <br />

      <form
        style={{ marginBottom: "0.5rem" }}
        className="form-group"
        onSubmit={handleRegister}
      >
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

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Loading..." : "Daftar"}
        </button>
      </form>

      <p>
        Sudah punya akun? <Link to="/">Masuk</Link>
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {info && <p style={{ color: "green" }}>{info}</p>}
    </div>
  );
}