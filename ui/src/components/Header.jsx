import { Database } from 'lucide-react';

export default function Header() {
  return (
    <header style={{
      background: 'rgba(8,8,15,0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '0 32px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>

        {/* ── Brand ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 1px rgba(99,102,241,0.4), 0 4px 16px rgba(99,102,241,0.45)',
          }}>
            <Database size={18} color="#fff" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 18, fontWeight: 750, letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #a5b4fc 0%, #818cf8 50%, #67e8f9 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                NexVec
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#818cf8',
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 5, padding: '2px 6px', letterSpacing: '0.04em',
              }}>
                v1.3
              </span>
            </div>
            <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.22)', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Vector Intelligence Studio
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}
