import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import ClassSetupForm from './ClassSetupForm'
import DateCalendar from './DateCalendar'
import ClassSummary from './ClassSummary'
import ReadyToStartClass from './ReadyToStartClass'
import LiveCamera from './LiveCamera'
import { useSession } from '../context/SessionContext'

const API_BASE = 'http://localhost:8000/api'

export default function StartClass({ selectedDate, onDateSelect, setupPrefs, updateSetupPrefs }) {
  const [showReadyDialog, setShowReadyDialog] = useState(true)
  const [classSetup, setClassSetup] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [detectedGesture, setDetectedGesture] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [gestureLog, setGestureLog] = useState([])
  const [liveDateTime, setLiveDateTime] = useState('')
  const { setSession, markDirty, markClean } = useSession()

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
    const newSessionId = `session-${Date.now()}`
    setSessionId(newSessionId)
    setClassSetup(setupData)
    setGestureLog([])
    setDetectedGesture('')
    setShowSummary(false)
    setSession({ id: newSessionId, ...setupData })
    markDirty()
    try {
      await fetch(`${API_BASE}/sessions/`, {
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
    } catch (err) {
      console.error('Failed to create session', err)
    }
  }

  const handleGestureDetected = (gestureData) => {
    if (!gestureData || !gestureData.gesture) return
    const timestamp = new Date()
    setDetectedGesture(gestureData.gesture)
    setGestureLog(prev => [{
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: timestamp.toLocaleDateString('en-US'),
      gesture: gestureData.gesture,
      confidence: gestureData.confidence ? (gestureData.confidence * 100).toFixed(1) + '%' : '',
      rankChair: gestureData.seat ? `#${gestureData.seat}` : `#${prev.length + 1}`,
      activityMode: classSetup?.activityMode || 'Lecture',
    }, ...prev])
  }

  const handleEndClass = () => setShowSummary(true)

  const handleSaveProgress = useCallback(async () => {
    markClean()
    setSession(null)
    console.log('Saving progress...', gestureLog)
    setShowSummary(false)
  }, [gestureLog, markClean, setSession])

  const handleStartNewClass = () => {
    markClean()
    setSession(null)
    setClassSetup(null)
    setShowSummary(false)
    setShowReadyDialog(false)
    setGestureLog([])
    setDetectedGesture('')
  }

  const handleDiscard = () => {
    markClean()
    setSession(null)
    setClassSetup(null)
    setShowSummary(false)
    setGestureLog([])
    setDetectedGesture('')
    setShowReadyDialog(true)
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

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-blue-500 px-6 py-4 flex items-center justify-between gap-6 flex-shrink-0 shadow-md relative z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-white text-2xl font-bold">Start Class</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/90 text-sm">Subject: {classSetup.subjectName || 'Machine Learning 101'}</span>
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

        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="flex gap-6 h-full">
            <div className="flex flex-col gap-3" style={{ width: '45%' }}>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2 text-center">
                  <span className="text-sm font-semibold text-gray-700">Live Classroom</span>
                </div>
                <div className="p-3">
                  <LiveCamera
                    sessionId={sessionId || 'session-live'}
                    mode={(classSetup?.activityMode || 'Lecture').toLowerCase()}
                    numSeats={classSetup?.numChairs || 20}
                    onGestureDetected={handleGestureDetected}
                  />
                </div>
                <div className="px-4 pb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-700">Current gesture:</span>
                    <span className="text-xs text-blue-600 font-semibold">
                      {detectedGesture || 'Waiting for gesture...'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                    <span className="tabular-nums">{liveDateTime}</span>
                    <span>{classSetup?.subjectName || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 flex-1">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3">
                <span className="text-sm text-gray-600 font-medium">Activity Mode</span>
                <span className="text-base font-bold text-blue-600 bg-blue-50 px-4 py-1 rounded-full">
                  {classSetup.activityMode || 'Quiz'}
                </span>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col flex-1">
                <div className="px-4 pt-3 pb-1">
                  <span className="text-sm font-bold text-gray-800">Gesture Log</span>
                </div>
                <div className="overflow-auto flex-1">
                  {gestureLog.length === 0 ? (
                    <div className="flex items-center justify-center text-gray-400 text-sm py-6">
                      No gesture data yet
                    </div>
                  ) : (
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Time', 'Date', 'Gesture', 'Rank', 'Mode'].map(h => (
                            <th key={h} className="px-3 py-1.5 text-left text-gray-500 font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {gestureLog.map((row, i) => (
                          <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 ${i === 0 ? 'bg-yellow-50' : ''}`}>
                            <td className="px-3 py-1.5 text-gray-600 tabular-nums">{row.time}</td>
                            <td className="px-3 py-1.5 text-gray-600">{row.date}</td>
                            <td className="px-3 py-1.5 text-gray-600 font-medium capitalize">{row.gesture.replace(/_/g, ' ')}</td>
                            <td className="px-3 py-1.5 text-gray-600">{row.rankChair}</td>
                            <td className="px-3 py-1.5 text-gray-600">{row.activityMode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3">
                <div className="mb-3">
                  <span className="text-sm font-bold text-gray-800">Gesture Summary</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Total Gestures', value: totalGestures },
                    { label: 'Gesture Detected', value: totalGestures },
                    { label: 'Total Chair Ranking', value: totalChairRanking },
                    { label: 'Alerts', value: totalGestures },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <div className="bg-sky-100 text-sky-700 text-[10px] font-medium px-2 py-1 rounded mb-1">{label}</div>
                      <div className="text-lg font-semibold text-gray-800">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleEndClass}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-6 rounded-lg transition-colors text-sm"
              >
                End Class
              </button>
            </div>
          </div>
        </main>
      </div>

      {showCalendar && createPortal(
        <DateCalendar
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          onClose={() => setShowCalendar(false)}
        />,
        document.body
      )}
    </>
  )
}