import React, { useEffect, useState } from 'react';
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
      setFile(null);
      setTitle('');
      setUploadType('');
      fetchFiles(email);
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
      <div style={{ width: '280px', margin: '1rem' }}>
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
      </div>
    );
  };

  const filteredFiles = files.filter(file =>
    activeTab === 'photos' ? file.type === 'image' : file.type === 'document'
  );

  return (
    <div className="dashboard-container" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Welcome, {email}</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <input type="file" onChange={e => setFile(e.target.files[0])} />
        <input
          type="text"
          placeholder="Enter title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <select value={uploadType} onChange={e => setUploadType(e.target.value)}>
          <option value="">Select type</option>
          <option value="image">Image or Video</option>
          <option value="document">Document</option>
        </select>
        <button onClick={handleUpload}>Upload</button>
      </div>

      {/* Tab buttons */}
      <div style={{ marginTop: '2rem' }}>
        <button
          onClick={() => setActiveTab('photos')}
          style={{
            marginRight: '1rem',
            fontWeight: activeTab === 'photos' ? 'bold' : 'normal'
          }}
        >
          Photos
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          style={{ fontWeight: activeTab === 'documents' ? 'bold' : 'normal' }}
        >
          Documents
        </button>
      </div>

      {/* File Grid */}
      <div className="file-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '2rem' }}>
        {filteredFiles.map(file => (
          <div key={file.key} className="file-card" style={{ border: '1px solid #ccc', padding: '10px', width: '120px' }}>
            {isImage(file) ? (
              <img
                src={file.url}
                alt={file.title}
                style={{ width: '100px', height: '100px', objectFit: 'cover', cursor: 'pointer' }}
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
                fontSize: '2rem'
              }}>
                📄
              </div>
            )}
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>{file.title || 'Untitled'}</p>
            <button style={{ marginTop: '0.5rem' }} onClick={() => handleDelete(file.key)}>Delete</button>
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
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', marginTop: '3rem' }}>
          {renderPie(userMeta.storageUsedMB || 0, userMeta.storageLimitMB || 1, 'Storage Usage')}
          {renderPie(userMeta.retrievalsUsedMB || 0, userMeta.retrievalLimitMB || 1, 'Retrieval Usage')}
        </div>
      )}
    </div>
  );
}