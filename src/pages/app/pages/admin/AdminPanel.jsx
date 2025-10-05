import React, { useEffect, useState } from "react";
import { supabase } from "../../../../services/supabase";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fungsi sederhana untuk fetch data
  const fetchUsers = async () => {
    try {
      alert("🔄 Mulai fetch data...");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, status, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        alert("❌ Error: " + error.message);
        return;
      }

      alert(`✅ Ditemukan ${data?.length || 0} user`);
      
      // ✅ DEBUG: Tampilkan detail setiap user
      if (data && data.length > 0) {
        data.forEach((user, index) => {
          alert(`User ${index + 1}: ${user.email} - Status: ${JSON.stringify(user.status)}`);
        });
      }
      
      setUsers(data || []);
      
    } catch (err) {
      alert("❌ Catch error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Load data pertama kali
  useEffect(() => {
    fetchUsers();
  }, []);

  // 🎯 Tampilan sangat sederhana
  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1>🛠️ Admin Panel</h1>
        <p>Loading data user...</p>
        <button onClick={fetchUsers}>Coba Lagi</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>🛠️ Admin Panel</h1>
      <p>Total User: {users.length}</p>
      
      <button onClick={fetchUsers} style={{ marginBottom: "20px" }}>
        Refresh Data
      </button>

      {users.length === 0 ? (
        <p>Tidak ada data user</p>
      ) : (
        <div>
          {/* ✅ DEBUG: Tampilkan jumlah user yang akan di-render */}
          <p style={{ background: "yellow", padding: "10px" }}>
            Debug: Akan render {users.length} user
          </p>
          
          {users.map((user, index) => (
            <div 
              key={user.id} 
              style={{ 
                border: "1px solid #ccc", 
                padding: "10px", 
                marginBottom: "10px",
                borderRadius: "5px",
                backgroundColor: index % 2 === 0 ? "#f9f9f9" : "white" // Warna bergantian
              }}
            >
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Status:</strong> {JSON.stringify(user.status)}</p>
              <p><strong>Daftar:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
              <p><strong>ID:</strong> {user.id}</p>
              <button 
                onClick={() => alert(`Edit user: ${user.email}`)}
                style={{ marginTop: "5px" }}
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;