import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import ClassSetupForm from './ClassSetupForm'
import DateCalendar from './DateCalendar'
import ClassSummary from './ClassSummary'
import ReadyToStartClass from './ReadyToStartClass'
import LiveCamera from './LiveCamera'
import { useSession } from '../context/SessionContext'

const API_BASE = 'http://localhost:8000/api'

const MODE_CONFIG = {
  Lecture:  { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)',  label: 'Lecture',  icon: '📖' },
  Quiz:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  label: 'Quiz',     icon: '📝' },
  Exam:     { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   label: 'Exam',     icon: '🔒' },
}

function getModeConfig(mode) {
  return MODE_CONFIG[mode] || MODE_CONFIG.Lecture
}

export default function StartClass({ selectedDate, onDateSelect, setupPrefs, updateSetupPrefs, onSaveSuccess }) {
  const [showReadyDialog, setShowReadyDialog] = useState(true)
  const [classSetup, setClassSetup] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [detectedGesture, setDetectedGesture] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [gestureLog, setGestureLog] = useState([])
  const [liveDateTime, setLiveDateTime] = useState('')
  const { setSession, markDirty, markClean } = useSession()

  const sessionIdRef = useRef(null)
  const classSetupRef = useRef(null)
  const unsavedGesturesRef = useRef([])
  const saveInProgressRef = useRef(false)

  useEffect(() => { sessionIdRef.current = sessionId }, [sessionId])
  useEffect(() => { classSetupRef.current = classSetup }, [classSetup])

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

  const handleStartClass = async (setupData) => {
    setGestureLog([])
    setDetectedGesture('')
    setShowSummary(false)
    setClassSetup(setupData)
    setSession({ ...setupData })
    markDirty()
    unsavedGesturesRef.current = []
    try {
      const res = await fetch(`${API_BASE}/sessions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_name: setupData.subjectName,
          teacher_name: setupData.teacherName,
          room_number: setupData.roomNumber,
          activity_mode: setupData.activityMode,
          num_chairs: setupData.numChairs,
          student_names: setupData.studentNames,
          date_key: new Date().toISOString().split('T')[0]
        })
      })
      const session = await res.json()
      setSessionId(session.id)
      setSession({ id: session.id, ...setupData })
    } catch (err) {
      console.warn('Session API failed, continuing offline:', err)
    }
  }

  const saveSingleGesture = async (sessionId, entry) => {
    try {
      const response = await fetch(`${API_BASE}/gestures/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: parseInt(sessionId),
          chair_rank: parseInt(entry.chair_rank),
          gesture: entry.gesture,
        })
      })
      return response.ok
    } catch (err) {
      console.error('Failed to save gesture:', err)
      return false
    }
  }

  const handleGestureDetected = useCallback((gestureData) => {
    if (!gestureData || !gestureData.gesture) return
    const timestamp = new Date()
    const chairRank = gestureData.chair_rank || 1
    const savedToDB = gestureData.log_id != null

    setDetectedGesture(gestureData.gesture)
    setGestureLog(prev => [{
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: timestamp.toLocaleDateString('en-US'),
      gesture: gestureData.gesture,
      confidence: gestureData.confidence !== undefined ? gestureData.confidence : null,
      rankChair: `#${chairRank}`,
      activityMode: classSetupRef.current?.activityMode || 'Lecture',
      isAlert: gestureData.is_alert || false,
      savedToDB,
    }, ...prev])

    if (!savedToDB && sessionIdRef.current) {
      unsavedGesturesRef.current.push({
        gesture: gestureData.gesture,
        chair_rank: chairRank,
      })
    }
  }, [])

  const handleEndClass = () => setShowSummary(true)

  const handleSaveProgress = useCallback(async () => {
    if (saveInProgressRef.current) return
    saveInProgressRef.current = true

    try {
      let activeSessionId = sessionIdRef.current

      if (!activeSessionId) {
        const res = await fetch(`${API_BASE}/sessions/active/`)
        const session = await res.json()
        activeSessionId = session?.id
      }

      if (activeSessionId) {
        const toSave = [...unsavedGesturesRef.current]
        unsavedGesturesRef.current = []

        for (const entry of toSave) {
          const saved = await saveSingleGesture(activeSessionId, entry)
          if (!saved) {
            unsavedGesturesRef.current.push(entry)
          }
        }

        await fetch(`${API_BASE}/sessions/${activeSessionId}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'end' })
        })
      }
    } catch (err) {
      console.error('Failed to save session:', err)
    }

    saveInProgressRef.current = false
    markClean()
    setSession(null)
    setShowSummary(false)
    if (onSaveSuccess) onSaveSuccess()
  }, [markClean, setSession, onSaveSuccess])

  const handleStartNewClass = () => {
    markClean()
    setSession(null)
    setClassSetup(null)
    setShowSummary(false)
    setShowReadyDialog(false)
    setGestureLog([])
    setDetectedGesture('')
    setSessionId(null)
    unsavedGesturesRef.current = []
  }

  const handleDiscard = () => {
    markClean()
    setSession(null)
    setClassSetup(null)
    setShowSummary(false)
    setGestureLog([])
    setDetectedGesture('')
    setSessionId(null)
    setShowReadyDialog(true)
    unsavedGesturesRef.current = []
  }

  if (showReadyDialog) {
    return (
      <ReadyToStartClass
        onNotNow={() => {}}
        onProceedToSetup={() => setShowReadyDialog(false)}
        selectedDate={selectedDate}
        onDateSelect={onDateSelect}
      />
    )
  }

  if (!classSetup) {
    return (
      <ClassSetupForm
        onStartClass={handleStartClass}
        onCancel={() => setShowReadyDialog(true)}
        selectedDate={selectedDate}
        onDateSelect={onDateSelect}
        setupPrefs={setupPrefs}
        updateSetupPrefs={updateSetupPrefs}
      />
    )
  }

  if (showSummary) {
    return (
      <ClassSummary
        classSetup={classSetup}
        gestureLog={gestureLog}
        onSaveProgress={handleSaveProgress}
        onStartNewClass={handleStartNewClass}
        onDiscard={handleDiscard}
      />
    )
  }

  const totalGestures = gestureLog.length
  const totalChairRanking = new Set(gestureLog.map(g => g.rankChair)).size
  const alertCount = gestureLog.filter(g => g.isAlert).length
  const modeConfig = getModeConfig(classSetup.activityMode)
  const timerDuration = classSetup.timerDuration || 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .sc-root { flex: 1; display: flex; flex-direction: column; overflow: hidden; font-family: 'DM Sans','Segoe UI',sans-serif; }
        .sc-topbar {
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
        .sc-topbar-left { display: flex; align-items: center; gap: 12px; }
        .sc-topbar-title { font-size: 18px; font-weight: 700; color: #f0f9ff; letter-spacing: -0.4px; }
        .sc-topbar-subject {
          font-size: 12px;
          color: rgba(148,163,184,0.7);
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 3px 10px;
          border-radius: 6px;
        }
        .sc-datetime-btn {
          display: flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 6px 12px;
          cursor: pointer;
          color: rgba(186,210,235,0.9);
          font-size: 12px;
          font-weight: 500;
          font-family: 'DM Sans','Segoe UI',sans-serif;
          transition: all 0.18s ease;
        }
        .sc-datetime-btn:hover { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.3); }
        .sc-avatar { width: 34px; height: 34px; background: linear-gradient(135deg,#3b82f6,#1d4ed8); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(59,130,246,0.3); }
        .sc-body { flex: 1; overflow: auto; padding: 24px 28px; background: #f1f5f9; }
        .sc-layout { display: flex; gap: 20px; height: 100%; }
        .sc-left { display: flex; flex-direction: column; gap: 0; width: 45%; min-width: 0; }
        .sc-right { display: flex; flex-direction: column; gap: 14px; flex: 1; min-width: 0; }
        .sc-camera-card { background: white; border-radius: 16px; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 2px 12px rgba(0,0,0,0.04); overflow: hidden; }
        .sc-camera-header { padding: 12px 16px 10px; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: space-between; }
        .sc-camera-title { font-size: 13px; font-weight: 700; color: #0f172a; }
        .sc-camera-body { padding: 12px; }
        .sc-camera-footer { padding: 10px 16px; border-top: 1px solid rgba(0,0,0,0.04); background: #f8fafc; display: flex; justify-content: space-between; align-items: center; }
        .sc-curr-gesture-label { font-size: 11px; color: #94a3b8; font-weight: 500; }
        .sc-curr-gesture-value { font-size: 12px; font-weight: 700; color: #3b82f6; text-transform: capitalize; }
        .sc-mode-card { background: white; border-radius: 14px; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 2px 10px rgba(0,0,0,0.04); padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
        .sc-mode-label { font-size: 12px; color: #64748b; font-weight: 500; }
        .sc-mode-badge { display: flex; align-items: center; gap: 7px; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; }
        .sc-log-card { background: white; border-radius: 14px; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 2px 10px rgba(0,0,0,0.04); display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
        .sc-log-header { padding: 12px 16px 10px; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .sc-log-title { font-size: 13px; font-weight: 700; color: #0f172a; }
        .sc-log-count { font-size: 10px; background: #f1f5f9; color: #64748b; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
        .sc-log-body { overflow-y: auto; flex: 1; }
        .sc-log-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 20px; }
        .sc-log-empty-icon { width: 44px; height: 44px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
        .sc-log-empty-text { font-size: 12px; color: #94a3b8; font-weight: 500; }
        .sc-log-table { width: 100%; border-collapse: collapse; }
        .sc-log-thead th { padding: 8px 12px; text-align: left; font-size: 10px; font-weight: 700; color: #94a3b8; background: #f8fafc; text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 1px solid rgba(0,0,0,0.05); }
        .sc-log-row { border-bottom: 1px solid rgba(0,0,0,0.04); transition: background 0.15s ease; }
        .sc-log-row:hover { background: #f8fafc; }
        .sc-log-row.new { background: rgba(59,130,246,0.04); }
        .sc-log-row td { padding: 8px 12px; font-size: 11px; color: #475569; font-variant-numeric: tabular-nums; }
        .sc-log-gesture { text-transform: capitalize; font-weight: 600; color: #334155; }
        .sc-conf-pill { font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: rgba(59,130,246,0.1); color: #3b82f6; margin-left: 4px; }
        .sc-stats-card { background: white; border-radius: 14px; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 2px 10px rgba(0,0,0,0.04); padding: 14px 16px; }
        .sc-stats-title { font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 12px; letter-spacing: 0.2px; }
        .sc-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .sc-stat-item { text-align: center; }
        .sc-stat-item-label { font-size: 9px; font-weight: 700; color: #94a3b8; background: #f1f5f9; padding: 3px 6px; border-radius: 6px; margin-bottom: 5px; letter-spacing: 0.3px; text-transform: uppercase; line-height: 1.3; }
        .sc-stat-item-value { font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1; }
        .sc-end-btn { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; font-weight: 700; padding: 13px 20px; border: none; border-radius: 12px; cursor: pointer; font-size: 14px; font-family: 'DM Sans','Segoe UI',sans-serif; transition: all 0.18s ease; box-shadow: 0 4px 14px rgba(239,68,68,0.3); display: flex; align-items: center; justify-content: center; gap: 8px; letter-spacing: 0.2px; }
        .sc-end-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(239,68,68,0.4); }
        @keyframes lc-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }
      `}</style>

      <div className="sc-root">
        <header className="sc-topbar">
          <div className="sc-topbar-left">
            <div style={{ width: 4, height: 20, background: 'linear-gradient(180deg,#3b82f6,#60a5fa)', borderRadius: 4 }} />
            <span className="sc-topbar-title">Start Class</span>
            <span className="sc-topbar-subject">Subject: {classSetup.subjectName || 'Machine Learning'}</span>
            {timerDuration > 0 && (
              <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', padding: '3px 10px', borderRadius: 6 }}>
                ⏱ {timerDuration}m Timer
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="sc-datetime-btn" onClick={() => setShowCalendar(!showCalendar)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {liveDateTime}
            </button>
            <div className="sc-avatar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>
        </header>

        <main className="sc-body">
          <div className="sc-layout">
            <div className="sc-left">
              <div className="sc-camera-card">
                <div className="sc-camera-header">
                  <span className="sc-camera-title">Live Classroom</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                    <div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%', animation: 'lc-pulse 1.4s ease-in-out infinite' }} />
                    Active Session
                  </div>
                </div>
                <div className="sc-camera-body">
                  <LiveCamera
                    sessionId={sessionId}
                    mode={(classSetup?.activityMode || 'Lecture').toLowerCase()}
                    numSeats={classSetup?.numChairs || 20}
                    onGestureDetected={handleGestureDetected}
                    timerDuration={timerDuration}
                    onTimerEnd={handleEndClass}
                  />
                </div>
                <div className="sc-camera-footer">
                  <div>
                    <div className="sc-curr-gesture-label">Current gesture</div>
                    <div className="sc-curr-gesture-value">{detectedGesture || 'Waiting for gesture...'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="sc-curr-gesture-label">{liveDateTime}</div>
                    <div className="sc-curr-gesture-label" style={{ color: '#475569', fontWeight: 600 }}>{classSetup?.subjectName || ''}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sc-right">
              <div className="sc-mode-card">
                <span className="sc-mode-label">Activity Mode</span>
                <div className="sc-mode-badge" style={{ background: modeConfig.bg, color: modeConfig.color, border: `1px solid ${modeConfig.border}` }}>
                  <span>{modeConfig.icon}</span>
                  {classSetup.activityMode || 'Lecture'}
                </div>
                {classSetup.activityMode === 'Exam' && (
                  <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, marginLeft: 'auto', background: 'rgba(239,68,68,0.08)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)' }}>
                    STRICT MONITORING
                  </span>
                )}
                {classSetup.activityMode === 'Quiz' && (
                  <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginLeft: 'auto', background: 'rgba(245,158,11,0.08)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.2)' }}>
                    ENHANCED MONITORING
                  </span>
                )}
              </div>

              <div className="sc-log-card">
                <div className="sc-log-header">
                  <span className="sc-log-title">Gesture Log</span>
                  {gestureLog.length > 0 && <span className="sc-log-count">{gestureLog.length}</span>}
                </div>
                <div className="sc-log-body">
                  {gestureLog.length === 0 ? (
                    <div className="sc-log-empty">
                      <div className="sc-log-empty-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      </div>
                      <div className="sc-log-empty-text">No gesture data yet</div>
                    </div>
                  ) : (
                    <table className="sc-log-table">
                      <thead className="sc-log-thead">
                        <tr>
                          <th>Time</th>
                          <th>Gesture</th>
                          <th>Conf</th>
                          <th>Rank</th>
                          <th>Mode</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gestureLog.map((row, i) => (
                          <tr key={i} className={`sc-log-row ${i === 0 ? 'new' : ''}`}>
                            <td>{row.time}</td>
                            <td className="sc-log-gesture">{(row.gesture || '').replace(/_/g, ' ')}</td>
                            <td>
                              {row.confidence !== null && row.confidence !== undefined
                                ? <span className="sc-conf-pill">{typeof row.confidence === 'number' ? row.confidence.toFixed(1) : row.confidence}%</span>
                                : <span style={{ color: '#cbd5e1', fontSize: 10 }}>—</span>
                              }
                            </td>
                            <td>{row.rankChair}</td>
                            <td>{row.activityMode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="sc-stats-card">
                <div className="sc-stats-title">Gesture Summary</div>
                <div className="sc-stats-grid">
                  {[
                    { label: 'Total Gestures', value: totalGestures },
                    { label: 'Chairs Active', value: totalChairRanking },
                    { label: 'Alerts', value: alertCount },
                    { label: 'Timer', value: timerDuration > 0 ? `${timerDuration}m` : 'Off' },
                  ].map(({ label, value }) => (
                    <div key={label} className="sc-stat-item">
                      <div className="sc-stat-item-label">{label}</div>
                      <div className="sc-stat-item-value" style={{ fontSize: label === 'Timer' ? 16 : 22 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="sc-end-btn" onClick={handleEndClass}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6v6H9z" />
                </svg>
                End Class
              </button>
            </div>
          </div>
        </main>
      </div>

      {showCalendar && createPortal(
        <DateCalendar selectedDate={selectedDate} onDateSelect={onDateSelect} onClose={() => setShowCalendar(false)} />,
        document.body
      )}
    </>
  )
}