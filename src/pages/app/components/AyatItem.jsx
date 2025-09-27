import React, { useState, useEffect } from "react";
import { EyeFill } from "react-bootstrap-icons";
import AyatModal from "./AyatModal";
import suratList from "../data/SuratConfig";
import { Form } from "react-bootstrap";

const toArabicNumber = (number) => {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return number
    .toString()
    .split("")
    .map((d) => arabicDigits[parseInt(d)])
    .join("");
};

const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), timeout),
    ),
  ]);
};

const AyatItem = ({ ayat, suratId }) => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHafal, setIsHafal] = useState(false);

  const key = `hafalan_${suratId}_${ayat.number}`;

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

    const suratData = suratList.find((s) => s.id === suratId.toString());
    const folderName = suratData.path.replace("/", "");
    const suratNumber = suratData.id.padStart(3, "0");
    const ayatNumber = ayat.number.toString().padStart(3, "0");

    const audioUrl = `https://archive.org/download/download-murottal-misyari-rasyid-per-ayat-surah-${folderName}-mp3/${suratNumber}${ayatNumber}.mp3`;

    try {
      const response = await fetchWithTimeout(
        audioUrl,
        { method: "HEAD" },
        5000,
      );
      if (!response.ok) throw new Error("Audio tidak tersedia.");

      const audio = new Audio(audioUrl);
      audio.play();
      audio.onplaying = () => setIsLoading(false);
    } catch (error) {
      alert("Gagal memutar audio. Periksa koneksi internet.");
      setIsLoading(false);
    }
  };

  const firstTwoWords = ayat.text.split(" ").slice(0, 2).join(" ");

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

      <div className="text-center flex-grow-1 fs-4">{firstTwoWords}</div>
      <div className="fs-5">{toArabicNumber(ayat.number)}</div>

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
