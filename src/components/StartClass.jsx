import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ClassSetupForm from "./ClassSetupForm";
import DateCalendar from "./DateCalendar";
import ClassSummary from "./ClassSummary";
import ReadyToStartClass from "./ReadyToStartClass";

const gestureLogData = [];

export default function StartClass({ selectedDate, onDateSelect }) {
  const [showReadyDialog, setShowReadyDialog] = useState(true);
  const [classSetup, setClassSetup] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date(2026, 0, 5, 10, 0, 0)); // For live gesture timestamps
  const [detectedGesture, setDetectedGesture] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [cameraExpanded, setCameraExpanded] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("front"); // "front" or "back"
  const [showSummary, setShowSummary] = useState(false);
  const [gestureLog, setGestureLog] = useState([]);

  const formatDate = (date) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = date.getHours() >= 12 ? "PM" : "AM";
    return `${hours}:${minutes} ${ampm}`;
  };

  const handleDateSelectInternal = (newDate) => {
    onDateSelect(newDate);
    setShowCalendar(false);
  };

  const handleStartClass = (setupData) => {
    setClassSetup(setupData);
    setGestureLog([]);
    setShowSummary(false);
  };

  const handleEndClass = () => {
    setShowSummary(true);
  };

  const handleSaveProgress = () => {
    // Save gesture log to dashboard/backend
    console.log("Saving progress...", gestureLog);
    // Then reset and go back to class setup
    setClassSetup(null);
    setShowSummary(false);
  };

  const handleStartNewClass = () => {
    // Start a completely new class - go directly to setup form
    setClassSetup(null);
    setShowSummary(false);
    setShowReadyDialog(false);
    setGestureLog([]);
    setDetectedGesture("");
  };

  const handleDiscard = () => {
    // Discard data and return to setup
    setClassSetup(null);
    setShowSummary(false);
    setGestureLog([]);
    setDetectedGesture("");
    setShowReadyDialog(true);
  };

  const handleNotNow = () => {
    // Just keep the dialog visible, don't navigate
    // User can click "Proceed to Setup" when ready
  };

  const handleProceedToSetup = () => {
    setShowReadyDialog(false);
  };

  // Real-time clock for gesture timestamps
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime((prev) => new Date(prev.getTime() + 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);



  if (showReadyDialog) {
    return (
      <ReadyToStartClass 
        onNotNow={handleNotNow}
        onProceedToSetup={handleProceedToSetup}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelectInternal}
      />
    );
  }

  const handleCancelSetup = () => {
    setShowReadyDialog(true);
  };

  if (!classSetup) {
    return <ClassSetupForm onStartClass={handleStartClass} onCancel={handleCancelSetup} selectedDate={selectedDate} onDateSelect={handleDateSelectInternal} />
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
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-blue-500 px-6 py-4 flex items-center justify-between gap-6 flex-shrink-0 shadow-md relative z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-white text-2xl font-bold">Start Class</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/90 text-sm">Subject: {classSetup.subjectName || "Machine Learning 101"}</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
  
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex items-center gap-1.5 bg-white/20 border border-white/40 rounded px-2.5 py-1 hover:bg-white/30 transition-colors cursor-pointer"
          >
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

      {/* Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="flex gap-6 h-full">

            {/* ── Left Column ── */}
            <div className="flex flex-col gap-3" style={{ width: "45%" }}>

              {/* Live Classroom */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2 text-center">
                  <span className="text-sm font-semibold text-gray-700">Live Classroom</span>
                </div>
                {/* Camera feed placeholder with classroom image */}
                <button
                  onClick={() => setCameraExpanded(true)}
                  className="relative mx-3 mb-3 rounded overflow-hidden bg-gray-300 w-full hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ height: "180px" }}
                >
      
                  <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Live
                  </div>
             
                  <div className="w-full h-full bg-gray-200" />
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                    <div className="bg-sky-500/90 text-white text-[11px] font-semibold px-3 py-1 rounded">
                      {detectedGesture ? detectedGesture : "Waiting for gesture..."}
                    </div>
                    <div className="bg-black/50 text-white text-[11px] px-2 py-1 rounded">
                      {formatTime(currentTime)}
                    </div>
                  </div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/60 text-xs pointer-events-none">
                    Click to expand
                  </div>
                </button>
              </div>

              {/* Recent Alerts */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm">🔔</span>
                  <span className="text-sm font-semibold text-gray-700">Recent Alerts</span>
                </div>
                {detectedGesture ? (
                  <div className="flex justify-between items-center text-xs text-gray-600 py-1">
                    <span>Chair Rank Number 1 {detectedGesture}</span>
                    <span className="text-gray-400">{formatTime(currentTime)}</span>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 py-1">
                    No alerts yet
                  </div>
                )}
              </div>

              {/* Expanded Camera Modal */}
              {cameraExpanded && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-blue-500 px-6 py-4 flex items-center justify-between">
                      <h2 className="text-white font-bold text-lg">Live Camera</h2>
                      <button
                        onClick={() => setCameraExpanded(false)}
                        className="text-white hover:bg-white/20 p-2 rounded transition-colors"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>

                    {/* Camera Area */}
                    <div className="relative bg-gray-300 w-full" style={{ height: "400px" }}>
                      <div className="absolute top-4 right-4 z-10 bg-black/50 text-white text-xs px-3 py-1 rounded-full font-medium">
                        {cameraFacing === "front" ? "Front Camera" : "Back Camera"}
                      </div>

                      <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded animate-pulse">
                        Live
                      </div>

                      <div className="w-full h-full bg-gray-200" />

                      {/* Detection info */}
                      {detectedGesture && (
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                          <div className="bg-sky-500/90 text-white text-sm font-semibold px-4 py-2 rounded-lg">
                            {detectedGesture}
                          </div>
                          <div className="bg-black/60 text-white text-sm px-3 py-2 rounded-lg">
                            {formatTime(currentTime)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Camera toggle buttons */}
                    <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-200">
                      <button
                        onClick={() => setCameraFacing("front")}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${
                          cameraFacing === "front"
                            ? "bg-blue-500 text-white shadow-md"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        Front Camera
                      </button>
                      <button
                        onClick={() => setCameraFacing("back")}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${
                          cameraFacing === "back"
                            ? "bg-blue-500 text-white shadow-md"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        Back Camera
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Right Column ── */}
            <div className="flex flex-col gap-3 flex-1">

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3">
                <span className="text-sm text-gray-600 font-medium">Activity Mode</span>
                <span className="text-base font-bold text-gray-800">{classSetup.activityMode || "Quiz"}</span>
              </div>

              {/* Gesture Log */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
                <div className="px-4 pt-3 pb-1">
                  <span className="text-sm font-bold text-gray-800">Gesture Log</span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  {gestureLogData.length === 0 ? (
                    <div className="flex items-center justify-center text-gray-400 text-sm py-6">
                      No gesture data yet
                    </div>
                  ) : (
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {["Time", "Date", "Gesture", "Rank Chair", "Activity Mode"].map((h) => (
                            <th key={h} className="px-3 py-1.5 text-left text-gray-500 font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {gestureLogData.map((row, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-3 py-1.5 text-gray-600">{row.time}</td>
                            <td className="px-3 py-1.5 text-gray-600">{row.date}</td>
                            <td className="px-3 py-1.5 text-gray-600">{row.gesture}</td>
                            <td className="px-3 py-1.5 text-gray-600">{row.rankChair}</td>
                            <td className="px-3 py-1.5 text-gray-600">{row.activityMode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Gesture Summary */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3">
                <div className="mb-3">
                  <span className="text-sm font-bold text-gray-800">Gesture Summary</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Total Gestures", value: "0" },
                    { label: "Gesture Detected", value: "0" },
                    { label: "Total Chair ranking", value: "0" },
                    { label: "Alerts", value: "0" },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <div className="bg-sky-100 text-sky-700 text-[10px] font-medium px-2 py-1 rounded mb-1">
                        {label}
                      </div>
                      <div className="text-lg font-semibold text-gray-800">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleEndClass}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-6 rounded-lg transition-colors text-sm inline-block"
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
          onDateSelect={handleDateSelectInternal}
          onClose={() => setShowCalendar(false)}
        />,
        document.body
      )}
    </>
  );
}