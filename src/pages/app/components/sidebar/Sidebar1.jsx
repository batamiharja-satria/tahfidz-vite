import React, { useEffect, useState, forwardRef } from "react";
import { Link, useLocation, useNavigate} from "react-router-dom";
import { Modal, Button, Form } from "react-bootstrap";
import Logout from "../../../../components/Logout";
import suratConfig from "../../data/SuratConfig";
import { supabase } from "../../../../services/supabase";
import { HistoryManager } from "../../utils/history"; // ✅ IMPORT HISTORY MANAGER

const Sidebar1 = forwardRef(({ isOpen, toggleSidebar, basePath = "/app2/app/fitur1" }, ref) => {
  const location = useLocation();
  const [suratList, setSuratList] = useState([]);
  const [maxWidth, setMaxWidth] = useState("250px");
  const [openPremium, setOpenPremium] = useState(null);
  const [userStatus, setUserStatus] = useState([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedPremiums, setSelectedPremiums] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate(); // ✅ TAMBAHKAN useNavigate

  // ✅ Cek apakah sedang di fitur1 atau fitur2
  const isFitur1 = location.pathname.includes('/fitur1');
  const isFitur2 = location.pathname.includes('/fitur2');

  // ✅ EFFECT UNTUK MENGONTROL BODY SCROLL
  useEffect(() => {
    if (isOpen) {
      // Sidebar terbuka - disable body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // Sidebar tertutup - enable body scroll
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
    }

    // Cleanup
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
    };
  }, [isOpen]);

  // ✅ Ambil email user
  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
      }
    };
    getUserEmail();
  }, []);

  // ✅ PERBAIKAN: Handle klik surat - stop audio sebelum pindah
  const handleSuratClick = () => {
    // Stop semua audio sebelum pindah surat
    window.dispatchEvent(new CustomEvent('stopAllAudio'));
    toggleSidebar();
  };

  // ✅ FUNGSI BARU: Handle pindah fitur
  const handlePindahFitur = (targetFitur) => {
    // Stop semua audio sebelum pindah fitur
    window.dispatchEvent(new CustomEvent('stopAllAudio'));
    
    // Tutup sidebar
    toggleSidebar();
    
    // Cek history untuk fitur tujuan
    const lastPage = HistoryManager.getLastPage(targetFitur);
    console.log(`Last page ${targetFitur}:`, lastPage);
    
    // Navigasi ke halaman terakhir atau panduan
    if (lastPage && lastPage !== `/app2/app/${targetFitur}` && lastPage !== `/app2/app/${targetFitur}/panduan${targetFitur === 'fitur1' ? '1' : '2'}`) {
      navigate(lastPage);
    } else {
      navigate(`/app2/app/${targetFitur}`);
    }
  };

  // ✅ Fungsi hitung progress per surat
  const getSuratProgress = (suratNomor, totalAyat) => {
    let hafalCount = 0;
    for (let i = 1; i <= totalAyat; i++) {
      const key = `hafalan_${suratNomor}_${i}`;
      if (localStorage.getItem(key) === 'true') {
        hafalCount++;
      }
    }
    return Math.round((hafalCount / totalAyat) * 100);
  };

  // ✅ Fungsi hitung progress per premium
  const getPremiumProgress = (suratListInPremium) => {
    let totalAyat = 0;
    let totalHafal = 0;
    
    suratListInPremium.forEach(surat => {
      totalAyat += surat.jumlah_ayat;
      for (let i = 1; i <= surat.jumlah_ayat; i++) {
        const key = `hafalan_${surat.nomor}_${i}`;
        if (localStorage.getItem(key) === 'true') {
          totalHafal++;
        }
      }
    });
    
    return totalAyat > 0 ? Math.round((totalHafal / totalAyat) * 100) : 0;
  };

  // ✅ FUNGSI BARU: Dapatkan warna berdasarkan persentase
  const getProgressColor = (progress) => {
    if (progress === 100) return "#28a745"; // Hijau - 100%
    if (progress >= 76) return "#007bff";   // Biru - 76-99%
    if (progress >= 56) return "#ffc107";   // Kuning - 56-75%
    if (progress >= 26) return "#fd7e14";   // Orange - 26-55%
    return "#dc3545";                       // Merah - 0-25%
  };

  // ✅ Ambil status Premium dari Supabase
  const fetchUserStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("status")
        .eq("email", user.email)
        .single();

      if (error) {
        console.error("Gagal ambil status:", error.message);
      } else if (data && data.status) {
        let statusArray = [];
        
        if (Array.isArray(data.status)) {
          statusArray = data.status;
        } else if (typeof data.status === "object") {
          statusArray = Object.values(data.status);
        } else if (typeof data.status === "string") {
          try {
            statusArray = JSON.parse(data.status);
          } catch (err) {
            console.error("Gagal parse JSON:", err);
          }
        }
        
        if (statusArray.length !== 10) {
          statusArray = [false, false, false, false, false, false, false, false, false, true];
        }
        
        setUserStatus(statusArray);
      }
    } catch (err) {
      console.error("Error fetchUserStatus:", err.message);
    }
  };

  // 🔁 Pertama kali ambil data status
  useEffect(() => {
    fetchUserStatus();
  }, []);

  // ⚡ Realtime listener perubahan tabel profiles
  useEffect(() => {
    const channel = supabase
      .channel("profiles-channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          fetchUserStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ✅ Ambil surat hanya dari Premium yang aktif (true)
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
    const totalHarga = selectedPremiums.length * 15000;
    
    const message = `Halo, saya ingin membuka${premiumNames} untuk aplikasi Tahfidz Qur'an. Email: ${userEmail}`;
    const encodedMessage = encodeURIComponent(message);
    
    // Ganti nomor WhatsApp dengan nomor Anda
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
    // ✅ STYLE BARU UNTUK TOMBOL PINDAH FITUR
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
      // ✅ HANYA GUNAKAN WHEEL HANDLER SEDERHANA
      onWheel={(e) => {
        // Biarkan scroll internal sidebar bekerja normal
        e.stopPropagation();
      }}
    >
      <ul className="nav flex-column p-3">
        {/* ✅ Beranda */}




        {/* ✅ TOMBOL BARU: PINDAH FITUR */}
        <li className="nav-item">
          <button
            style={styles.pindahFiturButton}
            onClick={() => handlePindahFitur(isFitur1 ? 'fitur2' : 'fitur1')}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(23,162,184,0.5), rgba(40,167,69,0.5))";
              e.currentTarget.style.transform = "translateX(5px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(23,162,184,0.3), rgba(40,167,69,0.3))";
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            {isFitur1 ? "🎧 PINDAH KE ISTIMA'" : "📖 PINDAH KE TAHFIDZ"}
          </button>
        </li>
                <li className="nav-item">
          <Link
            to="/app2"
            className="nav-link"
            style={styles.navLink}
            onClick={handleSuratClick}
          >
            BERANDA
          </Link>
        </li>
                {/* ✅ Panduan - TOGGLE berdasarkan halaman aktif */}
        {isFitur1 && (
          <li className="nav-item">
            <Link
              to="/app2/app/fitur1"
              className="nav-link"
              style={styles.navLink}
              onClick={handleSuratClick}
            >
              PANDUAN TAHFIDZ
            </Link>
          </li>
        )}
        
        {isFitur2 && (
          <li className="nav-item">
            <Link
              to="/app2/app/fitur2"
              className="nav-link"
              style={styles.navLink}
              onClick={handleSuratClick}
            >
              PANDUAN ISTIMA'
            </Link>
          </li>
        )}

        {/* ✅ Tombol Buka Surat - Hanya tampil jika ada premium yang belum dibeli */}
        {!semuaPremiumDibeli() && (
          <li className="nav-item">
            <button
              style={styles.bukaSuratButton}
              onClick={() => {
                setShowPremiumModal(true);
                toggleSidebar();
              }}
              className="nav-link"
            >
              BUKA SURAT TERKUNCI
            </button>
          </li>
        )}

        {/* ✅ Premium Aktif dengan Progress */}
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
                  {premiumKey.replace('premium', 'Premium ')} (
                  <span style={{ color: progressColor, fontWeight: 'bold' }}>
                    {premiumProgress}%
                  </span>
                  )
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
                        <Link
                          to={`${basePath}/${surat.nomor}`}
                          className="nav-link"
                          style={styles.navLink}
                          onClick={handleSuratClick}
                        >
                          {surat.nomor} {surat.nama_latin || surat.nama} (
                          <span style={{ color: suratProgressColor, fontWeight: 'bold' }}>
                            {suratProgress}%
                          </span>
                          )
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}

        {/* ✅ Logout */}
        <li className="nav-item">
          <Link className="nav-link text-white" style={styles.navLink}>
            <Logout />
          </Link>
        </li>
      </ul>

      {/* ✅ Modal Pembelian Premium */}
      <Modal show={showPremiumModal} onHide={() => setShowPremiumModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Buka Surat Premium</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Pilih premium yang ingin dibuka (Rp 15.000 per premium):</p>
          
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
                  Total: <strong>Rp {selectedPremiums.length * 15000}</strong>
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
    </div>
  );
});

export default Sidebar1;