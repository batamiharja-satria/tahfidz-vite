import React, { useState, useEffect, useRef } from "react";

const Panduan1 = () => {
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

      <h2 className="text-center mb-4" style={{ marginBottom: "2rem" }}>📖 Panduan Fitur Tahfidz</h2>
      
      {/* KONTEN ASLI TETAP SAMA */}
      <div className="mb-4" style={{ marginBottom: "2rem" }}>
        <p className="text-center text-muted" style={{ textAlign: "justify", textAlignLast: "center" }}>
          Fitur ini membantu Anda <strong>menguji hafalan secara mandiri</strong> dengan sistem level bantuan yang dapat disesuaikan.
        </p>
      </div>

      <div className="mb-4" style={{ marginBottom: "2.5rem" }}>
        <h5 style={{ marginBottom: "1.2rem" }}>🎯 Cara Menggunakan:</h5>
        <ol style={{ paddingLeft: "1.5rem" }}>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Pilih Surat</strong> - Buka sidebar, pilih surat dari premium yang aktif
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Atur Level Bantuan</strong> - Tekan tombol "Tambah" untuk menyesuaikan jumlah kata panduan:
            <ul className="small mt-2" style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li style={{ marginBottom: "0.4rem" }}><strong>Level 0:</strong> Tes hafalan tanpa bantuan</li>
              <li style={{ marginBottom: "0.4rem" }}><strong>Level 1:</strong> 1 kata panduan</li>
              <li style={{ marginBottom: "0.4rem" }}><strong>Level 2:</strong> 2 kata panduan</li>
              <li style={{ marginBottom: "0.4rem" }}><strong>Level 3:</strong> 3 kata panduan (bantuan maksimal)</li>
            </ul>
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Gunakan Mode Bantuan ketika Lupa:</strong>
            <ul className="small mt-2" style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li style={{ marginBottom: "0.4rem" }}><strong>🔊 Audio</strong> - Untuk mendengar pelafalan yang benar</li>
              <li style={{ marginBottom: "0.4rem" }}><strong>👁 Lihat Ayat Lengkap</strong> - Untuk membaca teks Arab seutuhnya</li>
            </ul>
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Tandai Hafalan</strong> - Centang ✅ hanya ketika sudah hafal sempurna di level 0
          </li>
        </ol>
      </div>

      <div className="mb-4" style={{ marginBottom: "2.5rem" }}>
        <h6 style={{ marginBottom: "1rem" }}>💡 Strategi Setor Hafalan:</h6>
        <ul style={{ paddingLeft: "1.5rem" }}>
          <li style={{ marginBottom: "0.6rem", textAlign: "justify" }}>
            Mulai tes di <strong>level 0</strong> untuk menguji hafalan tanpa bantuan
          </li>
          <li style={{ marginBottom: "0.6rem", textAlign: "justify" }}>
            Jika lupa, naikkan level bantuan atau gunakan <strong>audio/teks lengkap</strong>
          </li>
          <li style={{ marginBottom: "0.6rem", textAlign: "justify" }}>
            Turunkan level bantuan secara bertahap hingga bisa di <strong>level 0</strong>
          </li>
          <li style={{ marginBottom: "0.6rem", textAlign: "justify" }}>
            Gunakan <strong>audio untuk memperbaiki tajwid</strong> dan pelafalan
          </li>
          <li style={{ marginBottom: "0.6rem", textAlign: "justify" }}>
            Gunakan <strong>lihat ayat lengkap untuk mengingat urutan</strong> yang terlupa
          </li>
        </ul>
      </div>

      <div className="p-3 bg-light rounded" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <h6 style={{ marginBottom: "1.2rem", textAlign: "center" }}>🔄 Alur Setor Hafalan Mandiri:</h6>
        <div className="small">
          <div className="d-flex justify-content-between mb-3" style={{ marginBottom: "1.2rem" }}>
            <div style={{ textAlign: "center", flex: "1" }}>
              <div style={{ fontSize: "1.5rem" }}>🧪</div>
              <div>Mulai Tes</div>
              <small>(Level 0)</small>
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: "0 0.5rem" }}>→</div>
            <div style={{ textAlign: "center", flex: "1" }}>
              <div style={{ fontSize: "1.5rem" }}>🆘</div>
              <div>Jika Lupa</div>
              <small>Audio/Teks</small>
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: "0 0.5rem" }}>→</div>
            <div style={{ textAlign: "center", flex: "1" }}>
              <div style={{ fontSize: "1.5rem" }}>📚</div>
              <div>Latihan</div>
              <small>(Level 3→0)</small>
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: "0 0.5rem" }}>→</div>
            <div style={{ textAlign: "center", flex: "1" }}>
              <div style={{ fontSize: "1.5rem" }}>✅</div>
              <div>Lulus Tes</div>
              <small>(Level 0)</small>
            </div>
          </div>
          <p className="text-center mb-0" style={{ textAlign: "justify", textAlignLast: "center" }}>
            <em>Dua mode bantuan: 🔊 Audio untuk pelafalan, 👁 Teks lengkap untuk pengingat</em>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Panduan1;