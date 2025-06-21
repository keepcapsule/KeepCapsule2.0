import React from 'react';

const plans = [
  {
    title: 'Starter',
    price: '£1.99/mo',
    priceId: 'price_1RbrvHGlVDvHzPSzt5WEE29y',
    storage: '1GB',
    downloads: '250MB/year',
    features: ['Store up to 10 images', '5 min of video', '5–10 documents'],
  },
  {
    title: 'Standard',
    price: '£4.99/mo',
    priceId: 'price_1RbrwKGlVDvHzPSz7pRqMQ6o',
    storage: '5GB',
    downloads: '1 full retrieval/year',
    features: ['Full access to KeepCapsule', '1 annual download bundle'],
  },
  {
    title: 'Premium',
    price: '£9.99/mo',
    priceId: 'price_1RbrxDGlVDvHzPSzmrhElfjX',
    storage: '10GB',
    downloads: '2 full retrievals/year',
    features: ['Ideal for families', 'Backup guarantee', 'Priority support'],
  },
  {
    title: 'Lifetime 5GB',
    price: '£149 one-time',
    priceId: 'price_1RbryxGlVDvHzPSzXAgPe7js',
    storage: '5GB',
    downloads: '2/year',
    features: ['Lifetime access', 'No monthly fees'],
  },
  {
    title: 'Lifetime 10GB',
    price: '£199 one-time',
    priceId: 'price_1RbrzDGlVDvHzPSzTSa9Kxs6',
    storage: '10GB',
    downloads: '3/year',
    features: ['Lifetime access', 'Maximum capacity', 'Highest tier support'],
  },
];

export default function PricingTable() {
  const handleSubscribe = async (priceId) => {
    const email = prompt("Enter your email to begin:");
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email.');
      return;
    }

    try {
      const res = await fetch("https://xkl1o711jk.execute-api.eu-west-1.amazonaws.com/prod/create-checkout-session", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, priceId }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout failed.');

      window.location.href = data.url;
    } catch (err) {
      console.error('❌ Error:', err);
      alert('Checkout failed. Please try again.');
    }
  };

  return (
    <section className="pricing-section" id="pricing">
      <h2>Pricing Plans</h2>
      <div className="pricing-grid">
        {plans.map((plan, i) => (
          <div className="pricing-card fade-in" key={i}>
            <h3>{plan.title}</h3>
            <p className="price">{plan.price}</p>
            <p><strong>{plan.storage}</strong> storage</p>
            <p>{plan.downloads} download limit</p>
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              {plan.features.map((feat, j) => (
                <li key={j}>✅ {feat}</li>
              ))}
            </ul>
            <button className="subscribe-btn" onClick={() => handleSubscribe(plan.priceId)}>Choose Plan</button>
          </div>
        ))}
      </div>
    </section>
  );
}
