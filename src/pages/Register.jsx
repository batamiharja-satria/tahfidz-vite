import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { UserStorage } from "./app/utils/userStorage";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  // ✅ PERBAIKAN: Handle Google Register dengan state management yang lebih baik
  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      // Generate unique state parameter untuk mencegah CSRF
      const state = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      
      // Simpan state di sessionStorage untuk validasi nanti
      sessionStorage.setItem('oauth_state', state);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: "https://tahfidzku.vercel.app/app2",
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            state: state // Tambahkan state parameter
          }
        }
      });

      if (error) throw error;

    } catch (err) {
      setError(err.message);
      setGoogleLoading(false);
      // Bersihkan state jika error
      sessionStorage.removeItem('oauth_state');
    }
  };

  // ✅ PERBAIKAN: Handle OAuth callback ketika kembali ke halaman register
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      
      // Jika ada error OAuth di URL, tampilkan dan bersihkan URL
      if (error) {
        console.error('OAuth Error:', error, errorDescription);
        
        if (error === 'invalid_request' && errorDescription?.includes('bad_oauth_state')) {
          setError("Session pendaftaran telah kadaluarsa. Silakan coba daftar lagi.");
        } else {
          setError(`Error pendaftaran: ${errorDescription || error}`);
        }
        
        // Bersihkan URL dari parameter error
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // Cek jika ini adalah redirect dari OAuth (ada code di URL)
      const code = urlParams.get('code');
      if (code) {
        setGoogleLoading(true);
        try {
          // Dapatkan session current user
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) throw sessionError;
          
          if (session?.user) {
            await handleGoogleUser(session.user);
          }
        } catch (err) {
          console.error("Error handling OAuth callback:", err);
          setError(err.message);
          await supabase.auth.signOut();
        } finally {
          setGoogleLoading(false);
          // Bersihkan URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    handleOAuthCallback();
  }, [deviceUUID, navigate]);

  // ✅ PERBAIKAN: Pisahkan logic handling Google user untuk reusable
  const handleGoogleUser = async (user) => {
    try {
      // ✅ Check if user signed in with Google (OAuth)
      const isGoogleUser = user.app_metadata?.provider === 'google' || 
                          user.identities?.some(identity => identity.provider === 'google');

      if (!isGoogleUser) return;

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
      await UserStorage.migrateGuestToUser({ user }, deviceUUID);

      // ✅ Redirect to app
      navigate("/app2", { replace: true });
      
    } catch (err) {
      console.error("Error handling Google user:", err);
      throw err;
    }
  };

  // ✅ PERBAIKAN: Listen for auth state changes (untuk non-OAuth flows)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip jika ini OAuth flow (sudah dihandle di atas)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('code')) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const user = session.user;
          
          const isGoogleUser = user.app_metadata?.provider === 'google' || 
                              user.identities?.some(identity => identity.provider === 'google');

          if (isGoogleUser) {
            try {
              await handleGoogleUser(user);
            } catch (err) {
              console.error("Error handling Google signup:", err);
              setError(err.message);
              await supabase.auth.signOut();
            }
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [deviceUUID, navigate]);

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
        // ✅ Insert baru dengan status default yang eksplisit
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({ 
            id: authData.user.id,
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

  // ✅ Reset OAuth state saat komponen unmount
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('oauth_state');
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
          padding: '0px 0px',
          background: '',
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

      {/* ✅ TOMBOL GOOGLE */}
      <div style={{ marginBottom: "1rem" }}>
        <button
          className="btn btn-secondary"
          onClick={handleGoogleRegister}
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
              Daftar dengan Google
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