import React, { useState } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
// Jika perlu import supabase di sini
import { supabase } from "../../../../services/supabase";
const StatusEditor = ({ show, user, onHide, onUpdate }) => {
  const [status, setStatus] = useState(user.status);
  const [updating, setUpdating] = useState(false);

  // ✏️ Toggle status premium
  const togglePremium = (index) => {
    const newStatus = [...status];
    newStatus[index] = !newStatus[index];
    setStatus(newStatus);
  };

  // 💾 Simpan perubahan
  const handleSave = async () => {
    setUpdating(true);
    try {
      await onUpdate(user.id, status);
    } finally {
      setUpdating(false);
    }
  };

  // 🎯 Hitung total premium aktif
  const activeCount = status.slice(0, 9).filter(Boolean).length;
  const totalPrice = activeCount * 15000;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Status Premium</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="user-info mb-4">
          <h6>User: <strong>{user.email}</strong></h6>
          <p className="text-muted mb-0">
            {activeCount} premium aktif · Total: Rp {totalPrice.toLocaleString()}
          </p>
        </div>

        <Row>
          {status.slice(0, 9).map((isActive, index) => (
            <Col key={index} xs={6} md={4} className="mb-3">
              <div className={`premium-option ${isActive ? "active" : ""}`}>
                <Form.Check
                  type="checkbox"
                  id={`premium-${user.id}-${index}`}
                  label={`Premium ${index + 1}`}
                  checked={isActive}
                  onChange={() => togglePremium(index)}
                  className="premium-checkbox"
                />
                <span className="price-tag">Rp 15.000</span>
              </div>
            </Col>
          ))}
        </Row>

        <div className="premium-summary mt-4 p-3 bg-light rounded">
          <h6>Ringkasan:</h6>
          <p>
            {activeCount} premium terpilih · 
            <strong> Total: Rp {totalPrice.toLocaleString()}</strong>
          </p>
        </div>

        <Alert variant="info" className="mt-3">
          <small>
            💡 <strong>Catatan:</strong> Premium 10 selalu aktif (gratis) untuk semua user
          </small>
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Batal
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave}
          disabled={updating}
        >
          {updating ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default StatusEditor;