export default function Header() {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
            <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
            <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
            <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.3"/>
          </svg>
        </div>
        <div>
          <div className="brand-name">NexVec</div>
          <div className="brand-tag">Vector Intelligence Studio</div>
        </div>
        <div className="brand-badge">v1.3.0</div>
      </div>
    </header>
  );
}
