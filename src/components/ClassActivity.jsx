import { useState } from "react";

const gestureLog = [];

const studentRoster = [
  { rank: "Rank 1", name: "Student 1", score: "20g", scoreColor: "bg-green-400" },
  { rank: "Rank 1", name: "Student 2", score: "3g", scoreColor: "bg-green-300" },
];

const filterOptions = ["All", "Hand Raise", "Peace Sign", "Writing", "Head Moving"];
const sortOptions = ["Newest", "Oldest", "By Rank", "By Gesture"];

export default function ClassActivity({ isClassActive = true }) {
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  return (
    <>
      {/* Filter bar */}
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
                {filterOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setFilter(option);
                      setFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      filter === option ? "bg-sky-100 text-sky-700 font-medium" : "text-gray-700"
                    }`}
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
                {sortOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSort(option);
                      setSortOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      sort === option ? "bg-sky-100 text-sky-700 font-medium" : "text-gray-700"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content area */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="flex gap-6 h-full">

            <div className={`${!isClassActive ? "flex-1" : "flex-1"} bg-white rounded-lg border border-gray-200 shadow p-4 flex flex-col`}>
              <div className="mb-4">
                <h2 className="text-sm font-bold text-gray-800">Gesture Log</h2>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-5 border-b-2 border-gray-300 bg-gray-50 rounded-md mb-2">
                {["Time", "Date", "Gesture", "Rank Chair", "Activity Mode"].map((col) => (
                  <div key={col} className="px-4 py-3 text-xs text-gray-700 font-semibold border-r border-gray-200 last:border-r-0">
                    {col}
                  </div>
                ))}
              </div>

              {/* Empty body */}
              <div className="flex-1" />
            </div>

            {!isClassActive && (
              <div className="w-56 bg-white rounded-lg border border-gray-200 shadow p-4 flex flex-col">
                <div className="mb-4">
                  <h2 className="text-sm font-bold text-gray-800">Student Roster</h2>
                </div>

                <div className="flex flex-col gap-2">
                  {studentRoster.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-150 rounded-lg px-3 py-2.5 hover:bg-blue-50 hover:border-blue-200 transition-all">
                      <span className="text-xs text-gray-600 font-medium w-12">{s.rank}</span>
                      <span className="text-xs text-gray-700 flex-1 text-center font-medium">{s.name}</span>
                      <span className={`text-xs text-white font-semibold ${s.scoreColor} px-2.5 py-1 rounded-md`}>
                        {s.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
    </>
  );
}