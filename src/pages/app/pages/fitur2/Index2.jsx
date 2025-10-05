import React, { useState, useRef, useEffect } from "react";
import { Routes, Route, useParams } from "react-router-dom";
import Sidebar1 from "../../components/sidebar/Sidebar1";
import Header1 from "../../components/header/Header1";
import Panduan2 from "./Panduan2";
import TampilanSuratIstima from "../../data/TampilanSuratIstima"; // ✅ Path sesuai struktur

function TampilanSuratIstimaWrapper() {
  const { nomor } = useParams();
  return <TampilanSuratIstima nomor={nomor} />;
}

function Index2() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const headerRef = useRef(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const closeSidebar = () => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target) &&
          headerRef.current &&
          !headerRef.current.contains(event.target)) {
        closeSidebar();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  return (
    <div className="app-container">
      <div ref={headerRef}>
        <Header1 toggleSidebar={toggleSidebar} />
      </div>
      
      <div ref={sidebarRef}>
        {/* ✅ Tambah basePath untuk fitur2 */}
        <Sidebar1 
          isOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar} 
          basePath="/app2/app/fitur2" 
        />
      </div>
      
      <div className="content" style={{ paddingTop: "56px" }}>
        <Routes>
          <Route index element={<Panduan2 />} />
          <Route path="panduan2" element={<Panduan2 />} />
          <Route path=":nomor" element={<TampilanSuratIstimaWrapper />} />
        </Routes>
      </div>
    </div>
  );
}

export default Index2;