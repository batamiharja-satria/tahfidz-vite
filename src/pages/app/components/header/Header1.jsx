import React, { useState, useEffect, useRef } from "react";
import { List, Search, X } from "react-bootstrap-icons";
import { useLocation, useNavigate } from "react-router-dom";
import suratConfig from "../../data/SuratConfig";

const Header1 = ({ toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [suratList, setSuratList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef(null);

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

  // Fungsi normalisasi teks untuk pencarian
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

  // Handle pencarian
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (query.length === 0) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    const normalizedQuery = normalizeText(query);
    const results = suratList.filter(surat => {
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
      {/* Tombol Sidebar - selalu ada */}
      <button className="btn btn-outline-light btn-sm" onClick={toggleSidebar}>
        <List size={20} />
      </button>

      {/* Kondisional: Judul ATAU Search Input */}
      {!isSearchActive ? (
        // DEFAULT STATE: Judul di tengah + Search Icon di kanan
        <>
          <h5 className="mb-0 text-center" style={{ flex: 1, margin: 0 }}>
            {currentPath === "/" || currentPath === "/fitur1/home1"
              ? "تَحْفِيْظ"
              : suratName}
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

            {/* Search Suggestions */}
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
};

export default Header1;