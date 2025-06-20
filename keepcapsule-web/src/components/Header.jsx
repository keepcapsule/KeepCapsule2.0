import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Header() {
  const [userEmail, setUserEmail] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    setUserEmail(email || '');
    setMenuOpen(false); // close menu on route change
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    setUserEmail('');
    setMenuOpen(false);
    navigate('/');
  };

  const toggleMenu = () => setMenuOpen(prev => !prev);

  return (
    <header className="header">
      <Link to="/" className="logo">KeepCapsule</Link>

      <div className="hamburger" onClick={toggleMenu}>☰</div>

      <nav className={`nav-links ${menuOpen ? 'show' : ''}`}>
        <Link to="/">Home</Link>

        {userEmail ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <span className="user-email">{userEmail}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
      </nav>
    </header>
  );
}