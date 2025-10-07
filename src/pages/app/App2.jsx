import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { Container, Button } from "react-bootstrap";
import { useNavigate, Routes, Route } from "react-router-dom";
import Index1 from "./pages/fitur1/Index1";
import Index2 from "./pages/fitur2/Index2";
import { HistoryManager } from "./utils/history"; // ✅ IMPORT HISTORY MANAGER

function App2() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Error checking session:", error);
          navigate("/");
          return;
        }

        if (!user) {
          navigate("/");
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Session check failed:", err);
        navigate("/");
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          navigate("/");
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setLoading(false);
        }
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

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Container
            fluid
            className="pt-5"
            style={{
              width: "100%",
              minWidth: "360px",
              maxWidth: "768px",
              margin: "0 auto",
              padding: "40px 20px",
              background: "linear-gradient(135deg, #f9fdf9, #f0fdfa, #f9f9ff)",
              backgroundAttachment: "fixed",
            }}
          >
            {/* Header - TEXT CENTER */}
            <h1 className="fw-bold display-6 mb-2 text-center">Assalamu'alaikum</h1>
            <p className="text-muted fs-5 text-center">
              Selamat datang di aplikasi Qur'an. Silakan mulai dengan memilih fitur.
            </p>

            {/* Kartu Fitur - ✅ MODIFIKASI ONCLICK */}
            <div className="d-flex justify-content-center gap-3 flex-wrap mt-4">
              <div
                className="card shadow p-4 text-center clickable-card"
                style={{
                  flex: "1 1 300px",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, rgba(40,167,69,0.15), rgba(23,162,184,0.15))",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "15px",
                  transition: "all 0.3s ease",
                }}
                onClick={() => {
                  // ✅ CEK HISTORY UNTUK FITUR 1
                  const lastPage = HistoryManager.getLastPage('fitur1');
                  console.log('Last page fitur1:', lastPage);
                  
                  if (lastPage && lastPage !== '/app2/app/fitur1' && lastPage !== '/app2/app/fitur1/panduan1') {
                    navigate(lastPage); // ✅ KE HALAMAN TERAKHIR
                  } else {
                    navigate("app/fitur1"); // ✅ KE PANDUAN JIKA BELUM ADA HISTORY
                  }
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
                <h5>📖 Tahfidz</h5>
                <p className="small text-muted">Mengingat hafalan Al-Qur'an</p>
              </div>

              <div
                className="card shadow p-4 text-center clickable-card"
                style={{
                  flex: "1 1 300px",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, rgba(23,162,184,0.15), rgba(40,167,69,0.15))",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "15px",
                  transition: "all 0.3s ease",
                }}
                onClick={() => {
                  // ✅ CEK HISTORY UNTUK FITUR 2
                  const lastPage = HistoryManager.getLastPage('fitur2');
                  console.log('Last page fitur2:', lastPage);
                  
                  if (lastPage && lastPage !== '/app2/app/fitur2' && lastPage !== '/app2/app/fitur2/panduan2') {
                    navigate(lastPage); // ✅ KE HALAMAN TERAKHIR
                  } else {
                    navigate("app/fitur2"); // ✅ KE PANDUAN JIKA BELUM ADA HISTORY
                  }
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
                <h5>🎧 Istima'</h5>
                <p className="small text-muted">Mendengarkan Al-Qur'an</p>
              </div>
            </div>

            {/* Footer Quote - TEXT CENTER */}
            <div
              className="card shadow-sm p-4 mt-5 text-muted small text-center"
              style={{
                maxWidth: "700px",
                margin: "0 auto",
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

            {/* Footer Link - TEXT CENTER */}
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
              {/* TAMBAHAN LINK DOWNLOAD */}
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
                        href="https://wa.me/?text=Assalamualaikum,%20ayo%20hafal%20dan%20dengarkan%20Al-Qur'an%20dengan%20aplikasi%20ini.%20Download%20di%20sini:%20https://tahfidzku.vercel.app"
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
                    <h5 className="modal-title" id="supportModalLabel">Kontak & Dukungan</h5>
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
  paddingBottom: '40px' // Beri ruang untuk indikator
}}>
  <p>
    Untuk pertanyaan, saran, bantuan teknis, atau kerja sama, silakan hubungi kami:
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
{/* INDIKATOR SCROLL UNTUK MODAL */}
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

            {/* MODAL BARU UNTUK DOWNLOAD PWA */}
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
                      <strong>Install Aplikasi di Perangkat Anda</strong>
                    </p>
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
                      Setelah diinstall, Anda bisa membuka aplikasi langsung dari home screen atau desktop tanpa perlu membuka browser lagi.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </Container>
        }
      />

      <Route path="app/fitur1/*" element={<Index1 />} />
      <Route path="app/fitur2/*" element={<Index2 />} />
    </Routes>
  );
}

export default App2;