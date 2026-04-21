import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import DateCalendar from "./DateCalendar";

export default function ReadyToStartClass({ onNotNow, onProceedToSetup, selectedDate, onDateSelect }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [liveDateTime, setLiveDateTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now  = new Date();
      const date = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLiveDateTime(`${date} | ${time}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .rtsc-root { flex: 1; display: flex; flex-direction: column; overflow: hidden; font-family: 'DM Sans','Segoe UI',sans-serif; }
        .rtsc-topbar {
          background: rgba(15,23,42,0.97);
          backdrop-filter: blur(20px);
          padding: 0 28px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 2px 16px rgba(0,0,0,0.2);
        }
        .rtsc-topbar-left { display: flex; align-items: center; gap: 10px; }
        .rtsc-topbar-title { font-size: 18px; font-weight: 700; color: #f0f9ff; letter-spacing: -0.4px; }
        .rtsc-datetime-btn {
          display: flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; padding: 6px 12px; cursor: pointer;
          color: rgba(186,210,235,0.9); font-size: 12px; font-weight: 500;
          font-family: 'DM Sans','Segoe UI',sans-serif; transition: all 0.18s ease;
        }
        .rtsc-datetime-btn:hover { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.3); }
        .rtsc-avatar { width: 34px; height: 34px; background: linear-gradient(135deg,#3b82f6,#1d4ed8); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(59,130,246,0.3); }
        .rtsc-body {
          flex: 1; overflow: auto;
          background: #f1f5f9;
          display: flex; align-items: center; justify-content: center;
          padding: 40px 20px;
        }
        .rtsc-card {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.6);
          border-radius: 24px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9);
          padding: 48px 52px;
          width: 100%;
          max-width: 460px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .rtsc-card::before {
          content: '';
          position: absolute;
          top: -60px; left: -60px;
          width: 180px; height: 180px;
          background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .rtsc-icon-wrap {
          width: 72px; height: 72px;
          background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(96,165,250,0.08));
          border: 1px solid rgba(59,130,246,0.2);
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
          font-size: 34px;
        }
        .rtsc-title {
          font-size: 24px; font-weight: 700; color: #0f172a;
          letter-spacing: -0.5px; margin-bottom: 12px;
        }
        .rtsc-desc {
          font-size: 14px; color: #64748b; line-height: 1.7;
          margin-bottom: 36px;
        }
        .rtsc-actions { display: flex; gap: 12px; justify-content: center; }
        .rtsc-btn-cancel {
          padding: 11px 24px;
          border-radius: 10px;
          font-size: 13px; font-weight: 600;
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0,0,0,0.1);
          color: #475569;
          cursor: pointer;
          font-family: 'DM Sans','Segoe UI',sans-serif;
          transition: all 0.18s ease;
          display: flex; align-items: center; gap: 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .rtsc-btn-cancel:hover {
          background: rgba(255,255,255,0.85);
          border-color: rgba(0,0,0,0.15);
          transform: translateY(-1px);
        }
        .rtsc-btn-proceed {
          padding: 11px 24px;
          border-radius: 10px;
          font-size: 13px; font-weight: 700;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: none;
          color: white;
          cursor: pointer;
          font-family: 'DM Sans','Segoe UI',sans-serif;
          transition: all 0.18s ease;
          display: flex; align-items: center; gap: 7px;
          box-shadow: 0 4px 14px rgba(59,130,246,0.35);
        }
        .rtsc-btn-proceed:hover {
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(59,130,246,0.45);
        }
      `}</style>

      {showCalendar && createPortal(
        <DateCalendar
          selectedDate={selectedDate}
          onDateSelect={(newDate) => { onDateSelect(newDate); setShowCalendar(false); }}
          onClose={() => setShowCalendar(false)}
        />,
        document.body
      )}

      <div className="rtsc-root">
        <header className="rtsc-topbar">
          <div className="rtsc-topbar-left">
            <div style={{ width: 4, height: 20, background: 'linear-gradient(180deg,#3b82f6,#60a5fa)', borderRadius: 4 }} />
            <span className="rtsc-topbar-title">Start Class</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="rtsc-datetime-btn" onClick={() => setShowCalendar(!showCalendar)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {liveDateTime}
            </button>
            <div className="rtsc-avatar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          </div>
        </header>

        <main className="rtsc-body">
          <div className="rtsc-card">
            <div className="rtsc-icon-wrap">🎓</div>
            <h2 className="rtsc-title">Ready to Start a Class?</h2>
            <p className="rtsc-desc">
              You are about to begin a new class session.<br/>
              Set up your activity mode, chair ranking,<br/>
              and custom session parameters.
            </p>
            <div className="rtsc-actions">
              <button className="rtsc-btn-cancel" onClick={onNotNow}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Not Now
              </button>
              <button className="rtsc-btn-proceed" onClick={onProceedToSetup}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Proceed to Setup
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}