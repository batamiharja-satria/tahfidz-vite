import React, { useState, useRef, useEffect } from "react";
import { Routes, Route, useParams } from "react-router-dom";
import Sidebar1 from "../../components/sidebar/Sidebar1";
import Header1 from "../../components/header/Header1";
import Panduan1 from "./Panduan1";
import TampilanSurat from "../../data/TampilanSurat";

function TampilanSuratWrapper() {
  const { nomor } = useParams();
  return <TampilanSurat nomor={nomor} />;
}

function Index1() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const headerRef = useRef(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // ✅ Fungsi untuk menutup sidebar ketika klik di luar
  const closeSidebar = () => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  // ✅ Effect untuk handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Jika sidebar terbuka DAN klik di luar sidebar DAN bukan di header toggle button
      if (sidebarOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target) &&
          headerRef.current &&
          !headerRef.current.contains(event.target)) {
        closeSidebar();
      }
    };

    // Tambah event listener
    document.addEventListener("mousedown", handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  return (
    <div className="app-container">
      {/* ✅ Tambah ref ke Header untuk exclude toggle button */}
      <div ref={headerRef}>
        <Header1 toggleSidebar={toggleSidebar} />
      </div>
      
      {/* ✅ Tambah ref ke Sidebar */}
      <div ref={sidebarRef}>
        <Sidebar1 isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      </div>
      
      <div className="content" style={{ paddingTop: "56px" }}>
        <Routes>
          <Route index element={<Panduan1 />} />
          <Route path="panduan1" element={<Panduan1 />} />
          <Route path=":nomor" element={<TampilanSuratWrapper />} />
        </Routes>
      </div>
    </div>
  );
}

export default Index1;