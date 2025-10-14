import React, { useState, useRef, useEffect } from "react";
import { Routes, Route, useParams, useLocation, useNavigate } from "react-router-dom";
import Sidebar1 from "../../components/sidebar/Sidebar1";
import Header1 from "../../components/header/Header1";
import Panduan3 from "./Panduan3";
import TampilanSuratMakna from "../../data/TampilanSuratMakna";
import { UserStorage } from "../../utils/userStorage";

// ✅ PERBAIKAN: Wrapper dengan props yang benar
function TampilanSuratMaknaWrapper({ session, userStatus }) {
  const { id } = useParams();
  return <TampilanSuratMakna nomor={id} session={session} userStatus={userStatus} />;
}

function Index3({ session, userStatus }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const sidebarRef = useRef(null);
  const headerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ PERBAIKAN: Debug untuk memastikan props diterima
  useEffect(() => {
    console.log("Index3 Props:", { 
      hasSession: !!session, 
      userStatusLength: userStatus?.length,
      userStatus: userStatus 
    });
  }, [session, userStatus]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleSearchClick = () => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  // ✅ PERBAIKAN: INISIALISASI DATA UNTUK FITUR3
  useEffect(() => {
    if (userStatus && userStatus.length > 0 && !isInitialized) {
      UserStorage.initializeDefaultData(session);
      
      const lastPage = UserStorage.getHistory(session, 'fitur3');
      
      if (lastPage && lastPage !== '/app2/app/fitur3' && lastPage !== '/app2/app/fitur3/') {
        navigate(lastPage, { replace: true });
      } else {
        navigate('/app2/app/fitur3/panduan3', { replace: true });
      }
      
      setIsInitialized(true);
    }
  }, [isInitialized, navigate, session, userStatus]);

  // ✅ SIMPAN HISTORY UNTUK FITUR3
  useEffect(() => {
    if (userStatus && userStatus.length > 0 && location.pathname && 
        location.pathname !== '/app2/app/fitur3' && 
        location.pathname !== '/app2/app/fitur3/') {
      UserStorage.setHistory(session, 'fitur3', location.pathname);
    }
  }, [location.pathname, session, userStatus]);

  // ✅ FUNGSI UNTUK MENUTUP SIDEBAR KETIKA KLIK DI LUAR
  const closeSidebar = () => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  // ✅ EFFECT UNTUK HANDLE CLICK OUTSIDE
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

  // ✅ PERBAIKAN: TAMPILKAN LOADING JIKA USERSTATUS BELUM SIAP
  if (!userStatus || userStatus.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <h3>Mempersiapkan fitur Ma'na...</h3>
          <p>Status: {userStatus ? `Loaded ${userStatus.length} items` : 'Not loaded'}</p>
          <p>Session: {session ? 'Available' : 'Not available'}</p>
        </div>
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
          onSearchClick={handleSearchClick}
        />
      </div>
      
      <div ref={sidebarRef}>
        <Sidebar1 
          isOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar} 
          session={session} 
          userStatus={userStatus}
        />
      </div>
      
      <div className="content" style={{ paddingTop: "56px" }}>
        <Routes>
          <Route index element={<Panduan3 />} />
          <Route path="panduan3" element={<Panduan3 />} />
          <Route 
            path=":id" 
            element={<TampilanSuratMaknaWrapper session={session} userStatus={userStatus} />} 
          />
        </Routes>
      </div>
    </div>
  );
}

export default Index3;