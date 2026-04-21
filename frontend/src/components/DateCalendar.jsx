import { useState, useEffect } from "react";

export default function DateCalendar({ selectedDate, onDateSelect, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [liveTime, setLiveTime] = useState('');
  const [liveDate, setLiveDate] = useState('');

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
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  const handleSelectDay = (day) => onDateSelect(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today = new Date();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .dc-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.25); backdrop-filter: blur(4px);
          display: flex; align-items: flex-start; justify-content: flex-end;
          padding-top: 70px; padding-right: 24px;
          z-index: 50;
          font-family: 'DM Sans','Segoe UI',sans-serif;
        }
        .dc-card {
          background: rgba(255,255,255,0.78);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.65);
          border-radius: 18px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.95);
          padding: 20px;
          width: 300px;
        }
        .dc-datetime-box {
          background: rgba(59,130,246,0.07);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(59,130,246,0.15);
          border-radius: 12px;
          padding: 12px;
          text-align: center;
          margin-bottom: 14px;
        }
        .dc-dt-label { font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
        .dc-dt-date { font-size: 13px; font-weight: 700; color: #1d4ed8; margin-bottom: 2px; }
        .dc-dt-time { font-size: 22px; font-weight: 700; color: #0f172a; font-variant-numeric: tabular-nums; letter-spacing: -0.5px; }
        .dc-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .dc-nav-btn {
          width: 30px; height: 30px;
          background: rgba(255,255,255,0.6); backdrop-filter: blur(8px);
          border: 1px solid rgba(0,0,0,0.08); border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s ease;
        }
        .dc-nav-btn:hover { background: rgba(255,255,255,0.9); transform: translateY(-1px); }
        .dc-month-label { font-size: 13px; font-weight: 700; color: #0f172a; }
        .dc-day-headers { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; margin-bottom: 6px; }
        .dc-day-header { text-align: center; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; padding: 4px 0; }
        .dc-days-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; margin-bottom: 14px; }
        .dc-day-btn {
          aspect-ratio: 1; border: none; border-radius: 8px;
          font-size: 12px; font-weight: 500; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s ease; background: transparent; color: #334155;
        }
        .dc-day-btn:hover:not(.invisible):not(.today) { background: rgba(59,130,246,0.1); color: #1d4ed8; }
        .dc-day-btn.today { background: linear-gradient(135deg,#3b82f6,#2563eb); color: white; font-weight: 700; box-shadow: 0 3px 10px rgba(59,130,246,0.35); }
        .dc-day-btn.selected { background: rgba(59,130,246,0.12); color: #1d4ed8; font-weight: 700; border: 1px solid rgba(59,130,246,0.25); }
        .dc-day-btn.invisible { visibility: hidden; cursor: default; }
        .dc-done-btn {
          width: 100%; padding: 9px;
          background: rgba(255,255,255,0.6); backdrop-filter: blur(8px);
          border: 1px solid rgba(0,0,0,0.08); border-radius: 10px;
          font-size: 13px; font-weight: 600; color: #475569;
          cursor: pointer; transition: all 0.15s ease;
          font-family: 'DM Sans','Segoe UI',sans-serif;
        }
        .dc-done-btn:hover { background: rgba(255,255,255,0.88); transform: translateY(-1px); }
      `}</style>
      <div className="dc-overlay" onClick={onClose}>
        <div className="dc-card" onClick={e => e.stopPropagation()}>
          <div className="dc-datetime-box">
            <div className="dc-dt-label">Current Date & Time</div>
            <div className="dc-dt-date">{liveDate}</div>
            <div className="dc-dt-time">{liveTime}</div>
          </div>

          <div className="dc-nav">
            <button className="dc-nav-btn" onClick={handlePrevMonth}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="dc-month-label">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
            <button className="dc-nav-btn" onClick={handleNextMonth}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <div className="dc-day-headers">
            {dayNames.map(d => <div key={d} className="dc-day-header">{d}</div>)}
          </div>

          <div className="dc-days-grid">
            {days.map((day, index) => {
              const isToday = day && today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();
              const isSelected = day && selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth.getMonth() && selectedDate.getFullYear() === currentMonth.getFullYear();
              return (
                <button
                  key={index}
                  onClick={() => day && handleSelectDay(day)}
                  disabled={!day}
                  className={`dc-day-btn${!day ? ' invisible' : ''}${isToday ? ' today' : ''}${isSelected && !isToday ? ' selected' : ''}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <button className="dc-done-btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </>
  );
}