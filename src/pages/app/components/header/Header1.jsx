import React, { useState, useEffect, useRef, forwardRef } from "react";
import { List, Search, X } from "react-bootstrap-icons";
import { useLocation, useNavigate } from "react-router-dom";
import suratConfig from "../../data/SuratConfig";
// HAPUS import supabase - tidak perlu karena kita pakai userStatus dari props

const Header1 = forwardRef(({ toggleSidebar, session, userStatus, onSearchClick }, ref) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [aktifSuratList, setAktifSuratList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef(null);

  // ✅ PERBAIKAN: Deteksi fitur aktif
  const isFitur1 = currentPath.includes('/fitur1');
  const isFitur2 = currentPath.includes('/fitur2');

  // ✅ PERBAIKAN: Dapatkan SEMUA surat yang tersedia (baik untuk user login maupun guest)
  useEffect(() => {
    const allSurat = [];

    // Jika user guest, tampilkan semua surat dari premium8, premium9, premium10
    // Jika user login, tampilkan sesuai userStatus mereka
    const premiumMapping = {
      'premium1': 0,
      'premium2': 1, 
      'premium3': 2,
      'premium4': 3,
      'premium5': 4,
      'premium6': 5,
      'premium7': 6,
      'premium8': 7,
      'premium9': 8,
      'premium10': 9
    };

    Object.keys(suratConfig).forEach((key) => {
      const premiumIndex = premiumMapping[key];
      
      // ✅ PERBAIKAN PENTING: Untuk guest, tampilkan premium8,9,10
      // Untuk user login, tampilkan sesuai userStatus mereka
      const shouldShow = session 
        ? (premiumIndex !== undefined && userStatus && userStatus[premiumIndex] === true)
        : (premiumIndex >= 7 && premiumIndex <= 9); // premium8,9,10 untuk guest
      
      if (shouldShow) {
        const premium = suratConfig[key];
        
        if (premium && Array.isArray(premium.data)) {
          premium.data.forEach((surat) => {
            if (surat) allSurat.push(surat);
          });
        }
      }
    });

    setAktifSuratList(allSurat);
  }, [session, userStatus]); // ✅ DEPENDENCY PADA SESSION DAN USERSTATUS

  // ✅ PERBAIKAN: Cek apakah di halaman surat (ada nomor surat di path)
  const isSuratPage = /\/\d+$/.test(currentPath);
  const suratName = isSuratPage ? aktifSuratList.find((s) =>
    currentPath.endsWith(String(s.nomor)),
  )?.nama : null;

  // Fungsi normalisasi teks untuk pencarian
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

  // Handle pencarian - dari surat yang TERSEDIA (baik guest maupun login)
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (query.length === 0) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    const normalizedQuery = normalizeText(query);
    const results = aktifSuratList.filter(surat => {
      const normalizedLatin = normalizeText(surat.nama_latin || '');
      const normalizedArabic = normalizeText(surat.nama || '');
      
      return normalizedLatin.includes(normalizedQuery) || 
             normalizedArabic.includes(normalizedQuery);
    });

    setSearchResults(results);
    setShowSuggestions(true);
  };

  // ✅ PERBAIKAN: Handle pilih surat dari hasil pencarian
  const handleSelectSurat = (surat) => {
    let basePath;
    if (isFitur2) {
      basePath = "/app2/app/fitur2";
    } else {
      basePath = "/app2/app/fitur1";
    }
    
    navigate(`${basePath}/${surat.nomor}`);
    setSearchQuery("");
    setShowSuggestions(false);
    setIsSearchActive(false);
    
    // Dispatch event untuk menghentikan audio di semua fitur
    window.dispatchEvent(new CustomEvent('stopAllAudio'));
  };

  // ✅ PERBAIKAN: Aktifkan mode search - DITAMBAHKAN onSearchClick
  const activateSearch = () => {
    // Stop semua audio sebelum membuka pencarian
    window.dispatchEvent(new CustomEvent('stopAllAudio'));
    
    // ✅ PANGGIL onSearchClick JIKA ADA
    if (onSearchClick) {
      onSearchClick();
    }
    
    setIsSearchActive(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  // Nonaktifkan mode search
  const deactivateSearch = () => {
    setIsSearchActive(false);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  // Handle klik di luar search box
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        if (searchQuery.length === 0) {
          deactivateSearch();
        } else {
          setShowSuggestions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchQuery]);

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
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      onWheel={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onTouchMove={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onScroll={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Tombol Sidebar */}
      <button 
        ref={ref}
        className="btn btn-outline-light btn-sm" 
        onClick={toggleSidebar}
      >
        <List size={20} />
      </button>

      {/* Kondisional: Judul ATAU Search Input */}
      {!isSearchActive ? (
        // DEFAULT STATE: Judul di tengah + Search Icon di kanan
        <>
          <h5 className="mb-0 text-center" style={{ flex: 1, margin: 0 }}>
            {isSuratPage ? suratName : "تَحْفِيْظ"}
          </h5>
          
          <button
            className="btn btn-outline-light btn-sm"
            onClick={activateSearch}
            style={{ border: "none", padding: "6px" }}
          >
            <Search size={18} />
          </button>
        </>
      ) : (
        // SEARCH ACTIVE STATE: Search Input mengambil alih tengah
        <div 
          ref={searchInputRef}
          style={{ 
            position: "relative", 
            flex: 1,
            margin: "0 1rem"
          }}
        >
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Cari surat..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 12px",
                paddingRight: "30px",
                borderRadius: "4px",
                border: "1px solid #495057",
                backgroundColor: "#343a40",
                color: "#fff",
                fontSize: "14px"
              }}
            />
            
            {/* Tombol Close di dalam input */}
            <button
              onClick={deactivateSearch}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#6c757d",
                cursor: "pointer",
                padding: "2px"
              }}
            >
              <X size={16} />
            </button>

            {/* ✅ PERBAIKAN: Search Suggestions */}
            {showSuggestions && searchResults.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "#343a40",
                  border: "1px solid #495057",
                  borderRadius: "4px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 1300,
                  marginTop: "4px"
                }}
              >
                {searchResults.map((surat) => (
                  <div
                    key={surat.nomor}
                    onClick={() => handleSelectSurat(surat)}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderBottom: "1px solid #495057",
                      fontSize: "14px",
                      color: "#fff"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#495057";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                  >
                    {surat.nomor}. {surat.nama_latin || surat.nama}
                  </div>
                ))}
              </div>
            )}

            {/* ✅ PERBAIKAN: No results message */}
            {showSuggestions && searchQuery.length > 0 && searchResults.length === 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "#343a40",
                  border: "1px solid #495057",
                  borderRadius: "4px",
                  padding: "8px 12px",
                  color: "#6c757d",
                  fontSize: "14px",
                  zIndex: 1300,
                  marginTop: "4px"
                }}
              >
                Surat tidak ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default Header1;