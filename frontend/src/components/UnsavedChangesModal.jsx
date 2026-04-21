// UnsavedChangesModal.jsx
import { createPortal } from 'react-dom'

export function UnsavedChangesModal({ onConfirm, onCancel }) {
  return createPortal(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .ucm-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          z-index: 10000;
          font-family: 'DM Sans','Segoe UI',sans-serif;
        }
        .ucm-card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.6);
          border-radius: 18px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.9);
          padding: 32px 32px 28px;
          width: 380px;
          max-width: 90vw;
        }
        .ucm-icon {
          width: 48px; height: 48px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .ucm-title { font-size: 16px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; margin-bottom: 8px; }
        .ucm-desc { font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
        .ucm-actions { display: flex; gap: 10px; justify-content: flex-end; }
        .ucm-btn-cancel {
          padding: 9px 20px; border-radius: 9px;
          font-size: 13px; font-weight: 600;
          background: rgba(255,255,255,0.6); backdrop-filter: blur(8px);
          border: 1px solid rgba(0,0,0,0.09); color: #475569;
          cursor: pointer; font-family: 'DM Sans','Segoe UI',sans-serif;
          transition: all 0.18s ease;
        }
        .ucm-btn-cancel:hover { background: rgba(255,255,255,0.88); transform: translateY(-1px); }
        .ucm-btn-confirm {
          padding: 9px 20px; border-radius: 9px;
          font-size: 13px; font-weight: 700;
          background: linear-gradient(135deg,#ef4444,#dc2626);
          border: none; color: white;
          cursor: pointer; font-family: 'DM Sans','Segoe UI',sans-serif;
          transition: all 0.18s ease;
          box-shadow: 0 4px 14px rgba(239,68,68,0.3);
        }
        .ucm-btn-confirm:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(239,68,68,0.4); }
      `}</style>
      <div className="ucm-overlay" onClick={onCancel}>
        <div className="ucm-card" onClick={e => e.stopPropagation()}>
          <div className="ucm-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="ucm-title">Unsaved Changes</div>
          <div className="ucm-desc">You have an active class session. Leaving now will discard all progress.</div>
          <div className="ucm-actions">
            <button className="ucm-btn-cancel" onClick={onCancel}>Cancel</button>
            <button className="ucm-btn-confirm" onClick={onConfirm}>Leave Anyway</button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

export default UnsavedChangesModal