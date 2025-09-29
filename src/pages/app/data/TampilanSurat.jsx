import React, { useEffect, useState } from "react";
import Sidebar1 from "../components/sidebar/Sidebar1";
import AyatItem from "../components/AyatItem";
import { Container, Button } from "react-bootstrap";

const TampilanSurat = ({ nomor }) => {
  const [data, setData] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [wordCount, setWordCount] = useState(1); // ✅ default 1 kata

  useEffect(() => {
    if (!nomor) return;

    fetch(`https://api.quran.gading.dev/surah/${nomor}`)
      .then((res) => res.json())
      .then((result) => {
        if (result?.data?.verses) {
          // hanya ambil nomor ayat + teks arab
          const mapped = result.data.verses.map((v) => ({
            nomor: v.number.inSurah,
            ar: v.text.arab,
          }));
          setData(mapped);
        } else {
          setData([]);
        }
      })
      .catch((err) => console.error("Error fetch data:", err));
  }, [nomor]);

  const toggleWordCount = () => {
    setWordCount((prev) => (prev + 1) % 4); // 0 → 1 → 2 → 3 → balik lagi
  };

  return (
    <div className="d-flex flex-column vh-100">
      <Sidebar1 show={showSidebar} />

      {/* content scroll */}
      <div className="flex-grow-1 overflow-auto">
        <Container className="mt-3 mb-5">
          {data.map((ayat) => (
            <AyatItem
              key={ayat.nomor}
              ayat={ayat}
              suratId={parseInt(nomor, 10)} // cast biar pasti number
              wordCount={wordCount} // ✅ lempar ke AyatItem
            />
          ))}
        </Container>
      </div>
{/* footer fixed */}
<footer
  className="bg-dark text-center p-2"
  style={{
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    zIndex: 1030, // biar selalu di atas konten
  }}
>
<div
  style={{
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: "400",
    color: "#fff",
  }}
  className="d-flex justify-content-between align-items-center px-3"
>
  {/* Button kiri */}
  <button
    onClick={toggleWordCount}
    className="btn btn-outline-light btn-sm"
  >
    Tambah
  </button>


  {/* Kata pertama di kanan */}
  <span className="text-end">
        <span className="me-5">
     {wordCount}
  </span>
      Kata pertama
  </span>
</div>
</footer>

    </div>
  );
};

export default TampilanSurat;