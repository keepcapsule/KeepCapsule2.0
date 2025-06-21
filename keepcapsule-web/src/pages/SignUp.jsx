import React, { useState } from 'react';

const API_BASE = 'https://xkl1o711jk.execute-api.eu-west-1.amazonaws.com/prod';

const plans = [
  {
    id: 'price_1RbrvHGlVDvHzPSzt5WEE29y',
    title: 'Starter',
    price: '£1.99/mo',
    features: ['1GB Storage', '250MB/year download', '10 images', '5 min video'],
  },
  {
    id: 'price_1RbrwKGlVDvHzPSz7pRqMQ6o',
    title: 'Standard',
    price: '£4.99/mo',
    features: ['5GB Storage', '1 annual retrieval', 'Full access'],
  },
  {
    id: 'price_1RbrxDGlVDvHzPSzmrhElfjX',
    title: 'Premium',
    price: '£9.99/mo',
    features: ['10GB Storage', '2 full retrievals/year', 'Priority support'],
  },
  {
    id: 'price_1RbryxGlVDvHzPSzXAgPe7js',
    title: 'Lifetime 5GB',
    price: '£149 one-time',
    features: ['Lifetime access', 'No monthly fee', '5GB total storage'],
  },
  {
    id: 'price_1RbrzDGlVDvHzPSzTSa9Kxs6',
    title: 'Lifetime 10GB',
    price: '£199 one-time',
    features: ['Lifetime access', 'Max capacity', 'Highest tier support'],
  },
];

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    setError('');

    if (!email.includes('@')) return setError('Please enter a valid email.');
    if (!selectedPlan) return setError('Please select a plan.');

    try {
      const res = await fetch(`${API_BASE}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, priceId: selectedPlan }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout failed');
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="signup-container" style={{ padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2>Select Your Plan</h2>
      </div>

      <div className="pricing-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`pricing-card ${selectedPlan === plan.id ? 'selected' : ''}`}
            onClick={() => setSelectedPlan(plan.id)}
            style={{ cursor: 'pointer' }}
          >
            <h3>{plan.title}</h3>
            <p className="price">{plan.price}</p>
            <ul>
              {plan.features.map((feat, i) => (
                <li key={i}>✅ {feat}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: '0.7rem',
            borderRadius: '6px',
            border: '1px solid #ccc',
            width: '280px',
          }}
        />
        <button
          className="btn-primary"
          onClick={handleSubscribe}
          style={{ marginTop: '1rem', width: '280px' }}
        >
          Continue to Payment
        </button>
        {error && (
          <p className="error" style={{ color: 'red', marginTop: '1rem' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
