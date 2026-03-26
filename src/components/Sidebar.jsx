import React from "react";

export default function Sidebar({ active, setActive, onLogout }) {
  const navItems = ["Dashboard", "Class Activity", "Start Class", "Class Setup"];

  return (
    <aside className="w-40 bg-gradient-to-b from-blue-500 to-blue-600 flex flex-col shrink-0 shadow-lg">

      <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-4 py-4 border-b-2 border-blue-400/30">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white font-bold text-lg">ClassSense</span>
        </div>
      </div>

      <nav className="flex flex-col mt-6 space-y-1.5 px-3">
        {navItems.map((item) => (
          <button
            key={item}
            onClick={() => setActive(item)}
            className={`text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              active === item
                ? "bg-sky-700 text-white shadow-lg scale-105"
                : "text-white/90 hover:bg-sky-600 hover:text-white hover:shadow-md"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="mt-auto px-3 pb-6">
        <button
          onClick={onLogout}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
