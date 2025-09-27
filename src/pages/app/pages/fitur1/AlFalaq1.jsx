import React, { useEffect, useState } from "react";

import Sidebar1 from "../../components/sidebar/Sidebar1";

import AyatItem from "../../components/AyatItem";
import suratList from "../../data/SuratConfig";
import { Container } from "react-bootstrap";
import dataAlFalaq from "../../data/ayatdata/AlFalaq.json"; // ✅ tambahkan ini

const AlFalaq1 = () => {
  const surat = suratList.find((s) => s.id === "113");
  const [data, setData] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    setData(dataAlFalaq); // ✅ pakai data langsung
  }, []);

  return (
    <div className="d-flex">
      <Sidebar1 show={showSidebar} />
      <div className="flex-grow-1">
        <Container className="mt-3">
          {data.map((ayat) => (
            <AyatItem key={ayat.number} ayat={ayat} suratId={surat.id} />
          ))}
        </Container>
      </div>
    </div>
  );
};

export default AlFalaq1;
