import { useState, useEffect, useCallback, useRef } from 'react'
import Sidebar from './Sidebar'
import ClassActivity from './ClassActivity'
import StartClass from './StartClass'
import ClassSetup from './ClassSetUp'
import DateCalendar from './DateCalendar'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts'
import { useSession } from '../context/SessionContext'
import UnsavedChangesModal from './UnsavedChangesModal'

const API_BASE = 'http://localhost:8000/api'
const PIE_COLORS = ['#e53e3e', '#38a169', '#3182ce', '#805ad5', '#d69e2e']

// Timezone-safe: formats a JS Date to YYYY-MM-DD using LOCAL date parts, not UTC
function toLocalDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const STAT_CARDS = [
  {
    label: 'Total Gestures',
    key: 'total_gestures',
    modalKey: 'gestures',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
      </svg>
    ),
    accent: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.2)',
  },
  {
    label: 'Unique Students',
    key: 'unique_students',
    modalKey: 'students',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    accent: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
  },
  {
    label: 'Total Alerts',
    key: 'total_alerts',
    modalKey: 'alerts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    accent: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
  },
  {
    label: 'Avg Response',
    key: null,
    modalKey: null,
    value: 'N/A',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    accent: '#a855f7',
    bg: 'rgba(168,85,247,0.08)',
    border: 'rgba(168,85,247,0.2)',
  },
]

const EmptyChart = ({ height = 140, message = 'No data yet', sub = 'Save a class session to see progress' }) => (
  <div style={{ width: '100%', height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(248,250,252,0.5)', borderRadius: 10, border: '1px dashed rgba(148,163,184,0.3)' }}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
    <p style={{ color: 'rgba(148,163,184,0.8)', fontSize: 13, margin: 0, fontWeight: 500 }}>{message}</p>
    {sub && <p style={{ color: 'rgba(148,163,184,0.5)', fontSize: 11, marginTop: 4, margin: '4px 0 0' }}>{sub}</p>}
  </div>
)

function StatModal({ modalKey, stats, onClose }) {
  if (!modalKey) return null

  const titles = {
    gestures: 'Total Gestures Breakdown',
    students: 'Unique Students Detail',
    alerts: 'Total Alerts Detail',
  }

  const accentMap = { gestures: '#3b82f6', students: '#10b981', alerts: '#ef4444' }
  const accent = accentMap[modalKey] || '#3b82f6'

  const renderContent = () => {
    if (modalKey === 'gestures') {
      const dist = stats.gesture_type_distribution || []
      const total = stats.total_gestures || 0
      return (
        <div>
          {dist.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '24px 0' }}>No gesture data available for this date</div>
          ) : dist.map((item, i) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{item.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 80, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: PIE_COLORS[i % PIE_COLORS.length], borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', minWidth: 28, textAlign: 'right' }}>{item.value}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 32 }}>{pct}%</span>
                </div>
              </div>
            )
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #e2e8f0', marginTop: 4 }}>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: accent }}>{total}</span>
          </div>
        </div>
      )
    }

    if (modalKey === 'students') {
      const perStudent = stats.gesture_per_student || []
      const total = stats.unique_students || 0
      return (
        <div>
          {perStudent.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '24px 0' }}>No student data available for this date</div>
          ) : perStudent.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#10b981', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>{s.rank || s.name || `Student ${i + 1}`}</div>
                  {s.chair_rank && <div style={{ fontSize: 11, color: '#94a3b8' }}>Chair #{s.chair_rank}</div>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: accent }}>{s.gestures}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>gestures</div>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #e2e8f0', marginTop: 4 }}>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Unique Students</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: accent }}>{total}</span>
          </div>
        </div>
      )
    }

    if (modalKey === 'alerts') {
      const alertLogs = stats.recent_alerts || []
      const total = stats.total_alerts || 0
      return (
        <div>
          {alertLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 10, display: 'block', margin: '0 auto 10px' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>No alerts recorded for this date</div>
              <div style={{ color: '#cbd5e1', fontSize: 11, marginTop: 4 }}>Alerts appear when forbidden gestures are detected in Exam or Quiz mode</div>
            </div>
          ) : alertLogs.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '10px 0 10px 12px', borderBottom: '1px solid #f1f5f9', borderLeft: '3px solid rgba(239,68,68,0.45)', marginBottom: 2 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#334155', fontWeight: 600, marginBottom: 3, textTransform: 'capitalize' }}>{a.gesture || 'Unknown Gesture'}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {a.date && <span>{a.date}</span>}
                  {a.time && <span>· {a.time}</span>}
                  {a.chair_rank && <span>· Chair #{a.chair_rank}</span>}
                  {a.student_name && <span>· {a.student_name}</span>}
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '3px 8px', borderRadius: 6, flexShrink: 0, marginLeft: 10 }}>ALERT</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #e2e8f0', marginTop: 4 }}>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Total Alerts</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: accent }}>{total}</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'white', borderRadius: 18, boxShadow: '0 24px 64px rgba(0,0,0,0.16)', width: 480, maxWidth: '90vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid rgba(0,0,0,0.06)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 3 }}>Details</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', letterSpacing: -0.3 }}>{titles[modalKey]}</div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#64748b', fontWeight: 400, lineHeight: 1 }}
          >×</button>
        </div>
        <div style={{ padding: '4px 24px 24px', overflowY: 'auto', flex: 1 }}>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

function SaveSuccessModal({ onClose }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 }}
    >
      <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', width: 400, maxWidth: '90vw', padding: '36px 32px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8, letterSpacing: -0.4 }}>Class Saved!</div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24, lineHeight: 1.5 }}>Your class data has been saved successfully.<br/>Taking you to the Dashboard now.</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'cs-pulse 1s ease-in-out infinite' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'cs-pulse 1s ease-in-out 0.2s infinite' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'cs-pulse 1s ease-in-out 0.4s infinite' }} />
        </div>
      </div>
    </div>
  )
}

const EMPTY_STATS = { total_gestures: 0, unique_students: 0, total_alerts: 0, gesture_per_student: [], gesture_type_distribution: [], engagement_over_time: [], activity_mode_usage: [], recent_alerts: [] }

export default function Dashboard({ onLogout, setupPrefs, updateSetupPrefs }) {
  const [active, setActive] = useState('Dashboard')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showCalendar, setShowCalendar] = useState(false)
  const [viewMode, setViewMode] = useState('day') // 'day' | 'total'
  const [stats, setStats] = useState(EMPTY_STATS)
  const [liveDateTime, setLiveDateTime] = useState('')
  const { activeSession, isDirty, markClean, setSession } = useSession()
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingNav, setPendingNav] = useState(null)
  const [activeModal, setActiveModal] = useState(null)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const autoRefreshRef = useRef(null)

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const date = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setLiveDateTime(`${date} | ${time}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const fetchStats = useCallback(async (date, mode) => {
    try {
      let url
      if (mode === 'total') {
        url = `${API_BASE}/dashboard/stats/`
      } else {
        // Use timezone-safe local date string — fixes the "clicking Apr 23 shows Apr 22" bug
        const dateStr = toLocalDateStr(date)
        url = `${API_BASE}/dashboard/stats/?date=${dateStr}`
      }
      const res = await fetch(url)
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats', err)
    }
  }, [])

  // Fetch whenever date or viewMode changes
  useEffect(() => {
    fetchStats(selectedDate, viewMode)
  }, [selectedDate, viewMode, fetchStats])

  // Auto-refresh every 30 seconds (no manual refresh button needed)
  useEffect(() => {
    if (active === 'Dashboard') {
      autoRefreshRef.current = setInterval(() => {
        fetchStats(selectedDate, viewMode)
      }, 30000)
      return () => clearInterval(autoRefreshRef.current)
    }
    return () => clearInterval(autoRefreshRef.current)
  }, [active, selectedDate, viewMode, fetchStats])

  // Re-fetch when switching back to Dashboard tab
  useEffect(() => {
    if (active === 'Dashboard') {
      fetchStats(selectedDate, viewMode)
    }
  }, [active])

  const handleDateSelect = (newDate) => {
    setSelectedDate(newDate)
    setViewMode('day')
    setShowCalendar(false)
  }

  const handleNavigation = (target) => {
    if (active === 'Start Class' && activeSession && isDirty) {
      setPendingNav(target); setShowUnsavedModal(true)
    } else {
      setActive(target)
    }
  }

  const handleSaveSuccess = () => {
    setShowSaveSuccess(true)
    setTimeout(() => {
      setShowSaveSuccess(false)
      markClean()
      setSession(null)
      setActive('Dashboard')
      // Slight delay so dashboard fetch happens after navigation
      setTimeout(() => fetchStats(new Date(), 'day'), 200)
    }, 2000)
  }

  const confirmLeave = () => { setShowUnsavedModal(false); markClean(); setSession(null); setActive(pendingNav); setPendingNav(null) }
  const cancelLeave = () => { setShowUnsavedModal(false); setPendingNav(null) }

  const dateLabel = viewMode === 'total'
    ? 'All Time — Combined Total'
    : selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const isToday = toLocalDateStr(selectedDate) === toLocalDateStr(new Date())

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes cs-pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.1)} }
        .cs-app-root {
          display: flex; height: 100vh;
          background: #f1f5f9;
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          overflow: hidden;
        }
        .cs-main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #f1f5f9; }
        .cs-topbar {
          background: rgba(15,23,42,0.97); backdrop-filter: blur(20px);
          padding: 0 28px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0; border-bottom: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 2px 16px rgba(0,0,0,0.2);
        }
        .cs-topbar-title { font-size: 18px; font-weight: 700; color: #f0f9ff; letter-spacing: -0.4px; }
        .cs-topbar-right { display: flex; align-items: center; gap: 12px; }
        .cs-datetime-btn {
          display: flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; padding: 6px 12px; cursor: pointer;
          transition: all 0.18s ease; color: rgba(186,210,235,0.9);
          font-size: 12px; font-weight: 500; font-family: 'DM Sans','Segoe UI',sans-serif;
        }
        .cs-datetime-btn:hover { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.3); }
        .cs-avatar-btn {
          width: 34px; height: 34px;
          background: linear-gradient(135deg,#3b82f6,#1d4ed8);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: 0 2px 8px rgba(59,130,246,0.3);
        }
        .cs-dashboard-content { flex: 1; overflow: auto; padding: 24px 28px; }
        .cs-date-bar {
          display: flex; align-items: center; gap: 8px; margin-bottom: 18px;
          padding: 8px 14px;
          background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.15);
          border-radius: 8px; font-size: 12px; color: #3b82f6; font-weight: 600;
        }
        .cs-view-toggle {
          display: flex; align-items: center; gap: 6px; margin-left: auto;
        }
        .cs-toggle-btn {
          padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700;
          cursor: pointer; border: 1px solid transparent;
          font-family: 'DM Sans','Segoe UI',sans-serif; transition: all 0.18s ease;
          letter-spacing: 0.3px;
        }
        .cs-toggle-btn.active {
          background: #3b82f6; color: white; border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59,130,246,0.3);
        }
        .cs-toggle-btn.inactive {
          background: rgba(59,130,246,0.08); color: #3b82f6; border-color: rgba(59,130,246,0.2);
        }
        .cs-toggle-btn.inactive:hover { background: rgba(59,130,246,0.15); }
        .cs-stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }
        .cs-stat-card {
          background: rgba(255,255,255,0.62); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-radius: 16px; padding: 20px;
          border: 1px solid rgba(255,255,255,0.5);
          box-shadow: 0 4px 24px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.8);
          display: flex; align-items: center; gap: 14px;
          transition: all 0.22s ease; cursor: pointer; position: relative; overflow: hidden;
        }
        .cs-stat-card:hover {
          transform: translateY(-3px); background: rgba(255,255,255,0.84);
          box-shadow: 0 12px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .cs-stat-card.no-click { cursor: default; }
        .cs-stat-card.no-click:hover { transform: translateY(-3px); background: rgba(255,255,255,0.78); }
        .cs-click-hint {
          position: absolute; top: 9px; right: 11px;
          font-size: 9px; color: rgba(148,163,184,0.5);
          font-weight: 600; letter-spacing: 0.3px; text-transform: uppercase;
        }
        .cs-stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cs-stat-label { font-size: 11px; color: #94a3b8; font-weight: 500; margin-bottom: 4px; letter-spacing: 0.3px; }
        .cs-stat-value { font-size: 26px; font-weight: 700; line-height: 1; letter-spacing: -0.5px; }
        .cs-chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .cs-chart-card {
          background: rgba(255,255,255,0.62); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-radius: 16px; padding: 20px;
          border: 1px solid rgba(255,255,255,0.5);
          box-shadow: 0 4px 24px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.8);
          cursor: pointer; transition: background 0.18s ease;
        }
        .cs-chart-card:hover { background: rgba(255,255,255,0.78); }
        .cs-chart-card.static { cursor: default; }
        .cs-chart-card.static:hover { background: rgba(255,255,255,0.62); }
        .cs-chart-title { font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 14px; letter-spacing: 0.3px; text-transform: uppercase; }
        .cs-chart-hint { font-size: 10px; color: #94a3b8; font-weight: 400; text-transform: none; margin-left: 4px; }
        .cs-total-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: linear-gradient(135deg,rgba(168,85,247,0.12),rgba(59,130,246,0.12));
          border: 1px solid rgba(168,85,247,0.25); border-radius: 6px;
          padding: 2px 8px; font-size: 10px; font-weight: 700; color: #a855f7;
          letter-spacing: 0.3px; margin-left: 8px; vertical-align: middle;
        }
      `}</style>

      <div className="cs-app-root">
        <Sidebar active={active} setActive={handleNavigation} onLogout={onLogout} />

        <div className="cs-main-area">
          {active !== 'Start Class' && (
            <header className="cs-topbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 4, height: 20, background: 'linear-gradient(180deg,#3b82f6,#60a5fa)', borderRadius: 4 }} />
                <span className="cs-topbar-title">{active}</span>
              </div>
              <div className="cs-topbar-right">
                <button className="cs-datetime-btn" onClick={() => setShowCalendar(!showCalendar)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {liveDateTime}
                </button>
                <div className="cs-avatar-btn">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              </div>
            </header>
          )}

          {active === 'Dashboard' && (
            <main className="cs-dashboard-content">
              <div className="cs-date-bar">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {viewMode === 'total' ? (
                  <>All Time Data <span className="cs-total-badge">★ TOTAL</span></>
                ) : (
                  <>
                    {isToday ? 'Today — ' : ''}{dateLabel}
                  </>
                )}
                <div className="cs-view-toggle">
                  <button
                    className={`cs-toggle-btn ${viewMode === 'day' ? 'active' : 'inactive'}`}
                    onClick={() => setViewMode('day')}
                  >
                    {isToday ? 'Today' : 'Selected Day'}
                  </button>
                  <button
                    className={`cs-toggle-btn ${viewMode === 'total' ? 'active' : 'inactive'}`}
                    onClick={() => setViewMode('total')}
                  >
                    All Time Total
                  </button>
                </div>
              </div>

              <div className="cs-stat-grid">
                {STAT_CARDS.map(({ label, key, value, icon, accent, bg, border, modalKey }) => (
                  <div
                    key={label}
                    className={`cs-stat-card${!modalKey ? ' no-click' : ''}`}
                    onClick={() => modalKey && setActiveModal(modalKey)}
                  >
                    {modalKey && <div className="cs-click-hint">Click for details</div>}
                    <div className="cs-stat-icon" style={{ background: bg, border: `1px solid ${border}`, color: accent }}>{icon}</div>
                    <div>
                      <div className="cs-stat-label">{label}</div>
                      <div className="cs-stat-value" style={{ color: accent }}>{key ? stats[key] : value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cs-chart-grid">
                <div className="cs-chart-card" onClick={() => setActiveModal('students')}>
                  <div className="cs-chart-title">Gesture per Student<span className="cs-chart-hint">(click for detail)</span></div>
                  {stats.gesture_per_student.length === 0 ? <EmptyChart height={140} /> : (
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={stats.gesture_per_student} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="rank" tick={{ fontSize: 10, fill: '#94a3b8' }} width={50} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: 12 }} />
                        <Bar dataKey="gestures" fill="#3b82f6" barSize={14} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="cs-chart-card" onClick={() => setActiveModal('gestures')}>
                  <div className="cs-chart-title">Gesture Type Distribution<span className="cs-chart-hint">(click for detail)</span></div>
                  {stats.gesture_type_distribution.length === 0 ? <EmptyChart height={140} /> : (
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={stats.gesture_type_distribution} cx="40%" cy="50%" outerRadius={55} dataKey="value" label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false} fontSize={10}>
                          {stats.gesture_type_distribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={8} formatter={v => <span style={{ fontSize: 10, color: '#64748b' }}>{v}</span>} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="cs-chart-grid">
                <div className="cs-chart-card static">
                  <div className="cs-chart-title">Engagement Overtime</div>
                  {stats.engagement_over_time.length === 0 ? <EmptyChart height={130} /> : (
                    <ResponsiveContainer width="100%" height={130}>
                      <LineChart data={stats.engagement_over_time} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={2} />
                        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: 12 }} />
                        <Line type="monotone" dataKey="gestures" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="cs-chart-card" onClick={() => setActiveModal('alerts')}>
                  <div className="cs-chart-title">Activity Mode Usage<span className="cs-chart-hint">(click for alerts)</span></div>
                  {stats.activity_mode_usage.length === 0 ? <EmptyChart height={130} message="No data yet" sub={null} /> : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 130 }}>
                      {stats.activity_mode_usage.map(({ mode, count }) => (
                        <div key={mode} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{count}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>{mode}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </main>
          )}

          {active === 'Class Activity' && <ClassActivity selectedDate={selectedDate} />}
          {active === 'Start Class' && (
            <StartClass
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              setupPrefs={setupPrefs}
              updateSetupPrefs={updateSetupPrefs}
              onSaveSuccess={handleSaveSuccess}
            />
          )}
          {active === 'Class Setup' && <ClassSetup setupPrefs={setupPrefs} updateSetupPrefs={updateSetupPrefs} />}

          {showCalendar && <DateCalendar selectedDate={selectedDate} onDateSelect={handleDateSelect} onClose={() => setShowCalendar(false)} />}
          {showUnsavedModal && <UnsavedChangesModal onConfirm={confirmLeave} onCancel={cancelLeave} />}
        </div>
      </div>

      {activeModal && <StatModal modalKey={activeModal} stats={stats} onClose={() => setActiveModal(null)} />}
      {showSaveSuccess && <SaveSuccessModal />}
    </>
  )
}