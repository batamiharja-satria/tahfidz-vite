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
    let isMounted = true;

    const loadData = async () => {
      if (show && ayatData) {
        console.log('ModalCatatan dibuka untuk:', ayatData);
        setError('');
        
        try {
          // Load from IndexedDB - ASYNC
          const cachedData = await cacheService.getCatatan(
            ayatData.userId,
            ayatData.surahNumber, 
            ayatData.ayatNumber
          );
          
          console.log('Data catatan dari IndexedDB:', cachedData);
          
          if (isMounted) {
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
        } catch (error) {
          console.error('Error loading catatan from cache:', error);
          if (isMounted) {
            setError('Gagal memuat catatan dari cache');
          }
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [show, ayatData]);

  const handleSave = async () => {
    if (!inputText.trim()) {
      setError('Keterangan tidak boleh kosong');
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

      console.log('Saving catatan to IndexedDB:', dataToSave);

      // Simpan ke IndexedDB - ASYNC
      const savedCacheData = await cacheService.setCatatan(
        ayatData.userId,
        ayatData.surahNumber,
        ayatData.ayatNumber,
        dataToSave
      );

      if (onSave) {
        onSave(savedCacheData);
      }

      setSavedData(savedCacheData);
      setIsEditing(false);
      
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
      // Hapus dari IndexedDB - ASYNC
      await cacheService.deleteCatatan(
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

          
            <div>Keterangan : Ayat {ayatData?.ayatNumber}</div>
          
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ padding: '12px' }}>
        {error && (
          <Alert variant="danger" className="mb-1">
            {error}
          </Alert>
        )}

        <Form>
          <Form.Group className="mb-0">
            <Form.Label >
             
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={11}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tulis keterangan..."
              disabled={!isEditing || isLoading}
              style={{ 
                fontSize: '1.1rem',
                lineHeight: '1.5'
              }}
            />
            <Form.Text className="text-muted">
              {isEditing 
                ? "Jumlah huruf untuk keterangan tidak terbatas" 
                : "Klik tombol Edit untuk mengubah keterangan"}
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
      
      <Modal.Footer style={{ borderTop: '1px solid #dee2e6', padding: '15px' }}>
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

export default ModalCatatan;