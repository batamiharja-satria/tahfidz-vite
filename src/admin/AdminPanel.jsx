// src/admin/AdminPanel.js
import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import "./admin.css";

const AdminPanel = () => {
  // ✅ STATE LOGIN BARU - TAMBAHIN INI DOANG
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // ✅ STATE YANG UDAH ADA - JANGAN DIUBAH
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [updating, setUpdating] = useState(false);

  // ✅ FUNGSI LOGIN BARU - TAMBAHIN INI
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', loginEmail)
        .eq('password', loginPassword)
        .single();

      if (error || !data) {
        setLoginError("Email atau password salah!");
        return;
      }

      setIsLoggedIn(true);
      localStorage.setItem("adminLoggedIn", "true");
      
    } catch (err) {
      setLoginError("Login gagal!");
    } finally {
      setLoginLoading(false);
    }
  };

  // ✅ CEK SUDAH LOGIN - TAMBAHIN INI
  useEffect(() => {
    const loggedIn = localStorage.getItem("adminLoggedIn");
    if (loggedIn === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  // ✅ LOGOUT - TAMBAHIN INI
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("adminLoggedIn");
  };

  // ✅ FUNGSI YANG UDAH ADA - JANGAN DIUBAH
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      
    } catch (err) {
      console.error("Error fetchUsers:", err);
      alert("Gagal memuat data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Initial load - MODIFIKASI SEDIKIT
  useEffect(() => {
    if (isLoggedIn) {
      fetchUsers();
    }
  }, [isLoggedIn]); // Tambah dependency isLoggedIn

  // ✅ FUNGSI-FUNGSI LAIN YANG UDAH ADA - JANGAN DIUBAH
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditUser = (user) => {
    setSelectedUser({...user});
    setShowEditor(true);
    setUpdating(false);
  };

  const handleUpdateStatus = async () => {
    if (!selectedUser) return;
    
    try {
      setUpdating(true);
      
      const { error } = await supabase
        .from("profiles")
        .update({ status: selectedUser.status })
        .eq("id", selectedUser.id);

      if (error) throw error;
      
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id ? { ...user, status: selectedUser.status } : user
      ));
      
      setShowEditor(false);
      setSelectedUser(null);
      alert("✅ Status berhasil diupdate!");
      
    } catch (err) {
      alert("❌ Gagal update: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const getActivePremiumCount = (statusArray) => {
    if (!statusArray || !Array.isArray(statusArray)) return 0;
    return statusArray.slice(0, 9).filter(Boolean).length;
  };

  const getTotalActivePremiums = () => {
    return users.reduce((total, user) => total + getActivePremiumCount(user.status), 0);
  };

  const getPremiumUserCount = () => {
    return users.filter(user => getActivePremiumCount(user.status) > 0).length;
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("id-ID");
    } catch {
      return "Invalid Date";
    }
  };

  const togglePremium = (index) => {
    if (!selectedUser) return;
    
    const newStatus = [...selectedUser.status];
    newStatus[index] = !newStatus[index];
    setSelectedUser({...selectedUser, status: newStatus});
  };

  const handleCloseModal = () => {
    setShowEditor(false);
    setSelectedUser(null);
    setUpdating(false);
  };

  // ✅ RENDER LOGIN JIKA BELUM LOGIN - TAMBAHIN INI
  if (!isLoggedIn) {
    return (
      <div className="admin-container">
        <div className="login-section">
          <div className="login-card">
            <h2>🔐 Admin Login</h2>
            <form onSubmit={handleAdminLogin}>
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="login-input"
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="login-input"
              />
              {loginError && <div className="login-error">{loginError}</div>}
              <button type="submit" disabled={loginLoading} className="login-btn">
                {loginLoading ? "Loading..." : "Login"}
              </button>
            </form>
           
          </div>
        </div>
      </div>
    );
  }

  // ✅ RENDER YANG UDAH ADA - JANGAN DIUBAH, CUMA TAMBAH TOMBOL LOGOUT
  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <h3>Memuat data user...</h3>
          <button className="btn-retry" onClick={fetchUsers}>
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Header - TAMBAHIN TOMBOL LOGOUT */}
      <div className="admin-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>🛠️ Admin</h1>
            <p>Kelola status premium user</p>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Stats Grid - JANGAN DIUBAH */}
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-number">{users.length}</div>
          <div className="stat-label">Total User</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{getTotalActivePremiums()}</div>
          <div className="stat-label">Premium Aktif</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{getPremiumUserCount()}</div>
          <div className="stat-label">User Premium</div>
        </div>
      </div>

      {/* Search Box - JANGAN DIUBAH */}
      <div className="search-container">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Cari user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <button className="btn-refresh" onClick={fetchUsers}>
          🔄
        </button>
      </div>

      {/* Users List - JANGAN DIUBAH */}
      <div className="users-section">
        <div className="section-title">
          Daftar User <span className="count-badge">{filteredUsers.length}</span>
        </div>
        
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>Tidak ada user ditemukan</p>
          </div>
        ) : (
          <div className="users-list">
            {filteredUsers.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-header">
                  <div className="user-email">{user.email}</div>
                  <div className={`premium-badge ${getActivePremiumCount(user.status) > 0 ? 'active' : 'inactive'}`}>
                    {getActivePremiumCount(user.status)}/9
                  </div>
                </div>
                
                <div className="user-details">
                  <div className="detail-item">
                    <span className="label">Daftar:</span>
                    <span className="value">{formatDate(user.created_at)}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <div className="premium-tags">
                      {user.status && user.status.slice(0, 3).map((isActive, idx) => (
                        <span
                          key={idx}
                          className={`premium-tag ${isActive ? 'active' : ''}`}
                        >
                          P{idx + 1}
                        </span>
                      ))}
                      {user.status && user.status.length > 3 && (
                        <span className="premium-more">
                          +{user.status.slice(3, 9).filter(Boolean).length} lagi
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleEditUser(user)}
                  className="btn-edit"
                >
                  ✏️ Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Editor - JANGAN DIUBAH */}
      {showEditor && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Edit Premium</h3>
              <button className="btn-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="user-info">
                <strong>{selectedUser.email}</strong>
                <div className="premium-summary">
                  {getActivePremiumCount(selectedUser.status)} premium aktif · 
                  Rp {(getActivePremiumCount(selectedUser.status) * 15000).toLocaleString()}
                </div>
              </div>
              
              <div className="premium-grid">
                {selectedUser.status && selectedUser.status.slice(0, 9).map((isActive, index) => (
                  <div
                    key={index}
                    className={`premium-item ${isActive ? 'active' : ''}`}
                    onClick={() => togglePremium(index)}
                  >
                    <div className="premium-checkbox">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => {}}
                      />
                    </div>
                    <div className="premium-info">
                      <div className="premium-name">Premium {index + 1}</div>
                      <div className="premium-price">Rp 15.000</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={handleCloseModal}
                className="btn-cancel"
                disabled={updating}
              >
                Batal
              </button>
              <button
                onClick={handleUpdateStatus}
                className="btn-save"
                disabled={updating}
              >
                {updating ? "Menyimpan..." : "💾 Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;