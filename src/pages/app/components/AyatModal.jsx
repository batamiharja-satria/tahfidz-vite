import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import suratList from "../data/SuratConfig";
import { X } from "react-bootstrap-icons";
import audioCache from "../utils/audioCache"; // ✅ Import cache global

function AyatModal({ show, onHide, ayat, suratId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [audio, setAudio] = useState(null);

  // flatten semua juz di config
  const allSurat = [];
  Object.keys(suratList).forEach((k) => {
    const v = suratList[k];
    if (v && Array.isArray(v.data)) allSurat.push(...v.data);
    else if (Array.isArray(v)) allSurat.push(...v);
  });

  const suratData = allSurat.find((s) => String(s.nomor) === String(suratId));

  if (!suratData) {
    console.error("Surat tidak ditemukan di SuratConfig.js");
    return null;
  }

  const suratNumber = suratData.nomor;
  const ayatNumber = ayat.nomor;

  const audioUrl = `https://the-quran-project.github.io/Quran-Audio/Data/1/${suratNumber}_${ayatNumber}.mp3`;

  const handlePlayAudio = async () => {
    setIsLoading(true);

    try {
      // ✅ CEK CACHE GLOBAL - pakai cache yang sama dengan AyatItem
      if (audioCache.has(audioUrl)) {
        const cachedAudio = audioCache.get(audioUrl);
        cachedAudio.currentTime = 0;
        cachedAudio.play();
        setAudio(cachedAudio);
        setIsLoading(false);
        return;
      }

      // ✅ JIKA BELUM ADA DI CACHE - download dan simpan ke cache global
      const newAudio = new Audio(audioUrl);
      audioCache.set(audioUrl, newAudio);

      newAudio.onplaying = () => setIsLoading(false);
      newAudio.onerror = () => {
        setIsLoading(false);
        alert("Gagal memutar audio.");
      };

      newAudio.play();
      setAudio(newAudio);
    } catch (error) {
      alert("Audio gagal dimuat.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [audio]);

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Body className="text-center px-4 py-4">
        <div
          className="mb-4 fs-2"
          style={{ fontFamily: "Scheherazade", lineHeight: "2.4rem" }}
        >
          {ayat.ar || ayat.text}
        </div>
        <div className="d-flex justify-content-center gap-3 align-items-center">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={handlePlayAudio}
            disabled={isLoading}
          >
            {isLoading ? "⏳" : "🔊"}
          </button>

          <Button variant="secondary" className="btn btn-sm" onClick={onHide}>
            <X />
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default AyatModal;