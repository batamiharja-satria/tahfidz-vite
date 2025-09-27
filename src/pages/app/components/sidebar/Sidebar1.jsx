import React from "react";
import { Link } from "react-router-dom";
import suratList from "../../data/SuratConfig";
import "./Sidebar.css";
import Logout from "../../../../components/Logout";
const Sidebar1 = ({ isOpen, toggleSidebar }) => {
  return (
    <div
      className={`custom-sidebar bg-dark text-white ${isOpen ? "open" : ""}`}
    >
      <ul className="nav flex-column p-3">
        <li className="nav-item">
          <Link className="nav-link text-white">
            <Logout />
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/" className="nav-link text-white" onClick={toggleSidebar}>
            BERANDA
          </Link>
        </li>
        <li className="nav-item">
          <Link
            to="/fitur1/panduan1"
            className="nav-link text-white"
            onClick={toggleSidebar}
          >
            PANDUAN
          </Link>
        </li>
        {suratList.map((surat) => (
          <li className="nav-item" key={surat.id}>
            <Link
              to={`/fitur1/${surat.path}`}
              className="nav-link text-white"
              onClick={toggleSidebar}
            >
              {surat.arab}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar1;
