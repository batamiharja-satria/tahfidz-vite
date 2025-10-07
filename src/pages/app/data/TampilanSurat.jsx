import React, { useEffect, useState, useRef } from "react";
import Sidebar1 from "../components/sidebar/Sidebar1";
import AyatItem from "../components/AyatItem";
import { Container, Button } from "react-bootstrap";
import suratConfig from "./SuratConfig";
import { supabase } from "../../../services/supabase";
import audioCache from "../utils/audioCache"; // ✅ Import untuk akses cache

const TampilanSurat = ({ nomor }) => {
  const [data, setData] = useState([]);
  const [wordCount, setWordCount] = useState(1);
  const [userStatus, setUserStatus] = useState([]);
  const [isSuratAktif, setIsSuratAktif] = useState(false);
  
  // ✅ REF UNTUK CONTAINER AYAT - SCROLL POSITION
  const ayatContainerRef = useRef(null);

  // ✅ PERBAIKAN: Listen untuk event stopAllAudio dari header/sidebar
  useEffect(() => {
    const handleStopAllAudio = () => {
      // Hentikan semua audio yang sedang diputar di fitur1
      audioCache.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    };

    window.addEventListener('stopAllAudio', handleStopAllAudio);
    
    return () => {
      window.removeEventListener('stopAllAudio', handleStopAllAudio);
    };
  }, []);

  // ✅ SIMPAN SCROLL POSITION - FITUR TAHFIDZ
  useEffect(() => {
    const container = ayatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      localStorage.setItem(`scroll_fitur1_${nomor}`, container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [nomor]);

  // ✅ RESTORE SCROLL POSITION - FITUR TAHFIDZ
  useEffect(() => {
    const container = ayatContainerRef.current;
    if (!container) return;

    const savedScroll = localStorage.getItem(`scroll_fitur1_${nomor}`);
    if (savedScroll) {
      setTimeout(() => {
        container.scrollTop = parseInt(savedScroll);
      }, 100);
    }
  }, [nomor]);

  // ✅ Ambil status user dari Supabase
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

  // 🔁 Ambil data status user
  useEffect(() => {
    fetchUserStatus();
  }, []);

  // ✅ Cek apakah surat ini termasuk dalam premium yang aktif
  useEffect(() => {
    if (!nomor || userStatus.length === 0) return;

    let suratAktif = false;

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
          const found = premium.data.find(surat => String(surat.nomor) === String(nomor));
          if (found) suratAktif = true;
        }
      }
    });

    setIsSuratAktif(suratAktif);

    // Jika surat aktif, fetch data
    if (suratAktif) {
      fetch(`https://api.quran.gading.dev/surah/${nomor}`)
        .then((res) => res.json())
        .then((result) => {
          if (result?.data?.verses) {
            const mapped = result.data.verses.map((v) => ({
              nomor: v.number?.inSurah ?? v.number ?? null,
              ar: v.text?.arab ?? v.text ?? "",
            }));
            setData(mapped);
          } else {
            setData([]);
          }
        })
        .catch((err) => {
          console.error("Error fetch data:", err);
          setData([]);
        });
    } else {
      setData([]);
    }
  }, [nomor, userStatus]);

  const toggleWordCount = () => {
    setWordCount((prev) => (prev + 1) % 4);
  };

  return (
    <div className="d-flex flex-column vh-100">
      {/* ✅ TAMBAH REF DI CONTAINER AYAT */}
      <div ref={ayatContainerRef} className="flex-grow-1 overflow-auto">
        <Container className="mt-3 mb-5">
          {!isSuratAktif ? (
            <p style={{ padding: "1rem", textAlign: "center", color: "#6c757d" }}>
              LOADING...
            </p>
          ) : data.length === 0 ? (
            <p style={{ padding: "1rem" }}>
              Memuat surat...
            </p>
          ) : (
            data.map((ayat) => (
              <AyatItem
                key={ayat.nomor}
                ayat={ayat}
                suratId={parseInt(nomor, 10)}
                wordCount={wordCount}
              />
            ))
          )}
        </Container>
      </div>

      {/* Footer tetap sama */}
      <footer
        className="bg-dark text-center p-1"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          width: "100%",
          zIndex: 1030,
        }}
      >
        <div
          style={{
            cursor: "pointer",
            fontSize: "18px",
            fontWeight: "400",
            color: "#fff",
          }}
          className="d-flex justify-content-between align-items-center px-3"
        >
          <button
            onClick={toggleWordCount}
            className="btn btn-outline-light btn-sm"
          >
            Tambah
          </button>

          <span className="text-end">
            <span className="me-3">{wordCount}</span> Kata
          </span>
        </div>
      </footer>
    </div>
  );
};

export default TampilanSurat;