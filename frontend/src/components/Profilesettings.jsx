import { useState } from 'react'

export default function ProfileSettings({ setupPrefs, updateSetupPrefs, onLogout }) {
  const [teacherName, setTeacherName] = useState(setupPrefs?.teacher_name || 'ANGEL THE POGI')
  const [role, setRole] = useState(setupPrefs?.role || 'Teacher')
  const [school, setSchool] = useState(setupPrefs?.school || 'Western Mindanao State University')
  const [department, setDepartment] = useState(setupPrefs?.department || 'College of Computing Studies')
  const [email, setEmail] = useState(setupPrefs?.email || '')
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('profile')

  const initials = teacherName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const handleSave = () => {
    if (updateSetupPrefs) {
      updateSetupPrefs({
        ...setupPrefs,
        teacher_name: teacherName,
        role,
        school,
        department,
        email,
      })
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  const sections = [
    { id: 'profile', label: 'Profile', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    )},
    { id: 'system', label: 'System', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      </svg>
    )},
    { id: 'about', label: 'About', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    )},
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .ps-body { flex:1; overflow:auto; padding:28px; background:#f1f5f9; font-family:'DM Sans','Segoe UI',sans-serif; }
        .ps-layout { display:grid; grid-template-columns:220px 1fr; gap:20px; max-width:860px; margin:0 auto; }
        .ps-sidebar-card {
          background:rgba(255,255,255,0.7); backdrop-filter:blur(20px);
          border:1px solid rgba(255,255,255,0.6); border-radius:18px;
          box-shadow:0 4px 24px rgba(0,0,0,0.06); overflow:hidden;
          height:fit-content;
        }
        .ps-profile-hero {
          padding:24px 20px; text-align:center;
          background:linear-gradient(135deg,rgba(59,130,246,0.08),rgba(96,165,250,0.04));
          border-bottom:1px solid rgba(0,0,0,0.05);
        }
        .ps-avatar-big {
          width:72px; height:72px; border-radius:50%;
          background:linear-gradient(135deg,#3b82f6,#1d4ed8);
          display:flex; align-items:center; justify-content:center;
          font-size:24px; font-weight:700; color:white;
          margin:0 auto 12px;
          box-shadow:0 8px 24px rgba(59,130,246,0.35);
          border:3px solid rgba(255,255,255,0.8);
        }
        .ps-hero-name { font-size:14px; font-weight:700; color:#0f172a; margin-bottom:3px; }
        .ps-hero-role { font-size:11px; color:#64748b; font-weight:500; }
        .ps-nav { padding:8px; }
        .ps-nav-btn {
          width:100%; display:flex; align-items:center; gap:9px;
          padding:9px 12px; border-radius:9px; border:none;
          font-size:13px; font-weight:500; cursor:pointer;
          font-family:'DM Sans','Segoe UI',sans-serif; transition:all 0.15s ease;
          text-align:left; margin-bottom:2px;
        }
        .ps-nav-btn.active { background:rgba(59,130,246,0.1); color:#1d4ed8; font-weight:600; }
        .ps-nav-btn.inactive { background:transparent; color:#475569; }
        .ps-nav-btn.inactive:hover { background:rgba(0,0,0,0.04); color:#0f172a; }
        .ps-main-card {
          background:rgba(255,255,255,0.7); backdrop-filter:blur(20px);
          border:1px solid rgba(255,255,255,0.6); border-radius:18px;
          box-shadow:0 4px 24px rgba(0,0,0,0.06); padding:28px;
        }
        .ps-section-header { margin-bottom:24px; }
        .ps-section-title { font-size:17px; font-weight:700; color:#0f172a; letter-spacing:-0.4px; margin-bottom:4px; }
        .ps-section-sub { font-size:12px; color:#94a3b8; }
        .ps-divider-title {
          font-size:10px; font-weight:700; color:#64748b;
          letter-spacing:0.8px; text-transform:uppercase;
          margin-bottom:12px; margin-top:20px;
          display:flex; align-items:center; gap:8px;
        }
        .ps-divider-title::after { content:''; flex:1; height:1px; background:rgba(0,0,0,0.07); }
        .ps-field { display:flex; flex-direction:column; gap:5px; margin-bottom:14px; }
        .ps-label { font-size:11px; font-weight:700; color:#64748b; letter-spacing:0.4px; text-transform:uppercase; }
        .ps-input {
          padding:10px 14px;
          background:rgba(255,255,255,0.6); backdrop-filter:blur(8px);
          border:1px solid rgba(0,0,0,0.09); border-radius:10px;
          font-size:13px; color:#0f172a;
          font-family:'DM Sans','Segoe UI',sans-serif;
          transition:all 0.18s ease; outline:none;
          box-shadow:inset 0 1px 3px rgba(0,0,0,0.04);
        }
        .ps-input::placeholder { color:rgba(148,163,184,0.7); }
        .ps-input:focus {
          border-color:rgba(59,130,246,0.5); background:rgba(255,255,255,0.88);
          box-shadow:0 0 0 3px rgba(59,130,246,0.1), inset 0 1px 3px rgba(0,0,0,0.03);
        }
        .ps-input-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .ps-actions { display:flex; align-items:center; gap:10px; margin-top:24px; padding-top:20px; border-top:1px solid rgba(0,0,0,0.06); }
        .ps-save-btn {
          display:flex; align-items:center; gap:7px;
          padding:10px 24px; border-radius:10px;
          font-size:13px; font-weight:700; border:none; cursor:pointer;
          font-family:'DM Sans','Segoe UI',sans-serif; transition:all 0.22s ease;
        }
        .ps-save-btn.default { background:linear-gradient(135deg,#3b82f6,#2563eb); color:white; box-shadow:0 4px 14px rgba(59,130,246,0.35); }
        .ps-save-btn.default:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(59,130,246,0.45); }
        .ps-save-btn.success { background:linear-gradient(135deg,#10b981,#059669); color:white; }
        .ps-info-row {
          display:flex; align-items:center; justify-content:space-between;
          padding:12px 0; border-bottom:1px solid rgba(0,0,0,0.05);
        }
        .ps-info-row:last-child { border-bottom:none; }
        .ps-info-label { font-size:13px; color:#475569; font-weight:500; }
        .ps-info-value { font-size:13px; color:#0f172a; font-weight:600; }
        .ps-badge {
          font-size:10px; font-weight:700; padding:3px 8px; border-radius:6px;
          letter-spacing:0.3px; text-transform:uppercase;
        }
        .ps-logout-danger {
          width:100%; display:flex; align-items:center; justify-content:center; gap:7px;
          padding:10px; border-radius:9px; margin-top:8px;
          background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2);
          color:#ef4444; font-size:13px; font-weight:700; cursor:pointer;
          font-family:'DM Sans','Segoe UI',sans-serif; transition:all 0.18s ease;
        }
        .ps-logout-danger:hover { background:rgba(239,68,68,0.15); }
      `}</style>

      <main className="ps-body">
        <div className="ps-layout">
          {/* Sidebar */}
          <div className="ps-sidebar-card">
            <div className="ps-profile-hero">
              <div className="ps-avatar-big">{initials}</div>
              <div className="ps-hero-name">{teacherName}</div>
              <div className="ps-hero-role">{role}</div>
            </div>
            <div className="ps-nav">
              {sections.map(s => (
                <button
                  key={s.id}
                  className={`ps-nav-btn ${activeSection === s.id ? 'active' : 'inactive'}`}
                  onClick={() => setActiveSection(s.id)}
                >
                  <span style={{ opacity: activeSection === s.id ? 1 : 0.6 }}>{s.icon}</span>
                  {s.label}
                </button>
              ))}
              <button className="ps-logout-danger" onClick={onLogout}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="ps-main-card">
            {activeSection === 'profile' && (
              <>
                <div className="ps-section-header">
                  <div className="ps-section-title">Profile Settings</div>
                  <div className="ps-section-sub">Manage your personal information and preferences</div>
                </div>

                <div className="ps-divider-title">Personal Information</div>
                <div className="ps-input-grid">
                  <div className="ps-field">
                    <label className="ps-label">Full Name</label>
                    <input className="ps-input" value={teacherName} onChange={e => setTeacherName(e.target.value)} placeholder="Your full name" />
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">Role</label>
                    <input className="ps-input" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Teacher, Professor" />
                  </div>
                </div>
                <div className="ps-field">
                  <label className="ps-label">Email Address</label>
                  <input className="ps-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
                </div>

                <div className="ps-divider-title">Institution</div>
                <div className="ps-field">
                  <label className="ps-label">School / University</label>
                  <input className="ps-input" value={school} onChange={e => setSchool(e.target.value)} placeholder="School name" />
                </div>
                <div className="ps-field">
                  <label className="ps-label">Department / College</label>
                  <input className="ps-input" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Department name" />
                </div>

                <div className="ps-actions">
                  <button onClick={handleSave} className={`ps-save-btn ${saved ? 'success' : 'default'}`}>
                    {saved ? (
                      <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Saved!</>
                    ) : (
                      <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Changes</>
                    )}
                  </button>
                </div>
              </>
            )}

            {activeSection === 'system' && (
              <>
                <div className="ps-section-header">
                  <div className="ps-section-title">System Info</div>
                  <div className="ps-section-sub">Technical details about your ClassSense installation</div>
                </div>
                <div className="ps-divider-title">Application</div>
                {[
                  ['System', 'ClassSense'],
                  ['Version', 'v1.0.0'],
                  ['Backend', 'Django REST Framework'],
                  ['Frontend', 'React + Vite'],
                  ['ML Engine', 'TensorFlow / MediaPipe'],
                  ['API Base', 'http://localhost:8000/api'],
                ].map(([label, value]) => (
                  <div key={label} className="ps-info-row">
                    <span className="ps-info-label">{label}</span>
                    <span className="ps-info-value">{value}</span>
                  </div>
                ))}
                <div className="ps-divider-title">Status</div>
                {[
                  ['Backend Status', <span className="ps-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>Online</span>],
                  ['WebSocket', <span className="ps-badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>Active</span>],
                  ['ML Model', <span className="ps-badge" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>Loaded</span>],
                ].map(([label, value]) => (
                  <div key={label} className="ps-info-row">
                    <span className="ps-info-label">{label}</span>
                    {value}
                  </div>
                ))}
              </>
            )}

            {activeSection === 'about' && (
              <>
                <div className="ps-section-header">
                  <div className="ps-section-title">About ClassSense</div>
                  <div className="ps-section-sub">AI-powered classroom gesture recognition system</div>
                </div>
                <div style={{ textAlign: 'center', padding: '20px 0 28px' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg,#3b82f6,#60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(59,130,246,0.3)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: -0.4, marginBottom: 6 }}>ClassSense</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>Gesture Monitoring System — v1.0.0</div>
                </div>
                <div className="ps-divider-title">Project Info</div>
                {[
                  ['Course', 'IT 322 – Machine Learning'],
                  ['Institution', 'Western Mindanao State University'],
                  ['College', 'College of Computing Studies'],
                  ['Program', 'BSIT 3A | 3B'],
                  ['Instructor', 'Mr. John Augustus'],
                ].map(([label, value]) => (
                  <div key={label} className="ps-info-row">
                    <span className="ps-info-label">{label}</span>
                    <span className="ps-info-value" style={{ fontSize: 12, color: '#64748b' }}>{value}</span>
                  </div>
                ))}
                <div className="ps-divider-title">Developers</div>
                {['Alih, Salman L.', 'Benedicto, Hernane A.', 'Canilang, Kurt Aldrich', 'Enriquez, John Paul', 'Garcia, Angel M.', 'Madrazo, Alexandra Steffi Marie', 'Zaragoza, Marvin Paul'].map(name => (
                  <div key={name} className="ps-info-row">
                    <span className="ps-info-label" style={{ fontSize: 12 }}>{name}</span>
                    <span className="ps-badge" style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>Developer</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </main>
    </>
  )
}