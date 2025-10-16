// Di file: src/components/sidebar/Sidebar1.jsx

// PERBAIKAN: Hanya sembunyikan persentase di fitur3, fitur1 & fitur2 tetap tampil
import React, { useEffect, useState, forwardRef } from "react";
import { Link, useLocation, useNavigate} from "react-router-dom";
import { Modal, Button, Form } from "react-bootstrap";

import suratConfig from "../../data/SuratConfig";
import { supabase } from "../../../../services/supabase";
import { UserStorage } from "../../utils/userStorage";

const Sidebar1 = forwardRef(({ 
  isOpen, 
  toggleSidebar, 
  basePath = "/app2/app/fitur1", // Default tetap fitur1
  session, 
  userStatus
}, ref) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [suratList, setSuratList] = useState([]);
  const [maxWidth, setMaxWidth] = useState("250px");
  const [openPremium, setOpenPremium] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedPremiums, setSelectedPremiums] = useState([]);
  const [userEmail, setUserEmail] = useState("");

  // ✅ PERBAIKAN: Deteksi fitur aktif dengan lebih akurat
  const currentFitur = location.pathname.includes('/fitur3') ? 'fitur3' : 
                      location.pathname.includes('/fitur2') ? 'fitur2' : 'fitur1';

  // ✅ PERBAIKAN: Set basePath otomatis berdasarkan fitur aktif
  const actualBasePath = currentFitur === 'fitur3' ? '/app2/app/fitur3' :
                        currentFitur === 'fitur2' ? '/app2/app/fitur2' : 
                        '/app2/app/fitur1';

  // ✅ EFFECT UNTUK MENGONTROL BODY SCROLL
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
    }

    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
    };
  }, [isOpen]);

  // ✅ Ambil email user dari session
  useEffect(() => {
    if (session) {
      setUserEmail(session.user.email);
    }
  }, [session]);
  
  // ✅ PERBAIKAN: Handle klik beranda - navigasi ke root App2
  const handleBerandaClick = () => {
    window.dispatchEvent(new CustomEvent('stopAllAudio'));
    toggleSidebar();
    
    if (location.pathname !== '/app2') {
      navigate("/app2", { replace: true });
    }
  };

  // ✅ PERBAIKAN: Handle klik surat - stop audio sebelum pindah
  const handleSuratClick = () => {
    window.dispatchEvent(new CustomEvent('stopAllAudio'));
    toggleSidebar();
  };

  // ✅ PERBAIKAN: Handle pindah fitur - GUNAKAN basePath yang benar (tidak dipakai)
  const handlePindahFitur = (targetFitur) => {
    window.dispatchEvent(new CustomEvent('stopAllAudio'));
    toggleSidebar();
    
    const lastPage = UserStorage.getHistory(session, targetFitur);
    
    if (lastPage && lastPage !== `/app2/app/${targetFitur}` && 
        lastPage !== `/app2/app/${targetFitur}/panduan${targetFitur.slice(-1)}`) {
      navigate(lastPage);
    } else {
      navigate(`/app2/app/${targetFitur}`);
    }
  };

  // ✅ FUNGSI BARU: Handle klik surat dengan basePath yang benar
  const handleSuratClickWithBase = (suratNomor) => {
    window.dispatchEvent(new CustomEvent('stopAllAudio'));
    toggleSidebar();
    navigate(`${actualBasePath}/${suratNomor}`);
  };

  // ✅ FUNGSI BARU: Handle tombol "BUKA SURAT TERKUNCI" dengan modal konfirmasi
  const handleBukaSurat = () => {
    if (!session) {
      setShowLoginModal(true);
      toggleSidebar();
    } else {
      setShowPremiumModal(true);
      toggleSidebar();
    }
  };

  // ✅ FUNGSI BARU: Handle redirect ke login setelah tutup modal
  const handleRedirectToLogin = () => {
    setShowLoginModal(false);
    navigate('/login', { state: { from: location } });
  };

  // ✅ PERBAIKAN: Fungsi hitung progress dengan UserStorage - sesuaikan untuk fitur3
  const getSuratProgress = (suratNomor, totalAyat) => {
    let hafalCount = 0;
    for (let i = 1; i <= totalAyat; i++) {
      if (UserStorage.getHafalan(session, suratNomor, i)) {
        hafalCount++;
      }
    }
    return Math.round((hafalCount / totalAyat) * 100);
  };

  // ✅ PERBAIKAN: Fungsi hitung progress premium dengan UserStorage
  const getPremiumProgress = (suratListInPremium) => {
    let totalAyat = 0;
    let totalHafal = 0;
    
    suratListInPremium.forEach(surat => {
      totalAyat += surat.jumlah_ayat;
      for (let i = 1; i <= surat.jumlah_ayat; i++) {
        if (UserStorage.getHafalan(session, surat.nomor, i)) {
          totalHafal++;
        }
      }
    });
    
    return totalAyat > 0 ? Math.round((totalHafal / totalAyat) * 100) : 0;
  };

  // ✅ FUNGSI BARU: Dapatkan warna berdasarkan persentase
  const getProgressColor = (progress) => {
    if (progress === 100) return "#28a745";
    if (progress >= 76) return "#007bff";
    if (progress >= 56) return "#ffc107";
    if (progress >= 26) return "#fd7e14";
    return "#dc3545";
  };

  // ✅ AMBIL SURAT HANYA DARI PREMIUM YANG AKTIF (GUNAKAN USERSTATUS DARI PROP)
  useEffect(() => {
    const all = [];

    const premiumMapping = {
      'premium1': 0,
      'premium2': 1, 
      'premium3': 2,
      'premium4': 3,
      'premium5': 4,
      'premium6': 5,
      'premium7': 6,
      'premium8': 7,
      'premium9': 8,
      'premium10': 9
    };

    Object.keys(suratConfig).forEach((key) => {
      const premiumIndex = premiumMapping[key];
      
      if (premiumIndex !== undefined && userStatus[premiumIndex] === true) {
        const premium = suratConfig[key];
        
        if (premium && Array.isArray(premium.data)) {
          premium.data.forEach((surat) => {
            if (surat) all.push({ ...surat, premium: key });
          });
        }
      }
    });

    setSuratList(all);

    if (all.length > 0) {
      const maxLen = Math.max(
        ...all.map((s) =>
          s && (s.nama_latin || s.nama)
            ? (s.nama_latin || s.nama).length
            : 6
        ),
        6
      );
      setMaxWidth(`${maxLen * 20}px`);
    }
  }, [userStatus]);

  // ✅ Cek apakah semua premium sudah dibeli (premium1-9)
  const semuaPremiumDibeli = () => {
    for (let i = 0; i < 9; i++) {
      if (userStatus[i] !== true) {
        return false;
      }
    }
    return true;
  };

  // ✅ Toggle pilihan premium di modal
  const togglePremiumSelection = (premiumIndex) => {
    setSelectedPremiums(prev => {
      if (prev.includes(premiumIndex)) {
        return prev.filter(item => item !== premiumIndex);
      } else {
        return [...prev, premiumIndex];
      }
    });
  };

  // ✅ Fungsi untuk buka WhatsApp dengan pesan pembelian
  const bukaWhatsAppPembelian = () => {
    if (selectedPremiums.length === 0) return;

    const premiumNames = selectedPremiums.map(index => `premium${index + 1}`).join(", ");
    const totalHarga = selectedPremiums.length * 10000;
    
    const message = `Halo, saya ingin membuka ${premiumNames} untuk aplikasi Tahfidz Qur'an. Email: ${userEmail}`;
    const encodedMessage = encodeURIComponent(message);
    
    const whatsappUrl = `https://wa.me/6285199466850?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    setShowPremiumModal(false);
    setSelectedPremiums([]);
  };

  // ✅ Fungsi untuk mendapatkan informasi surat dalam premium
  const getSuratInfo = (premiumIndex) => {
    const premiumKey = `premium${premiumIndex + 1}`;
    const premiumData = suratConfig[premiumKey];
    
    if (!premiumData || !premiumData.data) return "";
    
    const suratList = premiumData.data;
    if (suratList.length === 0) return "";
    
    const firstSurat = suratList[0];
    const lastSurat = suratList[suratList.length - 1];
    
    if (firstSurat.nomor === lastSurat.nomor) {
      return `Surat ${firstSurat.nomor}`;
    } else {
      return `Surat ${firstSurat.nomor}-${lastSurat.nomor}`;
    }
  };

  // ✅ FUNGSI BARU: Handle logout dengan redirect ke beranda
  const handleLogout = async () => {
    window.dispatchEvent(new CustomEvent('stopAllAudio'));
    toggleSidebar();
    await UserStorage.clearUserData(session);
    navigate("/app2");
    
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err.message);
    }
  };

  // ✅ Style
  const styles = {
    sidebar: {
      width: maxWidth,
      height: "calc(100vh - 56px)",
      overflowY: "auto",
      position: "fixed",
      top: "56px",
      left: 0,
      zIndex: 1200,
      backgroundColor: "#212529",
      color: "#fff",
      transition: "transform 0.3s ease-in-out",
    },
    navLink: {
      padding: "6px 6px",
      borderRadius: "6px",
      display: "block",
      color: "#fff",
      textDecoration: "none",
      cursor: "pointer",
      border: "none",
      background: "none",
      width: "100%",
      textAlign: "left"
    },
    premiumButton: {
      padding: "0px 6px",
      cursor: "pointer",
      color: "#fff",
      textTransform: "capitalize",
      marginTop: "8px",
      marginBottom: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    caret: {
      marginLeft: "8px",
      transition: "transform 0.3s ease",
    },
    bukaSuratButton: {
      padding: "6px 6px",
      borderRadius: "6px",
      display: "block",
      color: "#fff",
      textDecoration: "none",
      cursor: "pointer",
      border: "none",
      background: "none",
      width: "100%",
      textAlign: "left"
    },
    pindahFiturButton: {
      padding: "8px 6px",
      borderRadius: "6px",
      display: "block",
      color: "#fff",
      textDecoration: "none",
      cursor: "pointer",
      border: "none",
      background: "linear-gradient(135deg, rgba(23,162,184,0.3), rgba(40,167,69,0.3))",
      width: "100%",
      textAlign: "left",
      margin: "8px 0",
      fontWeight: "bold",
      transition: "all 0.3s ease"
    }
  };

  // ✅ Kelompokkan berdasarkan Premium
  const groupedByPremium = suratList.reduce((acc, surat) => {
    if (!acc[surat.premium]) acc[surat.premium] = [];
    acc[surat.premium].push(surat);
    return acc;
  }, {});

  return (
    <div
      ref={ref}
      style={{
        ...styles.sidebar, 
        paddingBottom: '100px',
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
      }}
      onWheel={(e) => {
        e.stopPropagation();
      }}
    >
      <ul className="nav flex-column p-3">
        {/* ✅ PERBAIKAN: Tombol BERANDA menggunakan fungsi handleBerandaClick */}
        <li className="nav-item">
          <button
            style={styles.navLink}
            onClick={handleBerandaClick}
            className="nav-link text-white"
          >
            BERANDA
          </button>
        </li>

        {/* ✅ PERBAIKAN: Panduan dengan basePath yang benar */}
        <li className="nav-item">
          <Link
            to={actualBasePath}
            className="nav-link"
            style={styles.navLink}
            onClick={handleSuratClick}
          >
            {currentFitur === 'fitur3' ? 'PANDUAN MA\'NA' : 
             currentFitur === 'fitur2' ? 'PANDUAN ISTIMA\'' : 
             'PANDUAN TAHFIDZ'}
          </Link>
        </li>

        {/* ✅ PERBAIKAN: Tombol Buka Surat - SELALU TAMPIL (baik login atau belum) */}
        {!semuaPremiumDibeli() && (
          <li className="nav-item">
            <button
              style={styles.bukaSuratButton}
              onClick={handleBukaSurat}
              className="nav-link"
            >
              BUKA SURAT TERKUNCI
            </button>
          </li>
        )}

        {/* ✅ PERBAIKAN: Premium Aktif dengan Progress - gunakan actualBasePath */}
        {/* ✅ PERUBAHAN: Hanya sembunyikan persentase untuk fitur3 */}
        {Object.keys(groupedByPremium).map((premiumKey) => {
          const premiumProgress = getPremiumProgress(groupedByPremium[premiumKey]);
          const progressColor = getProgressColor(premiumProgress);
          
          return (
            <li className="nav-item" key={premiumKey}>
              <p
                style={styles.premiumButton}
                onClick={() => setOpenPremium(openPremium === premiumKey ? null : premiumKey)}
              >
                <span>
                  {premiumKey.replace('premium', 'Premium ')}
                  {/* ✅ PERUBAHAN: Hanya sembunyikan persentase untuk fitur3 */}
                  {currentFitur !== 'fitur3' && (
                    <> (
                      <span style={{ color: progressColor, fontWeight: 'bold' }}>
                        {premiumProgress}%
                      </span>
                    )</>
                  )}
                </span>
                <span
                  style={{
                    ...styles.caret,
                    transform: openPremium === premiumKey ? "rotate(90deg)" : "rotate(0)",
                  }}
                >
                  ▶
                </span>
              </p>

              {openPremium === premiumKey && (
                <ul className="nav flex-column ms-3">
                  {groupedByPremium[premiumKey].map((surat) => {
                    const suratProgress = getSuratProgress(surat.nomor, surat.jumlah_ayat);
                    const suratProgressColor = getProgressColor(suratProgress);
                    
                    return (
                      <li key={surat.nomor}>
                        <button
                          className="nav-link"
                          style={styles.navLink}
                          onClick={() => handleSuratClickWithBase(surat.nomor)}
                        >
                          {surat.nomor} {surat.nama_latin || surat.nama}
                          {/* ✅ PERUBAHAN: Hanya sembunyikan persentase untuk fitur3 */}
                          {currentFitur !== 'fitur3' && (
                            <> (
                              <span style={{ color: suratProgressColor, fontWeight: 'bold' }}>
                                {suratProgress}%
                              </span>
                            )</>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}

        {/* ✅ Logout - Hanya tampil jika login */}
        {session && (
          <li className="nav-item">
            <div 
              style={styles.navLink} 
              onClick={handleLogout}
              className="nav-link text-white"
            >
              KELUAR
            </div>
          </li>
        )}
      </ul>

      {/* ✅ Modal Pembelian Premium - Hanya untuk user yang login */}
      {session && (
        <Modal show={showPremiumModal} onHide={() => setShowPremiumModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Buka Surat Premium</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Pilih premium yang ingin dibuka (Rp 10.000 per premium):</p>
            
            <div className="row">
              {userStatus.slice(0, 9).map((status, index) => (
                !status && (
                  <div key={index} className="col-6 mb-3">
                    <div 
                      className="p-2 border rounded h-100"
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: selectedPremiums.includes(index) ? '#e7f3ff' : 'white'
                      }}
                      onClick={() => togglePremiumSelection(index)}
                    >
                      <Form.Check
                        type="checkbox"
                        id={`premium-${index + 1}`}
                        label={
                          <div>
                            <div className="fw-bold">Premium {index + 1}</div>
                            <div className="small text-muted mt-1">
                              {getSuratInfo(index)}
                            </div>
                          </div>
                        }
                        checked={selectedPremiums.includes(index)}
                        onChange={() => togglePremiumSelection(index)}
                        className="mb-0"
                      />
                    </div>
                  </div>
                )
              ))}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="w-100 d-flex justify-content-between align-items-center">
              <Button variant="secondary" onClick={() => {
                setShowPremiumModal(false);
                setSelectedPremiums([]);
              }}>
                Batal
              </Button>
              <div className="d-flex align-items-center">
                {selectedPremiums.length > 0 && (
                  <span className="me-3 text-muted">
                    Total: <strong>Rp {selectedPremiums.length * 10000}</strong>
                  </span>
                )}
                <Button 
                  variant="primary" 
                  onClick={bukaWhatsAppPembelian}
                  disabled={selectedPremiums.length === 0}
                >
                  Pesan ({selectedPremiums.length})
                </Button>
              </div>
            </div>
          </Modal.Footer>
        </Modal>
      )}

      {/* ✅ MODAL BARU: Konfirmasi Login untuk Guest User */}
      <Modal show={showLoginModal} onHide={() => setShowLoginModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>🔒 Login Diperlukan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔐</div>
            <h5>Anda perlu login terlebih dahulu</h5>
            <p className="text-muted">
              Untuk membuka surat premium tambahan, Anda harus memiliki akun dan login.
              Dengan login, Anda bisa memesan premium dan mengakses semua fitur aplikasi.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowLoginModal(false)}
            style={{ marginRight: "1rem" }}
          >
            Nanti Saja
          </Button>
          <Button 
            variant="primary" 
            onClick={handleRedirectToLogin}
          >
            🔑 Login 
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
});

export default Sidebar1;