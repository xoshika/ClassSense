import { useState } from "react";
import { createPortal } from "react-dom";
import DateCalendar from "./DateCalendar";

export default function ClassSetupForm({ onStartClass, onCancel, selectedDate, onDateSelect }) {
  const [showCalendar, setShowCalendar] = useState(false);

  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleCalendarClose = () => {
    setShowCalendar(false);
  };

  const handleDateSelectInternal = (newDate) => {
    onDateSelect(newDate);
    setShowCalendar(false);
  };
  const [classSetup, setClassSetup] = useState({
    subjectName: "",
    teacherName: "",
    roomNumber: "",
    activityMode: "Lecture",
    numChairs: 12,
    studentNames: {},
  });

  const handleInputChange = (field, value) => {
    setClassSetup((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleActivityMode = (mode) => {
    setClassSetup((prev) => ({
      ...prev,
      activityMode: mode,
    }));
  };

  const handleChairChange = (increment) => {
    setClassSetup((prev) => ({
      ...prev,
      numChairs: Math.max(1, prev.numChairs + increment),
    }));
  };

  const handleStudentNameChange = (rowCol, value) => {
    setClassSetup((prev) => ({
      ...prev,
      studentNames: {
        ...prev.studentNames,
        [rowCol]: value,
      },
    }));
  };

  const handleStart = () => {
    onStartClass(classSetup);
  };

  return (
    <>
      {showCalendar && createPortal(
        <DateCalendar
          selectedDate={selectedDate}
          onDateSelect={handleDateSelectInternal}
          onClose={handleCalendarClose}
        />,
        document.body
      )}

      {/* Top bar */}
      <header className="bg-blue-500 px-6 py-4 flex items-center justify-between gap-6 flex-shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <h1 className="text-white text-2xl font-bold">Start Class</h1>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={() => setShowCalendar(!showCalendar)} className="flex items-center gap-1.5 bg-white/20 border border-white/40 rounded px-2.5 py-1 hover:bg-white/30 transition-colors cursor-pointer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="text-white text-[11px] font-medium">{formatDate(selectedDate)} | 10:00am</span>
          </button>
          <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        </div>
      </header>

      {/* Setup Form */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto bg-white rounded-lg border border-gray-200 shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Setup Your Class Activity</h2>

          {/* Class Information */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Class Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-600 font-medium block mb-1">Subject Name</label>
                <input
                  type="text"
                  placeholder="Machine Learning 101"
                  value={classSetup.subjectName}
                  onChange={(e) => handleInputChange("subjectName", e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium block mb-1">Teacher Name</label>
                <input
                  type="text"
                  placeholder="Prof. Santos"
                  value={classSetup.teacherName}
                  onChange={(e) => handleInputChange("teacherName", e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium block mb-1">Room Number</label>
                <input
                  type="text"
                  placeholder="Room 104"
                  value={classSetup.roomNumber}
                  onChange={(e) => handleInputChange("roomNumber", e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Activity Mode */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Activity Mode</h3>
            <div className="flex gap-3">
              {["Lecture", "Quiz", "Exam"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleActivityMode(mode)}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    classSetup.activityMode === mode
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Chair Ranking Setup */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Chair Ranking Setup</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600 font-medium">Number of Chairs / Students</span>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => handleChairChange(-1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  value={classSetup.numChairs}
                  onChange={(e) => handleInputChange("numChairs", parseInt(e.target.value) || 0)}
                  className="w-12 text-center border-0 focus:outline-none text-sm font-medium"
                />
                <button
                  onClick={() => handleChairChange(1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Student Names (optional) */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Student Names (optional)</h3>
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: Math.min(classSetup.numChairs, 6) }).map((_, i) => (
                <div key={i}>
                  <label className="text-xs text-gray-600 font-medium block mb-1">
                    Chair {i + 1}
                  </label>
                  <input
                    type="text"
                    placeholder={`Student ${i + 1}`}
                    value={classSetup.studentNames[`student_${i}`] || ""}
                    onChange={(e) => handleStudentNameChange(`student_${i}`, e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2 rounded-lg transition-colors shadow-md flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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
  );
}
