import React, { useEffect, useState, useRef } from "react";
import { Container, Button, Badge, Alert } from "react-bootstrap";
import suratConfig from "./SuratConfig";
import { UserStorage } from "../utils/userStorage";
import ModalMakna from "../components/ModalMakna";
import ModalCatatan from "../components/ModalCatatan";
import { cacheService } from "../utils/cacheService";
import { quranDataService } from "../utils/googleSheetsService";

const TampilanSuratMakna = ({ nomor, session, userStatus }) => {
  const [data, setData] = useState([]);
  const [isSuratAktif, setIsSuratAktif] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // STATE UNTUK MODAL MAKNA
  const [showModalMakna, setShowModalMakna] = useState(false);
  const [selectedKata, setSelectedKata] = useState(null);

  // STATE UNTUK MODAL CATATAN
  const [showModalCatatan, setShowModalCatatan] = useState(false);
  const [selectedAyat, setSelectedAyat] = useState(null);

  // STATE UNTUK CACHE
  const [maknaStorage, setMaknaStorage] = useState({});
  const [catatanStorage, setCatatanStorage] = useState({});
  const [syncStatus, setSyncStatus] = useState({ 
    loading: false, 
    message: '',
    type: 'info' 
  });
  const [cacheStats, setCacheStats] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // REF UNTUK CONTAINER AYAT - SCROLL POSITION
  const ayatContainerRef = useRef(null);

  // CEK APAKAH SURAT INI TERMASUK PREMIUM YANG AKTIF
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

  // LOAD DATA DARI INDEXEDDB - UPDATE: Reset ketika session berubah
  useEffect(() => {
    let isMounted = true;

    const loadCacheData = async () => {
      if (!isSuratAktif || !session?.user?.id) {
        // Reset state jika tidak ada user atau surat tidak aktif
        if (isMounted) {
          setMaknaStorage({});
          setCatatanStorage({});
          setCacheStats({});
          setHasUnsavedChanges(false);
        }
        return;
      }

      const userId = session.user.id;
      
      try {
        // Load from IndexedDB - ASYNC
        const [userMakna, userCatatan] = await Promise.all([
          cacheService.getAllMaknaByUser(userId),
          cacheService.getAllCatatanByUser(userId)
        ]);

        if (isMounted) {
          setMaknaStorage(userMakna);
          setCatatanStorage(userCatatan);
        }
        
        // Update cache stats
        await updateCacheStats();
      } catch (error) {
        console.error('Error loading cache data from IndexedDB:', error);
        if (isMounted) {
          setMaknaStorage({});
          setCatatanStorage({});
          setCacheStats({});
          setHasUnsavedChanges(false);
        }
      }
    };

    loadCacheData();

    return () => {
      isMounted = false;
    };
  }, [isSuratAktif, session]); // Tambah session sebagai dependency

  // UPDATE CACHE STATS
  const updateCacheStats = async () => {
    try {
      const stats = await cacheService.getStats();
      const unsaved = await cacheService.hasUnsavedChanges();
      
      setCacheStats(stats);
      setHasUnsavedChanges(unsaved);
    } catch (error) {
      console.error('Error updating cache stats:', error);
      setCacheStats({});
      setHasUnsavedChanges(false);
    }
  };

  // SIMPAN SCROLL POSITION
  useEffect(() => {
    const container = ayatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      UserStorage.setScrollPosition(session, 'fitur3', nomor, container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [nomor, session]);

  // RESTORE SCROLL POSITION
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

  // FUNGSI: Handle klik pada kata
  const handleKataClick = (ayatNumber, kataIndex, kataText) => {
    // Cek login
    if (!session?.user?.id) {
      alert('Silakan login terlebih dahulu untuk menambahkan makna kata');
      return;
    }

    console.log('Kata diklik:', { ayatNumber, kataIndex, kataText });
    
    const kataData = {
      kataText,
      kataIndex,
      ayatNumber,
      surahNumber: nomor,
      userId: session.user.id
    };

    setSelectedKata(kataData);
    setShowModalMakna(true);
  };

  // FUNGSI: Handle save dari modal makna
  const handleSaveMakna = async (savedData) => {
    try {
      // Update local state untuk menampilkan perubahan
      if (savedData) {
        const key = `${savedData.user_id}_${savedData.surah}_${savedData.ayat}_${savedData.kata_index}`;
        setMaknaStorage(prev => ({
          ...prev,
          [key]: savedData
        }));
      } else {
        // Jika dihapus
        const key = `${selectedKata.userId}_${selectedKata.surahNumber}_${selectedKata.ayatNumber}_${selectedKata.kataIndex}`;
        setMaknaStorage(prev => {
          const newStorage = { ...prev };
          delete newStorage[key];
          return newStorage;
        });
      }
      await updateCacheStats(); // Immediate update
    } catch (error) {
      console.error('Error updating makna storage:', error);
    }
  };

  // FUNGSI: Handle klik pada icon catatan ayat
  const handleCatatanClick = (ayatNumber) => {
    // Cek login
    if (!session?.user?.id) {
      alert('Silakan login terlebih dahulu untuk menambahkan catatan');
      return;
    }

    console.log('Catatan ayat diklik:', ayatNumber);
    
    const ayatData = {
      ayatNumber,
      surahNumber: nomor,
      userId: session.user.id
    };

    setSelectedAyat(ayatData);
    setShowModalCatatan(true);
  };

  // FUNGSI: Handle save dari modal catatan
  const handleSaveCatatan = async (savedData) => {
    try {
      // Update local state untuk menampilkan perubahan
      if (savedData) {
        const key = `${savedData.user_id}_${savedData.surah}_${savedData.ayat}`;
        setCatatanStorage(prev => ({
          ...prev,
          [key]: savedData
        }));
      } else {
        // Jika dihapus
        const key = `${selectedAyat.userId}_${selectedAyat.surahNumber}_${selectedAyat.ayatNumber}`;
        setCatatanStorage(prev => {
          const newStorage = { ...prev };
          delete newStorage[key];
          return newStorage;
        });
      }
      await updateCacheStats(); // Immediate update
    } catch (error) {
      console.error('Error updating catatan storage:', error);
    }
  };

  // FUNGSI: Simpan semua data ke database (UPDATE: Immediate state update)
  const handleSaveToDatabase = async () => {
    if (!session?.user?.id) {
      alert('Silakan login terlebih dahulu');
      return;
    }

    setSyncStatus({ loading: true, message: 'Menyimpan data ke database...', type: 'info' });

    try {
      const userId = session.user.id;
      const exportData = await cacheService.exportForDatabase();
      
      console.log('Saving to database:', exportData);

      // Kirim data termasuk deletions ke Google Sheets
      const result = await quranDataService.saveAllData(
        userId, 
        exportData.makna, 
        exportData.catatan, 
        exportData.deletions
      );
      
      if (result) {
        // Mark as saved - ini akan clear semua flag _isDirty dan deletions
        // DAN return updated stats untuk immediate update
        const updatedStats = await cacheService.markAllAsSaved();
        
        // IMMEDIATE UPDATE STATE
        setCacheStats(updatedStats);
        setHasUnsavedChanges(false);
        
        setSyncStatus({ 
          loading: false, 
          message: '✅ Data berhasil disimpan ke database!', 
          type: 'success' 
        });
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setSyncStatus({ loading: false, message: '', type: 'info' });
        }, 3000);
      }
    } catch (error) {
      console.error('Error saving to database:', error);
      setSyncStatus({ 
        loading: false, 
        message: `❌ Gagal menyimpan: ${error.message}`, 
        type: 'danger' 
      });
    }
  };

  // FUNGSI: Muat data dari database ke cache (UPDATE: Immediate state update)
  const handleLoadFromDatabase = async () => {
    if (!session?.user?.id) {
      alert('Silakan login terlebih dahulu');
      return;
    }

    setSyncStatus({ loading: true, message: 'Memuat data dari database...', type: 'info' });

    try {
      const userId = session.user.id;
      const result = await quranDataService.getAllUserData(userId);
      
      if (result) {
        // Process and import data
        const processedData = {
          makna: {},
          catatan: {},
          deletions: {}
        };

        // Process the data into cache format
        result.forEach(item => {
          if (item.kata_index === -1) {
            // Catatan
            const key = `${item.user_id}_${item.surah}_${item.ayat}`;
            processedData.catatan[key] = item;
          } else {
            // Makna
            const key = `${item.user_id}_${item.surah}_${item.ayat}_${item.kata_index}`;
            processedData.makna[key] = item;
          }
        });

        // Import to IndexedDB dan dapatkan updated stats
        const updatedStats = await cacheService.importFromDatabase(processedData);
        
        // IMMEDIATE UPDATE STATE
        setCacheStats(updatedStats);
        setHasUnsavedChanges(false);

        // Update local state dengan data terbaru
        const [userMakna, userCatatan] = await Promise.all([
          cacheService.getAllMaknaByUser(userId),
          cacheService.getAllCatatanByUser(userId)
        ]);

        setMaknaStorage(userMakna);
        setCatatanStorage(userCatatan);
        
        setSyncStatus({ 
          loading: false, 
          message: '✅ Data berhasil dimuat dari database!', 
          type: 'success' 
        });
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setSyncStatus({ loading: false, message: '', type: 'info' });
        }, 3000);
      }
    } catch (error) {
      console.error('Error loading from database:', error);
      setSyncStatus({ 
        loading: false, 
        message: `❌ Gagal memuat: ${error.message}`, 
        type: 'danger' 
      });
    }
  };

  // FUNGSI: Reset cache untuk user saat ini
  const handleResetCache = async () => {
    if (!session?.user?.id) return;
    
    if (window.confirm('Reset cache untuk user saat ini? Data yang belum disimpan akan hilang.')) {
      try {
        const userId = session.user.id;
        const updatedStats = await cacheService.resetUserCache(userId);
        
        // Update state immediately
        setCacheStats(updatedStats);
        setHasUnsavedChanges(false);
        setMaknaStorage({});
        setCatatanStorage({});
        
        console.log('Cache reset for user:', userId);
      } catch (error) {
        console.error('Error resetting cache:', error);
      }
    }
  };

  // FUNGSI: Mendapatkan style untuk kata berdasarkan ada/tidaknya makna
  const getKataStyle = (ayatNumber, kataIndex) => {
    const key = `${session?.user?.id}_${nomor}_${ayatNumber}_${kataIndex}`;
    const hasMakna = maknaStorage[key];
    
    return {
      cursor: 'pointer', 
      padding: '2px 6px', 
      margin: '0 3px', 
      borderRadius: '6px',
      transition: 'all 0.3s ease',
      display: 'inline-block',
      backgroundColor: hasMakna ? 'white' : 'transparent',
      border: hasMakna ? '1px solid transparent' : '1px solid transparent',
      boxShadow: hasMakna ? '0 0px 0px white' : 'none',
      position: 'relative'
    };
  };

  // FUNGSI: Mendapatkan style untuk container ayat berdasarkan ada/tidaknya catatan
  const getAyatContainerStyle = (ayatNumber) => {
    const key = `${session?.user?.id}_${nomor}_${ayatNumber}`;
    const hasCatatan = catatanStorage[key];
    
    return {
      background: 'white', 
      marginBottom: '15px', 
      padding: '15px', 
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      direction: 'rtl',
      position:'relative',
      border: hasCatatan ? '1px solid white' : '1px solid white',
      backgroundColor: hasCatatan ? 'white' : 'white'
    };
  };

  // FUNGSI: Mendapatkan style untuk icon catatan berdasarkan ada/tidaknya catatan
  const getCatatanIconStyle = (ayatNumber) => {
    const key = `${session?.user?.id}_${nomor}_${ayatNumber}`;
    const hasCatatan = catatanStorage[key];
    
    return {
      position: 'absolute',
      top: '8px',
      left: '8px',
      background: hasCatatan ? 'white' : 'none',
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
  
  // ubah angka ke Arab
const toArabicNumber = (number) => {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return number
    .toString()
    .split("")
    .map((d) => arabicDigits[parseInt(d)])
    .join("");
};

  // DAPATKAN INFO SURAT DARI SURATCONFIG UNTUK HEADER
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
      {/* HEADER DENGAN TOMBOL SYNC */}
      <div style={{ padding: '10px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
        <Container className="d-flex justify-content-between align-items-center">
          {session?.user?.id && (
            <div className="d-flex gap-2 text-center">

              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleLoadFromDatabase}
                disabled={syncStatus.loading}
              >
                {syncStatus.loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Memuat...
                  </>
                ) : (
                  '📥 Muat data'
                )}
              </Button>
              <Button 
                variant={hasUnsavedChanges ? "warning" : "success"}
                size="sm" 
                onClick={handleSaveToDatabase}
                disabled={syncStatus.loading || !hasUnsavedChanges}
              >
                {syncStatus.loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Menyimpan...
                  </>
                ) : (
                  '💾 Simpan data'
                )}
              </Button>
            </div>
          )}
        </Container>


      </div>
      <div style={{textAlign:"left", marginTop:"8px"}}>
            {cacheStats && (
              <small className="text-muted ">
                {hasUnsavedChanges && (
                  <Badge bg="warning" className="ms-4">
                    Ada Perubahan Belum Disimpan
                  </Badge>
                )}
              </small>
            )}
                    {/* SYNC STATUS */}
        {syncStatus.message && (

            <p variant={syncStatus.type} className="py-0 mb-0 ms-4">
              <small>{syncStatus.message}</small>
            </p>
        )}
          </div>

      {/* REF DI CONTAINER AYAT */}
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


              {/* AYAT-AYAT DENGAN PEMOTONGAN KATA */}
              {data.map((ayat) => {
                const hasCatatan = catatanStorage[`${session?.user?.id}_${nomor}_${ayat.nomor}`];
                
                return (
                  <div key={ayat.nomor} style={getAyatContainerStyle(ayat.nomor)}>
                    {/* ICON CATATAN AYAT DENGAN INDIKATOR */}
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
                            top: '0px',
                            right: '0px',
                            background: '#28a745',
                            color: '#28a745',
                            borderRadius: '50%',
                            width: '5px',
                            height: '5px',
                            fontSize: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ●
                        </span>
                      )}
                    </button>
                    
                    {/* NOMOR AYAT */}
                    <div style={{
                      display: 'inline-block',
                      background: 'white',
                      color: 'black',
                      width: '25px',
                      height: '25px',
                      borderRadius: '50%',
                      textAlign: 'center',
                      lineHeight: '20px',
                      marginLeft: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      
                      {toArabicNumber(ayat.nomor)}
                     
                    </div>
                    
                    {/* TEKS AYAT DENGAN KATA-KATA YANG BISA DIKLIK */}
                    <div style={{ 
                      textAlign: 'right', 
                      lineHeight: '2.2', 
                      fontSize: '1.8rem',
                      fontFamily: "'Traditional Arabic', 'Lateef', 'Amiri', serif",
                      marginTop: '10px'
                    }}>
                      {splitAyatPerKata(ayat.ar).map((kata, kataIndex) => {
                        const hasMakna = maknaStorage[`${session?.user?.id}_${nomor}_${ayat.nomor}_${kataIndex}`];
                        
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
                                  fontSize: '0.6rem',
                                  fontWeight: 'bold',
                                  position: 'absolute',
                                  top: '15px',
                                  right: '-1px'
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

      {/* MODAL MAKNA */}
      <ModalMakna
        show={showModalMakna}
        onHide={() => setShowModalMakna(false)}
        kataData={selectedKata}
        onSave={handleSaveMakna}
      />

      {/* MODAL CATATAN */}
      <ModalCatatan
        show={showModalCatatan}
        onHide={() => setShowModalCatatan(false)}
        ayatData={selectedAyat}
        onSave={handleSaveCatatan}
      />
    </div>
  );
};

export default TampilanSuratMakna;