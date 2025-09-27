import React from "react";
import { List } from "react-bootstrap-icons";
import { useLocation } from "react-router-dom";
import suratList from "../../data/SuratConfig"; // SESUAI default export kamu

import "./Header.css";

const Header1 = ({ toggleSidebar }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const suratName = suratList.find((s) => currentPath.endsWith(s.path))?.arab;

  return (
    <div className="app-header bg-dark text-white d-flex justify-content-between align-items-center px-3 py-2">
      <button className="btn btn-outline-light btn-sm" onClick={toggleSidebar}>
        <List size={20} />
      </button>
      <h5 className="mb-0 ms-auto text-end">
        {currentPath === "/" || currentPath === "/fitur1/home1"
          ? "تَحْفِيْظ"
          : suratName}
      </h5>
    </div>
  );
};

export default Header1;
