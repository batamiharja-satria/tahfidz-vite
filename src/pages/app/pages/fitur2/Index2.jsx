import React, { useState, useRef, useEffect } from "react";
import { Routes, Route, useParams, useLocation, useNavigate } from "react-router-dom";
import Sidebar1 from "../../components/sidebar/Sidebar1";
import Header1 from "../../components/header/Header1";
import Panduan2 from "./Panduan2";
import TampilanSuratIstima from "../../data/TampilanSuratIstima";
import { HistoryManager } from "../../utils/history"; // ✅ IMPORT HISTORY MANAGER

function TampilanSuratIstimaWrapper() {
  const { nomor } = useParams();
  return <TampilanSuratIstima nomor={nomor} />;
}

function Index2() {
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
      HistoryManager.setLastPage('fitur2', location.pathname);
    }
  }, [location.pathname]);

  // ✅ CEK HISTORY SAAT PERTAMA KALI LOAD
  useEffect(() => {
    if (!isInitialized) {
      const lastPage = HistoryManager.getLastPage('fitur2');
      
      // Jika ada history dan bukan halaman panduan, redirect ke halaman terakhir
      if (lastPage && lastPage !== '/app2/app/fitur2' && lastPage !== '/app2/app/fitur2/panduan2') {
        navigate(lastPage);
      }
      
      setIsInitialized(true);
    }
  }, [isInitialized, navigate]);

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