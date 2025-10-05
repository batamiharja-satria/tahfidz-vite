import React from "react";

const Panduan2 = () => {
  return (
    <div style={{ padding: "25px", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
      <h2 className="text-center mb-4" style={{ marginBottom: "2rem" }}>🎧 Panduan Istima' (Mendengarkan)</h2>
      
      <div className="mb-4" style={{ marginBottom: "2rem" }}>
        <p className="text-center text-muted" style={{ textAlign: "justify", textAlignLast: "center" }}>
          Fitur ini membantu Anda <strong>mendengarkan Al-Qur'an</strong> dengan berbagai mode pemutaran untuk memudahkan hafalan.
        </p>
      </div>

      <div className="mb-4" style={{ marginBottom: "2.5rem" }}>
        <h5 style={{ marginBottom: "1.2rem" }}>🎯 Cara Menggunakan:</h5>
        <ol style={{ paddingLeft: "1.5rem" }}>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Pilih Surat</strong> - Buka sidebar, pilih surat dari premium yang aktif
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Dengarkan Per Ayat</strong> - Klik tombol play pada setiap ayat
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Mode Berurutan</strong> - Putar semua ayat secara otomatis berurutan
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Atur Range</strong> - Pilih range ayat tertentu untuk didengarkan berulang
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong>Baca Terjemahan</strong> - Terjemahan langsung tampil di bawah teks Arab
          </li>
        </ol>
      </div>

      <div className="mb-4" style={{ marginBottom: "2.5rem" }}>
        <h6 style={{ marginBottom: "1rem" }}>💡 Tips Mendengarkan:</h6>
        <ul style={{ paddingLeft: "1.5rem" }}>
          <li style={{ marginBottom: "0.6rem", textAlign: "justify" }}>
            Gunakan <strong>mode berurutan</strong> untuk mendengarkan seluruh surat
          </li>
          <li style={{ marginBottom: "0.6rem", textAlign: "justify" }}>
            Gunakan <strong>range loop</strong> untuk fokus menghafal ayat tertentu
          </li>
          <li style={{ marginBottom: "0.6rem", textAlign: "justify" }}>
            Manfaatkan <strong>terjemahan</strong> untuk memahami makna ayat
          </li>
          <li style={{ marginBottom: "0.6rem", textAlign: "justify" }}>
            Dengarkan <strong>berulang kali</strong> hingga hafal pelafalan dan tajwid
          </li>
        </ul>
      </div>

      <div className="p-3 bg-light rounded" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <h6 style={{ marginBottom: "1.2rem", textAlign: "center" }}>🔄 Mode Pemutaran:</h6>
        <div className="small text-center">
          <div className="d-flex justify-content-between mb-2">
            <div style={{ textAlign: "center", flex: "1" }}>
              <div style={{ fontSize: "1.5rem" }}>⏯️</div>
              <div>Single Ayat</div>
              <small>Putar per ayat</small>
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: "0 0.5rem" }}>→</div>
            <div style={{ textAlign: "center", flex: "1" }}>
              <div style={{ fontSize: "1.5rem" }}>🔁</div>
              <div>Sequential</div>
              <small>Berurutan</small>
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: "0 0.5rem" }}>→</div>
            <div style={{ textAlign: "center", flex: "1" }}>
              <div style={{ fontSize: "1.5rem" }}>🔂</div>
              <div>Range Loop</div>
              <small>Pengulangan</small>
            </div>
          </div>
          <p className="mb-0" style={{ textAlign: "justify", textAlignLast: "center" }}>
            <em>Dengarkan, pahami, dan hafalkan dengan bantuan audio dan terjemahan</em>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Panduan2;