import React from 'react';
import '../styles.css';

export default function Footer() {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} KeepCapsule. All rights reserved.</p>
      <p><a href="mailto:hello@keepcapsule.com">hello@keepcapsule.com</a></p>
    </footer>
  );
}
