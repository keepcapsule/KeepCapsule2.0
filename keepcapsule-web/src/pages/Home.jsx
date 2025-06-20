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
          <p className="tagline">Your secure vault for life’s most important memories and documents.</p>
          <Link to="/signup">
            <button className="btn-primary">Subscribe</button>
          </Link>
        </div>
      </section>

      <section className="benefits-section fade-in">
        <h2>Why KeepCapsule?</h2>
        <ul>
          <li>✅ Safe long-term storage</li>
          <li>✅ Retrieve files anytime</li>
          <li>✅ Perfect for wills, photos, memories</li>
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
