import React, { useState, useEffect } from "react";
import { EyeFill } from "react-bootstrap-icons";
import AyatModal from "./AyatModal";
import suratConfig from "../data/SuratConfig";
import { Form } from "react-bootstrap";

// ubah angka ke Arab
const toArabicNumber = (number) => {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return number
    .toString()
    .split("")
    .map((d) => arabicDigits[parseInt(d)])
    .join("");
};

// cache audio supaya gak download ulang
const audioCache = new Map();

const AyatItem = ({ ayat, suratId, wordCount = 2 }) => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHafal, setIsHafal] = useState(false);

  const key = `hafalan_${suratId}_${ayat.nomor}`;

  useEffect(() => {
    const stored = localStorage.getItem(key);
    setIsHafal(stored === "true");
  }, [key]);

  const toggleHafalan = () => {
    const newStatus = !isHafal;
    setIsHafal(newStatus);
    localStorage.setItem(key, newStatus);
  };

  const playAudio = async () => {
    setIsLoading(true);

    // cari surat dari config
    const suratData = suratConfig.find((s) => s.nomor === suratId);
    if (!suratData) {
      alert("Surat tidak ditemukan di SuratConfig.js");
      setIsLoading(false);
      return;
    }

    // pakai nomor asli (tanpa padStart)
    const suratNumber = suratData.nomor;
    const ayatNumber = ayat.nomor;

    // URL audio The Quran Project
    const audioUrl = `https://the-quran-project.github.io/Quran-Audio/Data/1/${suratNumber}_${ayatNumber}.mp3`;

    try {
      if (audioCache.has(audioUrl)) {
        const cachedAudio = audioCache.get(audioUrl);
        cachedAudio.currentTime = 0;
        cachedAudio.play();
        setIsLoading(false);
        return;
      }

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

  // ✅ tentukan jumlah kata yang ditampilkan
  let displayedText = "";
  if (wordCount > 0) {
    displayedText = ayat.ar.split(" ").slice(0, wordCount).join(" ");
  }

  return (
    <div className="d-flex justify-content-between align-items-center border p-2 mb-2">
      <div className="d-flex align-items-center">
        {/* tombol lihat detail */}
        <button
          className="btn btn-outline-secondary btn-sm me-2"
          onClick={() => setShowModal(true)}
        >
          <EyeFill />
        </button>

        {/* tombol audio */}
        <button
          className="btn btn-outline-secondary btn-sm me-2"
          onClick={playAudio}
          disabled={isLoading}
        >
          {isLoading ? "⏳" : "🔊"}
        </button>

        {/* checkbox hafalan */}
        <Form.Check
          type="checkbox"
          checked={isHafal}
          onChange={toggleHafalan}
          title="Tandai hafal"
          style={{ width: "40px", textAlign: "center" }}
        />
      </div>

      {/* teks ayat (potongan arab) */}
      <div className="text-end  flex-grow-1 fs-4 me-3"
      style={{
    minHeight: "2.2rem", // tinggi minimal tetap
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
  }}
      >{displayedText}</div>

      {/* nomor ayat arab */}
      <div className="fs-5">{toArabicNumber(ayat.nomor)}</div>

      {/* modal ayat */}
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