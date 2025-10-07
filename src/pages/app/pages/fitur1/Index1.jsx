import React, { useState, useRef, useEffect } from "react";
import { Routes, Route, useParams, useLocation, useNavigate } from "react-router-dom";
import Sidebar1 from "../../components/sidebar/Sidebar1";
import Header1 from "../../components/header/Header1";
import Panduan1 from "./Panduan1";
import TampilanSurat from "../../data/TampilanSurat";
import { HistoryManager } from "../../utils/history"; // ✅ IMPORT HISTORY MANAGER

function TampilanSuratWrapper() {
  const { nomor } = useParams();
  return <TampilanSurat nomor={nomor} />;
}

function Index1() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const headerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // ✅ SIMPAN HISTORY SETIAP KALI ROUTE BERUBAH
  useEffect(() => {
    if (location.pathname) {
      HistoryManager.setLastPage('fitur1', location.pathname);
    }
  }, [location.pathname]);

  // ✅ CEK HISTORY SAAT PERTAMA KALI LOAD
  useEffect(() => {
    if (!isInitialized) {
      const lastPage = HistoryManager.getLastPage('fitur1');
      
      // Jika ada history dan bukan halaman panduan, redirect ke halaman terakhir
      if (lastPage && lastPage !== '/app2/app/fitur1' && lastPage !== '/app2/app/fitur1/panduan1') {
        navigate(lastPage);
      }
      
      setIsInitialized(true);
    }
  }, [isInitialized, navigate]);

  // ✅ Fungsi untuk menutup sidebar ketika klik di luar
  const closeSidebar = () => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  // ✅ Effect untuk handle click outside
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