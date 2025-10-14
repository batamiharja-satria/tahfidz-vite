import React, { useEffect, useState, useRef } from "react";
import { Container } from "react-bootstrap";
import suratConfig from "./SuratConfig";
import { UserStorage } from "../utils/userStorage";

const TampilanSuratMakna = ({ nomor, session, userStatus }) => {
  const [data, setData] = useState([]);
  const [isSuratAktif, setIsSuratAktif] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // ✅ REF UNTUK CONTAINER AYAT - SCROLL POSITION
  const ayatContainerRef = useRef(null);

  // ✅ CEK APAKAH SURAT INI TERMASUK PREMIUM YANG AKTIF (GUNAKAN USERSTATUS DARI PROP)
  useEffect(() => {
    if (!nomor || !userStatus || userStatus.length === 0) {
      setLoading(false);
      return;
    }

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
  }, [nomor, userStatus]);

  // ✅ SIMPAN SCROLL POSITION - FITUR MA'NA
  useEffect(() => {
    const container = ayatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      UserStorage.setScrollPosition(session, 'fitur3', nomor, container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [nomor, session]);

  // ✅ RESTORE SCROLL POSITION - FITUR MA'NA
  useEffect(() => {
    const container = ayatContainerRef.current;
    if (!container) return;

    const savedScroll = UserStorage.getScrollPosition(session, 'fitur3', nomor);
    if (savedScroll) {
      setTimeout(() => {
        container.scrollTop = savedScroll;
      }, 100);
    }
  }, [nomor, session]);

  const splitAyatPerKata = (ayatText) => {
    const words = ayatText.split(/([\u0600-\u06FF]+)/g).filter(word => word.trim() !== '');
    return words;
  };

  const handleKataClick = (ayatNumber, kataIndex, kataText) => {
    console.log('Kata diklik:', { ayatNumber, kataIndex, kataText });
    // TODO: Akan diimplementasi di step modal
  };

  const handleCatatanClick = (ayatNumber) => {
    console.log('Catatan ayat diklik:', ayatNumber);
    // TODO: Akan diimplementasi di step modal
  };

  // ✅ DAPATKAN INFO SURAT DARI SURATCONFIG UNTUK HEADER
  const getSuratInfo = () => {
    const premiumMapping = {
      'premium1': 0, 'premium2': 1, 'premium3': 2, 'premium4': 3, 'premium5': 4,
      'premium6': 5, 'premium7': 6, 'premium8': 7, 'premium9': 8, 'premium10': 9
    };

    for (const key in suratConfig) {
      const premiumIndex = premiumMapping[key];
      if (premiumIndex !== undefined && userStatus && userStatus[premiumIndex] === true) {
        const premium = suratConfig[key];
        if (premium && Array.isArray(premium.data)) {
          const found = premium.data.find(surat => String(surat.nomor) === String(nomor));
          if (found) return found;
        }
      }
    }
    
    return suratConfig.all?.data?.find(surat => String(surat.nomor) === String(nomor)) || null;
  };

  const suratInfo = getSuratInfo();

  return (
    <div className="d-flex flex-column vw-100 vh-100">
      {/* ✅ TAMBAH REF DI CONTAINER AYAT */}
      <div ref={ayatContainerRef} className="flex-grow-1 overflow-auto">
        <Container className="mt-4 mb-5">
          {!isSuratAktif ? (
            <p style={{ padding: "1rem", textAlign: "center", color: "#6c757d" }}>
              {loading ? "Memuat..." : "Surat tidak tersedia. Silakan login atau beli premium untuk mengakses."}
            </p>
          ) : data.length === 0 ? (
            <p style={{ padding: "1rem" }}>
              Memuat surat...
            </p>
          ) : (
            <>


              {/* ✅ AYAT-AYAT DENGAN PEMOTONGAN KATA */}
              {data.map((ayat) => (
                <div key={ayat.nomor} style={{ 
                  background: 'white', 
                  marginBottom: '10px', 
                  padding: '10px', 
                  borderRadius: '10px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  direction: 'rtl',
                  position:'relative',
                }}>
                  <button 
  style={{
    position: 'absolute',        // ⬅️ Supaya bisa nempel di pojok
    top: '8px',                  // ⬅️ Jarak dari atas
    left: '8px',                 // ⬅️ Jarak dari kiri
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.2rem',
    padding: '5px',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    zIndex: 2                    // ⬅️ Supaya di atas elemen lain
  }}
  onMouseEnter={(e) => {
    e.target.style.backgroundColor = '#f0f0f0';
    e.target.style.transform = 'scale(1.1)';
  }}
  onMouseLeave={(e) => {
    e.target.style.backgroundColor = 'transparent';
    e.target.style.transform = 'scale(1)';
  }}
  onClick={() => handleCatatanClick(ayat.nomor)}
>
  📝
</button>
                  
                  <div style={{
                    display: 'inline-block',
                    background: '#965430',
                    color: 'white',
                    width: '25px',
                    height: '25px',
                    borderRadius: '50%',
                    textAlign: 'center',
                    lineHeight: '25px',
                    marginLeft: '10px',
                    fontSize: '0.7rem'
                  }}>
                    {ayat.nomor}
                  </div>
                  
                  <div style={{ 
                    textAlign: 'right', 
                    lineHeight: '2.0', 
                    fontSize: '1.8rem',
                    fontFamily: "'Traditional Arabic', 'Lateef', serif",
                    marginTop: '10px'
                  }}>
                    {splitAyatPerKata(ayat.ar).map((kata, kataIndex) => (
                      <span
                        key={kataIndex}
                        style={{ 
                          cursor: 'pointer', 
                          padding: '2px 4px', 
                          margin: '0 2px', 
                          borderRadius: '4px',
                          transition: 'all 0.2s ease',
                          display: 'inline-block'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#e8f5e8';
                          e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.transform = 'translateY(0)';
                        }}
                        onClick={() => handleKataClick(ayat.nomor, kataIndex, kata)}
                      >
                        {kata}
                      </span>
                    ))}
                    
                   
                  </div>
                </div>
              ))}
            </>
          )}
        </Container>
      </div>
    </div>
  );
};

export default TampilanSuratMakna;