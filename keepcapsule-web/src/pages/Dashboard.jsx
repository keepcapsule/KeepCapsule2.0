import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const API_BASE = 'https://xkl1o711jk.execute-api.eu-west-1.amazonaws.com/prod';

export default function Dashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [userMeta, setUserMeta] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem("userEmail");
    if (!user) {
      navigate("/");
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
    if (!file || !title) return alert('Please select a file and enter a title.');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', email);
    formData.append('title', title);
    formData.append('type', 'files');

    try {
      const res = await fetch(`${API_BASE}/upload-file`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');

      const { file: uploadedFile } = await res.json();
      setFiles(prev => [...prev, uploadedFile]);
      setFile(null);
      setTitle('');
      fetchFiles(email); // Refresh usage stats
    } catch (err) {
      console.error('❌ Upload failed:', err);
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
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    navigate('/');
  };

  const renderPie = (used, total, label) => {
    const remaining = Math.max(total - used, 0);
    return (
      <div style={{ width: '300px', margin: '1rem' }}>
        <Pie
          data={{
            labels: ['Used', 'Remaining'],
            datasets: [
              {
                data: [used, remaining],
                backgroundColor: ['#f87171', '#4ade80'],
                borderColor: '#fff',
                borderWidth: 1,
              },
            ],
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

  return (
    <div className="dashboard-container">
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
        <button onClick={handleUpload}>Upload</button>
      </div>

      <div className="file-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '2rem' }}>
        {files.map((file) => (
          <div key={file.key} className="file-card" style={{ border: '1px solid #ccc', padding: '10px' }}>
            {file.url && file.url.match(/\.(jpg|jpeg|png)$/i) ? (
              <img src={file.url} alt={file.title} style={{ width: '100px' }} />
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
            <p>{file.title}</p>
            <button onClick={() => handleDelete(file.key)}>Delete</button>
          </div>
        ))}
      </div>

      {userMeta && (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', marginTop: '3rem' }}>
          {renderPie(userMeta.storageUsedMB || 0, userMeta.storageLimitMB || 1, 'Storage Usage')}
          {renderPie(userMeta.retrievalsUsedMB || 0, userMeta.retrievalLimitMB || 1, 'Retrieval Usage')}
        </div>
      )}
    </div>
  );
}
