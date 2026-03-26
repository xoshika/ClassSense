import React from "react";

export default function ClassSummary({ classSetup, gestureLog, onSaveProgress, onStartNewClass, onDiscard }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-blue-500 px-6 py-4 flex items-center justify-between gap-6 flex-shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <h1 className="text-white text-2xl font-bold">Start Class</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/90 text-sm">Subject: {classSetup.subjectName || "Machine Learning 101"}</span>
        </div>
        <div className="ml-auto flex items-center gap-3">

          <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
  
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Class Summary</h2>
            <div className="grid grid-cols-5 gap-2 mb-4 text-sm text-gray-600">
              <div>
                <span className="text-xs text-gray-500">Subject</span>
                <p className="font-medium">{classSetup.subjectName}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Teacher</span>
                <p className="font-medium">{classSetup.teacherName}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Mode</span>
                <p className="font-medium">{classSetup.activityMode}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Duration</span>
                <p className="font-medium">{classSetup.duration}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Date</span>
                <p className="font-medium">March 21 2026</p>
              </div>
            </div>
          </div>

          {/* Class Statistics */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Class Statistics</h2>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total Gestures", value: gestureLog.length.toString() },
                { label: "Students Participated", value: "0" },
                { label: "Total Alerts", value: "0" },
                { label: "Gesture Type", value: "0" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-150 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-sky-700 font-semibold mb-1">{label}</div>
                  <div className="text-2xl font-bold text-sky-900">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Participation Ranking */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Participation Ranking</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-2 text-left text-gray-600 font-semibold">Rank</th>
                    <th className="px-3 py-2 text-left text-gray-600 font-semibold">Student</th>
                    <th className="px-3 py-2 text-left text-gray-600 font-semibold">Chair</th>
                    <th className="px-3 py-2 text-left text-gray-600 font-semibold">Gestures</th>
                    <th className="px-3 py-2 text-left text-gray-600 font-semibold">Gesture Type</th>
                  </tr>
                </thead>
                <tbody>
                  {gestureLog.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-3 py-4 text-center text-gray-400 text-sm">
                        No participation data
                      </td>
                    </tr>
                  ) : (
                    gestureLog.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                        <td className="px-3 py-2 text-gray-600">{row.student || "-"}</td>
                        <td className="px-3 py-2 text-gray-600">{row.rankChair || "-"}</td>
                        <td className="px-3 py-2 text-gray-600">1</td>
                        <td className="px-3 py-2 text-gray-600">{row.gesture}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full Gesture Log */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Full Gesture Log</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-2 text-left text-gray-600 font-semibold">Time</th>
                    <th className="px-3 py-2 text-left text-gray-600 font-semibold">Date</th>
                    <th className="px-3 py-2 text-left text-gray-600 font-semibold">Gesture</th>
                    <th className="px-3 py-2 text-left text-gray-600 font-semibold">Chair</th>
                    <th className="px-3 py-2 text-left text-gray-600 font-semibold">Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {gestureLog.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-3 py-4 text-center text-gray-400 text-sm">
                        No gesture data recorded
                      </td>
                    </tr>
                  ) : (
                    gestureLog.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-600">{row.time || "-"}</td>
                        <td className="px-3 py-2 text-gray-600">{row.date || "-"}</td>
                        <td className="px-3 py-2 text-gray-600 font-medium">{row.gesture}</td>
                        <td className="px-3 py-2 text-gray-600">{row.rankChair || "-"}</td>
                        <td className="px-3 py-2 text-gray-600">{row.activityMode || classSetup.activityMode}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={onSaveProgress}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg transition-colors"
            >
              Save Progress
            </button>
            <button
              onClick={onStartNewClass}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-6 rounded-lg transition-colors"
            >
               Start New Class
            </button>
            <button
              onClick={onDiscard}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2.5 px-6 rounded-lg transition-colors"
            >
              ✕ Discard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
