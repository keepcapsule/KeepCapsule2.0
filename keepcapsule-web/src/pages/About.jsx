export default function About() {
  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>About KeepCapsule</h1>
      <p>KeepCapsule is your digital safety deposit box — a private, secure place to store the moments, memories, and documents that matter most.</p>

      <h2 style={{ color: '#007BFF', fontSize: '1.25rem', fontWeight: '600', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Why We Built KeepCapsule</h2>
      <p>Too often, memories are lost to time — old phones break, cloud accounts get forgotten, and precious documents disappear. KeepCapsule was created to ensure those irreplaceable files are protected for life. Whether it's a voice message to your loved ones, a family photo, or your final wishes — it's all safely stored here, for the future.</p>

      <h2 style={{ color: '#007BFF', fontSize: '1.25rem', fontWeight: '600', marginTop: '1.5rem', marginBottom: '0.5rem' }}>What You Can Store</h2>
      <ul>
        <li>Photos and videos</li>
        <li>Written messages or voice notes</li>
        <li>Important documents (wills, IDs, insurance)</li>
      </ul>

      <h2 style={{ color: '#007BFF', fontSize: '1.25rem', fontWeight: '600', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Our Mission</h2>
      <p>We believe everyone should have a simple, affordable way to preserve their legacy. KeepCapsule empowers you to save your story — for your family, for the future, forever.</p>

      <h2 style={{ color: '#007BFF', fontSize: '1.25rem', fontWeight: '600', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Built on Trust</h2>
      <p>Your data is encrypted and stored using trusted AWS infrastructure. Only you have access to your capsule. We don’t sell data, and we never will.</p>

      <h2 style={{ color: '#007BFF', fontSize: '1.25rem', fontWeight: '600', marginTop: '1.5rem', marginBottom: '0.5rem' }}>How to Get Started</h2>
      <ol>
        <li>Create your capsule</li>
        <li>Choose a subscription plan</li>
        <li>Upload your memories or documents</li>
      </ol>

      <p>Start building your capsule today and protect what matters most — forever.</p>
    </div>
  );
}