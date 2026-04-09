import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import DateCalendar from './DateCalendar'

export default function ClassSetupForm({ onStartClass, onCancel, selectedDate, onDateSelect, setupPrefs, updateSetupPrefs }) {
  const [showCalendar, setShowCalendar] = useState(false)
  const [liveDateTime, setLiveDateTime] = useState('')

  const [classSetup, setClassSetup] = useState({
    subjectName: '',
    teacherName: '',
    roomNumber: '',
    activityMode: 'Lecture',
    numChairs: 12,
    studentNames: {}
  })

  useEffect(() => {
    if (setupPrefs) {
      const namesArray = setupPrefs.student_names || Array.from({ length: setupPrefs.num_chairs || 12 }, (_, i) => `Student ${i + 1}`)
      const namesObj = {}
      namesArray.forEach((name, idx) => { namesObj[`student_${idx}`] = name })
      setClassSetup({
        subjectName: setupPrefs.subject_name || '',
        teacherName: setupPrefs.teacher_name || '',
        roomNumber: setupPrefs.room_number || '',
        activityMode: 'Lecture',
        numChairs: setupPrefs.num_chairs || 12,
        studentNames: namesObj
      })
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

  const handleInputChange = (field, value) => {
    setClassSetup(prev => ({ ...prev, [field]: value }))
  }

  const handleActivityMode = (mode) => {
    setClassSetup(prev => ({ ...prev, activityMode: mode }))
  }

  const handleAddChair = () => {
    setClassSetup(prev => ({
      ...prev,
      numChairs: Math.min(prev.numChairs + 1, 50),
    }))
  }

  const handleRemoveChair = () => {
    setClassSetup(prev => {
      const next = Math.max(prev.numChairs - 1, 1)
      const updatedNames = { ...prev.studentNames }
      delete updatedNames[`student_${prev.numChairs - 1}`]
      return { ...prev, numChairs: next, studentNames: updatedNames }
    })
  }

  const handleStudentNameChange = (key, value) => {
    setClassSetup(prev => ({
      ...prev,
      studentNames: { ...prev.studentNames, [key]: value },
    }))
  }

  const handleStart = () => {
    const namesArray = []
    for (let i = 0; i < classSetup.numChairs; i++) {
      namesArray.push(classSetup.studentNames[`student_${i}`] || `Student ${i + 1}`)
    }
    updateSetupPrefs({
      num_chairs: classSetup.numChairs,
      subject_name: classSetup.subjectName,
      teacher_name: classSetup.teacherName,
      room_number: classSetup.roomNumber,
      student_names: namesArray
    })
    onStartClass(classSetup)
  }

  return (
    <>
      {showCalendar && createPortal(
        <DateCalendar
          selectedDate={selectedDate}
          onDateSelect={(newDate) => { onDateSelect(newDate); setShowCalendar(false) }}
          onClose={() => setShowCalendar(false)}
        />,
        document.body
      )}

      <header className="bg-blue-500 px-6 py-4 flex items-center justify-between gap-6 flex-shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <h1 className="text-white text-2xl font-bold">Start Class</h1>
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
        <div className="max-w-4xl mx-auto bg-white rounded-lg border border-gray-200 shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Setup Your Class Activity</h2>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Class Information</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Subject Name', field: 'subjectName', placeholder: 'Machine Learning 101' },
                { label: 'Teacher Name', field: 'teacherName', placeholder: 'Prof. Santos' },
                { label: 'Room Number', field: 'roomNumber', placeholder: 'Room 104' },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label className="text-xs text-gray-600 font-medium block mb-1">{label}</label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={classSetup[field]}
                    onChange={e => handleInputChange(field, e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Activity Mode</h3>
            <div className="flex gap-3">
              {['Lecture', 'Quiz', 'Exam'].map(mode => (
                <button
                  key={mode}
                  onClick={() => handleActivityMode(mode)}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${classSetup.activityMode === mode ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Chair Ranking Setup</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600 font-medium">Number of Chairs / Students</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRemoveChair}
                  disabled={classSetup.numChairs <= 1}
                  className="w-9 h-9 rounded-lg border border-gray-300 bg-white text-gray-700 text-lg font-bold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  −
                </button>
                <span className="w-10 text-center text-base font-bold text-gray-800 tabular-nums">{classSetup.numChairs}</span>
                <button
                  onClick={handleAddChair}
                  disabled={classSetup.numChairs >= 50}
                  className="w-9 h-9 rounded-lg border border-gray-300 bg-white text-gray-700 text-lg font-bold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Student Names (optional)</h3>
            <p className="text-xs text-gray-400 mb-4">
              {classSetup.numChairs} chair{classSetup.numChairs !== 1 ? 's' : ''} — adjust with + / − above
            </p>
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: Math.min(classSetup.numChairs, 12) }, (_, i) => (
                <div key={i}>
                  <label className="text-xs text-gray-600 font-medium block mb-1">Chair Rank {i + 1}</label>
                  <input
                    type="text"
                    placeholder={`Student ${i + 1}`}
                    value={classSetup.studentNames[`student_${i}`] || ''}
                    onChange={e => handleStudentNameChange(`student_${i}`, e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2 rounded-lg transition-colors shadow-md flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Cancel
            </button>
            <button
              onClick={handleStart}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-2 rounded-lg transition-colors shadow-md"
            >
              Start Class Activity
            </button>
          </div>
        </div>
      </main>
    </>
  )
}