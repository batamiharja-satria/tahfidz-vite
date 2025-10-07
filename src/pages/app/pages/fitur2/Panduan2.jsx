import React, { useState, useEffect, useRef } from "react";

const Panduan2 = () => {
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const contentRef = useRef(null);

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

      <h2 className="text-center mb-4" style={{ marginBottom: "2rem" }}>🎧 Panduan Fitur Istima'</h2>
      
      <div className="mb-4" style={{ marginBottom: "2rem" }}>
        <p className="text-center text-muted">
          Fitur ini membantu Anda menghafal <strong>Al-Qur'an</strong> dengan mendengarkan dibantu berbagai mode pemutaran untuk memudahkan hafalan dan memperbaiki tajwid.
        </p>
      </div>

      <div className="mb-4" style={{ marginBottom: "2.5rem" }}>
        <h5 style={{ marginBottom: "1.2rem" }}>🎯 Cara Menggunakan:</h5>
        <ol style={{ paddingLeft: "1.5rem" }}>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Pilih Surat</strong> - Buka sidebar, pilih surat dari premium yang aktif
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Dengarkan Per Ayat</strong> - Klik tombol 🔊 pada setiap ayat
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Putar Semua</strong> - Klik "🔁 Putar Semua" untuk mendengarkan seluruh surat berurutan
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Range Kustom</strong> - Klik "⚙️ Setelan" untuk atur range ayat dan pengulangan
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Toggle Tampilan</strong> - Klik tombol 👁 untuk beralih antara teks Arab dan terjemahan
          </li>
        </ol>
      </div>

      <div className="mb-4" style={{ marginBottom: "2.5rem" }}>
        <h6 style={{ marginBottom: "1rem" }}>💡 Manfaat & Strategi:</h6>
        <ul style={{ paddingLeft: "1.5rem" }}>
          <li style={{ marginBottom: "0.6rem" }}>
            <strong>Memperbaiki Tajwid</strong> - Dengarkan pelafalan yang benar dari qari profesional
          </li>
          <li style={{ marginBottom: "0.6rem" }}>
            <strong>Memperkuat Hafalan</strong> - Pengulangan audio membantu menguatkan memori
          </li>
          <li style={{ marginBottom: "0.6rem" }}>
            <strong>Memahami Makna</strong> - Baca terjemahan untuk memahami kandungan ayat
          </li>
          <li style={{ marginBottom: "0.6rem" }}>
            <strong>Fokus pada Ayat Sulit</strong> - Gunakan range loop untuk ayat-ayat yang butuh perhatian khusus
          </li>
          <li style={{ marginBottom: "0.6rem" }}>
            <strong>Belajar Dimanapun</strong> - Continuous mode untuk mendengarkan sambil beraktivitas
          </li>
        </ul>
      </div>

      <div className="p-3 bg-light rounded" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <h6 style={{ marginBottom: "1.2rem", textAlign: "center" }}>🔄 Alur Belajar Efektif:</h6>
        <div className="small text-center">
          <div className="d-flex justify-content-between mb-2">
            <div style={{ textAlign: "center", flex: "1" }}>
              <div style={{ fontSize: "1.5rem" }}>👂</div>
              <div>Dengarkan</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: "0 0.5rem" }}>→</div>
            <div style={{ textAlign: "center", flex: "1" }}>
              <div style={{ fontSize: "1.5rem" }}>📖</div>
              <div>Pahami</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: "0 0.5rem" }}>→</div>
            <div style={{ textAlign: "center", flex: "1" }}>
              <div style={{ fontSize: "1.5rem" }}>🔁</div>
              <div>Ulangi</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: "0 0.5rem" }}>→</div>
            <div style={{ textAlign: "center", flex: "1" }}>
              <div style={{ fontSize: "1.5rem" }}>✅</div>
              <div>Kuasi</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Panduan2;