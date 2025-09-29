import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Logout from "../../../../components/Logout";
import suratConfig from "../../data/SuratConfig"; // ✅ pakai data lokal

const Sidebar1 = ({ isOpen, toggleSidebar }) => {
  const [suratList, setSuratList] = useState([]);
  const [maxWidth, setMaxWidth] = useState("250px");

  useEffect(() => {
    // Filter hanya yang status = true
    const activeList = suratConfig.filter((s) => s.status === true);
    setSuratList(activeList);

    // Hitung panjang teks terpanjang (nama latin)
    if (activeList.length > 0) {
      const maxLen = Math.max(...activeList.map((s) => s.nama_latin.length), 6);
      setMaxWidth(`${maxLen * 20}px`);
    }
  }, []);

  const styles = {
    sidebar: {
      width: maxWidth,
      height: "calc(100vh - 56px)",
      overflowY: "auto",
      position: "fixed",
      top: "56px",
      left: 0,
      zIndex: 1000,
      backgroundColor: "#212529",
      color: "#fff",
      transition: "transform 0.3s ease-in-out",
    },
    navLink: {
      padding: "6px 6px",
      borderRadius: "6px",
      display: "block",
      color: "#fff",
      textDecoration: "none",
    },
  };

  return (
    <div
      style={{
        ...styles.sidebar,
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
      }}
    >
      <ul className="nav flex-column p-3">
        <li className="nav-item">
          <Link className="nav-link text-white" style={styles.navLink}>
            <Logout />
          </Link>
        </li>
        <li className="nav-item">
          <Link
            to="/app2"
            className="nav-link"
            style={styles.navLink}
            onClick={toggleSidebar}
          >
            BERANDA
          </Link>
        </li>
        <li className="nav-item">
          <Link
            to="/app2/app/fitur1"
            className="nav-link"
            style={styles.navLink}
            onClick={toggleSidebar}
          >
            PANDUAN
          </Link>
        </li>
        {suratList.map((surat) => (
          <li className="nav-item" key={surat.nomor}>
            <Link
              to={`/app2/app/fitur1/${surat.nomor}`} // ✅ nomor dipasang di URL
              className="nav-link"
              style={styles.navLink}
              onClick={toggleSidebar}
            >
              {surat.nama_latin}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar1;