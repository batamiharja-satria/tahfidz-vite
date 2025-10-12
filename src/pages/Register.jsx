import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { UserStorage } from "./app/utils/userStorage"; // ✅ IMPORT BARU

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [deviceUUID, setDeviceUUID] = useState("");

  const from = location.state?.from?.pathname || "/app2";

  useEffect(() => {
    const initializeDeviceUUID = async () => {
      // ✅ GUNAKAN FUNGSI ASYNC KHUSUS
      const uuid = await UserStorage.getPersistentDeviceUUIDAsync();
      setDeviceUUID(uuid);
    };
    initializeDeviceUUID();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      // 🔹 Step 1: Cek apakah email sudah ada di profiles
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("email, device_uuid, status")
        .eq("email", email)
        .maybeSingle();

      if (checkError) {
        throw new Error("Terjadi kesalahan saat memeriksa email.");
      }

      if (existingUser) {
        if (existingUser.device_uuid && existingUser.device_uuid !== deviceUUID) {
          throw new Error("Email sudah terdaftar di device lain. Gunakan email baru untuk device ini.");
        }
        throw new Error("Email sudah terdaftar, silakan login.");
      }

      // 🔹 Step 2: Daftar user baru di auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "https://tahfidzku.vercel.app/verified.html",
          data: {
            device_uuid: deviceUUID
          }
        },
      });

      if (signUpError) throw signUpError;

      if (authData?.user) {
        // ✅ PERBAIKAN FINAL: Insert baru dengan status default yang eksplisit
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({ 
            email: email,
            device_uuid: deviceUUID,
            status: [false,false,false,false,false,false,false,true,true,true] // ✅ FORCE DEFAULT
          });

        if (profileError) {
          console.error("Error creating profile:", profileError);
          // Jika error karena row sudah ada, try update
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ 
              device_uuid: deviceUUID,
              status: [false,false,false,false,false,false,false,true,true,true] // ✅ FORCE DEFAULT
            })
            .eq("email", email);
            
          if (updateError) {
            console.error("Error updating profile:", updateError);
          }
        }

        setInfo("Silakan cek email Anda dan lakukan verifikasi sebelum login.");
      } else {
        setInfo("Jika email valid, link verifikasi telah dikirim.");
      }

      // 🔹 Reset form
      setEmail("");
      setPassword("");

      setTimeout(() => {
        navigate(from, { replace: true });
      }, 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{
width: "100%",
      maxWidth: "600px",
    padding: "2rem" }}>
      
      
<Link 
  to="/" 
  style={{
    padding: '0px 0px',
    background: '',
    color: 'black',
    border: 'none',
    borderRadius: '0px',
    textDecoration: 'none',
    fontSize: '1.5rem', // ✅ TAMBAH INI - ukuran lebih besar
    fontWeight: 'bold',  // ✅ OPSIONAL - biar lebih tebal
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
        Sudah punya akun? <Link to="/login">Masuk</Link>
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {info && <p style={{ color: "green" }}>{info}</p>}
    </div>
  );
}