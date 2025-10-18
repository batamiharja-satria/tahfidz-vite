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

  // ✅ Tujuan redirect utama
  const from = location.state?.from?.pathname || "/app2";

  useEffect(() => {
    const initializeDeviceUUID = async () => {
      const uuid = await UserStorage.getPersistentDeviceUUIDAsync();
      setDeviceUUID(uuid);
    };
    initializeDeviceUUID();
  }, []);

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

  // ✅ Perbaikan: Google Login
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "https://tahfidzku.vercel.app/app2",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  // ✅ Listen for auth changes (Google login handler)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const user = session.user;

          const isGoogleUser =
            user.app_metadata?.provider === "google" ||
            user.identities?.some((identity) => identity.provider === "google");

          if (isGoogleUser) {
            try {
              const { data: existingProfile, error: profileError } = await supabase
                .from("profiles")
                .select("id, device_uuid")
                .eq("email", user.email)
                .maybeSingle();

              if (profileError) throw profileError;

              if (!existingProfile) {
                const { error: insertError } = await supabase
                  .from("profiles")
                  .insert({
                    id: user.id,
                    email: user.email,
                    device_uuid: deviceUUID,
                    status: [false, false, false, false, false, false, false, true, true, true],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  });

                if (insertError) {
                  if (insertError.code === "23505") {
                    const { error: updateError } = await supabase
                      .from("profiles")
                      .update({
                        device_uuid: deviceUUID,
                        updated_at: new Date().toISOString(),
                      })
                      .eq("email", user.email);
                    if (updateError) throw updateError;
                  } else {
                    throw insertError;
                  }
                }
              } else {
                if (existingProfile.device_uuid && existingProfile.device_uuid !== deviceUUID) {
                  await supabase.auth.signOut();
                  throw new Error("Akun Google ini terdaftar di device lain. Gunakan device yang sama.");
                }

                if (!existingProfile.device_uuid) {
                  await supabase
                    .from("profiles")
                    .update({ device_uuid: deviceUUID })
                    .eq("email", user.email);
                }
              }

              await UserStorage.migrateGuestToUser(session, deviceUUID);

              setGoogleLoading(false);
              navigate("/app2", { replace: true }); // ✅ langsung redirect ke app utama
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
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("device_uuid")
        .eq("email", email)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) throw new Error("Email belum terdaftar.");

      if (profileData.device_uuid && profileData.device_uuid !== deviceUUID) {
        throw new Error("Akun ini terdaftar di device lain. Gunakan device yang sama atau daftar dengan email baru.");
      }

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      const guestDeviceUUID = deviceUUID;
      await UserStorage.migrateGuestToUser(loginData.session, guestDeviceUUID);

      if (!profileData.device_uuid) {
        await supabase
          .from("profiles")
          .update({ device_uuid: deviceUUID })
          .eq("email", email);
      }

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
      setCooldown(60 * 60 * 1000);
    }
  };

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
    <div className="container" style={{ width: "100%", maxWidth: "600px", padding: "2rem" }}>
      <Link to="/" style={{ color: 'black', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold' }}>
        ←
      </Link>

      <div style={{ textAlign: "center" }}>
        <img src="/logo.png" alt="App Logo" style={{ width: "200px", height: "200px" }} />
      </div>
      <center><h3>Masuk</h3></center><br />

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
            opacity: googleLoading ? 0.7 : 1,
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
                  animation: "spin 1s linear infinite",
                }}
              />
              Loading...
            </>
          ) : (
            <>
              <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" style={{ width: "20px", height: "20px" }} />
              Masuk dengan Google
            </>
          )}
        </button>
      </div>

      <div style={{ textAlign: "center", margin: "1rem 0", position: "relative" }}>
        <hr style={{ border: "none", borderTop: "1px solid #ddd" }} />
        <span
          style={{
            background: "white",
            padding: "0 1rem",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#666",
            fontSize: "0.9rem",
          }}
        >
          atau
        </span>
      </div>

      {/* 🔹 Form login manual */}
      <form onSubmit={handleLogin} className="form-group">
        <input className="form-control" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
        <br />
        <input className="form-control" type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
        <br />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Loading..." : "Masuk"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
    </div>
  );
}