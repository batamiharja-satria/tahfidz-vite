import React, { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { Container, Button } from "react-bootstrap";
import { useNavigate, Routes, Route, Link, useLocation } from "react-router-dom";
import Index1 from "./pages/fitur1/Index1";
import Index2 from "./pages/fitur2/Index2";
import Index3 from "./pages/fitur3/Index3";
import { UserStorage } from "./utils/userStorage";

function App2({ session }) {
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ PERBAIKAN: Default userStatus untuk guest
  const defaultGuestStatus = [false,false,false,false,false,false,false,true,true,true];

  // ✅ UPDATE: AMBIL STATUS USER dengan handling yang lebih robust
  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        if (session) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setUserStatus(defaultGuestStatus);
            setLoading(false);
            return;
          }

          // ✅ GUNAKAN FUNGSI ASYNC UNTUK DEVICE VALIDATION
          const currentDeviceUUID = await UserStorage.getPersistentDeviceUUIDAsync();
          
          // ✅ CEK DEVICE UUID DI DATABASE
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("device_uuid, status")
            .eq("email", user.email)
            .single();

          if (profileError) {
            console.error("Gagal ambil profile:", profileError.message);
            setUserStatus(defaultGuestStatus);
          } else if (profileData) {
            // ✅ VALIDASI DEVICE UUID
            if (profileData.device_uuid && profileData.device_uuid !== currentDeviceUUID) {
              await supabase.auth.signOut();
              alert("Akun ini terdaftar di perangkat lain. Satu email hanya untuk satu perangkat.");
              setUserStatus(defaultGuestStatus);
              setLoading(false);
              return;
            }

            // ✅ SET USER STATUS JIKA VALID
            if (profileData.status && Array.isArray(profileData.status)) {
              setUserStatus(profileData.status);
            } else {
              setUserStatus(defaultGuestStatus);
            }
          } else {
            setUserStatus(defaultGuestStatus);
          }
        } else {
          // ✅ SET DEFAULT UNTUK GUEST dengan pasti
          setUserStatus(defaultGuestStatus);
        }
      } catch (err) {
        console.error("Error fetchUserStatus:", err.message);
        setUserStatus(defaultGuestStatus);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStatus();
  }, [session]);

  // ✅ PERBAIKAN: Handle navigation dengan userStatus yang sudah ter-initialize
  useEffect(() => {
    if (!loading && userStatus.length > 0) {
      // ✅ INIT DEFAULT DATA UNTUK GUEST ATAU USER
      UserStorage.initializeDefaultData(session);
      
      // ✅ HAPUS REDIRECT OTOMATIS KE FITUR1 - BIARKAN USER DI BERANDA
      // Tidak ada redirect otomatis lagi
    }
  }, [loading, userStatus, session]);

  // ✅ CEK SESSION SAAT KOMPONEN MOUNT
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Error checking session:", error);
        }
        // Loading akan di-set false di fetchUserStatus
      } catch (err) {
        console.error("Session check failed:", err);
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUserStatus(defaultGuestStatus);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <p>Memuat session...</p>
        </div>
      </Container>
    );
  }

  // ✅ PASTIKAN USERSTATUS TIDAK KOSONG SEBELUM RENDER
  if (userStatus.length === 0) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <p>Mempersiapkan aplikasi...</p>
        </div>
      </Container>
    );
  }

  return (
    <Routes>
      {/* ✅ ROUTE UNTUK BERANDA */}
      <Route
        path="/"
        element={
          <Container
            fluid
            className="pt-4"
            style={{
              width: "100%",
              minWidth: "360px",
              
              height: "100%",
              margin: "0 auto",
              padding: "40px 20px",
              background: "linear-gradient(135deg, #f9fdf9, #f0fdfa, #f9f9ff)",
              backgroundAttachment: "fixed",
            }}
          >
      
            {/* Header - TEXT CENTER */}
            <h1 className="fw-bold display-5 mb-2 text-center">Assalamu 'alaikum</h1>
            <p className="fs-6 text-center">
              Selamat Datang di Aplikasi Qur'an
            </p> 
              
            {!session ? (
              <div className="text-center">
                <Link
                  to="/login"
                  className="text-success"
                  style={{ textDecoration: "none" }}
                >
                  Login
                </Link>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-success">{session.user.email}</span>
              </div>
            )}

        {/* Kartu Fitur */}
<div className="d-flex flex-column align-items-center gap-3 mt-4">
  
  <div class="row text-center">
  <div
    className="card shadow text-center clickable-card col-sm-5"
    style={{
      width: "165px",
      
      cursor: "pointer",
      background: "linear-gradient(135deg, rgba(40,167,69,0.15), rgba(23,162,184,0.15))",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(255,255,255,0.2)",
      borderRadius: "15px",
      transition: "all 0.3s ease",
      padding: "1.2rem 1.2rem",
      margin:"5px"
    }}
    onClick={() => {
      navigate('/app2/app/fitur1');
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = "translateY(-5px)";
      e.currentTarget.style.boxShadow = "0 8px 20px rgba(23,162,184,0.3)";
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";
    }}
  >
    <h5 className="mb-2">📖 Tahfidz</h5>
    
  </div>

  <div
    className="card shadow text-center clickable-card col-sm-5"
    style={{
      width: "165px",
      
      cursor: "pointer",
      background: "linear-gradient(135deg, rgba(23,162,184,0.15), rgba(40,167,69,0.15))",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(255,255,255,0.2)",
      borderRadius: "15px",
      transition: "all 0.3s ease",
      padding: "1.2rem 1.2rem",
      margin:"5px"
    }}
    onClick={() => {
      navigate('/app2/app/fitur2');
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = "translateY(-5px)";
      e.currentTarget.style.boxShadow = "0 8px 20px rgba(40,167,69,0.3)";
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";
    }}
  >
    <h5 className="mb-2">🎧 Istima'</h5>

  </div>
</div>

  <div
    className="clearfix card shadow text-center clickable-card"
    style={{
      width: "340px",
      maxWidth: "576px",
      cursor: "pointer",
      background: "linear-gradient(135deg, rgba(23,162,184,0.15), rgba(40,167,69,0.15))",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(255,255,255,0.2)",
      borderRadius: "15px",
      transition: "all 0.3s ease",
      padding: "1.5rem 1.5rem",
      marginTop: "0.2rem"
    }}
    onClick={() => {
      navigate('/app2/app/fitur3');
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = "translateY(-5px)";
      e.currentTarget.style.boxShadow = "0 8px 20px rgba(40,167,69,0.3)";
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";
    }}
  >
     <h5 className="mb-2">📝 Ma'na</h5>

  </div>
</div>

            {/* Footer Quote */}
            <div
              className="card shadow-sm p-4 text-muted small center"
              style={{
              marginTop: "25px",
                width: "340px",
               maxWidth: "576px",
                marginLeft: "auto",
    marginRight: "auto",   
    background: "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(245,245,245,0.6))",
                backdropFilter: "blur(6px)",
                borderRadius: "12px",
              }}
            >
              <p className="mb-0 fs-6 fst-italic text-center">
                "Sebaik-baik kalian adalah yang belajar Al-Qur'an dan mengajarkannya"
              </p>
              <p className="mb-0 text-center">(HR. Bukhari)</p>
            </div>

            {/* Footer Link */}
            <footer className="mt-4 text-secondary small text-center">
              <a
                href="#about"
                className="me-3 text-success"
                data-bs-toggle="modal"
                data-bs-target="#aboutModal"
                style={{ textDecoration: "none" }}
              >
                Tentang
              </a>
              <a
                href="#support"
                className="me-3 text-success"
                data-bs-toggle="modal"
                data-bs-target="#supportModal"
                style={{ textDecoration: "none" }}
              >
                Kontak
              </a>
              {/* ✅ UBAH: Link Dukungan sekarang membuka modal pilihan donasi */}
              <a
                href="#donation"
                className="me-3 text-success"
                data-bs-toggle="modal"
                data-bs-target="#donationModal"
                style={{ textDecoration: "none" }}
              >
                Dukungan
              </a>
              <a
                href="#download"
                className="me-3 text-success"
                data-bs-toggle="modal"
                data-bs-target="#downloadModal"
                style={{ textDecoration: "none" }}
              >
                Download
              </a>
            </footer>

            {/* Modal Tentang */}
            <div
              className="modal fade"
              id="aboutModal"
              tabIndex="-1"
              aria-labelledby="aboutModalLabel"
              aria-hidden="true"
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title" id="aboutModalLabel">Tentang Aplikasi</h5>
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    ></button>
                  </div>
                  <div className="modal-body text-start">
                    <p>
                      Aplikasi ini dirancang untuk membantu menghafal (Tahfidz) dan mendengarkan (Istima') 
                      Al-Qur'an dengan cara yang mudah dan praktis.
                    </p>
                    <p>
                      Setiap fitur dilengkapi panduan di dalamnya agar Anda bisa langsung mulai.
                    </p>
                    <p>
                      Jika ada pembaruan aplikasi, fitur akan update tanpa harus install ulang.
                    </p>
                    <p>
                      Bantu teman dan keluarga menghafal dan mendengarkan Al-Qur'an. Bagikan aplikasi ini 
                      sebagai amal sholeh dan amal jariyah Anda. Setiap klik berbagi, akan sangat berarti.
                    </p>
                    <p>Bagikan melalui:</p>

                    <div style={{ display: "flex", gap: "12px" }}>
                      <a
                        href="https://wa.me/?text=Assalamualaikum,%20ayo%20hafal%20dengan%20aplikasi%20ini.%20Download%20di%20sini:%20https://tahfidzku.vercel.app"
                        target="_blank"
                        style={{
                          flex: 1,
                          textDecoration: "none",
                          display: "inline-flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "6px",
                          padding: "10px 0",
                          backgroundColor: "#25D366",
                          color: "white",
                          borderRadius: "8px",
                          fontWeight: "bold",
                          fontSize: "14px",
                        }}
                      >
                        <i className="fab fa-whatsapp"></i> WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Kontak */}
            <div
              className="modal fade"
              id="supportModal"
              tabIndex="-1"
              aria-labelledby="supportModalLabel"
              aria-hidden="true"
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title" id="supportModalLabel">Kontak</h5>
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    ></button>
                  </div>
                  <div className="modal-body text-start" style={{ 
                    position: 'relative',
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    paddingBottom: '40px'
                  }}>
                    <p>
                      Untuk pertanyaan, saran, bantuan teknis, atau kerja sama, silahkan hubungi kami:
                    </p>
                    <ul>
                      <li>
                        📧 Email: <a href="mailto:batamsatria2@gmail.com">batamsatria2@gmail.com</a>
                      </li>
                      <li>
                        📱 WhatsApp: <a href="https://wa.me/6285199466850">+62 851-9946-6850</a>
                      </li>
                    </ul>
                    
                    <div className="mt-4 p-3 bg-light rounded">
                      <h6 className="mb-3">🤝 Peluang Kerja Sama & Sponsor</h6>
                      
                      <div className="mb-3">
                        <strong>🎯 Untuk Sponsor & Advertiser:</strong>
                        <ul className="small mt-2">
                          <li>Tempatkan brand Anda di aplikasi Tahfidz Qur'an ini</li>
                          <li>Sponsorship dalam pengembangan fitur-fitur lainnya</li>
                          <li>Iklan native yang sesuai dengan nilai-nilai islami</li>
                        </ul>
                      </div>

                      <div className="mb-3">
                        <strong>💼 Jasa Pengembangan Custom:</strong>
                        <ul className="small mt-2">
                          <li>Pembuatan aplikasi web & mobile custom sesuai kebutuhan bisnis Anda</li>
                          <li>Development toko online (e-commerce)</li>
                          <li>Aplikasi perusahaan, UKM, atau startup</li>
                          <li>Integrasi payment gateway, SMS gateway, dan API lainnya</li>
                        </ul>
                      </div>

                      <div className="mb-3">
                        <strong>🚀 Layanan Lainnya:</strong>
                        <ul className="small mt-2">
                          <li>
                            <strong>👨‍💻 Private Coding Mentor</strong> - Fullstack Web & App Development 
                            untuk siswa usia 10+ tahun, bimbingan hingga mahir
                          </li>
                          <li>Konsultasi teknologi dan digital transformation</li>
                          <li>Maintenance & update aplikasi berkelanjutan</li>
                          <li>Optimasi performa dan keamanan aplikasi</li>
                        </ul>
                      </div>

                      <div className="alert alert-success small mt-3 mb-0">
                        <strong>💡 Tertarik bekerja sama?</strong><br/>
                        Mari diskusikan kebutuhan Anda! Kami siap membantu mewujudkan ide digital Anda dengan solusi teknologi yang tepat dan berkualitas.
                      </div>
                    </div>
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#212529',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    zIndex: 10,
                    animation: 'bounce 2s infinite'
                  }}>
                    Scroll ↓
                  </div>

                  <style>
                    {`
                    @keyframes bounce {
                      0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
                      40% { transform: translateX(-50%) translateY(-3px); }
                      60% { transform: translateX(-50%) translateY(-2px); }
                    }
                    `}
                  </style>
                </div>
              </div>
            </div>

            {/* ✅ MODAL BARU: Pilihan Donasi */}
            <div
              className="modal fade"
              id="donationModal"
              tabIndex="-1"
              aria-labelledby="donationModalLabel"
              aria-hidden="true"
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title" id="donationModalLabel">Donasi</h5>
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    ></button>
                  </div>
                  <div className="modal-body ">
                    <p className="mb-4 text-start">
                      
                      Pilih platform donasi:
                    </p>

                    <div className="row g-3">
                      {/* Opsi Saweria */}
                      <div className="col-12">
                        <div 
                          className="card h-100 border-0 shadow-sm"
                          style={{ 
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          onClick={() => window.open('https://saweria.co/batamiharja', '_blank')}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = "translateY(-3px)";
                            e.currentTarget.style.boxShadow = "0 6px 15px rgba(255,193,7,0.3)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                          }}
                        >
                          <div className="card-body py-4">
                            <div className="d-flex align-items-center mb-3">
                              <div 
                                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{ 
                                  width: '50px', 
                                  height: '50px', 
                                  backgroundColor: '#FFC107',
                                  color: 'white'
                                }}
                              >
                                <i className="fas fa-coins fs-5"></i>
                              </div>
                              <div className="text-start">
                                <h6 className="mb-1 fw-bold">Saweria</h6>
                                <small className="text-muted">Platform donasi Indonesia</small>
                              </div>
                            </div>
                            <p className="small text-muted mb-0 text-start">
                              Metode pembayaran lokal (Bank, E-Wallet, dll)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Opsi Lynk.id */}
                      <div className="col-12">
                        <div 
                          className="card h-100 border-0 shadow-sm"
                          style={{ 
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          onClick={() => window.open('http://lynk.id/batamiharja/s/o4nq4njynnwj', '_blank')}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = "translateY(-3px)";
                            e.currentTarget.style.boxShadow = "0 6px 15px rgba(13,110,253,0.3)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                          }}
                        >
                          <div className="card-body py-4">
                            <div className="d-flex align-items-center mb-3">
                              <div 
                                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{ 
                                  width: '50px', 
                                  height: '50px', 
                                  backgroundColor: '#0d6efd',
                                  color: 'white'
                                }}
                              >
                                <i className="fas fa-link fs-5"></i>
                              </div>
                              <div className="text-start">
                                <h6 className="mb-1 fw-bold">Lynk.id</h6>
                                <small className="text-muted">Link aggregator & donation</small>
                              </div>
                            </div>
                            <p className="small text-muted mb-0 text-start">
                              Metode pembayaran dan kemudahan akses
                            </p>
                          </div>
                        </div>
                      </div>
                      
                       {/* Opsi Transfer Langsung */}
                      <div className="col-12">
                        <div 
                          className="card h-100 border-0 shadow-sm"
                          style={{ 
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = "translateY(-3px)";
                            e.currentTarget.style.boxShadow = "0 6px 15px rgba(13,110,253,0.3)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                          }}
                        >
                          <span
  onClick={() => {
    navigator.clipboard.writeText('1090020833075');
    alert('Nomor rekening berhasil disalin!');
  }}
  style={{
    position: 'absolute',
    top: '10px',
    right: '15px',
    cursor: 'pointer',
    fontSize: '12px'
  }}
>
  📋 salin
</span>
                          
                          <div className="card-body py-4">
                            <div className="d-flex align-items-center mb-3">
                              <div 
                                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{ 
                                  width: '50px', 
                                  height: '50px', 
                                  backgroundColor: '#74eb34',
                                  color: 'white'
                                }}
                              >
                                <i className="fas fa-link fs-5"></i>
                              </div>
                              <div className="text-start">
                                <h6 className="mb-1 fw-bold">Transfer Langsung </h6>
                                <small className="text-muted">Bank Mandiri</small>
                              </div>
                            </div>
                            <p className="small text-muted mb-0 text-start">
                              1090020833075 - SATRIA BATAMIHARJA
                             
                            </p>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                    


                    <div className="mt-4 p-3 bg-light rounded">
                      <p className="small text-muted mb-0">
                        <strong>Catatan:</strong> Donasi Anda akan digunakan untuk pengembangan dan pemeliharaan aplikasi Qur'an ini, 
                        termasuk biaya server, update fitur, dan konten berkualitas. Jazakumullahu khairo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Download PWA */}
            <div
              className="modal fade"
              id="downloadModal"
              tabIndex="-1"
              aria-labelledby="downloadModalLabel"
              aria-hidden="true"
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title" id="downloadModalLabel">Download Aplikasi</h5>
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    ></button>
                  </div>
                  <div className="modal-body text-start">
      
                    <p>
                      Aplikasi ini mendukung PWA (Progressive Web App). Anda bisa menginstallnya seperti aplikasi native di smartphone atau desktop.
                    </p>
                    
                    <div className="mb-3">
                      <h6>📱 Untuk Smartphone (Android/iPhone):</h6>
                      <ol>
                        <li>Buka browser Chrome (Android) atau Safari (iPhone)</li>
                        <li>Tap menu (titik tiga di Chrome) atau share icon (kotak dengan panah di Safari)</li>
                        <li>Pilih <strong>"Add to Home Screen"</strong> atau <strong>"Install App"</strong></li>
                        <li>Konfirmasi install, dan aplikasi akan muncul di home screen Anda</li>
                      </ol>
                    </div>

                    <div className="mb-3">
                      <h6>💻 Untuk Desktop (Windows/Mac/Linux):</h6>
                      <ol>
                        <li>Buka browser Chrome, Edge, atau Safari</li>
                        <li>Klik icon <strong>"Install"</strong> atau <strong>"+"</strong> di address bar</li>
                        <li>Atau buka menu browser → "Install App"</li>
                        <li>Aplikasi akan terinstall seperti aplikasi desktop biasa</li>
                      </ol>
                    </div>
                    
                    <p className="text-muted small">
                      Setelah diinstall, Anda bisa membuka aplikasi langsung dari home screen atau desktop tanpa perlu membuka browser lagi. Jika gagal install mungkin butuh update browser versi terbaru terlebih dahulu, lalu coba install ulang.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Hak Cipta */}
            <footer className="mt-4 mt-10 text-center">
              <p className="small text-muted">&copy; 2025 BatamApp. All rights reserved.</p>
            </footer>
          </Container>
        }
      />

      {/* ✅ ROUTE UNTUK FITUR1 DAN FITUR2 - PERBAIKAN PATH */}
      <Route 
        path="app/fitur1/*" 
        element={<Index1 session={session} userStatus={userStatus} />} 
      />
      <Route 
        path="app/fitur2/*" 
        element={<Index2 session={session} userStatus={userStatus} />} 
      />
       <Route 
        path="app/fitur3/*" 
        element={<Index3 session={session} userStatus={userStatus} />} 
      />
    </Routes>
  );
}

export default App2;