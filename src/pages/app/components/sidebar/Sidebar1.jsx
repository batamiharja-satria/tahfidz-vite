import React, { useEffect, useState, forwardRef } from "react";
import { Link } from "react-router-dom";
import Logout from "../../../../components/Logout";
import suratConfig from "../../data/SuratConfig";
import { supabase } from "../../../../services/supabase";

const Sidebar1 = forwardRef(({ isOpen, toggleSidebar }, ref) => {
  const [suratList, setSuratList] = useState([]);
  const [maxWidth, setMaxWidth] = useState("250px");
  const [openPremium, setOpenPremium] = useState(null);
  const [userStatus, setUserStatus] = useState([]);

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

  // ✅ Style
  const styles = {
    sidebar: {
      width: maxWidth,
      height: "calc(100vh - 56px)",
      overflowY: "auto",
      position: "fixed",
      top: "56px",
      left: 0,
      zIndex: 1000,
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
        ...styles.sidebar, paddingBottom:'20px',
        transform: isOpen ? "translateX(0)" : "translateX(-100%)" ,
      }}
    >
      <ul className="nav flex-column p-3">
        {/* ✅ Beranda */}
        <li className="nav-item">
          <Link
            to="/app2"
            className="nav-link"
            style={styles.navLink}
            onClick={toggleSidebar}
          >
            BERANDA
          </Link>
        </li>

        {/* ✅ Panduan */}
        <li className="nav-item">
          <Link
            to="/app2/app/fitur1"
            className="nav-link"
            style={styles.navLink}
            onClick={toggleSidebar}
          >
            PANDUAN
          </Link>
        </li>

        {/* ✅ Premium Aktif dengan Progress */}
        {Object.keys(groupedByPremium).map((premiumKey) => (
          <li className="nav-item" key={premiumKey}>
            <p
              style={styles.premiumButton}
              onClick={() => setOpenPremium(openPremium === premiumKey ? null : premiumKey)}
            >
              <span>{premiumKey.replace('premium', 'Premium ')} ({getPremiumProgress(groupedByPremium[premiumKey])}%)</span>
              <span
                style={{
                  ...styles.caret,
                  transform:
                    openPremium === premiumKey ? "rotate(90deg)" : "rotate(0)",
                }}
              >
                ▶
              </span>
            </p>

            {openPremium === premiumKey && (
              <ul className="nav flex-column ms-3">
                {groupedByPremium[premiumKey].map((surat) => (
                  <li key={surat.nomor}>
                    <Link
                      to={`/app2/app/fitur1/${surat.nomor}`}
                      className="nav-link"
                      style={styles.navLink}
                      onClick={toggleSidebar}
                    >
                      {surat.nomor} {surat.nama_latin || surat.nama} ({getSuratProgress(surat.nomor, surat.jumlah_ayat)}%)
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}

        {/* ✅ Logout */}
        <li className="nav-item">
          <Link className="nav-link text-white" style={styles.navLink}>
            <Logout />
          </Link>
        </li>
      </ul>
    </div>
  );
});

export default Sidebar1;