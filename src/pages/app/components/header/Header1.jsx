import React, { useState, useEffect, useRef, forwardRef } from "react";
import { List, Search, X } from "react-bootstrap-icons";
import { useLocation, useNavigate } from "react-router-dom";
import suratConfig from "../../data/SuratConfig";
import { supabase } from "../../../../services/supabase";

const Header1 = forwardRef(({ toggleSidebar }, ref) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [aktifSuratList, setAktifSuratList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [userStatus, setUserStatus] = useState([]);
  const searchInputRef = useRef(null);

  // ✅ Ambil status user dari Supabase
  const fetchUserStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("status")
        .eq("email", user.email)
        .single();

      if (error) {
        console.error("Gagal ambil status:", error.message);
      } else if (data && data.status) {
        let statusArray = [];
        
        if (Array.isArray(data.status)) {
          statusArray = data.status;
        } else if (typeof data.status === "object") {
          statusArray = Object.values(data.status);
        } else if (typeof data.status === "string") {
          try {
            statusArray = JSON.parse(data.status);
          } catch (err) {
            console.error("Gagal parse JSON:", err);
          }
        }
        
        if (statusArray.length !== 10) {
          statusArray = [false, false, false, false, false, false, false, false, false, true];
        }
        
        setUserStatus(statusArray);
      }
    } catch (err) {
      console.error("Error fetchUserStatus:", err.message);
    }
  };

  // 🔁 Ambil data status user
  useEffect(() => {
    fetchUserStatus();
  }, []);

  // ✅ Dapatkan hanya surat yang aktif (premium status = true)
  useEffect(() => {
    const allAktif = [];

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
      
      if (premiumIndex !== undefined && userStatus[premiumIndex] === true) {
        const premium = suratConfig[key];
        
        if (premium && Array.isArray(premium.data)) {
          premium.data.forEach((surat) => {
            if (surat) allAktif.push(surat);
          });
        }
      }
    });

    setAktifSuratList(allAktif);
  }, [userStatus]);

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

  // Handle pencarian - HANYA dari surat aktif
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

  // Handle pilih surat dari hasil pencarian
  const handleSelectSurat = (surat) => {
    navigate(`/app2/app/fitur1/${surat.nomor}`);
    setSearchQuery("");
    setShowSuggestions(false);
    setIsSearchActive(false);
  };

  // Aktifkan mode search
  const activateSearch = () => {
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
      }}
    >
      {/* Tombol Sidebar - gunakan ref dari parent */}
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

            {/* Search Suggestions - HANYA surat aktif */}
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
                  zIndex: 1200,
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

            {/* No results message */}
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
                  zIndex: 1200,
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