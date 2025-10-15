import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Badge } from 'react-bootstrap';
import { cacheService } from '../utils/cacheService';

const ModalCatatan = ({ 
  show, 
  onHide, 
  ayatData, 
  onSave
}) => {
  const [inputText, setInputText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset state ketika modal dibuka dengan data baru
  useEffect(() => {
    if (show && ayatData) {
      console.log('ModalCatatan dibuka untuk:', ayatData);
      setError('');
      
      // Load from cache - INSTANT
      const cachedData = cacheService.getCatatan(
        ayatData.userId,
        ayatData.surahNumber, 
        ayatData.ayatNumber
      );
      
      console.log('Data catatan dari cache:', cachedData);
      
      if (cachedData) {
        setInputText(cachedData.keterangan || '');
        setSavedData(cachedData);
        setIsEditing(false);
      } else {
        setInputText('');
        setSavedData(null);
        setIsEditing(true);
      }
    }
  }, [show, ayatData]);

  const handleSave = async () => {
    if (!inputText.trim()) {
      setError('Catatan tidak boleh kosong');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const dataToSave = {
        user_id: ayatData.userId,
        surah: ayatData.surahNumber,
        ayat: ayatData.ayatNumber,
        kata_index: -1,
        kata_text: '',
        makna: '',
        keterangan: inputText.trim(),
        timestamp: new Date().toISOString()
      };

      console.log('Saving catatan to cache:', dataToSave);

      // Simpan ke cache - INSTANT
      const savedCacheData = cacheService.setCatatan(
        ayatData.userId,
        ayatData.surahNumber,
        ayatData.ayatNumber,
        dataToSave
      );

      setSavedData(savedCacheData);
      setIsEditing(false);
      
      // Panggil callback ke parent untuk update tampilan
      if (onSave) {
        onSave(savedCacheData);
      }
      
    } catch (error) {
      console.error('Error saving catatan:', error);
      setError(`Gagal menyimpan catatan: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
  };

  const handleDelete = async () => {
    if (!window.confirm('Hapus catatan untuk ayat ini?')) return;

    setIsLoading(true);
    setError('');
    
    try {
      // Hapus dari cache - INSTANT
      cacheService.deleteCatatan(
        ayatData.userId,
        ayatData.surahNumber,
        ayatData.ayatNumber
      );
      
      setInputText('');
      setSavedData(null);
      setIsEditing(true);
      
      if (onSave) {
        onSave(null);
      }
      
    } catch (error) {
      console.error('Error deleting catatan:', error);
      setError(`Gagal menghapus catatan: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setInputText('');
    setIsEditing(false);
    setSavedData(null);
    setError('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" backdrop="static">
      <Modal.Header closeButton style={{ borderBottom: '2px solid #007bff' }}>
        <Modal.Title className="d-flex align-items-center">
          <span style={{ marginRight: '10px' }}>📝</span>
          <div>
            <div>Catatan Ayat</div>
            <small className="text-muted" style={{ fontSize: '0.8rem' }}>
              Surah {ayatData?.surahNumber} : Ayat {ayatData?.ayatNumber}
            </small>
          </div>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ padding: '25px' }}>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <Form>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">
              <span style={{ marginRight: '8px' }}>✍️</span>
              Catatan untuk Ayat:
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Masukkan catatan, penjelasan, atau keterangan tambahan untuk ayat ini..."
              disabled={!isEditing || isLoading}
              style={{ 
                fontSize: '1.1rem',
                lineHeight: '1.5'
              }}
            />
            <Form.Text className="text-muted">
              {isEditing 
                ? "Ketik catatan Anda kemudian klik Simpan (disimpan di cache lokal)" 
                : "Klik tombol Edit untuk mengubah catatan"}
            </Form.Text>
          </Form.Group>
        </Form>

        {isLoading && (
          <div className="text-center mt-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-2">Menyimpan ke cache...</p>
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer style={{ borderTop: '1px solid #dee2e6', padding: '20px' }}>
        <div className="d-flex justify-content-between w-100">
          <div>
            {savedData && !isEditing && (
              <Button 
                variant="outline-danger" 
                onClick={handleDelete}
                disabled={isLoading}
                size="sm"
              >
                🗑️ Hapus
              </Button>
            )}
          </div>
          
          <div>
            <Button 
              variant="outline-secondary" 
              onClick={handleClose}
              disabled={isLoading}
              className="me-2"
            >
              {savedData && !isEditing ? 'Tutup' : 'Batal'}
            </Button>
            
            {isEditing ? (
              <Button 
                variant="primary" 
                onClick={handleSave}
                disabled={!inputText.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Menyimpan...
                  </>
                ) : (
                  '💾 Simpan ke Cache'
                )}
              </Button>
            ) : (
              <Button 
                variant="primary" 
                onClick={handleEdit}
                disabled={isLoading}
              >
                ✏️ Edit
              </Button>
            )}
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalCatatan;