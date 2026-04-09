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

  useEffect(() => {
    fetchStats(selectedDate)
  }, [selectedDate, fetchStats])

  const handleDateSelect = (newDate) => {
    setSelectedDate(newDate)
    setShowCalendar(false)
  }

  const handleNavigation = (target) => {
    if (active === 'Start Class' && activeSession && isDirty) {
      setPendingNav(target)
      setShowUnsavedModal(true)
    } else {
      setActive(target)
    }
  }

  const confirmLeave = () => {
    setShowUnsavedModal(false)
    markClean()
    setSession(null)
    setActive(pendingNav)
    setPendingNav(null)
  }

  const cancelLeave = () => {
    setShowUnsavedModal(false)
    setPendingNav(null)
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <Sidebar active={active} setActive={handleNavigation} onLogout={onLogout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {active !== 'Start Class' && (
          <header className="bg-blue-500 px-6 py-4 flex items-center justify-between gap-3 flex-shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <h1 className="text-white text-2xl font-bold">{active}</h1>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center gap-1.5 bg-white/20 border border-white/40 rounded px-2.5 py-1 hover:bg-white/30 transition-colors cursor-pointer"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="text-white text-[11px] font-medium tabular-nums">{liveDateTime}</span>
              </button>
              <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>
          </header>
        )}

        {active === 'Dashboard' && (
          <main className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Gestures', value: stats.total_gestures, color: 'bg-blue-50 border-blue-200' },
                { label: 'Unique Students', value: stats.unique_students, color: 'bg-green-50 border-green-200' },
                { label: 'Total Alerts', value: stats.total_alerts, color: 'bg-red-50 border-red-200' },
                { label: 'Avg Response', value: 'N/A', valueClass: 'text-sky-500', color: 'bg-purple-50 border-purple-200' },
              ].map(({ label, value, valueClass, color }) => (
                <div key={label} className={`${color} rounded-lg shadow p-4 text-center border transition-all duration-200 hover:shadow-md`}>
                  <p className="text-xs text-gray-600 mb-2 font-medium">{label}</p>
                  <p className={`text-3xl font-bold ${valueClass || 'text-gray-800'}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
                <p className="text-xs text-gray-600 mb-3 font-medium">Gesture per Student</p>
                {stats.gesture_per_student.length === 0 ? (
                  <div className="w-full h-[140px] flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-400 text-sm">No data yet</p>
                    <p className="text-gray-300 text-xs mt-1">Save a class session to see progress</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={stats.gesture_per_student} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9 }} />
                      <YAxis type="category" dataKey="rank" tick={{ fontSize: 9 }} width={50} />
                      <Tooltip />
                      <Bar dataKey="gestures" fill="#3182ce" barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
                <p className="text-xs text-gray-600 mb-3 font-medium">Gesture Type Distribution</p>
                {stats.gesture_type_distribution.length === 0 ? (
                  <div className="w-full h-[140px] flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-400 text-sm">No data yet</p>
                    <p className="text-gray-300 text-xs mt-1">Save a class session to see progress</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={stats.gesture_type_distribution} cx="40%" cy="50%" outerRadius={55} dataKey="value" label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false} fontSize={9}>
                        {stats.gesture_type_distribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={8} formatter={v => <span style={{ fontSize: 9 }}>{v}</span>} />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
                <p className="text-xs text-gray-600 mb-3 font-medium">Engagement Overtime</p>
                {stats.engagement_over_time.length === 0 ? (
                  <div className="w-full h-[130px] flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-400 text-sm">No data yet</p>
                    <p className="text-gray-300 text-xs mt-1">Save a class session to see progress</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={130}>
                    <LineChart data={stats.engagement_over_time} margin={{ top: 4, right: 10, left: -10, bottom: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" tick={{ fontSize: 8 }} interval={2} />
                      <YAxis tick={{ fontSize: 8 }} />
                      <Tooltip />
                      <Line type="linear" dataKey="gestures" stroke="#3182ce" strokeWidth={1.5} dot={{ r: 3, fill: '#3182ce' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
                <p className="text-xs text-gray-600 mb-3 font-medium">Activity Mode Usage</p>
                {stats.activity_mode_usage.length === 0 ? (
                  <div className="w-full h-[130px] flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-400 text-sm">No data yet</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-around h-[130px]">
                    {stats.activity_mode_usage.map(({ mode, count }) => (
                      <div key={mode} className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{count}</div>
                        <div className="text-xs text-gray-500">{mode}</div>
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
          <DateCalendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onClose={() => setShowCalendar(false)}
          />
        )}

        {showUnsavedModal && <UnsavedChangesModal onConfirm={confirmLeave} onCancel={cancelLeave} />}
      </div>
    </div>
  )
}