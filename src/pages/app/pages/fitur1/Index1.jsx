import React, { useState } from "react";
import { Routes, Route, useParams } from "react-router-dom";

import Sidebar1 from "../../components/sidebar/Sidebar1";
import Header1 from "../../components/header/Header1";

import Panduan1 from "./Panduan1";
import TampilanSurat from "../../data/TampilanSurat.jsx";

// wrapper supaya kita bisa oper props "nomor" ke TampilanSurat dari useParams()
function TampilanSuratWrapper() {
  const { nomor } = useParams(); // ✅ ambil nomor dari URL
  return <TampilanSurat nomor={nomor} />;
}

function Index1() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app-container">
      <Header1 toggleSidebar={toggleSidebar} />
      <Sidebar1 isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="content" style={{ paddingTop: "56px" }}>
        <Routes>
          <Route index element={<Panduan1 />} /> {/* /fitur1 */}
          <Route path="panduan1" element={<Panduan1 />} /> {/* /fitur1/panduan1 */}
          {/* Route dinamis: /fitur1/78 , /fitur1/114, dll */}
          <Route path=":nomor" element={<TampilanSuratWrapper />} />
        </Routes>
      </div>
    </div>
  );
}

export default Index1;