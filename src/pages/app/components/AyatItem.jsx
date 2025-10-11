import React, { useState, useEffect, useRef } from "react";
import { EyeFill } from "react-bootstrap-icons";
import AyatModal from "./AyatModal";
import suratConfig from "../data/SuratConfig";
import { Form } from "react-bootstrap";
import audioCache from "../utils/audioCache";
import { UserStorage } from "../utils/userStorage";
import audioManager from "../utils/audioManager"; // ✅ IMPORT BARU

// ubah angka ke Arab
const toArabicNumber = (number) => {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return number
    .toString()
    .split("")
    .map((d) => arabicDigits[parseInt(d)])
    .join("");
};

// helper: ambil semua surat dari semua juz di config
const getAllSuratFromConfig = (config) => {
  const all = [];
  Object.keys(config).forEach((k) => {
    const v = config[k];
    if (v && Array.isArray(v.data)) {
      all.push(...v.data);
    } else if (Array.isArray(v)) {
      all.push(...v);
    }
  });
  return all;
};

const AyatItem = ({ ayat, suratId, wordCount = 2, session }) => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHafal, setIsHafal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // ✅ STATE UNTUK UI

  // ✅ PERBAIKAN: Kembali ke SYNCHRONOUS
  useEffect(() => {
    const hafalStatus = UserStorage.getHafalan(session, suratId, ayat.nomor);
    setIsHafal(hafalStatus);
  }, [session, suratId, ayat.nomor]);

  // ✅ EFFECT UNTUK MENDENGARKAN PERUBAHAN STATE AUDIO GLOBAL
  useEffect(() => {
    const checkAudioState = () => {
      const currentlyPlaying = audioManager.isPlaying(suratId, ayat.nomor);
      setIsPlaying(currentlyPlaying);
    };

    // Check state saat komponen mount
    checkAudioState();

    // Check state secara periodic (opsional, untuk sync)
    const interval = setInterval(checkAudioState, 500);

    return () => clearInterval(interval);
  }, [suratId, ayat.nomor]);

  const toggleHafalan = () => {
    const newStatus = !isHafal;
    setIsHafal(newStatus);
    UserStorage.setHafalan(session, suratId, ayat.nomor, newStatus);
  };

  // ✅ FUNGSI PLAY AUDIO SINGLE AYAT YANG DISEMPURNAKAN
  const playSingleAudio = async (ayatNomor) => {
    // Jika audio yang sama sedang diputar, stop
    if (audioManager.isPlaying(suratId, ayatNomor)) {
      audioManager.stopCurrentAudio();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    // Cari surat dari config
    const allSurat = getAllSuratFromConfig(suratConfig);
    const suratData = allSurat.find((s) => String(s.nomor) === String(suratId));

    if (!suratData) {
      alert("Surat tidak ditemukan di SuratConfig.js");
      setIsLoading(false);
      return;
    }

    const suratNumber = suratData.nomor;
    const ayatNumber = ayatNomor;

    // URL audio The Quran Project
    const audioUrl = `https://the-quran-project.github.io/Quran-Audio/Data/1/${suratNumber}_${ayatNumber}.mp3`;

    try {
      let audioToPlay;

      // ✅ CEK CACHE GLOBAL
      if (audioCache.has(audioUrl)) {
        audioToPlay = audioCache.get(audioUrl);
      } else {
        // ✅ JIKA BELUM ADA DI CACHE - download dan simpan
        audioToPlay = new Audio(audioUrl);
        audioCache.set(audioUrl, audioToPlay);
      }

      // ✅ GUNAKAN AUDIO MANAGER GLOBAL
      audioManager.playAudio(
        audioUrl,
        suratId,
        ayatNomor,
        () => {
          // onPlaying callback
          setIsLoading(false);
          setIsPlaying(true);
        },
        () => {
          // onError callback
          setIsLoading(false);
          setIsPlaying(false);
          alert("Gagal memutar audio.");
        },
        () => {
          // onEnded callback
          setIsPlaying(false);
        }
      );

    } catch (error) {
      setIsLoading(false);
      setIsPlaying(false);
      alert("Audio gagal dimuat.");
    }
  };

  // tentukan jumlah kata yang ditampilkan (0 => kosong)
  let displayedText = "";
  if (wordCount > 0 && ayat?.ar) {
    const parts = ayat.ar.split(" ").filter(Boolean);
    displayedText = parts.slice(0, wordCount).join(" ");
  }

  return (
    <div className="d-flex justify-content-between align-items-center border p-2 mb-2">
      <div className="d-flex align-items-center">
        <button
          className="btn btn-outline-secondary btn-sm me-3"
          onClick={() => setShowModal(true)}
        >
          <EyeFill />
        </button>

        <button
          className="btn btn-outline-secondary btn-sm me-2"
          onClick={() => playSingleAudio(ayat.nomor)}
          disabled={isLoading && isPlaying}
          style={{ padding: "0.2rem 0.4rem", fontSize: "0.8rem" }}
        >
          {isPlaying ? "⏹️" : (isLoading ? "⏳" : "🔊")}
        </button>

        <Form.Check
          type="checkbox"
          checked={isHafal}
          onChange={toggleHafalan}
          title="Tandai hafal"
          style={{ width: "40px", textAlign: "center" }}
        />
      </div>

      <div
        className="text-end flex-grow-1 fs-4 me-2"
        style={{
          minHeight: "2.2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        {displayedText}
      </div>

      <div className="fs-6">{toArabicNumber(ayat.nomor)}</div>

      <AyatModal
        show={showModal}
        onHide={() => setShowModal(false)}
        ayat={ayat}
        suratId={suratId}
      />
    </div>
  );
};

export default AyatItem;