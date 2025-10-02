import React, { useState, useEffect } from "react";
import { List } from "react-bootstrap-icons";
import { useLocation } from "react-router-dom";
import suratConfig from "../../data/SuratConfig";

const Header1 = ({ toggleSidebar }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [suratList, setSuratList] = useState([]);

  useEffect(() => {
    // Ambil SEMUA surat tanpa filter status
    const collectAllSurat = () => {
      const all = [];

      Object.keys(suratConfig).forEach((k) => {
        const v = suratConfig[k];
        
        if (v && Array.isArray(v.data)) {
          all.push(...v.data);
        } else if (Array.isArray(v)) {
          all.push(...v);
        }
      });

      return all;
    };

    setSuratList(collectAllSurat());
  }, []);

  const suratName = suratList.find((s) =>
    currentPath.endsWith(String(s.nomor)),
  )?.nama;

  return (
    <div
      style={{
        height: "56px",
        backgroundColor: "#212529",
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.5rem 1rem",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
      }}
    >
      <button className="btn btn-outline-light btn-sm" onClick={toggleSidebar}>
        <List size={20} />
      </button>
      <h5 className="mb-0 ms-auto text-end">
        {currentPath === "/" || currentPath === "/fitur1/home1"
          ? "تَحْفِيْظ"
          : suratName}
      </h5>
    </div>
  );
};

export default Header1;