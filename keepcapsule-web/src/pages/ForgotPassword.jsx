import React, { useState } from 'react';

const API_BASE = 'https://xkl1o711jk.execute-api.eu-west-1.amazonaws.com/prod';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendResetLink = async () => {
    setMessage('');
    setError('');

    if (!email.includes('@')) {
      return setError('Please enter a valid email');
    }

    try {
      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset link');

      setMessage(`✅ Reset link sent to ${email} (simulated).`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-box">
        <h2>Forgot your password?</h2>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button onClick={handleSendResetLink}>Send Reset Link</button>
      </div>
    </div>
  );
}
