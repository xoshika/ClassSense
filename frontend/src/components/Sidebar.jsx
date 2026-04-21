import React from "react";

const NAV_ICONS = {
  Dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  "Class Activity": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  "Start Class": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  ),
  "Class Setup": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
    </svg>
  ),
};

export default function Sidebar({ active, setActive, onLogout }) {
  const navItems = ["Dashboard", "Class Activity", "Start Class", "Class Setup"];

  return (
    <>
      <style>{`
        .cs-sidebar {
          width: 220px;
          min-width: 220px;
          background: linear-gradient(180deg, #0f172a 0%, #1e3a5f 50%, #1a3353 100%);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          box-shadow: 4px 0 24px rgba(0,0,0,0.25);
          position: relative;
          overflow: hidden;
        }
        .cs-sidebar::before {
          content: '';
          position: absolute;
          top: -80px;
          left: -80px;
          width: 220px;
          height: 220px;
          background: radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .cs-sidebar::after {
          content: '';
          position: absolute;
          bottom: 60px;
          right: -60px;
          width: 160px;
          height: 160px;
          background: radial-gradient(circle, rgba(96,165,250,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
        .cs-logo-area {
          padding: 24px 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .cs-logo-badge {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cs-logo-icon {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, #3b82f6, #60a5fa);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(59,130,246,0.4);
          flex-shrink: 0;
        }
        .cs-logo-text {
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: #f0f9ff;
          letter-spacing: -0.3px;
        }
        .cs-logo-sub {
          font-size: 10px;
          color: rgba(148,163,184,0.8);
          font-weight: 400;
          letter-spacing: 0.5px;
          margin-top: 1px;
        }
        .cs-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 16px 12px;
          flex: 1;
        }
        .cs-nav-label {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: rgba(148,163,184,0.5);
          padding: 0 8px;
          margin-bottom: 6px;
          margin-top: 4px;
        }
        .cs-nav-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          text-align: left;
          width: 100%;
          transition: all 0.18s ease;
          position: relative;
          overflow: hidden;
          color: rgba(186,210,235,0.85);
          background: transparent;
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
        }
        .cs-nav-btn:hover {
          background: rgba(255,255,255,0.07);
          color: #e0f2fe;
          transform: translateX(2px);
        }
        .cs-nav-btn.active {
          background: linear-gradient(135deg, rgba(59,130,246,0.35), rgba(96,165,250,0.2));
          color: #e0f2fe;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(59,130,246,0.2);
          border: 1px solid rgba(96,165,250,0.25);
        }
        .cs-nav-btn.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 20%;
          height: 60%;
          width: 3px;
          background: linear-gradient(180deg, #60a5fa, #3b82f6);
          border-radius: 0 3px 3px 0;
        }
        .cs-nav-icon {
          opacity: 0.7;
          flex-shrink: 0;
          transition: opacity 0.18s;
        }
        .cs-nav-btn.active .cs-nav-icon,
        .cs-nav-btn:hover .cs-nav-icon {
          opacity: 1;
        }
        .cs-profile-area {
          margin: 0 12px 16px;
          padding: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          backdrop-filter: blur(8px);
        }
        .cs-profile-info {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .cs-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(59,130,246,0.3);
        }
        .cs-profile-name {
          font-size: 12px;
          font-weight: 600;
          color: #e0f2fe;
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
        }
        .cs-profile-role {
          font-size: 10px;
          color: rgba(148,163,184,0.7);
        }
        .cs-logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 8px 12px;
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 8px;
          color: rgba(252,165,165,0.9);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
        }
        .cs-logout-btn:hover {
          background: rgba(239,68,68,0.22);
          border-color: rgba(239,68,68,0.4);
          color: #fca5a5;
        }
      `}</style>

      <aside className="cs-sidebar">
        <div className="cs-logo-area">
          <div className="cs-logo-badge">
            <div className="cs-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <div className="cs-logo-text">ClassSense</div>
              <div className="cs-logo-sub">Gesture Monitoring</div>
            </div>
          </div>
        </div>

        <nav className="cs-nav">
          <div className="cs-nav-label">Navigation</div>
          {["Dashboard", "Class Activity", "Start Class", "Class Setup"].map((item) => (
            <button
              key={item}
              onClick={() => setActive(item)}
              className={`cs-nav-btn ${active === item ? "active" : ""}`}
            >
              <span className="cs-nav-icon">{NAV_ICONS[item]}</span>
              {item}
            </button>
          ))}
        </nav>

        <div className="cs-profile-area">
          <div className="cs-profile-info">
            <div className="cs-avatar">A</div>
            <div>
              <div className="cs-profile-name">ANGEL THE POGI</div>
              <div className="cs-profile-role">Teacher</div>
            </div>
          </div>
          <button className="cs-logout-btn" onClick={onLogout}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}