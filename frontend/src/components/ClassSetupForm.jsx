import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import DateCalendar from './DateCalendar'

export default function ClassSetupForm({ onStartClass, onCancel, selectedDate, onDateSelect, setupPrefs, updateSetupPrefs }) {
  const [showCalendar, setShowCalendar] = useState(false)
  const [liveDateTime, setLiveDateTime] = useState('')

  const [classSetup, setClassSetup] = useState({
    subjectName: '', teacherName: '', roomNumber: '',
    activityMode: 'Lecture', numChairs: 12, studentNames: {}, timerDuration: 0
  })

  useEffect(() => {
    if (setupPrefs) {
      const namesArray = setupPrefs.student_names || Array.from({ length: setupPrefs.num_chairs || 12 }, (_, i) => `Student ${i + 1}`)
      const namesObj = {}
      namesArray.forEach((name, idx) => { namesObj[`student_${idx}`] = name })
      setClassSetup(prev => ({
        ...prev,
        subjectName: setupPrefs.subject_name || '',
        teacherName: setupPrefs.teacher_name || '',
        roomNumber: setupPrefs.room_number || '',
        numChairs: setupPrefs.num_chairs || 12,
        studentNames: namesObj
      }))
    }
  }, [setupPrefs])

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

  const handleInputChange = (field, value) => setClassSetup(prev => ({ ...prev, [field]: value }))

  const handleActivityMode = (mode) => setClassSetup(prev => ({
    ...prev,
    activityMode: mode,
    timerDuration: mode === 'Lecture' ? 0 : prev.timerDuration
  }))

  const handleAddChair = () => setClassSetup(prev => ({ ...prev, numChairs: Math.min(prev.numChairs + 1, 50) }))
  const handleRemoveChair = () => setClassSetup(prev => {
    const next = Math.max(prev.numChairs - 1, 1)
    const updatedNames = { ...prev.studentNames }
    delete updatedNames[`student_${prev.numChairs - 1}`]
    return { ...prev, numChairs: next, studentNames: updatedNames }
  })

  const handleStudentNameChange = (key, value) => setClassSetup(prev => ({
    ...prev, studentNames: { ...prev.studentNames, [key]: value }
  }))

  const handleStart = () => {
    const namesArray = []
    for (let i = 0; i < classSetup.numChairs; i++) {
      namesArray.push(classSetup.studentNames[`student_${i}`] || `Student ${i + 1}`)
    }
    try {
      if (typeof updateSetupPrefs === 'function') {
        updateSetupPrefs({
          num_chairs: classSetup.numChairs,
          subject_name: classSetup.subjectName,
          teacher_name: classSetup.teacherName,
          room_number: classSetup.roomNumber,
          student_names: namesArray
        })
      }
    } catch (e) {
      console.warn('updateSetupPrefs failed:', e)
    }
    onStartClass({ ...classSetup, studentNames: namesArray })
  }

  const MODE_CONFIG = {
    Lecture: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', activeBg: 'linear-gradient(135deg,#3b82f6,#2563eb)' },
    Quiz:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', activeBg: 'linear-gradient(135deg,#f59e0b,#d97706)' },
    Exam:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  activeBg: 'linear-gradient(135deg,#ef4444,#dc2626)' },
  }

  const showTimer = classSetup.activityMode !== 'Lecture'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .csf-root { flex: 1; display: flex; flex-direction: column; overflow: hidden; font-family: 'DM Sans','Segoe UI',sans-serif; }
        .csf-topbar {
          background: rgba(15,23,42,0.97); backdrop-filter: blur(20px);
          padding: 0 28px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0; border-bottom: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 2px 16px rgba(0,0,0,0.2);
        }
        .csf-topbar-left { display: flex; align-items: center; gap: 10px; }
        .csf-topbar-title { font-size: 18px; font-weight: 700; color: #f0f9ff; letter-spacing: -0.4px; }
        .csf-datetime-btn {
          display: flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; padding: 6px 12px; cursor: pointer;
          color: rgba(186,210,235,0.9); font-size: 12px; font-weight: 500;
          font-family: 'DM Sans','Segoe UI',sans-serif; transition: all 0.18s ease;
        }
        .csf-datetime-btn:hover { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.3); }
        .csf-avatar { width: 34px; height: 34px; background: linear-gradient(135deg,#3b82f6,#1d4ed8); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(59,130,246,0.3); }
        .csf-body { flex: 1; overflow: auto; padding: 28px; background: #f1f5f9; }
        .csf-card {
          max-width: 860px; margin: 0 auto;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.6); border-radius: 20px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9);
          padding: 32px;
        }
        .csf-card-title { font-size: 17px; font-weight: 700; color: #0f172a; letter-spacing: -0.4px; margin-bottom: 28px; }
        .csf-section-title {
          font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.8px; text-transform: uppercase;
          margin-bottom: 14px; margin-top: 24px; display: flex; align-items: center; gap: 8px;
        }
        .csf-section-title::after { content: ''; flex: 1; height: 1px; background: rgba(0,0,0,0.07); }
        .csf-input-group { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
        .csf-field { display: flex; flex-direction: column; gap: 6px; }
        .csf-label { font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.4px; text-transform: uppercase; }
        .csf-input {
          padding: 10px 14px; background: rgba(255,255,255,0.6); backdrop-filter: blur(8px);
          border: 1px solid rgba(0,0,0,0.09); border-radius: 10px; font-size: 13px; color: #0f172a;
          font-family: 'DM Sans','Segoe UI',sans-serif; transition: all 0.18s ease; outline: none;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.04);
        }
        .csf-input::placeholder { color: rgba(148,163,184,0.7); }
        .csf-input:focus {
          border-color: rgba(59,130,246,0.5); background: rgba(255,255,255,0.85);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1), inset 0 1px 3px rgba(0,0,0,0.03);
        }
        .csf-mode-btns { display: flex; gap: 10px; }
        .csf-mode-btn {
          padding: 9px 22px; border-radius: 10px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.18s ease; font-family: 'DM Sans','Segoe UI',sans-serif;
          border: 1px solid transparent;
        }
        .csf-mode-btn.inactive {
          background: rgba(255,255,255,0.6); backdrop-filter: blur(8px);
          border-color: rgba(0,0,0,0.09); color: #475569; box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .csf-mode-btn.inactive:hover { background: rgba(255,255,255,0.85); transform: translateY(-1px); }
        .csf-timer-card {
          background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.2);
          border-radius: 12px; padding: 16px 18px; margin-top: 14px;
        }
        .csf-timer-label { font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .csf-timer-presets { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .csf-timer-preset {
          padding: 6px 14px; border-radius: 8px; border: none; cursor: pointer;
          font-size: 12px; font-weight: 700; transition: all 0.18s ease;
          font-family: 'DM Sans','Segoe UI',sans-serif;
        }
        .csf-timer-preset.active { background: linear-gradient(135deg,#f59e0b,#d97706); color: white; box-shadow: 0 3px 10px rgba(245,158,11,0.3); }
        .csf-timer-preset.inactive { background: rgba(255,255,255,0.7); color: #92400e; border: 1px solid rgba(245,158,11,0.2); }
        .csf-timer-preset.inactive:hover { background: rgba(245,158,11,0.1); }
        .csf-timer-custom { display: flex; align-items: center; gap: 10px; }
        .csf-timer-input {
          width: 80px; padding: 8px 12px; background: rgba(255,255,255,0.7);
          border: 1px solid rgba(245,158,11,0.3); border-radius: 8px; font-size: 13px;
          font-weight: 700; color: #0f172a; font-family: 'DM Sans','Segoe UI',sans-serif;
          outline: none; text-align: center;
        }
        .csf-timer-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
        .csf-chair-row { display: flex; align-items: center; gap: 14px; }
        .csf-chair-label { font-size: 13px; color: #475569; font-weight: 500; }
        .csf-counter { display: flex; align-items: center; gap: 10px; }
        .csf-counter-btn {
          width: 34px; height: 34px; border-radius: 9px; background: rgba(255,255,255,0.6);
          backdrop-filter: blur(8px); border: 1px solid rgba(0,0,0,0.09); color: #334155;
          font-size: 18px; font-weight: 700; cursor: pointer; display: flex; align-items: center;
          justify-content: center; transition: all 0.18s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .csf-counter-btn:hover:not(:disabled) { background: rgba(255,255,255,0.85); transform: translateY(-1px); }
        .csf-counter-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .csf-counter-val { font-size: 16px; font-weight: 700; color: #0f172a; min-width: 28px; text-align: center; }
        .csf-student-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
        .csf-student-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 5px; }
        .csf-divider { height: 1px; background: rgba(0,0,0,0.06); margin: 22px 0; }
        .csf-actions { display: flex; gap: 10px; }
        .csf-btn-cancel {
          display: flex; align-items: center; gap: 7px; padding: 11px 22px; border-radius: 10px;
          font-size: 13px; font-weight: 700; background: rgba(239,68,68,0.1); backdrop-filter: blur(8px);
          border: 1px solid rgba(239,68,68,0.25); color: #ef4444; cursor: pointer;
          font-family: 'DM Sans','Segoe UI',sans-serif; transition: all 0.18s ease;
        }
        .csf-btn-cancel:hover { background: rgba(239,68,68,0.18); transform: translateY(-1px); }
        .csf-btn-start {
          display: flex; align-items: center; gap: 7px; padding: 11px 22px; border-radius: 10px;
          font-size: 13px; font-weight: 700; background: linear-gradient(135deg,#3b82f6,#2563eb);
          border: none; color: white; cursor: pointer; font-family: 'DM Sans','Segoe UI',sans-serif;
          transition: all 0.18s ease; box-shadow: 0 4px 14px rgba(59,130,246,0.35);
        }
        .csf-btn-start:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(59,130,246,0.45); }
        .csf-hint { font-size: 11px; color: #94a3b8; margin-bottom: 12px; }
      `}</style>

      {showCalendar && createPortal(
        <DateCalendar selectedDate={selectedDate} onDateSelect={(d) => { onDateSelect(d); setShowCalendar(false) }} onClose={() => setShowCalendar(false)} />,
        document.body
      )}

      <div className="csf-root">
        <header className="csf-topbar">
          <div className="csf-topbar-left">
            <div style={{ width: 4, height: 20, background: 'linear-gradient(180deg,#3b82f6,#60a5fa)', borderRadius: 4 }} />
            <span className="csf-topbar-title">Start Class</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="csf-datetime-btn" onClick={() => setShowCalendar(!showCalendar)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {liveDateTime}
            </button>
            <div className="csf-avatar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          </div>
        </header>

        <main className="csf-body">
          <div className="csf-card">
            <div className="csf-card-title">Setup Your Class Activity</div>

            <div className="csf-section-title">Class Information</div>
            <div className="csf-input-group">
              {[
                { label: 'Subject Name', field: 'subjectName', placeholder: 'Machine Learning 101' },
                { label: 'Teacher Name', field: 'teacherName', placeholder: 'Prof. Santos' },
                { label: 'Room Number', field: 'roomNumber', placeholder: 'Room 104' },
              ].map(({ label, field, placeholder }) => (
                <div key={field} className="csf-field">
                  <label className="csf-label">{label}</label>
                  <input type="text" placeholder={placeholder} value={classSetup[field]} onChange={e => handleInputChange(field, e.target.value)} className="csf-input" />
                </div>
              ))}
            </div>

            <div className="csf-divider" />
            <div className="csf-section-title">Activity Mode</div>
            <div className="csf-mode-btns">
              {['Lecture', 'Quiz', 'Exam'].map(mode => {
                const cfg = MODE_CONFIG[mode]
                const isActive = classSetup.activityMode === mode
                return (
                  <button
                    key={mode}
                    onClick={() => handleActivityMode(mode)}
                    className={`csf-mode-btn ${isActive ? '' : 'inactive'}`}
                    style={isActive ? {
                      background: cfg.activeBg, color: 'white', border: 'none',
                      boxShadow: `0 4px 14px ${cfg.color}40`,
                    } : {}}
                  >
                    {mode === 'Lecture' && '📖 '}
                    {mode === 'Quiz' && '📝 '}
                    {mode === 'Exam' && '🔒 '}
                    {mode}
                  </button>
                )
              })}
            </div>

            {showTimer && (
              <div className="csf-timer-card">
                <div className="csf-timer-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Session Timer ({classSetup.activityMode})
                </div>
                <div className="csf-timer-presets">
                  <button
                    className={`csf-timer-preset ${classSetup.timerDuration === 0 ? 'active' : 'inactive'}`}
                    onClick={() => handleInputChange('timerDuration', 0)}
                    style={classSetup.timerDuration === 0 ? { background: 'linear-gradient(135deg,#64748b,#475569)' } : {}}
                  >
                    No Timer
                  </button>
                  {[5, 10, 15, 20, 30, 45, 60].map(min => (
                    <button
                      key={min}
                      className={`csf-timer-preset ${classSetup.timerDuration === min ? 'active' : 'inactive'}`}
                      onClick={() => handleInputChange('timerDuration', min)}
                    >
                      {min}m
                    </button>
                  ))}
                </div>
                <div className="csf-timer-custom">
                  <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>Custom:</span>
                  <input
                    type="number" min="1" max="180" className="csf-timer-input" placeholder="min"
                    value={classSetup.timerDuration || ''}
                    onChange={e => handleInputChange('timerDuration', parseInt(e.target.value) || 0)}
                  />
                  <span style={{ fontSize: 12, color: '#92400e' }}>minutes</span>
                  {classSetup.timerDuration > 0 && (
                    <span style={{ fontSize: 11, color: '#64748b', background: 'rgba(245,158,11,0.1)', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>
                      Timer will auto-lock detection when time's up
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="csf-divider" />
            <div className="csf-section-title">Chair Ranking Setup</div>
            <div className="csf-chair-row">
              <span className="csf-chair-label">Number of Chairs / Students</span>
              <div className="csf-counter">
                <button className="csf-counter-btn" onClick={handleRemoveChair} disabled={classSetup.numChairs <= 1}>−</button>
                <span className="csf-counter-val">{classSetup.numChairs}</span>
                <button className="csf-counter-btn" onClick={handleAddChair} disabled={classSetup.numChairs >= 50}>+</button>
              </div>
            </div>

            <div className="csf-divider" />
            <div className="csf-section-title">Student Names (Optional)</div>
            <div className="csf-hint">{classSetup.numChairs} chair{classSetup.numChairs !== 1 ? 's' : ''} — adjust with + / − above</div>
            <div className="csf-student-grid">
              {Array.from({ length: Math.min(classSetup.numChairs, 12) }, (_, i) => (
                <div key={i}>
                  <div className="csf-student-label">Chair Rank {i + 1}</div>
                  <input
                    type="text" placeholder={`Student ${i + 1}`}
                    value={classSetup.studentNames[`student_${i}`] || ''}
                    onChange={e => handleStudentNameChange(`student_${i}`, e.target.value)}
                    className="csf-input" style={{ fontSize: 12 }}
                  />
                </div>
              ))}
            </div>

            <div className="csf-divider" />
            <div className="csf-actions">
              <button className="csf-btn-cancel" onClick={onCancel}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Cancel
              </button>
              <button className="csf-btn-start" onClick={handleStart}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Start Class Activity
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}