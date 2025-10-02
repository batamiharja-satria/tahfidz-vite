import React, { useEffect, useState } from "react";
import Sidebar1 from "../components/sidebar/Sidebar1";
import AyatItem from "../components/AyatItem";
import { Container, Button } from "react-bootstrap";
import suratConfig from "./SuratConfig";

const TampilanSurat = ({ nomor }) => {
  const [data, setData] = useState([]);
  const [wordCount, setWordCount] = useState(1); // default 1 kata

  useEffect(() => {
    if (!nomor) return;

    // ✅ PERUBAHAN: Cek apakah surat ada di config (tanpa peduli status juz)
    let suratExists = false;
    Object.keys(suratConfig).forEach((k) => {
      const juz = suratConfig[k];
      if (!juz) return;
      const found = (juz.data || []).find(
        (s) => String(s.nomor) === String(nomor),
      );
      if (found) suratExists = true;
    });

    if (!suratExists) {
      setData([]);
      return;
    }

    // ✅ LANJUT FETCH - karena surat ada di config
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
      });
  }, [nomor]);

  const toggleWordCount = () => {
    setWordCount((prev) => (prev + 1) % 4); // 0 ->1->2->3->0...
  };

  return (
    <div className="d-flex flex-column vh-100">
      {/* content scroll (Header sudah fixed di Index1, Index1 menambahkan paddingTop) */}
      <div className="flex-grow-1 overflow-auto">
        <Container className="mt-3 mb-5">
          {data.length === 0 ? (
            <p style={{ padding: "1rem" }}>
              Loading...
            </p>
          ) : (
            data.map((ayat) => (
              <AyatItem
                key={ayat.nomor}
                ayat={ayat}
                suratId={parseInt(nomor, 10)}
                wordCount={wordCount}
              />
            ))
          )}
        </Container>
      </div>

      {/* footer fixed */}
      <footer
        className="bg-dark text-center p-1"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          width: "100%",
          zIndex: 1030,
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
          <button
            onClick={toggleWordCount}
            className="btn btn-outline-light btn-sm"
          >
            Tambah
          </button>

          <span className="text-end">
            <span className="me-3">{wordCount}</span> Kata
          </span>
        </div>
      </footer>
    </div>
  );
};

export default TampilanSurat;