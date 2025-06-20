import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles.css';

export default function SetPassword() {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [customerId, setCustomerId] = useState('');
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const emailParam = params.get('email');
    const customerIdParam = params.get('customerId') || params.get('session_id');
    if (emailParam && customerIdParam) {
      setEmail(emailParam);
      setCustomerId(customerIdParam);
    }
  }, [params]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {
      const res = await fetch('https://xkl1o711jk.execute-api.eu-west-1.amazonaws.com/prod/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Something went wrong. Please try again.");
        return;
      }

      // Optional: store login info in localStorage for now
      localStorage.setItem("userEmail", email);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error setting password:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Set Your Password</h2>
        {email ? (
          <form onSubmit={handleSubmit}>
            <p className="mb-3">For: <strong>{email}</strong></p>
            <input
              type="password"
              placeholder="Choose a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Set Password & Continue</button>
          </form>
        ) : (
          <p>Missing required information in the URL.</p>
        )}
      </div>
    </div>
  );
}
