import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles.css';
import PricingTable from '../components/PricingTable';

export default function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  }, []);

  return (
    <main className="page-wrapper">
      <section className="hero-wrapper fade-in">
        <div className="home-hero">
          <h1>Welcome to <span className="logo-text">KeepCapsule</span></h1>
          <p className="tagline"><b>Never Lose A Memory Again</b> </p> 
          <p className="tagline">Secure and preserve your memories forever with KeepCapsule.</p>
          <Link to="/signup">
            <button className="btn-primary">Subscribe</button>
          </Link>
        </div>
      </section>

      <section className="benefits-section fade-in">
        <h2>Why Choose KeepCapsule?</h2>
        <ul>
          <li>✅ Purpose-built for legacy – preserve what truly matters most, not digital clutter</li>
          <li>✅ Access anytime, anywhere – your memories are always at your fingertips</li>
          <li>✅ Designed for peace of mind – safeguard your most important photos, documents, and last messages</li>
        </ul>
      </section>

      <PricingTable />

      <section className="waitlist-box fade-in">
        <h3>Not ready to subscribe yet?</h3>
        <p>Join the waitlist and be the first to know when KeepCapsule officially launches.</p>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSdPINJvxp3S6vglzwhEyEjH77Awhjy8P3xcHgWKpcfPfHgu3Q/viewform"
          target="_blank"
          rel="noopener noreferrer"
        >
          <button className="btn-primary">Join the Waitlist</button>
        </a>
      </section>
    </main>
  );
}
