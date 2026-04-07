import { useState, useEffect } from "react";

export default function DateCalendar({ selectedDate, onDateSelect, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [liveTime, setLiveTime]         = useState('');
  const [liveDate, setLiveDate]         = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setLiveDate(now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
      setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay    = getFirstDayOfMonth(currentMonth);
  const days        = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const handleSelectDay = (day) => {
    onDateSelect(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
  };

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayNames   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today      = new Date();

  return (
    <div className="fixed inset-0 bg-black/20 flex items-start justify-end pt-20 pr-6 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl p-4 w-80" onClick={e => e.stopPropagation()}>

        <div className="mb-3 p-3 bg-blue-50 rounded-lg text-center border border-blue-100">
          <p className="text-xs text-gray-500 mb-0.5">Current Date & Time</p>
          <p className="text-sm font-bold text-blue-700">{liveDate}</p>
          <p className="text-xl font-bold text-blue-900 tabular-nums">{liveTime}</p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h2 className="text-sm font-semibold text-gray-800">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-500 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {days.map((day, index) => {
            const isToday    = day && today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();
            const isSelected = day && selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth.getMonth() && selectedDate.getFullYear() === currentMonth.getFullYear();
            return (
              <button
                key={index}
                onClick={() => day && handleSelectDay(day)}
                disabled={!day}
                className={`p-2 text-xs font-medium rounded-lg transition-colors
                  ${!day ? 'invisible' : ''}
                  ${isToday    ? 'bg-blue-500 text-white ring-2 ring-blue-300' : ''}
                  ${isSelected && !isToday ? 'bg-blue-100 text-blue-700 font-bold' : ''}
                  ${!isToday && !isSelected && day ? 'hover:bg-blue-50 text-gray-700' : ''}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        <button onClick={onClose} className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
          Done
        </button>
      </div>
    </div>
  );
}