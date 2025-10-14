import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const Panduan3 = () => {
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const contentRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 10;
      
      if (scrollTop > 50 || isAtBottom) {
        setShowScrollIndicator(false);
      }
    };

    const handleTouch = () => {
      setShowScrollIndicator(false);
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      contentElement.addEventListener('touchstart', handleTouch);
    }

    return () => {
      if (contentElement) {
        contentElement.removeEventListener('scroll', handleScroll);
        contentElement.removeEventListener('touchstart', handleTouch);
      }
    };
  }, []);

  return (
    <div 
      ref={contentRef}
      style={{ 
        padding: "25px", 
        maxWidth: "600px", 
        margin: "0 auto", 
        lineHeight: "1.6",
        height: "calc(100vh - 56px)",
        overflowY: "auto",
        position: "relative"
      }}
    >
      {/* INDIKATOR SCROLL - HANYA TAMPIL JIKA showScrollIndicator true */}
      {showScrollIndicator && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#212529',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '50px',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
          animation: 'bounce 2s infinite'
        }}>
          Scroll ↓
        </div>
      )}

      <style>
        {`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
          60% { transform: translateY(-3px); }
        }
        `}
      </style>

      <h2 className="text-center mb-4" style={{ marginBottom: "2rem" }}>📚 Panduan Fitur Ma'na</h2>
      
      <div className="mb-4" style={{ marginBottom: "2rem" }}>
        <p className="text-center text-muted" style={{ textAlign: "justify", textAlignLast: "center" }}>
          Fitur ini memungkinkan Anda <strong>mempelajari makna setiap kata dan keterangan setiap ayat dalam Al-Quran.</strong> 
        </p>
      </div>

      <div className="mb-4" style={{ marginBottom: "2.5rem" }}>
        <h5 style={{ marginBottom: "1.2rem" }}>🎯 Cara Menggunakan:</h5>
        <ol style={{ paddingLeft: "1.5rem" }}>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Pilih Surat</strong> - Buka sidebar, pilih surat dari premium yang aktif
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Ma'nai </strong> - Klik pada kata Arab untuk membuka editor makna:
            <ul className="small mt-2" style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li style={{ marginBottom: "0.4rem" }}><strong>Input Makna</strong> - Ketik arti kata</li>
              <li style={{ marginBottom: "0.4rem" }}><strong>Simpan</strong> - Data tersimpan langsung ke database</li>
              
            </ul>
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Tambah Catatan Ayat</strong> - Klik ikon 📝 di akhir ayat untuk:
            <ul className="small mt-2" style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li style={{ marginBottom: "0.4rem" }}><strong>Keterangan Ma'na</strong> - Tambah penjelasan konteks ayat</li>
              <li style={{ marginBottom: "0.4rem" }}><strong>Catatan Pribadi</strong> - Simpan insight atau renungan</li>
              <li style={{ marginBottom: "0.4rem" }}><strong>Ringkasan Ma'na</strong> - Poin penting dari ayat tersebut</li>
            </ul>
          </li>
        
        </ol>
      </div>

     
     
    </div>
  );
};

export default Panduan3;