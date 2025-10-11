import React, { useState, useEffect, useRef } from "react";
import { Container, Button, Modal, Form, Row, Col } from "react-bootstrap";
import { Eye, EyeSlash } from "react-bootstrap-icons";
import suratConfig from "./SuratConfig";
import audioCache from "../utils/audioCache";
import { UserStorage } from "../utils/userStorage"; // ✅ IMPORT BARU

// Helper: ubah angka ke Arab
const toArabicNumber = (number) => {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return number
    .toString()
    .split("")
    .map((d) => arabicDigits[parseInt(d)])
    .join("");
};

const TampilanSuratIstima = ({ nomor, session, userStatus }) => {
  const [data, setData] = useState([]);
  const [isSuratAktif, setIsSuratAktif] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // State untuk audio playback
  const [currentAyat, setCurrentAyat] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState("single");
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(1);
  const [loopCount, setLoopCount] = useState(1);
  const [currentLoop, setCurrentLoop] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // State untuk toggle semua terjemahan sekaligus
  const [showArabic, setShowArabic] = useState(true);
  
  // Refs untuk manage audio
  const audioRef = useRef(null);
  const ayatContainerRef = useRef(null);

  // Ref untuk state yang perlu diakses di event listeners
  const stateRef = useRef({
    playMode: "single",
    rangeStart: 1,
    rangeEnd: 1,
    loopCount: 1,
    currentLoop: 0,
    dataLength: 0,
    currentAyat: null,
    isPlaying: false
  });

  // Update ref ketika state berubah
  useEffect(() => {
    stateRef.current = {
      playMode,
      rangeStart,
      rangeEnd,
      loopCount,
      currentLoop,
      dataLength: data.length,
      currentAyat,
      isPlaying
    };
  }, [playMode, rangeStart, rangeEnd, loopCount, currentLoop, data.length, currentAyat, isPlaying]);

  // ✅ PERBAIKAN: Listen untuk event stopAllAudio dari header/sidebar
  useEffect(() => {
    const handleStopAllAudio = () => {
      stopAudio();
    };

    window.addEventListener('stopAllAudio', handleStopAllAudio);
    
    return () => {
      window.removeEventListener('stopAllAudio', handleStopAllAudio);
    };
  }, []);

  // ✅ PERBAIKAN: Scroll position dengan UserStorage - FITUR ISTIMA'
  useEffect(() => {
    const container = ayatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      UserStorage.setScrollPosition(session, 'fitur2', nomor, container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [nomor, session]);

  // ✅ PERBAIKAN: Restore scroll position dengan UserStorage - FITUR ISTIMA'
  useEffect(() => {
    const container = ayatContainerRef.current;
    if (!container) return;

    const savedScroll = UserStorage.getScrollPosition(session, 'fitur2', nomor);
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

    if (suratAktif) {
      setLoading(true);
      
      fetch(`https://api.quran.gading.dev/surah/${nomor}`)
        .then((res) => res.json())
        .then((result) => {
          if (result?.data?.verses) {
            const mapped = result.data.verses.map((v) => ({
              nomor: v.number?.inSurah ?? v.number ?? null,
              ar: v.text?.arab ?? v.text ?? "",
              translation: v.translation?.id || `Terjemahan ayat ${v.number?.inSurah} tidak tersedia`
            }));
            setData(mapped);
            const ayatCount = mapped.length;
            setRangeEnd(ayatCount);
            stateRef.current.rangeEnd = ayatCount;
            stateRef.current.dataLength = ayatCount;
            setLoading(false);
          } else {
            setData([]);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error("Error fetch data:", err);
          setData([]);
          setLoading(false);
        });
    } else {
      setData([]);
      setLoading(false);
    }
  }, [nomor, userStatus]);

  // Scroll function
  const scrollToAyat = (ayatNomor) => {
    if (!ayatContainerRef.current) return;
    
    setTimeout(() => {
      const container = ayatContainerRef.current;
      const ayatElements = container.getElementsByClassName('ayat-item');
      
      if (ayatElements[ayatNomor - 1]) {
        const ayatElement = ayatElements[ayatNomor - 1];
        const containerHeight = container.clientHeight;
        const ayatTop = ayatElement.offsetTop;
        const ayatHeight = ayatElement.offsetHeight;
        
        const scrollPosition = ayatTop - (containerHeight / 2);
        
        container.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  // Cleanup audio ketika komponen unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle audio ended
  const handleAudioEnded = () => {
    const state = stateRef.current;
    
    if (!state.isPlaying) return;

    let nextAyat = state.currentAyat + 1;

    if (state.playMode === "single") {
      stopAudio();
      return;
    }

    if (state.playMode === "range") {
      if (nextAyat > state.rangeEnd) {
        const newLoop = state.currentLoop + 1;
        setCurrentLoop(newLoop);
        stateRef.current.currentLoop = newLoop;

        if (state.loopCount > 0 && newLoop >= state.loopCount) {
          stopAudio();
          return;
        }
        nextAyat = state.rangeStart;
      }
    } else if (state.playMode === "sequential") {
      if (nextAyat > state.dataLength) {
        const newLoop = state.currentLoop + 1;
        setCurrentLoop(newLoop);
        stateRef.current.currentLoop = newLoop;

        if (state.loopCount > 0 && newLoop >= state.loopCount) {
          stopAudio();
          return;
        }
        nextAyat = 1;
      }
    }

    if (nextAyat < 1 || nextAyat > state.dataLength) {
      stopAudio();
      return;
    }

    setTimeout(() => {
      playAudio(nextAyat);
    }, 500);
  };

  // Core audio playback function
  const playAudio = async (ayatNomor) => {
    if (!data.length || ayatNomor < 1 || ayatNomor > data.length) {
      console.error("Ayat tidak valid:", ayatNomor);
      stopAudio();
      return;
    }

    // Stop audio sebelumnya
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }

    setCurrentAyat(ayatNomor);
    setIsPlaying(true);
    stateRef.current.currentAyat = ayatNomor;
    stateRef.current.isPlaying = true;

    // Scroll ke ayat yang sedang diputar
    scrollToAyat(ayatNomor);

    const allSurat = [];
    Object.keys(suratConfig).forEach((k) => {
      const v = suratConfig[k];
      if (v && Array.isArray(v.data)) allSurat.push(...v.data);
    });

    const suratData = allSurat.find((s) => String(s.nomor) === String(nomor));

    if (!suratData) {
      alert("Surat tidak ditemukan");
      stopAudio();
      return;
    }

    const audioUrl = `https://the-quran-project.github.io/Quran-Audio/Data/1/${suratData.nomor}_${ayatNomor}.mp3`;

    try {
      let audio;
      if (audioCache.has(audioUrl)) {
        audio = audioCache.get(audioUrl);
      } else {
        audio = new Audio(audioUrl);
        audioCache.set(audioUrl, audio);
      }

      audio.onended = handleAudioEnded;
      audio.onerror = () => {
        console.error("Error memutar audio ayat:", ayatNomor);
        if (stateRef.current.playMode !== "single") {
          handleAudioEnded();
        } else {
          alert(`Gagal memutar audio ayat ${ayatNomor}`);
          stopAudio();
        }
      };

      audioRef.current = audio;
      audio.currentTime = 0;
      await audio.play();
      
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal memutar audio.");
      stopAudio();
    }
  };

  // Fungsi play audio single ayat
  const playSingleAudio = async (ayatNomor) => {
    if (isPlaying && currentAyat === ayatNomor && playMode === "single") {
      stopAudio();
      return;
    }

    stopAudio();
    setPlayMode("single");
    stateRef.current.playMode = "single";
    await playAudio(ayatNomor);
  };

  // Fungsi play sequential (seluruh surat)
  const playSequential = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    stopAudio();
    setPlayMode("sequential");
    setCurrentLoop(0);
    stateRef.current.playMode = "sequential";
    stateRef.current.currentLoop = 0;
    await playAudio(1);
  };

  // Fungsi play range (ayat tertentu)
  const playRangeFromModal = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (rangeStart > rangeEnd) {
      alert("Ayat awal tidak boleh lebih besar dari ayat akhir");
      return;
    }

    if (rangeStart < 1 || rangeEnd > data.length) {
      alert(`Range ayat harus antara 1 dan ${data.length}`);
      return;
    }

    stopAudio();
    setPlayMode("range");
    setCurrentLoop(0);
    stateRef.current.playMode = "range";
    stateRef.current.currentLoop = 0;
    stateRef.current.rangeStart = rangeStart;
    stateRef.current.rangeEnd = rangeEnd;
    setShowSettingsModal(false);
    await playAudio(rangeStart);
  };

  // Stop semua audio
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentAyat(null);
    setCurrentLoop(0);
    stateRef.current.currentAyat = null;
    stateRef.current.isPlaying = false;
    stateRef.current.currentLoop = 0;
  };

  // Handler untuk input range
  const handleRangeStartChange = (e) => {
    const value = e.target.value === "" ? "" : parseInt(e.target.value);
    setRangeStart(value);
  };

  const handleRangeEndChange = (e) => {
    const value = e.target.value === "" ? "" : parseInt(e.target.value);
    setRangeEnd(value);
  };

  // Handler untuk input loop count manual
  const handleLoopCountChange = (e) => {
    const value = e.target.value === "" ? "" : parseInt(e.target.value);
    setLoopCount(value);
  };

  // Fungsi toggle semua terjemahan
  const toggleAllTranslations = () => {
    setShowArabic(!showArabic);
  };

  return (
    <div className="d-flex flex-column" style={{ height: '100vh', width: '100vw'}}>
      {/* Header - FIXED POSITION */}
      <div className="bg-white border-bottom" 
      style={{
        position: 'fixed',
        top: '56px',
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'white',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      onWheel={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onTouchMove={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onScroll={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}>
        <Container className="pt-3">
          <div className="text-center">
            <h4>🎧 Surat {nomor}</h4>
            <div className="d-flex justify-content-center gap-2 mb-3">
              <Button 
                variant={isPlaying ? "danger" : "success"}
                onClick={isPlaying ? stopAudio : playSequential}
                size="sm"
              >
                {isPlaying ? "⏹️ Stop" : "🔁 Putar Semua"}
              </Button>
              <Button 
                variant="outline-primary"
                onClick={() => setShowSettingsModal(true)}
                size="sm"
                disabled={isPlaying}
              >
                ⚙️ Setelan
              </Button>
              {/* Tombol toggle semua terjemahan */}
              <Button 
                variant={showArabic ? "outline-info" : "info"}
                onClick={toggleAllTranslations}
                size="sm"
                title={showArabic ? "Tampilkan terjemahan" : "Tampilkan teks Arab"}
              >
                {showArabic ? <Eye size={16} /> : <EyeSlash size={16} />}
              </Button>
            </div>

            {/* Status Playback */}
            <div className="alert alert-info py-2 small mb-3">
              {isPlaying ? (
                <strong>
                  {playMode === "sequential" 
                    ? `Memutar seluruh surat • Ayat ${currentAyat}` 
                    : playMode === "range"
                    ? `Memutar ayat ${stateRef.current.rangeStart}-${stateRef.current.rangeEnd} • Ayat ${currentAyat}`
                    : `Memutar ayat ${currentAyat}`}
                  {loopCount > 0 && ` • Loop ${currentLoop + 1}/${loopCount}`}
                  {loopCount === 0 && " • Loop continuous"}
                </strong>
              ) : (
                <strong>
                  {showArabic ? "Teks Arab" : " Terjemahan"} • Pilih mode pemutaran
                </strong>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* Container Ayat */}
      <div 
        ref={ayatContainerRef} 
        className="flex-grow-1   overflow-auto"
        style={{ 
          marginTop: '170px',
          height: 'calc(100vh - 140px - 56px)',
          paddingBottom: '60px',
          paddingTop: '20px'
        }}
      >
        <Container className="py-2">
          {!isSuratAktif ? (
            <p style={{ padding: "1rem", textAlign: "center", color: "#6c757d" }}>
              {loading ? "Memuat..." : "Surat tidak tersedia. Silakan login atau beli premium untuk mengakses."}
            </p>
          ) : loading ? (
            <p style={{ padding: "1rem", textAlign: "center" }}>
              ⏳ Memuat surat dan terjemahan...
            </p>
          ) : data.length === 0 ? (
            <p style={{ padding: "1rem", textAlign: "center" }}>
              Gagal memuat data surat.
            </p>
          ) : (
            <div>
              {data.map((ayat) => (
                <div 
                  key={ayat.nomor} 
                  className="ayat-item border-bottom pb-2 mb-2"
                  style={{ 
                    background: currentAyat === ayat.nomor ? "#e3f2fd" : "transparent",
                    padding: "0.4rem",
                    borderRadius: "4px",
                    transition: "all 0.3s ease",
                    border: currentAyat === ayat.nomor ? "2px solid #2196f3" : "none",
                    marginBottom: "0.5rem"
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <div className="d-flex align-items-center">
                      <span className="badge bg-secondary me-2" style={{ fontSize: "0.8rem" }}>
                        {toArabicNumber(ayat.nomor)}
                      </span>
                    </div>
                    <div className="d-flex gap-1">
                      <Button 
                        variant={currentAyat === ayat.nomor && isPlaying && playMode === "single" ? "success" : "outline-success"}
                        size="sm"
                        onClick={() => playSingleAudio(ayat.nomor)}
                        disabled={isPlaying && currentAyat !== ayat.nomor && playMode !== "single"}
                        style={{ padding: "0.2rem 0.4rem", fontSize: "0.8rem" }}
                      >
                        {currentAyat === ayat.nomor && isPlaying && playMode === "single" ? "⏹️" : "🔊"}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Conditional rendering berdasarkan showArabic */}
                  {showArabic ? (
                    <div 
                      className="text-end mb-1" 
                      style={{ 
                        fontFamily: "Scheherazade, serif", 
                        fontSize: "1.5rem",
                        lineHeight: "1.6",
                        minHeight: "2rem"
                      }}
                    >
                      {ayat.ar}
                    </div>
                  ) : (
                    <div 
                      className="p-2" 
                      style={{ 
                        background: "#f8f9fa", 
                        borderRadius: "4px",
                        lineHeight: "1.4",
                        fontSize: "1.0rem",
                        textAlign: "justify"
                      }}
                    >
                      <span className="text-muted">
                        {ayat.translation || `Terjemahan ayat ${ayat.nomor}`}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Container>
      </div>

      {/* Modal untuk Setelan */}
      <Modal show={showSettingsModal} onHide={() => setShowSettingsModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>⚙️ Setelan Pemutaran</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="mb-3">
              <Col>
                <Form.Label>Ayat Awal:</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max={data.length}
                  value={rangeStart}
                  onChange={handleRangeStartChange}
                  onBlur={(e) => {
                    let value = parseInt(e.target.value);
                    if (isNaN(value) || value < 1) value = 1;
                    if (value > data.length) value = data.length;
                    if (value > rangeEnd) setRangeEnd(value);
                    setRangeStart(value);
                  }}
                />
                <Form.Text className="text-muted">
                  Min: 1, Max: {data.length}
                </Form.Text>
              </Col>
              <Col>
                <Form.Label>Ayat Akhir:</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max={data.length}
                  value={rangeEnd}
                  onChange={handleRangeEndChange}
                  onBlur={(e) => {
                    let value = parseInt(e.target.value);
                    if (isNaN(value) || value < 1) value = 1;
                    if (value > data.length) value = data.length;
                    if (value < rangeStart) setRangeStart(value);
                    setRangeEnd(value);
                  }}
                />
                <Form.Text className="text-muted">
                  Min: 1, Max: {data.length}
                </Form.Text>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Jumlah Pengulangan:</Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={loopCount}
                onChange={handleLoopCountChange}
                onBlur={(e) => {
                  let value = parseInt(e.target.value);
                  if (isNaN(value) || value < 0) value = 1;
                  setLoopCount(value);
                }}
                placeholder="Masukkan jumlah pengulangan"
              />
              <Form.Text className="text-muted">
                0 = Continuous (terus menerus), 1+ = Jumlah pengulangan tertentu
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSettingsModal(false)}>
            Batal
          </Button>
          <Button 
            variant="primary" 
            onClick={playRangeFromModal}
            disabled={!rangeStart || !rangeEnd || rangeStart > rangeEnd}
          >
            ▶️ Putar Range
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TampilanSuratIstima;