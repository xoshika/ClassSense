import { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:8000/api'

const filterOptions = ['All', 'Hand Raise', 'Peace Sign', 'Writing', 'Head Moving']
const sortOptions = ['Newest', 'Oldest', 'By Rank', 'By Student', 'By Gesture']

export default function ClassActivity({ selectedDate }) {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('Newest')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  useEffect(() => {
    const dateStr = selectedDate.toISOString().split('T')[0]
    fetch(`${API_BASE}/activity/logs/?date=${dateStr}`)
      .then(r => r.json())
      .then(data => setLogs(data))
      .catch(console.error)
  }, [selectedDate])

  const filteredLogs = logs
    .filter(log => {
      if (filter === 'All') return true
      return log.gesture?.toLowerCase().includes(filter.toLowerCase().replace(' ', '_'))
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

  return (
    <>
      <div className="bg-white px-6 py-4 flex items-center gap-8 border-b-2 border-gray-200 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700 font-semibold">Filter:</span>
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="bg-sky-500 hover:bg-sky-600 text-white text-sm px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <span className="font-medium">{filter}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {filterOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-32">
                {filterOptions.map(option => (
                  <button
                    key={option}
                    onClick={() => { setFilter(option); setFilterOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filter === option ? 'bg-sky-100 text-sky-700 font-medium' : 'text-gray-700'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700 font-semibold">Sort:</span>
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="bg-sky-500 hover:bg-sky-600 text-white text-sm px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <span className="font-medium">{sort}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {sortOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-32">
                {sortOptions.map(option => (
                  <button
                    key={option}
                    onClick={() => { setSort(option); setSortOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sort === option ? 'bg-sky-100 text-sky-700 font-medium' : 'text-gray-700'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="bg-white rounded-lg border border-gray-200 shadow p-4 flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-800">Gesture Log</h2>
          </div>

          <div className="grid grid-cols-5 border-b-2 border-gray-300 bg-gray-50 rounded-md mb-2">
            {['Time', 'Date', 'Gesture', 'Chair', 'Student'].map(col => (
              <div key={col} className="px-4 py-3 text-xs text-gray-700 font-semibold border-r border-gray-200 last:border-r-0">
                {col}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[500px]">
            {filteredLogs.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">No gestures recorded</div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} className="grid grid-cols-5 border-b border-gray-100 py-2 hover:bg-blue-50 transition-colors">
                  <div className="px-4 py-2 text-xs text-gray-600">{log.time}</div>
                  <div className="px-4 py-2 text-xs text-gray-600">{log.date}</div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-800 capitalize flex items-center gap-2">
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: log.color || '#27AE60' }}></span>
                    {log.gesture}
                  </div>
                  <div className="px-4 py-2 text-xs text-gray-600">#{log.chair_rank}</div>
                  <div className="px-4 py-2 text-xs text-gray-600">{log.student_name}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  )
}