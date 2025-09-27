// pages/fitur1/Index1.jsx
import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";

import Sidebar1 from "../../components/sidebar/Sidebar1";
import Header1 from "../../components/header/Header1";

import Panduan1 from "./Panduan1";
import AlIkhlas1 from "./AlIkhlas1";
import AlFalaq1 from "./AlFalaq1";
import AnNas1 from "./AnNas1";

function Index1() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app-container">
      <Header1 toggleSidebar={toggleSidebar} />
      <Sidebar1 isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="content">
        <Routes>
          <Route index element={<Panduan1 />} /> {/* Ini untuk /fitur1 */}
          <Route path="panduan1" element={<Panduan1 />} /> {/* /fitur1/home1 */}
          <Route path="al-ikhlas" element={<AlIkhlas1 />} />{" "}
          {/* /fitur1/al-ikhlas */}
          <Route path="al-falaq" element={<AlFalaq1 />} />{" "}
          {/* /fitur1/al-falaq */}
          <Route path="an-nas" element={<AnNas1 />} /> {/* /fitur1/an-nas */}
        </Routes>
      </div>
    </div>
  );
}

export default Index1;
