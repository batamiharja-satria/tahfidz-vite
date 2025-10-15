import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Badge } from 'react-bootstrap';
import { quranDataService } from '../utils/googleSheetsService';

const ModalMakna = ({ 
  show, 
  onHide, 
  kataData, 
  onSave,
  existingData = null 
}) => {
  const [inputText, setInputText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state ketika modal dibuka dengan data baru
  useEffect(() => {
    if (show && kataData) {
      console.log('ModalMakna dibuka untuk:', kataData);
      
      // Load existing data
      const loadData = async () => {
        try {
          const result = await quranDataService.getMaknaByKata(
            kataData.userId,
            kataData.surahNumber, 
            kataData.ayatNumber,
            kataData.kataIndex
          );
          
          if (result) {
            setInputText(result.makna || '');
            setSavedData(result);
            setIsEditing(false);
          } else {
            setInputText('');
            setSavedData(null);
            setIsEditing(true);
          }
        } catch (error) {
          console.error('Error loading makna:', error);
          setInputText('');
          setSavedData(null);
          setIsEditing(true);
        }
      };

      loadData();
    }
  }, [show, kataData]);

  const handleSave = async () => {
    if (inputText.trim()) {
      setIsLoading(true);
      
      try {
        const dataToSave = {
          user_id: kataData.userId,
          surah: kataData.surahNumber,
          ayat: kataData.ayatNumber,
          kata_index: kataData.kataIndex, // Indeks kata sebenarnya
          kata_text: kataData.kataText, // Teks kata
          makna: inputText.trim(), // Disimpan di sini
          keterangan: '', // Kosong untuk makna kata
        };

        let result;
        if (savedData) {
          // Update existing
          result = await quranDataService.updateData(savedData.id, dataToSave);
        } else {
          // Add new
          result = await quranDataService.saveMakna(dataToSave);
        }
        
        // Reload data untuk mendapatkan ID jika baru
        const updatedData = await quranDataService.getMaknaByKata(
          kataData.userId,
          kataData.surahNumber, 
          kataData.ayatNumber,
          kataData.kataIndex
        );
        
        setSavedData(updatedData);
        setIsEditing(false);
        
        // Panggil callback ke parent untuk update state
        if (onSave) {
          onSave(updatedData);
        }
        
      } catch (error) {
        console.error('Error saving data:', error);
        alert('Gagal menyimpan data');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (window.confirm('Hapus makna untuk kata ini?')) {
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
        alert('Gagal menghapus data');
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
      <Modal.Header closeButton style={{ borderBottom: '2px solid #28a745' }}>
        <Modal.Title className="d-flex align-items-center">
          <span style={{ marginRight: '10px' }}>📖</span>
          <div>
            <div>Edit Makna Kata</div>
            <small className="text-muted" style={{ fontSize: '0.8rem' }}>
              Surah {kataData?.surahNumber} : Ayat {kataData?.ayatNumber}
            </small>
          </div>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ padding: '25px' }}>
        {kataData && (
          <div className="text-center mb-4">
            <div style={{ 
              fontSize: '2rem',
              fontFamily: "'Traditional Arabic', 'Lateef', 'Amiri', serif",
              marginBottom: '10px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              lineHeight: '1.8'
            }}>
              {kataData.kataText}
            </div>
            
            <Badge bg="secondary" className="mb-2">
              Kata ke-{kataData.kataIndex + 1}
            </Badge>
            
            {savedData && (
              <Badge bg="success" className="ms-2">
                ✅ Tersimpan
              </Badge>
            )}
          </div>
        )}

        <Form>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">
              <span style={{ marginRight: '8px' }}>✍️</span>
              Makna / Penjelasan Kata:
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Masukkan makna, penjelasan, atau catatan untuk kata ini..."
              disabled={!isEditing || isLoading}
              style={{ 
                fontSize: '1.1rem',
                lineHeight: '1.5'
              }}
            />
            <Form.Text className="text-muted">
              {isEditing 
                ? "Ketik makna kata kemudian klik Simpan" 
                : "Klik tombol Edit untuk mengubah makna"}
            </Form.Text>
          </Form.Group>
        </Form>

        {isLoading && (
          <div className="text-center mt-3">
            <div className="spinner-border text-success" role="status">
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
                variant="success" 
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

export default ModalMakna;