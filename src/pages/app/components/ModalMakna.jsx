import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Badge } from 'react-bootstrap';
import { cacheService } from '../utils/cacheService';

const ModalMakna = ({ 
  show, 
  onHide, 
  kataData, 
  onSave
}) => {
  const [inputText, setInputText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset state ketika modal dibuka dengan data baru
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (show && kataData) {
        console.log('ModalMakna dibuka untuk:', kataData);
        setError('');
        
        try {
          // Load from IndexedDB - ASYNC
          const cachedData = await cacheService.getMakna(
            kataData.userId,
            kataData.surahNumber, 
            kataData.ayatNumber,
            kataData.kataIndex
          );
          
          console.log('Data dari IndexedDB:', cachedData);
          
          if (isMounted) {
            if (cachedData) {
              setInputText(cachedData.makna || '');
              setSavedData(cachedData);
              setIsEditing(false);
            } else {
              setInputText('');
              setSavedData(null);
              setIsEditing(true);
            }
          }
        } catch (error) {
          console.error('Error loading makna from IndexedDB:', error);
          if (isMounted) {
            setError('Gagal memuat makna dari cache');
          }
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [show, kataData]);

  const handleSave = async () => {
    if (!inputText.trim()) {
      setError('Makna tidak boleh kosong');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const dataToSave = {
        user_id: kataData.userId,
        surah: kataData.surahNumber,
        ayat: kataData.ayatNumber,
        kata_index: kataData.kataIndex,
        kata_text: kataData.kataText,
        makna: inputText.trim(),
        keterangan: '',
        timestamp: new Date().toISOString()
      };

      console.log('Saving to IndexedDB:', dataToSave);

      // Simpan ke IndexedDB - ASYNC
      const savedCacheData = await cacheService.setMakna(
        kataData.userId,
        kataData.surahNumber,
        kataData.ayatNumber,
        kataData.kataIndex,
        dataToSave
      );

      if (onSave) {
        onSave(savedCacheData);
      }

      setSavedData(savedCacheData);
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error saving makna:', error);
      setError(`Gagal menyimpan makna: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
  };

  const handleDelete = async () => {
    if (!window.confirm('Hapus makna untuk kata ini?')) return;

    setIsLoading(true);
    setError('');
    
    try {
      // Hapus dari IndexedDB - ASYNC (method sudah diupdate untuk tracking deletions)
      await cacheService.deleteMakna(
        kataData.userId,
        kataData.surahNumber,
        kataData.ayatNumber,
        kataData.kataIndex
      );
      
      setInputText('');
      setSavedData(null);
      setIsEditing(true);
      
      if (onSave) {
        onSave(null);
      }
      
    } catch (error) {
      console.error('Error deleting makna:', error);
      setError(`Gagal menghapus makna: ${error.message}`);
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
      <Modal.Header closeButton style={{ borderBottom: '2px solid #28a745' }}>
        <Modal.Title className="d-flex align-items-center">
          <div style={{ marginLeft: '10px' }}>{kataData.kataText}</div> 
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ padding: '12px' }}>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}



             


        <Form>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">

            </Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tulis ma'na..."
              disabled={!isEditing || isLoading}
              style={{ 
                fontSize: '1.1rem',
                lineHeight: '1.5'
              }}
            />
            <Form.Text className="text-muted">
              {isEditing 
                ? "Jumlah huruf untuk ma'na tidak terbatas" 
                : "Klik tombol Edit untuk mengubah ma'na"}
            </Form.Text>
          </Form.Group>
        </Form>

        {isLoading && (
          <div className="text-center mt-3">
            <div className="spinner-border text-success" role="status">
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
                  '💾 Simpan ke cache'
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