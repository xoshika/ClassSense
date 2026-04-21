import { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:8000/api'

const filterOptions = ['All', 'Hand Raise', 'Peace Sign', 'Writing', 'Head Moving']
const sortOptions = ['Newest', 'Oldest', 'By Rank', 'By Student', 'By Gesture']

const GESTURE_COLORS = {
  raised_hand: '#10b981',
  hand_raise: '#10b981',
  peace_sign: '#3b82f6',
  writing: '#a855f7',
  head_moving: '#f59e0b',
  default: '#64748b',
}

function getGestureColor(gesture) {
  const key = gesture?.toLowerCase().replace(/\s/g, '_')
  return GESTURE_COLORS[key] || GESTURE_COLORS.default
}

export default function ClassActivity({ selectedDate }) {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('Newest')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  useEffect(() => {
    const dateStr = selectedDate.toISOString().split('T')[0]
    fetch(`${API_BASE}/activity/logs/?date=${dateStr}`)
      .then(r => r.json())
      .then(data => setLogs(data))
      .catch(console.error)
  }, [selectedDate])

  const filteredLogs = logs
    .filter(log => {
      if (filter === 'All') return true
      return log.gesture?.toLowerCase().includes(filter.toLowerCase().replace(' ', '_'))
    })
    .sort((a, b) => {
      switch (sort) {
        case 'Newest': return b.id - a.id
        case 'Oldest': return a.id - b.id
        case 'By Rank': return (a.chair_rank || 0) - (b.chair_rank || 0)
        case 'By Student': return (a.student_name || '').localeCompare(b.student_name || '')
        case 'By Gesture': return (a.gesture || '').localeCompare(b.gesture || '')
        default: return 0
      }
    })

  return (
    <>
      <style>{`
        .ca-root {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
        }
        .ca-toolbar {
          background: rgba(15,23,42,0.96);
          backdrop-filter: blur(20px);
          padding: 12px 28px;
          display: flex;
          align-items: center;
          gap: 24px;
          flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .ca-toolbar-label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(148,163,184,0.7);
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }
        .ca-dropdown-wrap { position: relative; }
        .ca-dropdown-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          padding: 7px 14px;
          color: #e0f2fe;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          min-width: 110px;
          justify-content: space-between;
        }
        .ca-dropdown-btn:hover {
          background: rgba(59,130,246,0.15);
          border-color: rgba(59,130,246,0.3);
        }
        .ca-dropdown-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          background: #1e293b;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.4);
          z-index: 100;
          min-width: 140px;
          overflow: hidden;
          padding: 4px;
        }
        .ca-dropdown-item {
          width: 100%;
          text-align: left;
          padding: 8px 12px;
          font-size: 13px;
          color: rgba(186,210,235,0.85);
          cursor: pointer;
          border: none;
          background: none;
          border-radius: 7px;
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          transition: all 0.15s ease;
        }
        .ca-dropdown-item:hover { background: rgba(59,130,246,0.15); color: #e0f2fe; }
        .ca-dropdown-item.active { background: rgba(59,130,246,0.2); color: #60a5fa; font-weight: 600; }
        .ca-body {
          flex: 1;
          overflow: auto;
          padding: 24px 28px;
          background: #f1f5f9;
        }
        .ca-table-card {
          background: white;
          border-radius: 16px;
          border: 1px solid rgba(0,0,0,0.05);
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
          overflow: hidden;
        }
        .ca-table-header-row {
          padding: 16px 20px 14px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .ca-table-title {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.2px;
        }
        .ca-table-count {
          font-size: 11px;
          color: #94a3b8;
          background: #f1f5f9;
          padding: 3px 10px;
          border-radius: 20px;
          font-weight: 600;
        }
        .ca-table-cols {
          display: grid;
          grid-template-columns: 1fr 1fr 1.5fr 0.8fr 1fr;
          padding: 10px 20px;
          background: #f8fafc;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .ca-col-label {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }
        .ca-table-body { max-height: 520px; overflow-y: auto; }
        .ca-table-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1.5fr 0.8fr 1fr;
          padding: 12px 20px;
          border-bottom: 1px solid rgba(0,0,0,0.04);
          transition: background 0.15s ease;
          align-items: center;
        }
        .ca-table-row:hover { background: #f8fafc; }
        .ca-table-row:last-child { border-bottom: none; }
        .ca-cell { font-size: 13px; color: #475569; }
        .ca-cell-time { font-size: 12px; color: #64748b; font-variant-numeric: tabular-nums; }
        .ca-gesture-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        .ca-gesture-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .ca-rank-badge {
          font-size: 12px;
          font-weight: 700;
          color: #3b82f6;
          background: rgba(59,130,246,0.08);
          padding: 2px 8px;
          border-radius: 6px;
          display: inline-block;
        }
        .ca-empty-state {
          padding: 60px 20px;
          text-align: center;
        }
        .ca-empty-icon {
          width: 56px;
          height: 56px;
          background: #f1f5f9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
        }
        .ca-empty-title {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 6px;
        }
        .ca-empty-sub {
          font-size: 12px;
          color: #94a3b8;
        }
      `}</style>

      <div className="ca-root">
        <div className="ca-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="ca-toolbar-label">Filter</span>
            <div className="ca-dropdown-wrap">
              <button className="ca-dropdown-btn" onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false) }}>
                <span>{filter}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {filterOpen && (
                <div className="ca-dropdown-menu">
                  {filterOptions.map(opt => (
                    <button key={opt} className={`ca-dropdown-item ${filter === opt ? 'active' : ''}`} onClick={() => { setFilter(opt); setFilterOpen(false) }}>{opt}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="ca-toolbar-label">Sort</span>
            <div className="ca-dropdown-wrap">
              <button className="ca-dropdown-btn" onClick={() => { setSortOpen(!sortOpen); setFilterOpen(false) }}>
                <span>{sort}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {sortOpen && (
                <div className="ca-dropdown-menu">
                  {sortOptions.map(opt => (
                    <button key={opt} className={`ca-dropdown-item ${sort === opt ? 'active' : ''}`} onClick={() => { setSort(opt); setSortOpen(false) }}>{opt}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <main className="ca-body">
          <div className="ca-table-card">
            <div className="ca-table-header-row">
              <span className="ca-table-title">Gesture Log</span>
              <span className="ca-table-count">{filteredLogs.length} entries</span>
            </div>

            <div className="ca-table-cols">
              {['Time', 'Date', 'Gesture', 'Chair', 'Student'].map(col => (
                <div key={col} className="ca-col-label">{col}</div>
              ))}
            </div>

            <div className="ca-table-body">
              {filteredLogs.length === 0 ? (
                <div className="ca-empty-state">
                  <div className="ca-empty-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div className="ca-empty-title">No gesture detected</div>
                  <div className="ca-empty-sub">Classroom is secure. Start a session to begin monitoring.</div>
                </div>
              ) : (
                filteredLogs.map(log => {
                  const color = log.color || getGestureColor(log.gesture)
                  return (
                    <div key={log.id} className="ca-table-row">
                      <div className="ca-cell ca-cell-time">{log.time}</div>
                      <div className="ca-cell ca-cell-time">{log.date}</div>
                      <div className="ca-gesture-badge" style={{ color }}>
                        <span className="ca-gesture-dot" style={{ background: color }} />
                        <span style={{ textTransform: 'capitalize' }}>{log.gesture}</span>
                      </div>
                      <div><span className="ca-rank-badge">#{log.chair_rank}</span></div>
                      <div className="ca-cell">{log.student_name}</div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}