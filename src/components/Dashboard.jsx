import { useState } from "react";
import Sidebar from "./Sidebar";
import ClassActivity from "./ClassActivity";
import StartClass from "./StartClass";
import ClassSetup from "./ClassSetUp";
import DateCalendar from "./DateCalendar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from "recharts";

const gestureData = [];

const gestureTypeData = [];

const PIE_COLORS = ["#e53e3e", "#38a169", "#3182ce"];

const engagementData = [];

export default function Dashboard({ onLogout }) {
  const [active, setActive] = useState("Dashboard");
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 2, 16)); 
  const [showCalendar, setShowCalendar] = useState(false);
  const [isClassActive, setIsClassActive] = useState(true); // Track if class session is active

  const formatDate = (date) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const handleDateSelect = (newDate) => {
    setSelectedDate(newDate);
    setShowCalendar(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">

      <Sidebar active={active} setActive={setActive} onLogout={onLogout} />

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {active !== "Start Class" && (
        <header className="bg-blue-500 px-6 py-4 flex items-center justify-between gap-3 flex-shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <h1 className="text-white text-2xl font-bold">{active}</h1>
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
        )}

        {/* Content */}
        {active === "Dashboard" && (
        <main className="flex-1 overflow-auto p-6">

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Gestures", value: "0", color: "bg-blue-50 border-blue-200" },
              { label: "Unique Students", value: "0", color: "bg-green-50 border-green-200" },
              { label: "Total Alerts", value: "0", color: "bg-red-50 border-red-200" },
              { label: "Avg Response", value: "N/A", valueClass: "text-sky-500", color: "bg-purple-50 border-purple-200" },
            ].map(({ label, value, valueClass, color }) => (
              <div key={label} className={`${color} rounded-lg shadow p-4 text-center border transition-all duration-200 hover:shadow-md`}>
                <p className="text-xs text-gray-600 mb-2 font-medium">{label}</p>
                <p className={`text-3xl font-bold ${valueClass || "text-gray-800"}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* ── Charts Row 1 ── */}
          <div className="grid grid-cols-2 gap-4 mb-4">

            {/* Gesture per Student */}
            <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
              <p className="text-xs text-gray-600 mb-3 font-medium">Gesture per Student</p>
              {gestureData.length === 0 ? (
                <div className="w-full h-[140px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-400 text-sm">No data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart
                    data={gestureData}
                    layout="vertical"
                    margin={{ top: 0, right: 10, left: 10, bottom: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 30]}
                    ticks={[0, 5, 10, 15, 20, 25, 30]}
                    tick={{ fontSize: 9 }}
                    label={{ value: "Gestures", position: "insideBottom", offset: -10, fontSize: 9 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="rank"
                    tick={{ fontSize: 9 }}
                    width={38}
                  />
                  <Tooltip />
                  <Bar dataKey="gestures" fill="#3182ce" barSize={16} />
                </BarChart>
              </ResponsiveContainer>
              )}
            </div>

            {/* Gesture Type Distribution */}
            <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
              <p className="text-xs text-gray-600 mb-3 font-medium">Gesture Type Distribution</p>
              {gestureTypeData.length === 0 ? (
                <div className="w-full h-[140px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-400 text-sm">No data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={gestureTypeData}
                      cx="40%"
                      cy="50%"
                      outerRadius={55}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${Math.round(percent * 100)}%`
                      }
                      labelLine={false}
                      fontSize={9}
                    >
                      {gestureTypeData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      iconSize={8}
                      formatter={(v) => <span style={{ fontSize: 9 }}>{v}</span>}
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Charts Row 2 ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
              <p className="text-xs text-gray-600 mb-3 font-medium">Engagement Overtime</p>
              {engagementData.length === 0 ? (
                <div className="w-full h-[130px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-400 text-sm">No data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={130}>
                  <LineChart
                    data={engagementData}
                    margin={{ top: 4, right: 10, left: -10, bottom: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 8 }}
                      interval={2}
                      label={{ value: "Time", position: "insideBottom", offset: -10, fontSize: 9 }}
                    />
                    <YAxis
                      tick={{ fontSize: 8 }}
                      label={{ value: "Gestures", angle: -90, position: "insideLeft", offset: 14, fontSize: 9 }}
                    />
                    <Tooltip />
                    <Line
                      type="linear"
                      dataKey="gestures"
                      stroke="#3182ce"
                      strokeWidth={1.5}
                      dot={{ r: 3, fill: "#3182ce" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
              <p className="text-xs text-gray-600 mb-3 font-medium">Activity Mode Usage</p>
              <div className="border border-gray-200 rounded-lg w-full h-[130px] bg-gray-50 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Coming soon...</p>
              </div>
            </div>
          </div>

        </main>
        )}

        {active === "Class Activity" && (
          <ClassActivity isClassActive={isClassActive} />
        )}

        {active === "Start Class" && (
          <StartClass selectedDate={selectedDate} onDateSelect={handleDateSelect} />
        )}

        {active === "Class Setup" && (
          <ClassSetup />
        )}
        
        {showCalendar && (
          <DateCalendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onClose={() => setShowCalendar(false)}
          />
        )}
      </div>
    </div>
  );
}