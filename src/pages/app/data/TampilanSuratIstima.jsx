import React, { useEffect, useState, useRef } from "react";
import { Container, Button, Modal, Form, Row, Col } from "react-bootstrap";
import suratConfig from "./SuratConfig";
import { supabase } from "../../../services/supabase";
import audioCache from "../utils/audioCache";

// Helper: ubah angka ke Arab
const toArabicNumber = (number) => {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return number
    .toString()
    .split("")
    .map((d) => arabicDigits[parseInt(d)])
    .join("");
};

const TampilanSuratIstima = ({ nomor }) => {
  const [data, setData] = useState([]);
  const [userStatus, setUserStatus] = useState([]);
  const [isSuratAktif, setIsSuratAktif] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // State untuk audio playback - SIMPLE VERSION
  const [currentAyat, setCurrentAyat] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState("single");
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(1);
  const [loopCount, setLoopCount] = useState(1);
  const [currentLoop, setCurrentLoop] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Refs untuk manage audio
  const audioRef = useRef(null);
  const ayatContainerRef = useRef(null);
  const currentAyatRef = useRef(null);

  // Refs untuk state yang perlu diakses di event listeners
  const stateRef = useRef({
    playMode: "single",
    rangeStart: 1,
    rangeEnd: 1,
    loopCount: 1,
    currentLoop: 0,
    dataLength: 0
  });

  // Update ref ketika state berubah
  useEffect(() => {
    stateRef.current = {
      playMode,
      rangeStart,
      rangeEnd,
      loopCount,
      currentLoop,
      dataLength: data.length
    };
  }, [playMode, rangeStart, rangeEnd, loopCount, currentLoop, data.length]);

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

  useEffect(() => {
    fetchUserStatus();
  }, []);

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

    if (suratAktif) {
      setLoading(true);
      
      // Fetch data Arabic text dan terjemahan SEKALIGUS dari API
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
            setRangeEnd(mapped.length);
            stateRef.current.dataLength = mapped.length;
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

  // Auto-scroll ke ayat yang sedang diputar
  useEffect(() => {
    if (currentAyat && currentAyatRef.current && ayatContainerRef.current) {
      const ayatElement = currentAyatRef.current;
      const container = ayatContainerRef.current;
      
      const ayatTop = ayatElement.offsetTop;
      const containerHeight = container.clientHeight;
      const scrollPosition = ayatTop - (containerHeight / 3);
      
      container.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [currentAyat]);

  // Cleanup audio ketika komponen unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // **FUNGSI UTAMA YANG DIPERBAIKI**

  // Handle ketika audio selesai - SANGAT SEDERHANA
  const handleAudioEnded = () => {
    const state = stateRef.current;
    let nextAyat = currentAyat + 1;

    if (state.playMode === "single") {
      stopAudio();
      return;
    }

    if (state.playMode === "range") {
      if (nextAyat > state.rangeEnd) {
        // Sampai akhir range, cek loop
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
        // Sampai akhir surat, cek loop
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

    // Play ayat berikutnya setelah delay kecil
    setTimeout(() => {
      playAudio(nextAyat);
    }, 500);
  };

  // Core audio playback function - SANGAT SEDERHANA
  const playAudio = async (ayatNomor) => {
    if (!data.length || ayatNomor < 1 || ayatNomor > data.length) {
      console.error("Ayat tidak valid:", ayatNomor);
      stopAudio();
      return;
    }

    console.log("Memutar ayat:", ayatNomor, "Mode:", stateRef.current.playMode);

    // Stop audio sebelumnya
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setCurrentAyat(ayatNomor);
    setIsPlaying(true);

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

      // Setup event listeners sederhana
      audio.onended = handleAudioEnded;
      audio.onerror = () => {
        console.error("Error memutar audio ayat:", ayatNomor);
        alert(`Gagal memutar audio ayat ${ayatNomor}`);
        stopAudio();
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
    if (isPlaying && currentAyat === ayatNomor) {
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
    if (isPlaying && playMode === "sequential") {
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
    if (isPlaying && playMode === "range") {
      stopAudio();
      return;
    }

    // Validasi range
    if (rangeStart > rangeEnd) {
      alert("Ayat awal tidak boleh lebih besar dari ayat akhir");
      return;
    }

    stopAudio();
    setPlayMode("range");
    setCurrentLoop(0);
    stateRef.current.playMode = "range";
    stateRef.current.currentLoop = 0;
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
    stateRef.current.currentLoop = 0;
  };

  return (
    <div className="d-flex flex-column vh-100">
      {/* Header - TETAP DI ATAS */}
      <div className="bg-white border-bottom" style={{ flexShrink: 0 }}>
        <Container className="pt-3">
          <div className="text-center">
            <h4>🎧 Surat {nomor}</h4>
            <div className="d-flex justify-content-center gap-2 mb-3">
              <Button 
                variant={isPlaying && playMode === "sequential" ? "danger" : "success"}
                onClick={playSequential}
                size="sm"
              >
                {isPlaying && playMode === "sequential" ? "⏹️ Stop" : "🔁 Putar Semua"}
              </Button>
              <Button 
                variant="outline-primary"
                onClick={() => setShowSettingsModal(true)}
                size="sm"
                disabled={isPlaying}
              >
                ⚙️ Setelan
              </Button>
            </div>

            {/* Status Playback */}
            {isPlaying && (
              <div className="alert alert-info py-2 small mb-3">
                <strong>
                  {playMode === "sequential" 
                    ? `Memutar seluruh surat • Ayat ${currentAyat}` 
                    : `Memutar ayat ${rangeStart}-${rangeEnd} • Ayat ${currentAyat}`}
                  {loopCount > 0 && ` • Loop ${currentLoop + 1}/${loopCount}`}
                  {loopCount === 0 && " • Loop continuous"}
                </strong>
              </div>
            )}
          </div>
        </Container>
      </div>

      {/* Container Ayat - BISA DI-SCROLL */}
      <div ref={ayatContainerRef} className="flex-grow-1 overflow-auto">
        <Container className="py-3">
          {!isSuratAktif ? (
            <p style={{ padding: "1rem", textAlign: "center", color: "#6c757d" }}>
              Surat tidak tersedia atau belum aktif untuk akun Anda.
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
              {/* Daftar Ayat */}
              {data.map((ayat) => (
                <div 
                  key={ayat.nomor} 
                  ref={currentAyat === ayat.nomor ? currentAyatRef : null}
                  className="border-bottom pb-3 mb-3"
                  style={{ 
                    background: currentAyat === ayat.nomor ? "#e3f2fd" : "transparent",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    transition: "all 0.3s ease",
                    border: currentAyat === ayat.nomor ? "2px solid #2196f3" : "none"
                  }}
                >
                  {/* Sederhana: Nomor ayat + Tombol audio */}
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center">
                      <span className="badge bg-secondary me-2">{toArabicNumber(ayat.nomor)}</span>
                    </div>
                    <Button 
                      variant={currentAyat === ayat.nomor ? "success" : "outline-success"}
                      size="sm"
                      onClick={() => playSingleAudio(ayat.nomor)}
                      disabled={isPlaying && currentAyat !== ayat.nomor}
                      className="ms-2"
                    >
                      {currentAyat === ayat.nomor ? "⏹️" : "🔊"}
                    </Button>
                  </div>
                  
                  {/* Teks Arab */}
                  <div 
                    className="text-end mb-2" 
                    style={{ 
                      fontFamily: "Scheherazade, serif", 
                      fontSize: "1.8rem",
                      lineHeight: "2",
                      minHeight: "3rem"
                    }}
                  >
                    {ayat.ar}
                  </div>
                  
                  {/* Terjemahan dari API */}
                  <div 
                    className="p-2 border-top" 
                    style={{ 
                      background: "#f8f9fa", 
                      borderRadius: "4px",
                      lineHeight: "1.5",
                      fontSize: "0.9rem"
                    }}
                  >
                    <span className="text-muted">
                      {ayat.translation || `Terjemahan ayat ${ayat.nomor}`}
                    </span>
                  </div>
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
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setRangeStart(value);
                    if (value > rangeEnd) setRangeEnd(value);
                  }}
                />
              </Col>
              <Col>
                <Form.Label>Ayat Akhir:</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max={data.length}
                  value={rangeEnd}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setRangeEnd(value);
                    if (value < rangeStart) setRangeStart(value);
                  }}
                />
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Pengulangan:</Form.Label>
              <Form.Select
                value={loopCount}
                onChange={(e) => setLoopCount(parseInt(e.target.value))}
              >
                <option value={1}>1x</option>
                <option value={3}>3x</option>
                <option value={5}>5x</option>
                <option value={10}>10x</option>
                <option value={0}>Continuous</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSettingsModal(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={playRangeFromModal}>
            ▶️ Putar Range
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Footer Minimal */}
      {!isPlaying && (
        <footer className="bg-light text-center p-2 border-top">
          <div className="text-muted small">
            Klik 🔊 untuk putar per ayat • ⚙️ untuk setelan lanjutan
          </div>
        </footer>
      )}
    </div>
  );
};

export default TampilanSuratIstima;