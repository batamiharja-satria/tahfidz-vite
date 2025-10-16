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

  // ✅ PERBAIKAN: Reset state ketika modal ditutup
  useEffect(() => {
    if (!show) {
      setInputText('');
      setIsEditing(false);
      setSavedData(null);
      setError('');
      setIsLoading(false);
    }
  }, [show]);

  // ✅ PERBAIKAN: Load data dengan error handling yang lebih baik
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!show || !kataData) {
        console.log('ModalMakna: skip load - tidak show atau kataData null');
        return;
      }

      console.log('ModalMakna dibuka untuk:', kataData);
      
      // ✅ PERBAIKAN: Reset state dulu
      if (isMounted) {
        setError('');
        setIsLoading(true);
      }

      try {
        // ✅ PERBAIKAN: Tambah null check untuk kataData properties
        if (!kataData.userId || !kataData.surahNumber || !kataData.ayatNumber || kataData.kataIndex === undefined) {
          throw new Error('Data kata tidak lengkap');
        }

        // Load from IndexedDB
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
          setError(`Gagal memuat makna: ${error.message}`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [show, kataData]);

  const handleSave = async () => {
    // ✅ PERBAIKAN: Validasi lebih ketat
    if (!kataData) {
      setError('Data kata tidak tersedia');
      return;
    }

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

      // ✅ PERBAIKAN: Tambah error handling untuk cacheService
      const savedCacheData = await cacheService.setMakna(
        kataData.userId,
        kataData.surahNumber,
        kataData.ayatNumber,
        kataData.kataIndex,
        dataToSave
      );

      if (!savedCacheData) {
        throw new Error('Gagal menyimpan ke cache');
      }

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
    if (!kataData) {
      setError('Data kata tidak tersedia');
      return;
    }

    if (!window.confirm('Hapus makna untuk kata ini?')) return;

    setIsLoading(true);
    setError('');
    
    try {
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
    // State reset sudah ditangani di useEffect berdasarkan `show`
    onHide();
  };

  // ✅ PERBAIKAN: Tambah guard clause untuk kataData null
  if (!kataData) {
    return (
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            Data kata tidak tersedia. Silakan tutup dan coba lagi.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" backdrop="static">
      <Modal.Header closeButton style={{ borderBottom: '2px solid #28a745' }}>
        <Modal.Title className="d-flex align-items-center">
          <div style={{ marginLeft: '10px' }}>
            {kataData.kataText}
            {savedData && (
              <span className="invisible">
                Tersimpan
              </span>
            )}
          </div>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ padding: '15px' }}>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}


        <Form>
          <Form.Group className="mb-0">
            
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
          </Form.Group>
        </Form>
                                   <span className="invisible">
            {kataData.surahNumber}, {kataData.ayatNumber}, {kataData.kataIndex + 1}
          </span>
        {isLoading && (
          <div className="text-center mt-0">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-2">Menyimpan...</p>
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