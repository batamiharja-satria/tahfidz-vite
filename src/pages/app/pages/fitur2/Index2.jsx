import React, { useState, useRef, useEffect } from "react";
import { Routes, Route, useParams, useLocation, useNavigate } from "react-router-dom";
import Sidebar1 from "../../components/sidebar/Sidebar1";
import Header1 from "../../components/header/Header1";
import Panduan2 from "./Panduan2";
import TampilanSuratIstima from "../../data/TampilanSuratIstima";
import { UserStorage } from "../../utils/userStorage";

function TampilanSuratIstimaWrapper({ session, userStatus }) {
  const { nomor } = useParams();
  return <TampilanSuratIstima nomor={nomor} session={session} userStatus={userStatus} />;
}

function Index2({ session, userStatus }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const sidebarRef = useRef(null);
  const headerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // ✅ PERBAIKAN: Pastikan userStatus tersedia sebelum inisialisasi
  useEffect(() => {
    if (userStatus && userStatus.length > 0 && !isInitialized) {
      UserStorage.initializeDefaultData(session);
      
      const lastPage = UserStorage.getHistory(session, 'fitur2');
      
      if (lastPage && lastPage !== '/app2/app/fitur2' && lastPage !== '/app2/app/fitur2/') {
        navigate(lastPage, { replace: true });
      } else {
        navigate('/app2/app/fitur2/panduan2', { replace: true });
      }
      
      setIsInitialized(true);
    }
  }, [isInitialized, navigate, session, userStatus]);

  // ✅ PERBAIKAN: SIMPAN HISTORY dengan kondisi yang lebih safe
  useEffect(() => {
    if (userStatus && userStatus.length > 0 && location.pathname && 
        location.pathname !== '/app2/app/fitur2' && 
        location.pathname !== '/app2/app/fitur2/') {
      UserStorage.setHistory(session, 'fitur2', location.pathname);
    }
  }, [location.pathname, session, userStatus]);

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

  // ✅ TAMPILKAN LOADING JIKA USERSTATUS BELUM SIAP
  if (!userStatus || userStatus.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center vw-100  vh-100">
        <p>Mempersiapkan fitur Istima'...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div ref={headerRef}>
        <Header1 
          toggleSidebar={toggleSidebar} 
          session={session} 
          userStatus={userStatus} 
        />
      </div>
      
      <div ref={sidebarRef}>
        <Sidebar1 
          isOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar} 
          basePath="/app2/app/fitur2" 
          session={session} 
          userStatus={userStatus}
        />
      </div>
      
      <div className="content" style={{ paddingTop: "50px" }}>
        <Routes>
          <Route index element={<Panduan2 />} />
          <Route path="panduan2" element={<Panduan2 />} />
          <Route 
            path=":nomor" 
            element={<TampilanSuratIstimaWrapper session={session} userStatus={userStatus} />} 
          />
        </Routes>
      </div>
    </div>
  );
}

export default Index2;