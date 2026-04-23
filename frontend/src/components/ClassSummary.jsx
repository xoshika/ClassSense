import React, { useMemo } from "react";

export default function ClassSummary({ classSetup, gestureLog, onSaveProgress, onStartNewClass, onDiscard }) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // Compute real stats from gestureLog
  const computedStats = useMemo(() => {
    const totalGestures = gestureLog.length
    const uniqueStudents = new Set(gestureLog.map(r => r.student || r.rankChair).filter(Boolean)).size
    const alerts = gestureLog.filter(r => r.isAlert || r.alert).length
    const uniqueGestureTypes = new Set(gestureLog.map(r => r.gesture).filter(Boolean)).size

    // Aggregate gestures per student
    const studentMap = {}
    gestureLog.forEach(row => {
      const key = row.student || row.rankChair || 'Unknown'
      if (!studentMap[key]) studentMap[key] = { name: key, chair: row.rankChair, count: 0 }
      studentMap[key].count++
    })
    const ranked = Object.values(studentMap).sort((a, b) => b.count - a.count)

    return { totalGestures, uniqueStudents, alerts, uniqueGestureTypes, ranked }
  }, [gestureLog])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .cs-sum-root { flex: 1; display: flex; flex-direction: column; overflow: hidden; font-family: 'DM Sans','Segoe UI',sans-serif; }
        .cs-sum-topbar {
          background: rgba(15,23,42,0.97); backdrop-filter: blur(20px);
          padding: 0 28px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0; border-bottom: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 2px 16px rgba(0,0,0,0.2);
        }
        .cs-sum-topbar-left { display: flex; align-items: center; gap: 10px; }
        .cs-sum-topbar-title { font-size: 18px; font-weight: 700; color: #f0f9ff; letter-spacing: -0.4px; }
        .cs-sum-topbar-sub { font-size: 12px; color: rgba(148,163,184,0.7); background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); padding: 3px 10px; border-radius: 6px; }
        .cs-sum-avatar { width: 34px; height: 34px; background: linear-gradient(135deg,#3b82f6,#1d4ed8); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(59,130,246,0.3); }
        .cs-sum-body { flex: 1; overflow: auto; padding: 24px 28px; background: #f1f5f9; }
        .cs-sum-inner { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
        .cs-sum-card {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.6);
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9);
          padding: 22px 24px;
        }
        .cs-sum-card-title { font-size: 14px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; margin-bottom: 16px; }
        .cs-sum-meta-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 12px; }
        .cs-sum-meta-item {}
        .cs-sum-meta-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .cs-sum-meta-value { font-size: 14px; font-weight: 600; color: #0f172a; }
        .cs-sum-stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
        .cs-sum-stat-item {
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 12px; padding: 14px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8);
          transition: all 0.18s ease;
        }
        .cs-sum-stat-item:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
        .cs-sum-stat-label { font-size: 10px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px; }
        .cs-sum-stat-value { font-size: 26px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; }
        .cs-sum-divider { height: 1px; background: rgba(0,0,0,0.06); margin: 4px 0; }
        .cs-sum-table { width: 100%; border-collapse: collapse; }
        .cs-sum-thead th {
          padding: 9px 12px; text-align: left;
          font-size: 10px; font-weight: 700; color: #94a3b8;
          background: rgba(248,250,252,0.8); text-transform: uppercase; letter-spacing: 0.6px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .cs-sum-tbody tr { border-bottom: 1px solid rgba(0,0,0,0.04); transition: background 0.15s ease; }
        .cs-sum-tbody tr:hover { background: rgba(248,250,252,0.6); }
        .cs-sum-tbody td { padding: 9px 12px; font-size: 12px; color: #475569; }
        .cs-sum-empty { padding: 24px; text-align: center; font-size: 13px; color: #94a3b8; }
        .cs-sum-actions { display: flex; gap: 10px; }
        .cs-sum-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 11px 22px; border-radius: 10px;
          font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: 'DM Sans','Segoe UI',sans-serif;
          transition: all 0.18s ease; border: none;
        }
        .cs-sum-btn.save { background: linear-gradient(135deg,#3b82f6,#2563eb); color: white; box-shadow: 0 4px 14px rgba(59,130,246,0.35); }
        .cs-sum-btn.save:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(59,130,246,0.45); }
        .cs-sum-btn.new { background: linear-gradient(135deg,#10b981,#059669); color: white; box-shadow: 0 4px 14px rgba(16,185,129,0.3); }
        .cs-sum-btn.new:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(16,185,129,0.4); }
        .cs-sum-btn.discard {
          background: rgba(255,255,255,0.6); backdrop-filter: blur(8px);
          border: 1px solid rgba(0,0,0,0.09) !important; color: #64748b;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .cs-sum-btn.discard:hover { background: rgba(255,255,255,0.85); transform: translateY(-1px); }
      `}</style>

      <div className="cs-sum-root">
        <header className="cs-sum-topbar">
          <div className="cs-sum-topbar-left">
            <div style={{ width: 4, height: 20, background: 'linear-gradient(180deg,#3b82f6,#60a5fa)', borderRadius: 4 }} />
            <span className="cs-sum-topbar-title">Start Class</span>
            <span className="cs-sum-topbar-sub">Subject: {classSetup.subjectName || 'Machine Learning'}</span>
          </div>
          <div className="cs-sum-avatar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        </header>

        <main className="cs-sum-body">
          <div className="cs-sum-inner">
            <div className="cs-sum-card">
              <div className="cs-sum-card-title">Class Summary</div>
              <div className="cs-sum-meta-grid">
                {[
                  { label: 'Subject', value: classSetup.subjectName },
                  { label: 'Teacher', value: classSetup.teacherName },
                  { label: 'Mode', value: classSetup.activityMode },
                  { label: 'Duration', value: classSetup.duration || '—' },
                  { label: 'Date', value: today },
                ].map(({ label, value }) => (
                  <div key={label} className="cs-sum-meta-item">
                    <div className="cs-sum-meta-label">{label}</div>
                    <div className="cs-sum-meta-value">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cs-sum-card">
              <div className="cs-sum-card-title">Class Statistics</div>
              <div className="cs-sum-stats-grid">
                {[
                  { label: 'Total Gestures', value: computedStats.totalGestures },
                  { label: 'Students Participated', value: computedStats.uniqueStudents },
                  { label: 'Total Alerts', value: computedStats.alerts },
                  { label: 'Gesture Types', value: computedStats.uniqueGestureTypes },
                ].map(({ label, value }) => (
                  <div key={label} className="cs-sum-stat-item">
                    <div className="cs-sum-stat-label">{label}</div>
                    <div className="cs-sum-stat-value">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cs-sum-card">
              <div className="cs-sum-card-title">Participation Ranking</div>
              <table className="cs-sum-table">
                <thead className="cs-sum-thead">
                  <tr>
                    {['Rank','Student','Chair','Gestures','Top Gesture'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody className="cs-sum-tbody">
                  {computedStats.ranked.length === 0 ? (
                    <tr><td colSpan="5" className="cs-sum-empty">No participation data</td></tr>
                  ) : (
                    computedStats.ranked.map((row, i) => {
                      const topGesture = gestureLog
                        .filter(r => (r.student || r.rankChair) === row.name)
                        .reduce((acc, r) => {
                          acc[r.gesture] = (acc[r.gesture] || 0) + 1
                          return acc
                        }, {})
                      const top = Object.entries(topGesture).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 700, color: i === 0 ? '#3b82f6' : '#475569' }}>#{i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{row.name}</td>
                          <td>{row.chair || '—'}</td>
                          <td style={{ fontWeight: 700, color: '#3b82f6' }}>{row.count}</td>
                          <td style={{ textTransform: 'capitalize' }}>{top}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="cs-sum-card">
              <div className="cs-sum-card-title">Full Gesture Log</div>
              <table className="cs-sum-table">
                <thead className="cs-sum-thead">
                  <tr>
                    {['Time','Date','Gesture','Chair','Mode'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody className="cs-sum-tbody">
                  {gestureLog.length === 0 ? (
                    <tr><td colSpan="5" className="cs-sum-empty">No gesture data recorded</td></tr>
                  ) : (
                    gestureLog.map((row, i) => (
                      <tr key={i}>
                        <td>{row.time || '—'}</td>
                        <td>{row.date || '—'}</td>
                        <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{row.gesture}</td>
                        <td>{row.rankChair || '—'}</td>
                        <td>{row.activityMode || classSetup.activityMode}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="cs-sum-actions">
              <button className="cs-sum-btn save" onClick={onSaveProgress}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
                Save Progress
              </button>
              <button className="cs-sum-btn new" onClick={onStartNewClass}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Start New Class
              </button>
              <button className="cs-sum-btn discard" onClick={onDiscard}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Discard
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}