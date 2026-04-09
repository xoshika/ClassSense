import { useState, useEffect } from 'react'

export default function ClassSetup({ setupPrefs, updateSetupPrefs }) {
  const [subjectName, setSubjectName] = useState('MACHINE LEARNING')
  const [roomNumber, setRoomNumber] = useState('Lab 2 CCS')
  const [teacherName, setTeacherName] = useState('JOHN AUGUSTUS')
  const [numChairs, setNumChairs] = useState(6)
  const [studentNames, setStudentNames] = useState([])
  const [liveDateTime, setLiveDateTime] = useState('')

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
      updateSetupPrefs({
        num_chairs: numChairs,
        subject_name: subjectName,
        teacher_name: teacherName,
        room_number: roomNumber,
        student_names: studentNames
      })
    }
    alert('Changes saved successfully!')
  }

  return (
    <main className="flex-1 overflow-auto p-6 bg-gray-50">
      <div className="bg-white rounded-lg border border-gray-200 shadow p-6 hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-gray-800">Class Setup</h2>
          <span className="text-xs text-gray-500 tabular-nums bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
            🕐 {liveDateTime}
          </span>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Class Information</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs text-gray-600 font-semibold">Subject Name</label>
              <input
                type="text"
                value={subjectName}
                onChange={e => setSubjectName(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs text-gray-600 font-semibold">Room Number</label>
              <input
                type="text"
                value={roomNumber}
                onChange={e => setRoomNumber(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300 transition-all"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-600 font-semibold">Teacher Name</label>
            <input
              type="text"
              value={teacherName}
              onChange={e => setTeacherName(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300 transition-all w-full"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 my-6" />

        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Chair Ranking Setup</h3>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Number of Chairs / Students</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRemoveChair}
                disabled={numChairs <= 1}
                className="w-9 h-9 rounded-lg border border-gray-300 bg-white text-gray-700 text-lg font-bold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                −
              </button>
              <span className="w-10 text-center text-base font-bold text-gray-800 tabular-nums">{numChairs}</span>
              <button
                onClick={handleAddChair}
                disabled={numChairs >= 50}
                className="w-9 h-9 rounded-lg border border-gray-300 bg-white text-gray-700 text-lg font-bold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 my-6" />

        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-1">Student Ranking</h3>
          <p className="text-xs text-gray-400 mb-4">
            {numChairs} chair{numChairs !== 1 ? 's' : ''} — adjust with + / − above
          </p>

          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: numChairs }, (_, i) => (
              <div key={i} className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500 font-medium">Chair Rank {i + 1}</label>
                <input
                  type="text"
                  value={studentNames[i] || ''}
                  onChange={e => handleStudentChange(i, e.target.value)}
                  placeholder={`Student ${i + 1}`}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300 transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 my-6" />

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-2 rounded-lg transition-colors shadow-md"
          >
            Save Changes
          </button>
        </div>
      </div>
    </main>
  )
}