import { createPortal } from 'react-dom'

const RULES = {
  Lecture: {
    allowed: ['Hand Raise', 'Peace Sign', 'Thumbs Up', 'Thumbs Down', 'OK Sign', 'Clapping', 'Walking', 'Head Moving'],
    warning: [],
    description: 'Lecture mode is open — all gestures are allowed. Students may freely express reactions.',
    color: '#3b82f6',
    bg: 'linear-gradient(135deg,#1e3a5f,#1e293b)',
    icon: '📖',
  },
  Quiz: {
    allowed: ['Hand Raise', 'Peace Sign', 'Thumbs Up', 'Thumbs Down', 'OK Sign'],
    warning: ['Clapping', 'Walking', 'Head Moving', 'Moving Chair'],
    description: 'Quiz mode — limited gestures allowed. Disruptive or suspicious behavior will trigger alerts.',
    color: '#f59e0b',
    bg: 'linear-gradient(135deg,#3d2800,#1e293b)',
    icon: '📝',
  },
  Exam: {
    allowed: ['Hand Raise'],
    warning: ['Peace Sign', 'Thumbs Up', 'Thumbs Down', 'OK Sign', 'Clapping', 'Walking', 'Head Moving', 'Moving Chair'],
    description: 'Exam mode — strict monitoring. Only Hand Raise is allowed. All other gestures will trigger alerts.',
    color: '#ef4444',
    bg: 'linear-gradient(135deg,#3d0000,#1e293b)',
    icon: '🔒',
  },
}

const GESTURE_ICONS = {
  'Hand Raise':   '✋',
  'Peace Sign':   '✌️',
  'Thumbs Up':    '👍',
  'Thumbs Down':  '👎',
  'OK Sign':      '👌',
  'Clapping':     '👏',
  'Walking':      '🚶',
  'Head Moving':  '🔄',
  'Moving Chair': '🪑',
}

export default function ActivityRulesModal({ mode, onConfirm }) {
  const rule = RULES[mode] || RULES['Lecture']

  return createPortal(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .arm-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 99999;
          font-family: 'DM Sans','Segoe UI',sans-serif;
          padding: 20px;
        }
        .arm-card {
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.6);
          width: 560px;
          max-width: 95vw;
          max-height: 90vh;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .arm-header {
          padding: 28px 28px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .arm-mode-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 20px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.5px;
          text-transform: uppercase; margin-bottom: 14px;
        }
        .arm-title {
          font-size: 22px; font-weight: 700; color: #f0f9ff;
          letter-spacing: -0.5px; margin-bottom: 8px;
        }
        .arm-desc {
          font-size: 13px; color: rgba(148,163,184,0.85); line-height: 1.6;
        }
        .arm-body { padding: 24px 28px; }
        .arm-section-title {
          font-size: 10px; font-weight: 700; letter-spacing: 1px;
          text-transform: uppercase; margin-bottom: 12px;
          display: flex; align-items: center; gap: 8px;
        }
        .arm-section-title::after {
          content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.08);
        }
        .arm-gesture-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 8px; margin-bottom: 20px;
        }
        .arm-gesture-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 10px;
          font-size: 13px; font-weight: 500;
        }
        .arm-gesture-icon { font-size: 18px; flex-shrink: 0; }
        .arm-gesture-name { flex: 1; }
        .arm-gesture-badge {
          font-size: 9px; font-weight: 700; padding: 2px 7px;
          border-radius: 20px; letter-spacing: 0.3px; text-transform: uppercase;
          flex-shrink: 0;
        }
        .arm-allowed {
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.2);
          color: rgba(110,231,183,0.9);
        }
        .arm-allowed .arm-gesture-badge {
          background: rgba(16,185,129,0.2);
          color: #6ee7b7;
        }
        .arm-warning {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.18);
          color: rgba(252,165,165,0.9);
        }
        .arm-warning .arm-gesture-badge {
          background: rgba(239,68,68,0.2);
          color: #fca5a5;
        }
        .arm-notice {
          background: rgba(245,158,11,0.08);
          border: 1px solid rgba(245,158,11,0.2);
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 12px;
          color: rgba(253,230,138,0.9);
          line-height: 1.6;
          margin-bottom: 24px;
          display: flex; gap: 10px; align-items: flex-start;
        }
        .arm-footer { padding: 0 28px 28px; }
        .arm-confirm-btn {
          width: 100%; padding: 14px;
          border: none; border-radius: 12px;
          font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.2s ease;
          font-family: 'DM Sans','Segoe UI',sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          letter-spacing: 0.2px;
        }
      `}</style>
      <div className="arm-overlay">
        <div className="arm-card">
          <div className="arm-header">
            <div
              className="arm-mode-badge"
              style={{ background: `${rule.color}22`, color: rule.color, border: `1px solid ${rule.color}44` }}
            >
              {rule.icon} {mode} Mode
            </div>
            <div className="arm-title">Gesture Rules for This Session</div>
            <div className="arm-desc">{rule.description}</div>
          </div>

          <div className="arm-body">
            {rule.allowed.length > 0 && (
              <>
                <div className="arm-section-title" style={{ color: '#10b981' }}>
                  ✅ Allowed Gestures
                </div>
                <div className="arm-gesture-grid">
                  {rule.allowed.map(g => (
                    <div key={g} className="arm-gesture-item arm-allowed">
                      <span className="arm-gesture-icon">{GESTURE_ICONS[g] || '👋'}</span>
                      <span className="arm-gesture-name">{g}</span>
                      <span className="arm-gesture-badge">Allowed</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {rule.warning.length > 0 && (
              <>
                <div className="arm-section-title" style={{ color: '#ef4444' }}>
                  🚨 Alert Gestures
                </div>
                <div className="arm-gesture-grid">
                  {rule.warning.map(g => (
                    <div key={g} className="arm-gesture-item arm-warning">
                      <span className="arm-gesture-icon">{GESTURE_ICONS[g] || '🚫'}</span>
                      <span className="arm-gesture-name">{g}</span>
                      <span className="arm-gesture-badge">Alert</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="arm-notice">
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
              <span>
                Alert gestures will be logged and flagged immediately. Notifications will appear in real-time during the session. Make sure students are aware of the rules before starting.
              </span>
            </div>
          </div>

          <div className="arm-footer">
            <button
              className="arm-confirm-btn"
              onClick={onConfirm}
              style={{
                background: `linear-gradient(135deg, ${rule.color}, ${rule.color}cc)`,
                color: 'white',
                boxShadow: `0 4px 20px ${rule.color}44`,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Got it — Start Monitoring
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}