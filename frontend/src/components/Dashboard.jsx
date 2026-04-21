import { useState, useEffect, useCallback } from 'react'
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

const STAT_CARDS = [
  {
    label: 'Total Gestures',
    key: 'total_gestures',
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

const EmptyChart = ({ height = 140, message = "No data yet", sub = "Save a class session to see progress" }) => (
  <div style={{ width: '100%', height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(248,250,252,0.5)', borderRadius: 10, border: '1px dashed rgba(148,163,184,0.3)' }}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
    <p style={{ color: 'rgba(148,163,184,0.8)', fontSize: 13, margin: 0, fontWeight: 500 }}>{message}</p>
    {sub && <p style={{ color: 'rgba(148,163,184,0.5)', fontSize: 11, marginTop: 4, margin: '4px 0 0' }}>{sub}</p>}
  </div>
)

export default function Dashboard({ onLogout, setupPrefs, updateSetupPrefs }) {
  const [active, setActive] = useState('Dashboard')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showCalendar, setShowCalendar] = useState(false)
  const [stats, setStats] = useState({ total_gestures: 0, unique_students: 0, total_alerts: 0, gesture_per_student: [], gesture_type_distribution: [], engagement_over_time: [], activity_mode_usage: [] })
  const [liveDateTime, setLiveDateTime] = useState('')
  const { activeSession, isDirty, markClean, setSession } = useSession()
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingNav, setPendingNav] = useState(null)

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

  const fetchStats = useCallback(async (date) => {
    const dateStr = date.toISOString().split('T')[0]
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats/?date=${dateStr}`)
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats', err)
    }
  }, [])

  useEffect(() => { fetchStats(selectedDate) }, [selectedDate, fetchStats])

  const handleDateSelect = (newDate) => { setSelectedDate(newDate); setShowCalendar(false) }

  const handleNavigation = (target) => {
    if (active === 'Start Class' && activeSession && isDirty) {
      setPendingNav(target); setShowUnsavedModal(true)
    } else {
      setActive(target)
    }
  }

  const confirmLeave = () => { setShowUnsavedModal(false); markClean(); setSession(null); setActive(pendingNav); setPendingNav(null) }
  const cancelLeave = () => { setShowUnsavedModal(false); setPendingNav(null) }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .cs-app-root {
          display: flex;
          height: 100vh;
          background: #f1f5f9;
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          overflow: hidden;
        }
        .cs-main-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #f1f5f9;
        }
        .cs-topbar {
          background: rgba(15,23,42,0.97);
          backdrop-filter: blur(20px);
          padding: 0 28px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 2px 16px rgba(0,0,0,0.2);
        }
        .cs-topbar-title {
          font-size: 18px;
          font-weight: 700;
          color: #f0f9ff;
          letter-spacing: -0.4px;
        }
        .cs-topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .cs-datetime-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 6px 12px;
          cursor: pointer;
          transition: all 0.18s ease;
          color: rgba(186,210,235,0.9);
          font-size: 12px;
          font-weight: 500;
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          letter-spacing: 0.2px;
        }
        .cs-datetime-btn:hover { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.3); }
        .cs-avatar-btn {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(59,130,246,0.3);
        }
        .cs-dashboard-content {
          flex: 1;
          overflow: auto;
          padding: 24px 28px;
        }
        .cs-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .cs-stat-card {
          background: rgba(255,255,255,0.62);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(255,255,255,0.5);
          box-shadow: 0 4px 24px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.8);
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 0.22s ease;
          cursor: default;
        }
        .cs-stat-card:hover {
          transform: translateY(-3px);
          background: rgba(255,255,255,0.78);
          box-shadow: 0 12px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .cs-stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cs-stat-label {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
          margin-bottom: 4px;
          letter-spacing: 0.3px;
        }
        .cs-stat-value {
          font-size: 26px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.5px;
        }
        .cs-chart-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .cs-chart-card {
          background: rgba(255,255,255,0.62);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(255,255,255,0.5);
          box-shadow: 0 4px 24px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.8);
        }
        .cs-chart-title {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 14px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        .cs-section-label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
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
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  {liveDateTime}
                </button>
                <div className="cs-avatar-btn">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>
            </header>
          )}

          {active === 'Dashboard' && (
            <main className="cs-dashboard-content">
              <div className="cs-stat-grid">
                {STAT_CARDS.map(({ label, key, value, icon, accent, bg, border }) => (
                  <div key={label} className="cs-stat-card">
                    <div className="cs-stat-icon" style={{ background: bg, border: `1px solid ${border}`, color: accent }}>
                      {icon}
                    </div>
                    <div>
                      <div className="cs-stat-label">{label}</div>
                      <div className="cs-stat-value" style={{ color: accent }}>
                        {key ? stats[key] : value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cs-chart-grid">
                <div className="cs-chart-card">
                  <div className="cs-chart-title">Gesture per Student</div>
                  {stats.gesture_per_student.length === 0 ? (
                    <EmptyChart height={140} />
                  ) : (
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

                <div className="cs-chart-card">
                  <div className="cs-chart-title">Gesture Type Distribution</div>
                  {stats.gesture_type_distribution.length === 0 ? (
                    <EmptyChart height={140} />
                  ) : (
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
                <div className="cs-chart-card">
                  <div className="cs-chart-title">Engagement Overtime</div>
                  {stats.engagement_over_time.length === 0 ? (
                    <EmptyChart height={130} />
                  ) : (
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

                <div className="cs-chart-card">
                  <div className="cs-chart-title">Activity Mode Usage</div>
                  {stats.activity_mode_usage.length === 0 ? (
                    <EmptyChart height={130} message="No data yet" sub={null} />
                  ) : (
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
          {active === 'Start Class' && <StartClass selectedDate={selectedDate} onDateSelect={handleDateSelect} setupPrefs={setupPrefs} updateSetupPrefs={updateSetupPrefs} />}
          {active === 'Class Setup' && <ClassSetup setupPrefs={setupPrefs} updateSetupPrefs={updateSetupPrefs} />}

          {showCalendar && (
            <DateCalendar selectedDate={selectedDate} onDateSelect={handleDateSelect} onClose={() => setShowCalendar(false)} />
          )}

          {showUnsavedModal && <UnsavedChangesModal onConfirm={confirmLeave} onCancel={cancelLeave} />}
        </div>
      </div>
    </>
  )
}