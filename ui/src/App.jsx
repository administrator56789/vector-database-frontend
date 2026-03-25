import Header from './components/Header';
import IngestPage from './components/IngestPage';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, maxWidth: 720, width: '100%', margin: '0 auto', padding: '44px 24px 72px' }}>
        <IngestPage />
      </main>
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '14px 24px', textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>NexVec · v1.3.0 · Vector Database Engine</span>
      </footer>
    </div>
  );
}
