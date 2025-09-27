import React, { useEffect, useState } from "react";

import Sidebar1 from "../../components/sidebar/Sidebar1";

import AyatItem from "../../components/AyatItem";
import suratList from "../../data/SuratConfig";
import { Container } from "react-bootstrap";
import dataAlIkhlas from "../../data/ayatdata/AlIkhlas.json"; // ✅ tambahkan ini

const AlIkhlas1 = () => {
  const surat = suratList.find((s) => s.id === "112");
  const [data, setData] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    setData(dataAlIkhlas); // ✅ pakai data langsung
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

export default AlIkhlas1;
