//Login
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

// App2.jsx
import { Container, Button } from "react-bootstrap";
import { useNavigate, Routes, Route } from "react-router-dom";
import Index1 from "./pages/fitur1/Index1";

//icon

<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
/>;

function App2() {
  //Login TEMPLATE

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/"); // kalau tidak ada session, balik ke login
      } else {
        setLoading(false);
      }
    };

    checkSession();

    // listen kalau session berubah (misal logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return <p style={{ padding: "2rem" }}>Loading...</p>;
  }

  //BATAS TEMPLATE

  //App

  return (
    //App

    <Routes>
      {/* Landing Page */}
      <Route
        path="/"
        element={
          <Container
            fluid
            className="text-center pt-5"
            style={{
              maxWidth: "100%",
              minHeight: "100vh",
              padding: "40px 20px",
              background: "linear-gradient(135deg, #f9fdf9, #f0fdfa, #f9f9ff)",
              backgroundAttachment: "fixed",
            }}
          >
            {/* Header */}
            <h1 className="fw-bold display-6 mb-2">Assalamu’alaikum</h1>
            <p className="text-muted fs-5 text-justify">
              Selamat datang di aplikasi Qur’an. Silakan mulai dengan memilih
              fitur.
            </p>

            {/* Kartu Fitur */}
            <div className="d-flex justify-content-center gap-3 flex-wrap mt-4">
              <div
                className="card shadow p-4 text-center clickable-card"
                style={{
                  flex: "1 1 300px",
                  cursor: "pointer",
                  background:
                    "linear-gradient(135deg, rgba(40,167,69,0.15), rgba(23,162,184,0.15))",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "15px",
                  transition: "all 0.3s ease",
                }}
                onClick={() => navigate("app/fitur1")}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(23,162,184,0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 10px rgba(0,0,0,0.1)";
                }}
              >
                <h5>📖 Tahfidz</h5>
                <p className="small text-muted">Mengingat hafalan Al-Qur’an</p>
              </div>

              <div
                className="card shadow p-4 text-center clickable-card"
                style={{
                  flex: "1 1 300px",
                  cursor: "pointer",
                  background:
                    "linear-gradient(135deg, rgba(23,162,184,0.15), rgba(40,167,69,0.15))",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "15px",
                  transition: "all 0.3s ease",
                }}
                onClick={() => navigate("app/fitur2")}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(40,167,69,0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 10px rgba(0,0,0,0.1)";
                }}
              >
                <h5>🎧 Istima’</h5>
                <p className="small text-muted">Mendengarkan Al-Qur’an</p>
              </div>
            </div>

            {/* Footer Quote */}
            <div
              className="card shadow-sm p-4 mt-5 text-muted small"
              style={{
                maxWidth: "700px",
                margin: "0 auto",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(245,245,245,0.6))",
                backdropFilter: "blur(6px)",
                borderRadius: "12px",
              }}
            >
              <p className="mb-0 fs-6 fst-italic">
                “Sebaik-baik kalian adalah yang belajar Al-Qur’an dan
                mengajarkannya”
              </p>
              <p className="mb-0">(HR. Bukhari)</p>
            </div>

            {/* Footer Link */}
            <footer className="mt-4 text-secondary small">
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
                    <h5 className="modal-title" id="aboutModalLabel">
                      Tentang Aplikasi
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    ></button>
                  </div>
                  <div className="modal-body text-start">
                    <p>
                      Aplikasi ini dirancang untuk membantu menghafal (Tahfidz)
                      dan mendengarkan (Istima’) Al-Qur’an dengan cara yang
                      mudah dan praktis.
                    </p>
                    <p>
                      Setiap fitur dilengkapi panduan di dalamnya agar Anda bisa
                      langsung mulai.
                    </p>
                    <p>
                      Jika ada pembaruan aplikasi, fitur akan update tanpa harus
                      install ulang.
                    </p>
                    <p>
                      Bantu teman dan keluarga menghafal dan mendengarkan
                      Al-Qur’an. Bagikan aplikasi ini sebagai amal sholeh dan
                      amal jariyah Anda. Setiap klik berbagi, akan sangat berarti.
                    </p>
                   
<div
  style={{
    display: "flex",
    gap: "12px",
  }}
>
  {/* WhatsApp */}
  <a
    href="https://wa.me/?text=Assalamualaikum,%20ayo%20hafal%20dan%20dengarkan%20Al-Qur’an%20dengan%20aplikasi%20ini.%20Download%20di%20sini:%20https://example.com"
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

  {/* Facebook */}
  <a
    href="https://www.facebook.com/sharer/sharer.php?u=https://example.com&quote=Bantu teman dan keluarga menghafal Al-Qur’an. Bagikan aplikasi ini sebagai amal sholeh dan amal jariyah Anda. Setiap klik berbagi, akan sangat berarti."
    target="_blank"
    style={{
      flex: 1,
      textDecoration: "none",
      display: "inline-flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "6px",
      padding: "10px 0",
      backgroundColor: "#4267B2",
      color: "white",
      borderRadius: "8px",
      fontWeight: "bold",
      fontSize: "14px",
    }}
  >
    <i className="fab fa-facebook-f"></i> Facebook
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
                    <h5 className="modal-title" id="supportModalLabel">
                      Kontak & Dukungan
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    ></button>
                  </div>
                  <div className="modal-body text-start">
                    <p>
                      Untuk pertanyaan, saran, atau bantuan teknis, silakan
                      hubungi tim kami:
                    </p>
                    <ul>
                      <li>
                        Email:{" "}
                        <a href="mailto:support@quranapp.com">
                          support@quranapp.com
                        </a>
                      </li>
                      <li>
                        WhatsApp:{" "}
                        <a href="https://wa.me/6282169089911">
                          +62 812-3456-7890
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        }
      />

      {/* Fitur 1 (Tahfidz) */}
      <Route path="app/fitur1/*" element={<Index1 />} />

      {/* Fitur 2: Placeholder sementara */}
      <Route
        path="app/fitur2"
        element={
          <Container className="text-center mt-5">
            <h2>Fitur 2 sedang dikembangkan</h2>
            <p>Silakan kembali nanti.</p>
          </Container>
        }
      />
    </Routes>
  );
}

export default App2;
