import React, { useState, useEffect } from "react";
import { EyeFill } from "react-bootstrap-icons";
import AyatModal from "./AyatModal";
import suratConfig from "../data/SuratConfig";
import { Form } from "react-bootstrap";
import audioCache from "../utils/audioCache";
import { UserStorage } from "../utils/userStorage"; // ✅ IMPORT BARU

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

const AyatItem = ({ ayat, suratId, wordCount = 2, session }) => { // ✅ TAMBAH SESSION PROP
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHafal, setIsHafal] = useState(false);

  // ✅ PERBAIKAN: Gunakan user-specific key
  useEffect(() => {
    const hafalStatus = UserStorage.getHafalan(session, suratId, ayat.nomor);
    setIsHafal(hafalStatus);
  }, [session, suratId, ayat.nomor]);

  const toggleHafalan = () => {
    const newStatus = !isHafal;
    setIsHafal(newStatus);
    // ✅ PERBAIKAN: Simpan dengan user-specific key
    UserStorage.setHafalan(session, suratId, ayat.nomor, newStatus);
  };

  const playAudio = async () => {
    setIsLoading(true);

    // cari surat dari config (flatten semua juz)
    const allSurat = getAllSuratFromConfig(suratConfig);
    const suratData = allSurat.find((s) => String(s.nomor) === String(suratId));

    if (!suratData) {
      alert("Surat tidak ditemukan di SuratConfig.js");
      setIsLoading(false);
      return;
    }

    const suratNumber = suratData.nomor;
    const ayatNumber = ayat.nomor;

    // URL audio The Quran Project
    const audioUrl = `https://the-quran-project.github.io/Quran-Audio/Data/1/${suratNumber}_${ayatNumber}.mp3`;

    try {
      // ✅ CEK CACHE GLOBAL - jika audio sudah pernah di-load
      if (audioCache.has(audioUrl)) {
        const cachedAudio = audioCache.get(audioUrl);
        cachedAudio.currentTime = 0;
        cachedAudio.play();
        setIsLoading(false);
        return;
      }

      // ✅ JIKA BELUM ADA DI CACHE - download dan simpan ke cache
      const audio = new Audio(audioUrl);
      audioCache.set(audioUrl, audio);

      audio.onplaying = () => setIsLoading(false);
      audio.onerror = () => {
        setIsLoading(false);
        alert("Gagal memutar audio.");
      };

      audio.play();
    } catch (error) {
      alert("Audio gagal dimuat.");
      setIsLoading(false);
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
          className="btn btn-outline-secondary btn-sm me-2"
          onClick={() => setShowModal(true)}
        >
          <EyeFill />
        </button>

        <button
          className="btn btn-outline-secondary btn-sm me-2"
          onClick={playAudio}
          disabled={isLoading}
        >
          {isLoading ? "⏳" : "🔊"}
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
        className="text-end flex-grow-1 fs-4 me-3"
        style={{
          minHeight: "2.2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        {displayedText}
      </div>

      <div className="fs-5">{toArabicNumber(ayat.nomor)}</div>

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