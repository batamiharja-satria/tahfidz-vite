import React, { useEffect, useState, useRef } from "react";
import AyatItem from "../components/AyatItem";
import { Container, Button } from "react-bootstrap";
import suratConfig from "./SuratConfig";
import audioCache from "../utils/audioCache";
import { UserStorage } from "../utils/userStorage"; // ✅ IMPORT BARU

const TampilanSurat = ({ nomor, session, userStatus }) => { // ✅ TERIMA SESSION & USERSTATUS
  const [data, setData] = useState([]);
  const [wordCount, setWordCount] = useState(1);
  const [isSuratAktif, setIsSuratAktif] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // ✅ REF UNTUK CONTAINER AYAT - SCROLL POSITION
  const ayatContainerRef = useRef(null);

  // ✅ PERBAIKAN: Listen untuk event stopAllAudio dari header/sidebar
  useEffect(() => {
    const handleStopAllAudio = () => {
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

  // ✅ PERBAIKAN: SIMPAN SCROLL POSITION - FITUR TAHFIDZ
  useEffect(() => {
    const container = ayatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      UserStorage.setScrollPosition(session, 'fitur1', nomor, container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [nomor, session]);

  // ✅ PERBAIKAN: RESTORE SCROLL POSITION - FITUR TAHFIDZ
  useEffect(() => {
    const container = ayatContainerRef.current;
    if (!container) return;

    const savedScroll = UserStorage.getScrollPosition(session, 'fitur1', nomor);
    if (savedScroll) {
      setTimeout(() => {
        container.scrollTop = savedScroll;
      }, 100);
    }
  }, [nomor, session]);

  // ✅ CEK APAKAH SURAT INI TERMASUK PREMIUM YANG AKTIF (GUNAKAN USERSTATUS DARI PROP)
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
      
      // ✅ GUNAKAN USERSTATUS DARI PROP
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
      setLoading(true);
      
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
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setData([]);
      setLoading(false);
    }
  }, [nomor, userStatus]); // ✅ DEPENDENCY PADA USERSTATUS

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
              {loading ? "Memuat..." : "Surat tidak tersedia. Silakan login atau beli premium untuk mengakses."}
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
                session={session} // ✅ KIRIM SESSION KE AYATITEM
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