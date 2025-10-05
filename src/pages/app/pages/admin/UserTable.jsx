import React from "react";
import { Table, Button, Badge } from "react-bootstrap";
import { Pencil } from "react-bootstrap-icons";
// Jika perlu import supabase di sini
import { supabase } from "../../../../services/supabase";
const UserTable = ({ users, onEditUser }) => {
  // 🎯 Hitung jumlah premium aktif per user
  const getActivePremiumCount = (statusArray) => {
    return statusArray.slice(0, 9).filter(Boolean).length;
  };

  // 🎯 Format tanggal
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID");
  };

  return (
    <div className="user-table-container">
      <Table responsive striped bordered hover className="user-table">
        <thead className="table-dark">
          <tr>
            <th>Email</th>
            <th>Premium Aktif</th>
            <th>Tanggal Daftar</th>
            <th>Status Detail</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center text-muted py-4">
                Tidak ada user ditemukan
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td className="email-cell">
                  <strong>{user.email}</strong>
                </td>
                <td>
                  <Badge bg="success">
                    {getActivePremiumCount(user.status)}/9
                  </Badge>
                </td>
                <td>{formatDate(user.created_at)}</td>
                <td>
                  <div className="premium-indicators">
                    {user.status.slice(0, 9).map((isActive, index) => (
                      <span
                        key={index}
                        className={`premium-dot ${isActive ? "active" : "inactive"}`}
                        title={`Premium ${index + 1}: ${isActive ? "Aktif" : "Non-aktif"}`}
                      >
                        {index + 1}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => onEditUser(user)}
                  >
                    <Pencil /> Edit
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default UserTable;