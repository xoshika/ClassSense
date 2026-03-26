import { useState } from "react";
import { createPortal } from "react-dom";
import DateCalendar from "./DateCalendar";

export default function ReadyToStartClass({ onNotNow, onProceedToSetup, selectedDate, onDateSelect }) {
  const [showCalendar, setShowCalendar] = useState(false);

  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleCalendarClose = () => {
    setShowCalendar(false);
  };

  const handleDateSelect = (newDate) => {
    onDateSelect(newDate);
    setShowCalendar(false);
  };
  return (
    <>
      {showCalendar && createPortal(
        <DateCalendar
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onClose={handleCalendarClose}
        />,
        document.body
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
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

      {/* Modal */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="text-5xl">🎓</div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-blue-700 mb-3">
            Ready to Start a Class?
          </h2>

          <p className="text-gray-600 text-sm mb-8 leading-relaxed">
            You are about to begin a new class session.<br/>
            Set up your activity mode, chair ranking,<br/>
            and custom session parameters.
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onNotNow}
              className="px-6 py-2.5 rounded-lg font-semibold text-gray-700 border-2 border-gray-300 hover:bg-gray-50 transition-colors"
            >
              ✕ Not Now
            </button>
            <button
              onClick={onProceedToSetup}
              className="px-6 py-2.5 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors"
            >
              ▶ Proceed to Setup
            </button>
          </div>
        </div>
      </main>
      </div>
    </>
  );
}
