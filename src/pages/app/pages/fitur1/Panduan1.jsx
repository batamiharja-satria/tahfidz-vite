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
          Fitur ini memungkinkan Anda <strong>mempelajari makna setiap kata dalam Al-Quran</strong> dengan sistem input personal yang tersimpan otomatis.
        </p>
      </div>

      <div className="mb-4" style={{ marginBottom: "2.5rem" }}>
        <h5 style={{ marginBottom: "1.2rem" }}>🎯 Cara Menggunakan:</h5>
        <ol style={{ paddingLeft: "1.5rem" }}>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Pilih Surat</strong> - Buka sidebar, pilih surat dari premium yang aktif
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Pelajari Kata Per Kata</strong> - Klik pada kata Arab untuk membuka editor makna:
            <ul className="small mt-2" style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li style={{ marginBottom: "0.4rem" }}><strong>Input Makna</strong> - Ketik arti kata dalam bahasa Indonesia</li>
              <li style={{ marginBottom: "0.4rem" }}><strong>Simpan Otomatis</strong> - Data tersimpan langsung ke database</li>
              <li style={{ marginBottom: "0.4rem" }}><strong>Edit Kapan Saja</strong> - Klik kembali untuk mengubah makna</li>
            </ul>
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Tambah Catatan Ayat</strong> - Klik ikon 📝 di akhir ayat untuk:
            <ul className="small mt-2" style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li style={{ marginBottom: "0.4rem" }}><strong>Keterangan Tafsir</strong> - Tambah penjelasan konteks ayat</li>
              <li style={{ marginBottom: "0.4rem" }}><strong>Catatan Pribadi</strong> - Simpan insight atau renungan</li>
              <li style={{ marginBottom: "0.4rem" }}><strong>Ringkasan Makna</strong> - Poin penting dari ayat tersebut</li>
            </ul>
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Review Pembelajaran</strong> - Kembali ke surat yang sama untuk melihat catatan yang sudah dibuat
          </li>
        </ol>
      </div>

      <div className="mb-4" style={{ marginBottom: "2.5rem" }}>
        <h6 style={{ marginBottom: "1rem" }}>💡 Tips Belajar Efektif:</h6>
        <ul style={{ paddingLeft: "1.5rem" }}>
          <li style={{ marginBottom: "0.6rem", textAlign: "justify" }}>
            Mulai dengan <strong>surat pendek</strong> seperti Al-Fatihah dan Juz 30
          </li>
          <li style={{ marginBottom: "0.6rem", textAlign: "justify" }}>
            Fokus pada <strong>kata-kata yang sering muncul</strong> dalam Al-Quran
          </li>
          <li style={{ marginBottom: "0.6rem", textAlign: "justify" }}>
            Gunakan <strong>catatan ayat untuk ringkasan tafsir</strong> yang mudah diingat
          </li>
          <li style={{ marginBottom: "0.6rem", textAlign: "justify" }}>
            Review secara <strong>berkala untuk memperkuat hafalan makna</strong>
          </li>
          <li style={{ marginBottom: "0.6rem", textAlign: "justify" }}>
            Kombinasikan dengan <strong>fitur Tahfidz untuk hafalan teks</strong> Arabnya
          </li>
        </ul>
      </div>

      <div className="p-3 bg-light rounded" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <h6 style={{ marginBottom: "1.2rem", textAlign: "center" }}>🔄 Alur Belajar Ma'na:</h6>
        <div className="small">
          <div className="d-flex justify-content-between mb-3" style={{ marginBottom: "1.2rem" }}>
            <div style={{ textAlign: "center", flex: "1" }}>
              <div style={{ fontSize: "1.5rem" }}>📖</div>
              <div>Baca Ayat</div>
              <small>Per kata</small>
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: "0 0.5rem" }}>→</div>
            <div style={{ textAlign: "center", flex: "1" }}>
              <div style={{ fontSize: "1.5rem" }}>🖱️</div>
              <div>Klik Kata</div>
              <small>Input makna</small>
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: "0 0.5rem" }}>→</div>
            <div style={{ textAlign: "center", flex: "1" }}>
              <div style={{ fontSize: "1.5rem" }}>📝</div>
              <div>Catatan Ayat</div>
              <small>Keterangan</small>
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: "0 0.5rem" }}>→</div>
            <div style={{ textAlign: "center", flex: "1" }}>
              <div style={{ fontSize: "1.5rem" }}>💾</div>
              <div>Simpan</div>
              <small>Otomatis</small>
            </div>
          </div>
          <p className="text-center mb-0" style={{ textAlign: "justify", textAlignLast: "center" }}>
            <em>Dua jenis input: 🖱️ Makna per kata, 📝 Catatan per ayat</em>
          </p>
        </div>
      </div>

      <div className="text-center mt-4">
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/fitur3')}
          style={{
            padding: "10px 30px",
            fontSize: "16px",
            fontWeight: "bold"
          }}
        >
          Mulai Belajar Ma'na
        </button>
      </div>
    </div>
  );
};

export default Panduan3;