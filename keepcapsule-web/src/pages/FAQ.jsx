export default function FAQ() {
    return (
      <div className="page-content" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Frequently Asked Questions</h1>
  
        <h3 style={{ color: '#007BFF' }}>Is my data safe?</h3>
        <p>
          Absolutely. Your files are encrypted with top-tier security and stored using trusted AWS cloud infrastructure.
        </p>
  
        <h3 style={{ color: '#007BFF' }}>Can I access my uploads anytime?</h3>
        <p>
          Yes. You can log in anytime from any device to view, download, or add to your capsule — even years later.
        </p>
  
        <h3 style={{ color: '#007BFF' }}>What happens if I stop paying?</h3>
        <p>
          We’ll send you reminders and give you ample time to retrieve your data. You’ll never lose access without warning.
        </p>
  
        <h3 style={{ color: '#007BFF' }}>How does KeepCapsule work?</h3>
        <ol>
          <li><strong>Upload your memories</strong> – Choose photos, videos, or important files.</li>
          <li><strong>Give them a title</strong> – Label each upload for easy organization and retrieval.</li>
          <li><strong>We store it securely</strong> – Your files live in a safe, encrypted vault you can return to anytime.</li>
        </ol>
  
        <h3 style={{ color: '#007BFF' }}>What makes KeepCapsule special?</h3>
        <ul>
          <li><strong>Secure Storage:</strong> Encrypted and backed by AWS.</li>
          <li><strong>Forever Access:</strong> Your memories never expire.</li>
          <li><strong>Simple Experience:</strong> Upload from any device without fuss.</li>
        </ul>
  
        <h3 style={{ color: '#007BFF' }}>How much does it cost?</h3>
        <p>
          For just <strong>£5.99/month</strong>, you get 5GB of encrypted storage — perfect for preserving photos, videos,
          or essential documents. Larger plans coming soon.
        </p>
  
        <h3 style={{ color: '#007BFF' }}>Why should I trust KeepCapsule?</h3>
        <p>
          We understand how important your digital legacy is. That’s why we’ve built KeepCapsule to be simple, private, and
          built for the long term. This isn’t just cloud storage — it’s your personal archive.
        </p>
      </div>
    );
  }