import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import 'react-image-lightbox/style.css';
import Lightbox from 'react-image-lightbox';
import { uploadFileToS3 } from '../utils/uploadFileToS3';

ChartJS.register(ArcElement, Tooltip, Legend);

const API_BASE = 'https://xkl1o711jk.execute-api.eu-west-1.amazonaws.com/prod';

export default function Dashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploadType, setUploadType] = useState('');
  const [userMeta, setUserMeta] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');
  const [activeTab, setActiveTab] = useState('photos');
  const fileInputRef = useRef();

  useEffect(() => {
    const user = localStorage.getItem('userEmail');
    if (!user) {
      navigate('/');
    } else {
      setEmail(user);
      fetchFiles(user);
    }
  }, [navigate]);

  const fetchFiles = async (userEmail) => {
    try {
      const res = await fetch(`${API_BASE}/get-files?email=${encodeURIComponent(userEmail)}`);
      if (!res.ok) throw new Error('Bad response from get-files');
      const data = await res.json();
      setFiles(data.files || []);
      setUserMeta(data.meta || {});
    } catch (err) {
      console.error('❌ Error fetching files:', err);
    }
  };

  const handleUpload = async () => {
    if (!file || !title || !uploadType) {
      alert('Please provide file, title, and select a type.');
      return;
    }

    try {
      await uploadFileToS3(file, title, uploadType, email);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFile(null);
      setTitle('');
      setUploadType('');
      fetchFiles(email);
      alert('Upload successful');
    } catch (err) {
      console.error('❌ Upload failed:', err);
      alert('Upload failed.');
    }
  };

  const handleDelete = async (key) => {
    try {
      const res = await fetch(`${API_BASE}/delete-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, key }),
      });
      if (!res.ok) throw new Error('Delete failed');
      fetchFiles(email);
    } catch (err) {
      console.error('❌ Delete failed:', err);
      alert('Delete failed.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  const isImage = (file) => file?.type === 'image';

  const renderPie = (used, total, label) => {
    const remaining = Math.max(total - used, 0);
    return (
      <Pie
        data={{
          labels: ['Used', 'Remaining'],
          datasets: [{
            data: [used, remaining],
            backgroundColor: ['#f87171', '#4ade80'],
            borderColor: '#fff',
            borderWidth: 1,
          }],
        }}
        options={{
          plugins: {
            title: { display: true, text: label },
            legend: { position: 'bottom' },
          },
        }}
      />
    );
  };

  const filteredFiles = files.filter(file =>
    activeTab === 'photos' ? file.type === 'image' : file.type === 'document'
  );

  return (
    <div className="dashboard-container" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Welcome, {email}</h2>

      <div className="upload-box auth-box" style={{ padding: '1rem', borderRadius: '8px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
          <div style={{ width: '100%', textAlign: 'center' }}>
            <label
              htmlFor="file-upload"
              style={{
                display: 'inline-block',
                backgroundColor: '#3b82f6',
                color: '#fff',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Choose file
            </label>
            <input
              id="file-upload"
              type="file"
              ref={fileInputRef}
              onChange={e => setFile(e.target.files[0])}
              style={{ display: 'none' }}
            />
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#555' }}>
              {file ? file.name : 'No file chosen'}
            </div>
          </div>
          <input
            type="text"
            placeholder="Enter title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="auth-box input"
            style={{
              width: '100%',
              height: '36px',
              fontSize: '0.9rem',
              padding: '0.4rem 0.6rem'
            }}
          />
          <select
            value={uploadType}
            onChange={e => setUploadType(e.target.value)}
            className="auth-box input"
            style={{
              width: '100%',
              height: '36px',
              fontSize: '0.9rem',
              padding: '0.4rem 0.6rem'
            }}
          >
            <option value="">Select type</option>
            <option value="image">Image or Video</option>
            <option value="document">Document</option>
          </select>
          <button className="btn-primary" onClick={handleUpload} style={{ width: '100px', height: '36px', fontSize: '0.9rem' }}>Upload</button>
        </div>
      </div>

      {/* Tab buttons group */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 0 5px rgba(0,0,0,0.1)' }}>
          <button
            onClick={() => setActiveTab('photos')}
            style={{
              padding: '0.5rem 1.2rem',
              border: 'none',
              backgroundColor: activeTab === 'photos' ? '#3b82f6' : '#e0e7ff',
              color: activeTab === 'photos' ? '#fff' : '#1e293b',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Photos
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            style={{
              padding: '0.5rem 1.2rem',
              border: 'none',
              backgroundColor: activeTab === 'documents' ? '#3b82f6' : '#e0e7ff',
              color: activeTab === 'documents' ? '#fff' : '#1e293b',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Documents
          </button>
        </div>
      </div>

      {/* File Grid */}
      <div className="file-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}>
        {filteredFiles.map(file => (
          <div key={file.key} className="file-card" style={{ border: '1px solid #ccc', padding: '10px', width: '120px', borderRadius: '6px', textAlign: 'center' }}>
            {isImage(file) ? (
              <img
                src={file.url}
                alt={file.title}
                style={{ width: '100px', height: '100px', objectFit: 'cover', cursor: 'pointer', borderRadius: '4px' }}
                onClick={() => {
                  setLightboxImage(file.url);
                  setLightboxOpen(true);
                }}
              />
            ) : (
              <div style={{
                width: '100px',
                height: '100px',
                background: '#eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                borderRadius: '4px'
              }}>
                📄
              </div>
            )}
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', wordBreak: 'break-word' }}>{file.title || 'Untitled'}</p>
            <button className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleDelete(file.key)}>Delete</button>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          mainSrc={lightboxImage}
          onCloseRequest={() => setLightboxOpen(false)}
        />
      )}

      {/* Pie Charts */}
      {userMeta && (
        <div style={{ marginTop: '3rem', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '50px' }}>
          <div style={{ width: '250px' }}>
            <h3 style={{ textAlign: 'center' }}>Storage Usage</h3>
            {renderPie(userMeta.storageUsedMB || 0, userMeta.storageLimitMB || 1, 'Storage')}
          </div>
          <div style={{ width: '250px' }}>
            <h3 style={{ textAlign: 'center' }}>Retrieval Usage</h3>
            {renderPie(userMeta.retrievalsUsedMB || 0, userMeta.retrievalLimitMB || 1, 'Retrievals')}
          </div>
        </div>
      )}
    </div>
  );
}