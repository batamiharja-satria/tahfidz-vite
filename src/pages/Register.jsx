import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { Link, useNavigate } from "react-router-dom";
import { UserStorage } from "./app/utils/userStorage";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deviceUUID, setDeviceUUID] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const initializeDeviceUUID = async () => {
      const uuid = await UserStorage.getPersistentDeviceUUIDAsync();
      setDeviceUUID(uuid);
    };
    initializeDeviceUUID();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validasi password
      if (password !== confirmPassword) {
        throw new Error("Password dan konfirmasi password tidak sama");
      }

      if (password.length < 6) {
        throw new Error("Password minimal 6 karakter");
      }

      // 🔹 Step 1: Cek apakah email sudah terdaftar
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, device_uuid")
        .eq("email", email)
        .maybeSingle();

      if (profileError) throw profileError;

      if (existingProfile) {
        // Jika email sudah terdaftar, tawarkan recovery
        const shouldRecover = window.confirm(
          'Email sudah terdaftar. Apakah Anda ingin memulihkan akses di device ini? ' +
          'Ini akan mengizinkan login di device ini.'
        );
        
        if (shouldRecover) {
          // Update device UUID untuk recovery
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ device_uuid: deviceUUID })
            .eq("email", email);
          
          if (updateError) throw updateError;
          
          // Simpan device history
          await UserStorage.saveDeviceHistory(deviceUUID, email);
          
          alert('✅ Device berhasil dipulihkan! Silakan login.');
          navigate("/login");
          return;
        } else {
          throw new Error("Email sudah terdaftar. Gunakan email lain atau pulihkan akses.");
        }
      }

      // 🔹 Step 2: Register user baru
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // 🔹 Step 3: Create profile dengan device UUID
      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: authData.user.id,
            email: email,
            device_uuid: deviceUUID,
            status: [false, false, false, false, false, false, false, true, true, true],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

        if (profileError) throw profileError;
      }

      // 🔹 Step 4: SIMPAN DEVICE HISTORY untuk recovery future
      await UserStorage.saveDeviceHistory(deviceUUID, email);

      setLoading(false);
      alert("✅ Pendaftaran berhasil! Silakan login.");
      navigate("/login");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

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
        <h3>Daftar</h3>
      </center>
      <br />
      <form onSubmit={handleRegister} className="form-group">
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
        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <input
            className="form-control"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Konfirmasi Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            style={{ width: "100%", paddingRight: "2.5rem" }}
          />
          <span
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            style={{
              position: "absolute",
              right: "0.5rem",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {showConfirmPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Loading..." : "Daftar"}
        </button>
      </form>

      <p>
        Sudah punya akun? <Link to="/login">Masuk</Link>
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
} 