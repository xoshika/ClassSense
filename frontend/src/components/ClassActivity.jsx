import { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:8000/api'

function toLocalDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const filterOptions = ['All', 'Hand Raise', 'Peace Sign', 'Writing', 'Head Moving', 'Thumbs Up', 'Clapping', 'OK Sign']
const sortOptions = ['Newest', 'Oldest', 'By Rank', 'By Student', 'By Gesture']

const GESTURE_COLORS = {
  raised_hand:  '#10b981',
  hand_raise:   '#10b981',
  peace_sign:   '#3b82f6',
  writing:      '#a855f7',
  head_moving:  '#f59e0b',
  thumbs_up:    '#06b6d4',
  thumbs_down:  '#ef4444',
  clapping:     '#f97316',
  ok_sign:      '#84cc16',
  walking:      '#6366f1',
  default:      '#64748b',
}

function getGestureColor(gesture) {
  const key = (gesture || '').toLowerCase().replace(/\s/g, '_')
  return GESTURE_COLORS[key] || GESTURE_COLORS.default
}

function buildStudentRankings(logs) {
  const map = {}
  logs.forEach(log => {
    const key = log.student_name || `Chair #${log.chair_rank}` || 'Unknown'
    if (!map[key]) {
      map[key] = {
        name: key,
        chair: log.chair_rank,
        total: 0,
        alerts: 0,
        gestures: {},
        modes: {},
        lastSeen: log.time,
      }
    }
    map[key].total++
    if (log.is_alert) map[key].alerts++
    map[key].gestures[log.gesture] = (map[key].gestures[log.gesture] || 0) + 1
    if (log.activity_mode) map[key].modes[log.activity_mode] = (map[key].modes[log.activity_mode] || 0) + 1
    map[key].lastSeen = log.time
  })

  return Object.values(map).sort((a, b) => b.total - a.total).map((s, i) => ({
    ...s,
    rank: i + 1,
    topGesture: Object.entries(s.gestures).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
    leastGesture: Object.entries(s.gestures).sort((a, b) => a[1] - b[1])[0]?.[0] || '—',
    topMode: Object.entries(s.modes).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
  }))
}

function downloadPDF(logs, rankings, dateLabel) {
  const win = window.open('', '_blank')
  const now = new Date().toLocaleString()

  const rankRows = rankings.map((s, i) => `
    <tr style="background:${i % 2 === 0 ? '#f8fafc' : 'white'}">
      <td style="padding:8px 12px;font-weight:700;color:${i === 0 ? '#3b82f6' : '#0f172a'}">#${s.rank}</td>
      <td style="padding:8px 12px;font-weight:600">${s.name}</td>
      <td style="padding:8px 12px;text-align:center">${s.chair || '—'}</td>
      <td style="padding:8px 12px;text-align:center;font-weight:700;color:#3b82f6">${s.total}</td>
      <td style="padding:8px 12px;text-align:center;color:#ef4444;font-weight:700">${s.alerts}</td>
      <td style="padding:8px 12px;text-transform:capitalize">${(s.topGesture || '').replace(/_/g, ' ')}</td>
      <td style="padding:8px 12px">${s.topMode}</td>
    </tr>
  `).join('')

  const logRows = logs.slice(0, 100).map((log, i) => `
    <tr style="background:${i % 2 === 0 ? '#f8fafc' : 'white'}">
      <td style="padding:6px 10px;color:#64748b">${log.time || '—'}</td>
      <td style="padding:6px 10px;color:#64748b">${log.date || '—'}</td>
      <td style="padding:6px 10px;font-weight:600;text-transform:capitalize">${(log.gesture || '').replace(/_/g, ' ')}</td>
      <td style="padding:6px 10px">${log.chair_rank ? '#' + log.chair_rank : '—'}</td>
      <td style="padding:6px 10px">${log.student_name || '—'}</td>
    </tr>
  `).join('')

  win.document.write(`<!DOCTYPE html><html><head><title>ClassSense Report</title>
  <style>
    body{font-family:'Segoe UI',sans-serif;margin:0;padding:32px;color:#0f172a;background:white}
    h1{font-size:22px;font-weight:700;margin:0 0 4px}
    .sub{font-size:13px;color:#64748b;margin-bottom:24px}
    h2{font-size:15px;font-weight:700;margin:28px 0 12px;padding-bottom:6px;border-bottom:2px solid #e2e8f0}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{padding:8px 12px;text-align:left;background:#1e293b;color:white;font-size:11px;letter-spacing:0.5px;text-transform:uppercase}
    @media print{button{display:none}}
  </style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
    <div>
      <div style="font-size:11px;color:#3b82f6;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">ClassSense — Gesture Monitoring</div>
      <h1>Class Activity Report</h1>
      <div class="sub">Date: ${dateLabel} &nbsp;|&nbsp; Generated: ${now}</div>
    </div>
    <button onclick="window.print()" style="padding:8px 18px;background:#3b82f6;color:white;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">🖨 Print / Save PDF</button>
  </div>

  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px">
    ${[
      ['Total Logs', logs.length, '#3b82f6'],
      ['Students', rankings.length, '#10b981'],
      ['Total Alerts', rankings.reduce((a,s) => a + s.alerts, 0), '#ef4444'],
      ['Gesture Types', [...new Set(logs.map(l => l.gesture))].length, '#a855f7'],
    ].map(([label, val, color]) => `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;text-align:center">
        <div style="font-size:24px;font-weight:700;color:${color}">${val}</div>
        <div style="font-size:11px;color:#64748b;font-weight:600;margin-top:3px">${label}</div>
      </div>
    `).join('')}
  </div>

  <h2>Student Rankings</h2>
  <table>
    <tr><th>Rank</th><th>Student</th><th>Chair</th><th>Gestures</th><th>Alerts</th><th>Top Gesture</th><th>Top Mode</th></tr>
    ${rankRows}
  </table>

  <h2>Full Gesture Log ${logs.length > 100 ? '(showing first 100)' : ''}</h2>
  <table>
    <tr><th>Time</th><th>Date</th><th>Gesture</th><th>Chair</th><th>Student</th></tr>
    ${logRows}
  </table>
  </body></html>`)
  win.document.close()
}

function StudentRankCard({ student, index }) {
  const gestureEntries = Object.entries(student.gestures).sort((a, b) => b[1] - a[1])
  const totalGestures = student.total
  const rankColors = ['#f59e0b', '#94a3b8', '#cd7c3e']
  const rankLabels = ['🥇', '🥈', '🥉']

  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      border: `1px solid ${index === 0 ? 'rgba(245,158,11,0.3)' : index === 1 ? 'rgba(148,163,184,0.3)' : 'rgba(0,0,0,0.06)'}`,
      boxShadow: index < 3 ? `0 4px 20px ${index === 0 ? 'rgba(245,158,11,0.12)' : 'rgba(0,0,0,0.06)'}` : '0 2px 8px rgba(0,0,0,0.04)',
      overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = index < 3 ? `0 4px 20px ${index === 0 ? 'rgba(245,158,11,0.12)' : 'rgba(0,0,0,0.06)'}` : '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      {/* Header */}
      <div style={{
        background: index < 3 ? `linear-gradient(135deg, ${index === 0 ? '#fef3c7,#fde68a' : index === 1 ? '#f1f5f9,#e2e8f0' : '#fdf4ec,#fde8d4'})` : '#f8fafc',
        padding: '14px 16px 12px',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: index < 3 ? `linear-gradient(135deg, ${rankColors[index]}, ${rankColors[index]}cc)` : 'linear-gradient(135deg,#3b82f6,#2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: index < 3 ? 16 : 13, fontWeight: 700,
            boxShadow: `0 3px 10px ${index < 3 ? rankColors[index] : '#3b82f6'}40`,
            flexShrink: 0,
          }}>
            {index < 3 ? rankLabels[index] : `#${index + 1}`}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{student.name}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>Chair #{student.chair || '—'}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: index < 3 ? rankColors[index] : '#3b82f6' }}>{student.total}</div>
          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>gestures</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '10px 16px', gap: 8, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
        {[
          { label: 'Alerts', value: student.alerts, color: student.alerts > 0 ? '#ef4444' : '#10b981' },
          { label: 'Top Mode', value: student.topMode, color: '#3b82f6' },
          { label: 'Last Seen', value: student.lastSeen || '—', color: '#64748b' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Gesture breakdown */}
      <div style={{ padding: '10px 16px 14px' }}>
        <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Gesture Breakdown</div>
        {gestureEntries.length === 0 ? (
          <div style={{ fontSize: 11, color: '#cbd5e1', textAlign: 'center', padding: '8px 0' }}>No gestures</div>
        ) : gestureEntries.slice(0, 4).map(([gesture, count]) => {
          const pct = Math.round((count / totalGestures) * 100)
          const color = getGestureColor(gesture)
          return (
            <div key={gesture} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: '#334155', fontWeight: 500, textTransform: 'capitalize' }}>
                  {gesture.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color }}>{count} <span style={{ fontSize: 9, color: '#94a3b8' }}>({pct}%)</span></span>
              </div>
              <div style={{ height: 4, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          )
        })}
        {gestureEntries.length > 4 && (
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>+{gestureEntries.length - 4} more gesture types</div>
        )}
      </div>

      {/* Alert badge */}
      {student.alerts > 0 && (
        <div style={{
          margin: '0 16px 14px',
          padding: '6px 10px',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8,
          fontSize: 11,
          color: '#ef4444',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          {student.alerts} alert{student.alerts !== 1 ? 's' : ''} flagged
        </div>
      )}
    </div>
  )
}

export default function ClassActivity({ selectedDate }) {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('Newest')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('log') // 'log' | 'rankings'
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const dateStr = toLocalDateStr(selectedDate)
    setLoading(true)
    fetch(`${API_BASE}/activity/logs/?date=${dateStr}`)
      .then(r => r.json())
      .then(data => { setLogs(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedDate])

  const filteredLogs = logs
    .filter(log => {
      if (filter === 'All') return true
      return (log.gesture || '').toLowerCase().includes(filter.toLowerCase().replace(/ /g, '_'))
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

  const rankings = buildStudentRankings(logs)
  const dateLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const totalAlerts = rankings.reduce((a, s) => a + s.alerts, 0)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .ca-root { flex:1; display:flex; flex-direction:column; overflow:hidden; font-family:'DM Sans','Segoe UI',sans-serif; }
        .ca-toolbar {
          background: rgba(15,23,42,0.96); backdrop-filter:blur(20px);
          padding: 0 28px;
          display: flex; align-items:center; gap:16px;
          flex-shrink:0; border-bottom:1px solid rgba(255,255,255,0.06);
          height: 54px;
        }
        .ca-tabs { display:flex; gap:4px; }
        .ca-tab {
          padding: 6px 16px; border-radius:8px; border:none;
          font-size:12px; font-weight:700; cursor:pointer;
          font-family:'DM Sans','Segoe UI',sans-serif; transition:all 0.18s ease;
          letter-spacing:0.3px;
        }
        .ca-tab.active { background:rgba(59,130,246,0.25); color:#60a5fa; border:1px solid rgba(59,130,246,0.3); }
        .ca-tab.inactive { background:transparent; color:rgba(148,163,184,0.7); border:1px solid transparent; }
        .ca-tab.inactive:hover { background:rgba(255,255,255,0.07); color:#e0f2fe; }
        .ca-sep { width:1px; height:22px; background:rgba(255,255,255,0.1); }
        .ca-toolbar-label { font-size:11px; font-weight:600; color:rgba(148,163,184,0.7); letter-spacing:0.8px; text-transform:uppercase; }
        .ca-dropdown-wrap { position:relative; }
        .ca-dropdown-btn {
          display:flex; align-items:center; gap:8px;
          background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12);
          border-radius:8px; padding:6px 12px; color:#e0f2fe;
          font-size:12px; font-weight:600; cursor:pointer; transition:all 0.18s ease;
          font-family:'DM Sans','Segoe UI',sans-serif; min-width:100px; justify-content:space-between;
        }
        .ca-dropdown-btn:hover { background:rgba(59,130,246,0.15); border-color:rgba(59,130,246,0.3); }
        .ca-dropdown-menu {
          position:absolute; top:calc(100% + 6px); left:0;
          background:#1e293b; border:1px solid rgba(255,255,255,0.1);
          border-radius:10px; box-shadow:0 16px 40px rgba(0,0,0,0.4);
          z-index:100; min-width:140px; overflow:hidden; padding:4px;
        }
        .ca-dropdown-item {
          width:100%; text-align:left; padding:7px 12px; font-size:12px;
          color:rgba(186,210,235,0.85); cursor:pointer; border:none;
          background:none; border-radius:7px;
          font-family:'DM Sans','Segoe UI',sans-serif; transition:all 0.15s ease;
        }
        .ca-dropdown-item:hover { background:rgba(59,130,246,0.15); color:#e0f2fe; }
        .ca-dropdown-item.active { background:rgba(59,130,246,0.2); color:#60a5fa; font-weight:600; }
        .ca-dl-btn {
          margin-left:auto; display:flex; align-items:center; gap:6px;
          padding:6px 14px; border-radius:8px; border:1px solid rgba(16,185,129,0.3);
          background:rgba(16,185,129,0.12); color:#34d399;
          font-size:11px; font-weight:700; cursor:pointer; transition:all 0.18s ease;
          font-family:'DM Sans','Segoe UI',sans-serif; letter-spacing:0.3px;
        }
        .ca-dl-btn:hover { background:rgba(16,185,129,0.22); border-color:rgba(16,185,129,0.5); transform:translateY(-1px); }
        .ca-body { flex:1; overflow:auto; padding:20px 28px; background:#f1f5f9; }
        .ca-summary-bar {
          display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:18px;
        }
        .ca-sum-card {
          background:rgba(255,255,255,0.7); backdrop-filter:blur(12px);
          border:1px solid rgba(255,255,255,0.5); border-radius:12px;
          padding:12px 16px; display:flex; align-items:center; gap:10px;
          box-shadow:0 2px 10px rgba(0,0,0,0.05);
        }
        .ca-sum-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ca-sum-label { font-size:10px; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.4px; margin-bottom:2px; }
        .ca-sum-value { font-size:20px; font-weight:700; line-height:1; }
        .ca-table-card {
          background:white; border-radius:16px;
          border:1px solid rgba(0,0,0,0.05);
          box-shadow:0 2px 12px rgba(0,0,0,0.04); overflow:hidden;
        }
        .ca-table-header-row {
          padding:14px 20px 12px; border-bottom:1px solid rgba(0,0,0,0.06);
          display:flex; align-items:center; justify-content:space-between;
        }
        .ca-table-title { font-size:14px; font-weight:700; color:#0f172a; letter-spacing:-0.2px; }
        .ca-table-count { font-size:11px; color:#94a3b8; background:#f1f5f9; padding:3px 10px; border-radius:20px; font-weight:600; }
        .ca-table-cols {
          display:grid; grid-template-columns:1fr 1fr 1.5fr 0.8fr 1fr;
          padding:9px 20px; background:#f8fafc; border-bottom:1px solid rgba(0,0,0,0.05);
        }
        .ca-col-label { font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.8px; text-transform:uppercase; }
        .ca-table-body { max-height:480px; overflow-y:auto; }
        .ca-table-row {
          display:grid; grid-template-columns:1fr 1fr 1.5fr 0.8fr 1fr;
          padding:11px 20px; border-bottom:1px solid rgba(0,0,0,0.04);
          transition:background 0.15s ease; align-items:center;
        }
        .ca-table-row:hover { background:#f8fafc; }
        .ca-table-row:last-child { border-bottom:none; }
        .ca-cell { font-size:12px; color:#475569; }
        .ca-cell-time { font-size:11px; color:#64748b; font-variant-numeric:tabular-nums; }
        .ca-gesture-badge { display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; }
        .ca-gesture-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .ca-rank-badge { font-size:12px; font-weight:700; color:#3b82f6; background:rgba(59,130,246,0.08); padding:2px 8px; border-radius:6px; display:inline-block; }
        .ca-rankings-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:14px; }
        .ca-empty-state { padding:60px 20px; text-align:center; }
        .ca-empty-icon { width:56px; height:56px; background:#f1f5f9; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
        .ca-empty-title { font-size:14px; font-weight:600; color:#64748b; margin-bottom:6px; }
        .ca-empty-sub { font-size:12px; color:#94a3b8; }
        .ca-rank-legend {
          display:flex; align-items:center; gap:12px; margin-bottom:14px;
          padding:10px 14px; background:rgba(255,255,255,0.7); border-radius:10px;
          border:1px solid rgba(255,255,255,0.5); font-size:11px; color:#64748b;
        }
        .ca-rank-legend-item { display:flex; align-items:center; gap:5px; font-weight:600; }
      `}</style>

      <div className="ca-root">
        <div className="ca-toolbar">
          <div className="ca-tabs">
            <button className={`ca-tab ${activeTab === 'log' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('log')}>
              Gesture Log
            </button>
            <button className={`ca-tab ${activeTab === 'rankings' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('rankings')}>
              Student Rankings
              {rankings.length > 0 && (
                <span style={{ marginLeft: 6, background: 'rgba(59,130,246,0.3)', color: '#93c5fd', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                  {rankings.length}
                </span>
              )}
            </button>
          </div>

          <div className="ca-sep" />

          {activeTab === 'log' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="ca-toolbar-label">Filter</span>
                <div className="ca-dropdown-wrap">
                  <button className="ca-dropdown-btn" onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false) }}>
                    <span>{filter}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
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

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="ca-toolbar-label">Sort</span>
                <div className="ca-dropdown-wrap">
                  <button className="ca-dropdown-btn" onClick={() => { setSortOpen(!sortOpen); setFilterOpen(false) }}>
                    <span>{sort}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
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
            </>
          )}

          <button className="ca-dl-btn" onClick={() => downloadPDF(filteredLogs, rankings, dateLabel)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download PDF
          </button>
        </div>

        <main className="ca-body">
          {/* Summary bar */}
          <div className="ca-summary-bar">
            {[
              { label: 'Total Logs', value: logs.length, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16h16V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              )},
              { label: 'Students', value: rankings.length, color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              )},
              { label: 'Alerts', value: totalAlerts, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              )},
              { label: 'Gesture Types', value: [...new Set(logs.map(l => l.gesture))].length, color: '#a855f7', bg: 'rgba(168,85,247,0.1)', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2"><path d="M18 11V6a2 2 0 0 0-4 0v0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
              )},
            ].map(({ label, value, color, bg, icon }) => (
              <div key={label} className="ca-sum-card">
                <div className="ca-sum-icon" style={{ background: bg }}>{icon}</div>
                <div>
                  <div className="ca-sum-label">{label}</div>
                  <div className="ca-sum-value" style={{ color }}>{loading ? '—' : value}</div>
                </div>
              </div>
            ))}
          </div>

          {activeTab === 'log' && (
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
                {loading ? (
                  <div className="ca-empty-state">
                    <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading...</div>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="ca-empty-state">
                    <div className="ca-empty-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                    <div className="ca-empty-title">No gesture detected</div>
                    <div className="ca-empty-sub">Classroom is secure. Start a session to begin monitoring.</div>
                  </div>
                ) : filteredLogs.map(log => {
                  const color = getGestureColor(log.gesture)
                  return (
                    <div key={log.id} className="ca-table-row">
                      <div className="ca-cell ca-cell-time">{log.time}</div>
                      <div className="ca-cell ca-cell-time">{log.date}</div>
                      <div className="ca-gesture-badge" style={{ color }}>
                        <span className="ca-gesture-dot" style={{ background: color }} />
                        <span style={{ textTransform: 'capitalize' }}>{(log.gesture || '').replace(/_/g, ' ')}</span>
                      </div>
                      <div><span className="ca-rank-badge">#{log.chair_rank}</span></div>
                      <div className="ca-cell">{log.student_name}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'rankings' && (
            <>
              {rankings.length === 0 ? (
                <div className="ca-table-card">
                  <div className="ca-empty-state">
                    <div className="ca-empty-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <div className="ca-empty-title">No student data yet</div>
                    <div className="ca-empty-sub">Save a class session to see student rankings here.</div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="ca-rank-legend">
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>Rankings for {dateLabel}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                      {[['🥇', 'Most Active', '#f59e0b'], ['🥈', 'Runner-up', '#94a3b8'], ['🥉', 'Third Place', '#cd7c3e']].map(([icon, label, color]) => (
                        <div key={label} className="ca-rank-legend-item" style={{ color }}>
                          <span>{icon}</span> {label}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="ca-rankings-grid">
                    {rankings.map((student, i) => (
                      <StudentRankCard key={student.name} student={student} index={i} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </>
  )
}