import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { VolumeUp } from "react-bootstrap-icons";
import suratList from "../data/SuratConfig";
import { X } from "react-bootstrap-icons";

// Fungsi timeout manual
const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), timeout),
    ),
  ]);
};

function AyatModal({ show, onHide, ayat, suratId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [audio, setAudio] = useState(null);

  const suratData = suratList.find((s) => s.id === suratId?.toString());

  if (!suratData) {
    console.error(
      "Surat tidak ditemukan. Cek SuratConfig.js dan pastikan ID valid.",
    );
    return null;
  }

  const folderName = suratData.path.replace("/", "");
  const suratNumber = suratData.id.padStart(3, "0");
  const ayatNumber = ayat.number.toString().padStart(3, "0");
  const audioUrl = `https://archive.org/download/download-murottal-misyari-rasyid-per-ayat-surah-${folderName}-mp3/${suratNumber}${ayatNumber}.mp3`;

  const handlePlayAudio = async () => {
    setIsLoading(true);

    try {
      const response = await fetchWithTimeout(
        audioUrl,
        { method: "HEAD" },
        5000,
      );
      if (!response.ok) throw new Error("Audio tidak tersedia.");

      const newAudio = new Audio(audioUrl);
      newAudio.onplaying = () => setIsLoading(false);
      newAudio.onerror = () => {
        setIsLoading(false);
        alert("Gagal memutar audio. Periksa koneksi internet.");
      };
      newAudio.play();
      setAudio(newAudio);
    } catch (error) {
      alert("Audio gagal dimuat. Periksa koneksi internet.");
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
          {ayat.text}
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
