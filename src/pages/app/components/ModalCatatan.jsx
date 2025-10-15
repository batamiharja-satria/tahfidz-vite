import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Badge } from 'react-bootstrap';
import { quranDataService } from '../utils/googleSheetsService';

const ModalCatatan = ({ 
  show, 
  onHide, 
  ayatData, 
  onSave,
  existingData = null 
}) => {
  const [inputText, setInputText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state ketika modal dibuka dengan data baru
  useEffect(() => {
    if (show && ayatData) {
      console.log('ModalCatatan dibuka untuk:', ayatData);
      
      // Load existing data
      const loadData = async () => {
        try {
          const result = await quranDataService.getCatatanByAyat(
            ayatData.userId,
            ayatData.surahNumber, 
            ayatData.ayatNumber
          );
          
          if (result) {
            setInputText(result.keterangan || '');
            setSavedData(result);
            setIsEditing(false);
          } else {
            setInputText('');
            setSavedData(null);
            setIsEditing(true);
          }
        } catch (error) {
          console.error('Error loading catatan:', error);
          setInputText('');
          setSavedData(null);
          setIsEditing(true);
        }
      };

      loadData();
    }
  }, [show, ayatData]);

  const handleSave = async () => {
    if (inputText.trim()) {
      setIsLoading(true);
      
      try {
        const dataToSave = {
          user_id: ayatData.userId,
          surah: ayatData.surahNumber,
          ayat: ayatData.ayatNumber,
          kata_index: -1, // Tanda bahwa ini adalah catatan ayat
          kata_text: '', // Kosong untuk catatan ayat
          makna: '', // Kosong untuk catatan ayat
          keterangan: inputText.trim(), // Disimpan di sini
        };

        let result;
        if (savedData) {
          // Update existing
          result = await quranDataService.updateData(savedData.id, dataToSave);
        } else {
          // Add new
          result = await quranDataService.saveCatatan(dataToSave);
        }
        
        // Reload data untuk mendapatkan ID jika baru
        const updatedData = await quranDataService.getCatatanByAyat(
          ayatData.userId,
          ayatData.surahNumber, 
          ayatData.ayatNumber
        );
        
        setSavedData(updatedData);
        setIsEditing(false);
        
        // Panggil callback ke parent untuk update state
        if (onSave) {
          onSave(updatedData);
        }
        
      } catch (error) {
        console.error('Error saving data:', error);
        alert('Gagal menyimpan catatan');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (window.confirm('Hapus catatan untuk ayat ini?')) {
      setIsLoading(true);
      try {
        if (savedData && savedData.id) {
          await quranDataService.deleteData(savedData.id);
        }
        
        setInputText('');
        setSavedData(null);
        setIsEditing(true);
        
        if (onSave) {
          onSave(null); // Notify parent about deletion
        }
        
      } catch (error) {
        console.error('Error deleting data:', error);
        alert('Gagal menghapus catatan');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    setInputText('');
    setIsEditing(false);
    setSavedData(null);
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
                ? "Ketik catatan Anda kemudian klik Simpan" 
                : "Klik tombol Edit untuk mengubah catatan"}
            </Form.Text>
          </Form.Group>
        </Form>

        {isLoading && (
          <div className="text-center mt-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-2">Menyimpan data...</p>
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
                  '💾 Simpan'
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