import React, { useEffect, useState, useRef } from "react";
import { Container } from "react-bootstrap";
import suratConfig from "./SuratConfig";
import { UserStorage } from "../utils/userStorage";
import ModalMakna from "../components/ModalMakna";
import ModalCatatan from "../components/ModalCatatan";
import { quranDataService } from "../utils/googleSheetsService"; // IMPORT SERVICE BARU

const TampilanSuratMakna = ({ nomor, session, userStatus }) => {
  const [data, setData] = useState([]);
  const [isSuratAktif, setIsSuratAktif] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // ✅ STATE BARU UNTUK MODAL MAKNA
  const [showModalMakna, setShowModalMakna] = useState(false);
  const [selectedKata, setSelectedKata] = useState(null);
  const [existingMaknaData, setExistingMaknaData] = useState(null);
  const [maknaStorage, setMaknaStorage] = useState({});

  // ✅ STATE BARU UNTUK MODAL CATATAN
  const [showModalCatatan, setShowModalCatatan] = useState(false);
  const [selectedAyat, setSelectedAyat] = useState(null);
  const [existingCatatanData, setExistingCatatanData] = useState(null);
  const [catatanStorage, setCatatanStorage] = useState({});

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

  // ✅ LOAD DATA MAKNA DAN CATATAN DARI SERVICE
  useEffect(() => {
    if (!isSuratAktif || !nomor || !session?.user?.id) return;

    const loadData = async () => {
      const userId = session.user.id;
      
      try {
        // Load data makna untuk surat ini
        const maknaData = await quranDataService.getMaknaBySurah(userId, nomor);
        const maknaStorageObj = {};
        maknaData.forEach(item => {
          const key = `${item.surah}-${item.ayat}-${item.kata_index}`;
          maknaStorageObj[key] = item;
        });
        setMaknaStorage(maknaStorageObj);

        // Load data catatan untuk surat ini
        const catatanData = await quranDataService.getCatatanBySurah(userId, nomor);
        const catatanStorageObj = {};
        catatanData.forEach(item => {
          const key = `${item.surah}-${item.ayat}`;
          catatanStorageObj[key] = item;
        });
        setCatatanStorage(catatanStorageObj);
      } catch (error) {
        console.error('Error loading data from service:', error);
      }
    };

    loadData();
  }, [isSuratAktif, nomor, session]);

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

  // ✅ FUNGSI BARU: Handle klik pada kata
  const handleKataClick = (ayatNumber, kataIndex, kataText) => {
    console.log('Kata diklik:', { ayatNumber, kataIndex, kataText });
    
    const kataData = {
      kataText,
      kataIndex,
      ayatNumber,
      surahNumber: nomor,
      userId: session?.user?.id || 'user-id-placeholder'
    };

    setSelectedKata(kataData);
    
    // Cek apakah sudah ada data makna untuk kata ini
    const storageKey = `${nomor}-${ayatNumber}-${kataIndex}`;
    const existingData = maknaStorage[storageKey];
    setExistingMaknaData(existingData || null);
    
    setShowModalMakna(true);
  };

  // ✅ FUNGSI BARU: Handle save dari modal dengan service
  const handleSaveMakna = async (savedData) => {
    if (savedData) {
      try {
        // Simpan ke service
        const result = await quranDataService.saveMakna(savedData);
        
        const storageKey = `${savedData.surah}-${savedData.ayat}-${savedData.kata_index}`;
        
        // Update storage dengan data baru
        setMaknaStorage(prev => ({
          ...prev,
          [storageKey]: result
        }));
        
        console.log('Data makna disimpan:', result);
      } catch (error) {
        console.error('Error saving makna:', error);
        alert('Gagal menyimpan makna');
      }
    } else {
      // Jika savedData null, berarti data dihapus
      const storageKey = `${selectedKata.surahNumber}-${selectedKata.ayatNumber}-${selectedKata.kataIndex}`;
      
      try {
        await quranDataService.deleteMakna(
          selectedKata.userId,
          selectedKata.surahNumber,
          selectedKata.ayatNumber,
          selectedKata.kataIndex
        );
        
        setMaknaStorage(prev => {
          const newStorage = { ...prev };
          delete newStorage[storageKey];
          return newStorage;
        });
        
        console.log('Data makna dihapus untuk:', storageKey);
      } catch (error) {
        console.error('Error deleting makna:', error);
        alert('Gagal menghapus makna');
      }
    }
  };

  // ✅ FUNGSI BARU: Handle klik pada icon catatan ayat
  const handleCatatanClick = (ayatNumber) => {
    console.log('Catatan ayat diklik:', ayatNumber);
    
    const ayatData = {
      ayatNumber,
      surahNumber: nomor,
      userId: session?.user?.id || 'user-id-placeholder'
    };

    setSelectedAyat(ayatData);
    
    // Cek apakah sudah ada data catatan untuk ayat ini
    const storageKey = `${nomor}-${ayatNumber}`;
    const existingData = catatanStorage[storageKey];
    setExistingCatatanData(existingData || null);
    
    setShowModalCatatan(true);
  };

  // ✅ FUNGSI BARU: Handle save dari modal catatan dengan service
  const handleSaveCatatan = async (savedData) => {
    if (savedData) {
      try {
        // Simpan ke service
        const result = await quranDataService.saveCatatan(savedData);
        
        const storageKey = `${savedData.surah}-${savedData.ayat}`;
        
        // Update storage dengan data baru
        setCatatanStorage(prev => ({
          ...prev,
          [storageKey]: result
        }));
        
        console.log('Data catatan disimpan:', result);
      } catch (error) {
        console.error('Error saving catatan:', error);
        alert('Gagal menyimpan catatan');
      }
    } else {
      // Jika savedData null, berarti data dihapus
      const storageKey = `${selectedAyat.surahNumber}-${selectedAyat.ayatNumber}`;
      
      try {
        await quranDataService.deleteCatatan(
          selectedAyat.userId,
          selectedAyat.surahNumber,
          selectedAyat.ayatNumber
        );
        
        setCatatanStorage(prev => {
          const newStorage = { ...prev };
          delete newStorage[storageKey];
          return newStorage;
        });
        
        console.log('Data catatan dihapus untuk:', storageKey);
      } catch (error) {
        console.error('Error deleting catatan:', error);
        alert('Gagal menghapus catatan');
      }
    }
  };

  // ✅ FUNGSI BARU: Mendapatkan style untuk kata berdasarkan ada/tidaknya makna
  const getKataStyle = (ayatNumber, kataIndex) => {
    const storageKey = `${nomor}-${ayatNumber}-${kataIndex}`;
    const hasMakna = maknaStorage[storageKey];
    
    return {
      cursor: 'pointer', 
      padding: '2px 6px', 
      margin: '0 3px', 
      borderRadius: '6px',
      transition: 'all 0.3s ease',
      display: 'inline-block',
      backgroundColor: hasMakna ? '#e8f5e8' : 'transparent',
      border: hasMakna ? '2px solid #4caf50' : '1px solid transparent',
      boxShadow: hasMakna ? '0 2px 6px rgba(76, 175, 80, 0.3)' : 'none',
      position: 'relative'
    };
  };

  // ✅ FUNGSI BARU: Mendapatkan style untuk container ayat berdasarkan ada/tidaknya catatan
  const getAyatContainerStyle = (ayatNumber) => {
    const storageKey = `${nomor}-${ayatNumber}`;
    const hasCatatan = catatanStorage[storageKey];
    
    return {
      background: 'white', 
      marginBottom: '15px', 
      padding: '15px', 
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      direction: 'rtl',
      position:'relative',
      border: hasCatatan ? '2px solid #007bff' : '1px solid #f0f0f0',
      backgroundColor: hasCatatan ? '#f0f8ff' : 'white'
    };
  };

  // ✅ FUNGSI BARU: Mendapatkan style untuk icon catatan berdasarkan ada/tidaknya catatan
  const getCatatanIconStyle = (ayatNumber) => {
    const storageKey = `${nomor}-${ayatNumber}`;
    const hasCatatan = catatanStorage[storageKey];
    
    return {
      position: 'absolute',
      top: '8px',
      left: '8px',
      background: hasCatatan ? '#007bff' : 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1.2rem',
      padding: '5px',
      borderRadius: '4px',
      transition: 'all 0.2s ease',
      zIndex: 2,
      color: hasCatatan ? 'white' : 'inherit'
    };
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
              {/* ✅ HEADER SURAT INFO */}
              {suratInfo && (
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '15px 20px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  textAlign: 'center',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ margin: 0, fontWeight: 'bold' }}>
                    {suratInfo.nama_latin} - {suratInfo.arti}
                  </h4>
                  <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
                    {suratInfo.jumlah_ayat} Ayat • {suratInfo.tempat_turun}
                  </p>
                </div>
              )}

              {/* ✅ AYAT-AYAT DENGAN PEMOTONGAN KATA */}
              {data.map((ayat) => {
                const hasCatatan = catatanStorage[`${nomor}-${ayat.nomor}`];
                
                return (
                  <div key={ayat.nomor} style={getAyatContainerStyle(ayat.nomor)}>
                    {/* ✅ ICON CATATAN AYAT DENGAN INDIKATOR */}
                    <button 
                      style={getCatatanIconStyle(ayat.nomor)}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = hasCatatan ? '#0056b3' : '#f0f0f0';
                        e.target.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = hasCatatan ? '#007bff' : 'transparent';
                        e.target.style.transform = 'scale(1)';
                      }}
                      onClick={() => handleCatatanClick(ayat.nomor)}
                      title={hasCatatan ? "Edit catatan ayat" : "Tambah catatan ayat"}
                    >
                      📝
                      {hasCatatan && (
                        <span 
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            background: '#28a745',
                            color: 'white',
                            borderRadius: '50%',
                            width: '12px',
                            height: '12px',
                            fontSize: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ●
                        </span>
                      )}
                    </button>
                    
                    {/* ✅ NOMOR AYAT */}
                    <div style={{
                      display: 'inline-block',
                      background: '#965430',
                      color: 'white',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      textAlign: 'center',
                      lineHeight: '30px',
                      marginLeft: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {ayat.nomor}
                    </div>
                    
                    {/* ✅ TEKS AYAT DENGAN KATA-KATA YANG BISA DIKLIK */}
                    <div style={{ 
                      textAlign: 'right', 
                      lineHeight: '2.2', 
                      fontSize: '1.8rem',
                      fontFamily: "'Traditional Arabic', 'Lateef', 'Amiri', serif",
                      marginTop: '10px'
                    }}>
                      {splitAyatPerKata(ayat.ar).map((kata, kataIndex) => {
                        const hasMakna = maknaStorage[`${nomor}-${ayat.nomor}-${kataIndex}`];
                        
                        return (
                          <span
                            key={kataIndex}
                            style={getKataStyle(ayat.nomor, kataIndex)}
                            onMouseEnter={(e) => {
                              if (!hasMakna) {
                                e.target.style.backgroundColor = '#e3f2fd';
                                e.target.style.transform = 'translateY(-2px)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!hasMakna) {
                                e.target.style.backgroundColor = '';
                                e.target.style.transform = '';
                              }
                            }}
                            onClick={() => handleKataClick(ayat.nomor, kataIndex, kata)}
                          >
                            {kata}
                            {hasMakna && (
                              <sup 
                                style={{
                                  color: '#4caf50',
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold',
                                  position: 'absolute',
                                  top: '-2px',
                                  right: '-2px'
                                }}
                              >
                                ●
                              </sup>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </Container>
      </div>

      {/* ✅ MODAL MAKNA */}
      <ModalMakna
        show={showModalMakna}
        onHide={() => setShowModalMakna(false)}
        kataData={selectedKata}
        existingData={existingMaknaData}
        onSave={handleSaveMakna}
      />

      {/* ✅ MODAL CATATAN */}
      <ModalCatatan
        show={showModalCatatan}
        onHide={() => setShowModalCatatan(false)}
        ayatData={selectedAyat}
        existingData={existingCatatanData}
        onSave={handleSaveCatatan}
      />
    </div>
  );
};

export default TampilanSuratMakna;