import { useState, useEffect } from 'react'

export default function ClassSetup({ setupPrefs, updateSetupPrefs }) {
  const [subjectName, setSubjectName] = useState('MACHINE LEARNING')
  const [roomNumber, setRoomNumber] = useState('Lab 2 CCS')
  const [teacherName, setTeacherName] = useState('JOHN AUGUSTUS')
  const [numChairs, setNumChairs] = useState(6)
  const [studentNames, setStudentNames] = useState([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (setupPrefs) {
      setSubjectName(setupPrefs.subject_name || 'MACHINE LEARNING')
      setRoomNumber(setupPrefs.room_number || 'Lab 2 CCS')
      setTeacherName(setupPrefs.teacher_name || 'JOHN AUGUSTUS')
      setNumChairs(setupPrefs.num_chairs || 6)
      const names = setupPrefs.student_names || Array.from({ length: setupPrefs.num_chairs || 6 }, (_, i) => `Student ${i + 1}`)
      setStudentNames(names)
    }
  }, [setupPrefs])

  const handleAddChair = () => {
    const next = numChairs + 1
    setNumChairs(next)
    setStudentNames(prev => [...prev, `Student ${next}`])
  }

  const handleRemoveChair = () => {
    if (numChairs <= 1) return
    setNumChairs(prev => prev - 1)
    setStudentNames(prev => prev.slice(0, -1))
  }

  const handleStudentChange = (index, value) => {
    const updated = [...studentNames]
    updated[index] = value
    setStudentNames(updated)
  }

  const handleSave = () => {
    if (updateSetupPrefs) {
      updateSetupPrefs({ num_chairs: numChairs, subject_name: subjectName, teacher_name: teacherName, room_number: roomNumber, student_names: studentNames })
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .csetup-body { flex: 1; overflow: auto; padding: 28px; background: #f1f5f9; font-family: 'DM Sans','Segoe UI',sans-serif; }
        .csetup-card {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.6);
          border-radius: 20px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9);
          padding: 32px;
        }
        .csetup-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
        .csetup-title { font-size: 17px; font-weight: 700; color: #0f172a; letter-spacing: -0.4px; }
        .csetup-section-title {
          font-size: 11px; font-weight: 700; color: #64748b;
          letter-spacing: 0.8px; text-transform: uppercase;
          margin-bottom: 14px;
          display: flex; align-items: center; gap: 8px;
        }
        .csetup-section-title::after { content: ''; flex: 1; height: 1px; background: rgba(0,0,0,0.07); }
        .csetup-input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
        .csetup-field { display: flex; flex-direction: column; gap: 6px; }
        .csetup-label { font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.4px; text-transform: uppercase; }
        .csetup-input {
          padding: 10px 14px;
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0,0,0,0.09);
          border-radius: 10px;
          font-size: 13px; color: #0f172a;
          font-family: 'DM Sans','Segoe UI',sans-serif;
          transition: all 0.18s ease; outline: none;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.04);
          width: 100%; box-sizing: border-box;
        }
        .csetup-input::placeholder { color: rgba(148,163,184,0.7); }
        .csetup-input:focus {
          border-color: rgba(59,130,246,0.5);
          background: rgba(255,255,255,0.88);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1), inset 0 1px 3px rgba(0,0,0,0.03);
        }
        .csetup-divider { height: 1px; background: rgba(0,0,0,0.06); margin: 22px 0; }
        .csetup-chair-row { display: flex; align-items: center; gap: 14px; }
        .csetup-chair-label { font-size: 13px; color: #475569; font-weight: 500; }
        .csetup-counter { display: flex; align-items: center; gap: 10px; }
        .csetup-counter-btn {
          width: 34px; height: 34px; border-radius: 9px;
          background: rgba(255,255,255,0.6); backdrop-filter: blur(8px);
          border: 1px solid rgba(0,0,0,0.09); color: #334155;
          font-size: 18px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.18s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .csetup-counter-btn:hover:not(:disabled) { background: rgba(255,255,255,0.88); transform: translateY(-1px); }
        .csetup-counter-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .csetup-counter-val { font-size: 16px; font-weight: 700; color: #0f172a; min-width: 28px; text-align: center; }
        .csetup-hint { font-size: 11px; color: #94a3b8; margin-bottom: 14px; }
        .csetup-student-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
        .csetup-student-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 5px; }
        .csetup-actions { display: flex; justify-content: flex-end; }
        .csetup-save-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 26px; border-radius: 10px;
          font-size: 13px; font-weight: 700;
          border: none; cursor: pointer;
          font-family: 'DM Sans','Segoe UI',sans-serif;
          transition: all 0.22s ease;
        }
        .csetup-save-btn.default {
          background: linear-gradient(135deg,#3b82f6,#2563eb);
          color: white; box-shadow: 0 4px 14px rgba(59,130,246,0.35);
        }
        .csetup-save-btn.default:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(59,130,246,0.45); }
        .csetup-save-btn.success {
          background: linear-gradient(135deg,#10b981,#059669);
          color: white; box-shadow: 0 4px 14px rgba(16,185,129,0.3);
        }
      `}</style>

      <main className="csetup-body">
        <div className="csetup-card">
          <div className="csetup-header">
            <div className="csetup-title">Class Setup</div>
          </div>

          <div className="csetup-section-title">Class Information</div>
          <div className="csetup-input-grid">
            <div className="csetup-field">
              <label className="csetup-label">Subject Name</label>
              <input type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} className="csetup-input" />
            </div>
            <div className="csetup-field">
              <label className="csetup-label">Room Number</label>
              <input type="text" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} className="csetup-input" />
            </div>
          </div>
          <div className="csetup-field">
            <label className="csetup-label">Teacher Name</label>
            <input type="text" value={teacherName} onChange={e => setTeacherName(e.target.value)} className="csetup-input" />
          </div>

          <div className="csetup-divider" />
          <div className="csetup-section-title">Chair Ranking Setup</div>
          <div className="csetup-chair-row">
            <span className="csetup-chair-label">Number of Chairs / Students</span>
            <div className="csetup-counter">
              <button className="csetup-counter-btn" onClick={handleRemoveChair} disabled={numChairs <= 1}>−</button>
              <span className="csetup-counter-val">{numChairs}</span>
              <button className="csetup-counter-btn" onClick={handleAddChair} disabled={numChairs >= 50}>+</button>
            </div>
          </div>

          <div className="csetup-divider" />
          <div className="csetup-section-title">Student Ranking</div>
          <div className="csetup-hint">{numChairs} chair{numChairs !== 1 ? 's' : ''} — adjust with + / − above</div>
          <div className="csetup-student-grid">
            {Array.from({ length: numChairs }, (_, i) => (
              <div key={i}>
                <div className="csetup-student-label">Chair Rank {i + 1}</div>
                <input
                  type="text"
                  value={studentNames[i] || ''}
                  onChange={e => handleStudentChange(i, e.target.value)}
                  placeholder={`Student ${i + 1}`}
                  className="csetup-input"
                  style={{ fontSize: 12 }}
                />
              </div>
            ))}
          </div>

          <div className="csetup-divider" />
          <div className="csetup-actions">
            <button onClick={handleSave} className={`csetup-save-btn ${saved ? 'success' : 'default'}`}>
              {saved ? (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Saved!</>
              ) : (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Changes</>
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  )
}