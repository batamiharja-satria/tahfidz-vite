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

  // LOAD DATA DARI CACHE
  useEffect(() => {
    if (!isSuratAktif || !session?.user?.id) return;

    const userId = session.user.id;
    
    // Load from cache - INSTANT
    const allMakna = cacheService.getAllMakna();
    const allCatatan = cacheService.getAllCatatan();
    
    // Filter hanya untuk user ini
    const userMakna = Object.keys(allMakna)
      .filter(key => key.startsWith(userId))
      .reduce((obj, key) => {
        obj[key] = allMakna[key];
        return obj;
      }, {});

    const userCatatan = Object.keys(allCatatan)
      .filter(key => key.startsWith(userId))
      .reduce((obj, key) => {
        obj[key] = allCatatan[key];
        return obj;
      }, {});

    setMaknaStorage(userMakna);
    setCatatanStorage(userCatatan);
    
    // Update cache stats
    updateCacheStats();
  }, [isSuratAktif, session]);

  // UPDATE CACHE STATS
  const updateCacheStats = () => {
    const stats = cacheService.getStats();
    setCacheStats(stats);
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
  const handleSaveMakna = (savedData) => {
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
    updateCacheStats();
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
  const handleSaveCatatan = (savedData) => {
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
    updateCacheStats();
  };

  // FUNGSI: Simpan semua data ke database
  const handleSaveToDatabase = async () => {
    if (!session?.user?.id) {
      alert('Silakan login terlebih dahulu');
      return;
    }

    setSyncStatus({ loading: true, message: 'Menyimpan data ke database...', type: 'info' });

    try {
      const userId = session.user.id;
      const exportData = cacheService.exportForDatabase();
      
      console.log('Saving to database:', exportData);

      const result = await quranDataService.saveAllData(userId, exportData.makna, exportData.catatan);
      
      if (result) {
        // Mark as saved
        cacheService.markAllAsSaved();
        updateCacheStats();
        
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

  // FUNGSI: Muat data dari database ke cache
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
          catatan: {}
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

        // Import to cache
        cacheService.importFromDatabase(processedData);
        
        // Update local state
        setMaknaStorage(processedData.makna);
        setCatatanStorage(processedData.catatan);
        updateCacheStats();
        
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
      backgroundColor: hasMakna ? '#e8f5e8' : 'transparent',
      border: hasMakna ? '2px solid #4caf50' : '1px solid transparent',
      boxShadow: hasMakna ? '0 2px 6px rgba(76, 175, 80, 0.3)' : 'none',
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
      border: hasCatatan ? '2px solid #007bff' : '1px solid #f0f0f0',
      backgroundColor: hasCatatan ? '#f0f8ff' : 'white'
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
  const hasUnsavedChanges = cacheService.hasUnsavedChanges();

  return (
    <div className="d-flex flex-column vw-100 vh-100">
      {/* HEADER DENGAN TOMBOL SYNC */}
      <div style={{ padding: '10px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
        <Container className="d-flex justify-content-between align-items-center">
          <div>
            <strong>Fitur 3: Tafsir Kata</strong>
            {cacheStats && (
              <small className="text-muted ms-2">
                (Cache: {cacheStats.totalMakna || 0} makna, {cacheStats.totalCatatan || 0} catatan)
                {hasUnsavedChanges && (
                  <Badge bg="warning" className="ms-2">
                    Ada Perubahan Belum Disimpan
                  </Badge>
                )}
              </small>
            )}
          </div>
          
          {session?.user?.id && (
            <div className="d-flex gap-2">
              <Button 
                variant="outline-primary" 
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
                  '📥 Muat dari Database'
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
                  '💾 Simpan ke Database'
                )}
              </Button>
            </div>
          )}
        </Container>

        {/* SYNC STATUS */}
        {syncStatus.message && (
          <Container className="mt-2">
            <Alert variant={syncStatus.type} className="py-2 mb-0">
              <small>{syncStatus.message}</small>
            </Alert>
          </Container>
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
              {/* HEADER SURAT INFO */}
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
                    
                    {/* NOMOR AYAT */}
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