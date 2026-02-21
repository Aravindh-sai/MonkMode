import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area
} from "recharts";
// Custom Tooltip for Graph
function GraphTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const month = label;
  const value = payload[0].value;
  return (
    <div className="bg-zinc-900 rounded-xl px-4 py-2 shadow-lg border border-zinc-700">
      <div className="text-xs text-zinc-400 mb-1">Month</div>
      <div className="text-base text-zinc-100 font-semibold mb-1">{month}</div>
      <div className="text-xs text-zinc-400 mb-1">Completion %</div>
      <div className="text-lg text-green-400 font-bold">{value}%</div>
    </div>
  );
}
import { useEffect, useState, useMemo, useRef } from "react";

const API_URL = "https://monkmode-vp52.onrender.com";


const TASK_OPTIONS = [
  "Gym",
  "Eat Healthy",
  "Drink Water",
  "Prototype Progress",
  "Study",
  "Custom Tasks"
];

// Helper: get month name
function getMonthName(monthStr) {
  const [year, month] = monthStr.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString("default", { month: "long", year: "numeric" });
}

// Helper: get weekday index (Mon=0, Sun=6)
function getWeekdayIdx(dateStr) {
  const d = new Date(dateStr);
  let idx = d.getDay(); // Sun=0, Mon=1, ...
  return idx === 0 ? 6 : idx - 1;
}


// Day Details Panel (compact side-by-side)
function DayDetailsPanel({ date, routines }) {
  if (!date || !routines) return null;
  const formatted = new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const defaultTasks = routines.filter(r => r.isDefault === true);
  const completedDefault = defaultTasks.filter(r => r.completed === true).length;
  const customTasks = routines.filter(r => r.isDefault === false);
  const completedCustom = customTasks.filter(r => r.completed === true).length;
  const totalTasks = routines.length;
  const totalCompleted = routines.filter(r => r.completed === true).length;
  const percent = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return (
    <div className="bg-zinc-900 rounded-xl px-4 py-3 mb-5 space-y-2 w-full">
      <div className="flex items-center gap-2 text-base font-semibold text-zinc-100 mb-1">
        <span role="img" aria-label="calendar">📅</span>
        <span>{formatted}</span>
      </div>
      <div className="flex justify-between items-center w-full">
        <span className="text-sm text-zinc-400">Default Tasks</span>
        <span className="text-sm font-semibold text-zinc-100">{completedDefault} <span className="font-normal text-zinc-500">/ 5</span></span>
      </div>
      <div className="flex justify-between items-center w-full">
        <span className="text-sm text-zinc-400">Custom Tasks</span>
        <span className="text-sm font-semibold text-zinc-100">{completedCustom} <span className="font-normal text-zinc-500">/ {customTasks.length}</span></span>
      </div>
      <div className="flex justify-between items-center w-full">
        <span className="text-sm text-zinc-400">Day Completion</span>
        <span className="text-sm font-semibold text-green-400">{percent}%</span>
      </div>
    </div>
  );
}

// MonthCalendar component
function MonthCalendar({ month, taskHistory, isCustom, selectedDate, onSelectDate }) {
  if (!month) return null;
  const daysInMonth = useMemo(() => {
    if (!month) return 0;
    const [year, m] = month?.split("-") || [];
    if (!year || !m) return 0;
    return new Date(Number(year), Number(m), 0).getDate();
  }, [month]);

  const dayMap = useMemo(() => {
    const map = {};
    if (!Array.isArray(taskHistory)) return map;
    taskHistory.forEach(entry => {
      if (entry?.date && month && entry.date.startsWith(month)) map[entry.date] = entry;
    });
    return map;
  }, [taskHistory, month]);

  const firstDayIdx = month ? getWeekdayIdx(`${month}-01`) : 0;
  const daysArr = [];
  for (let i = 0; i < firstDayIdx; ++i) daysArr.push(null);
  for (let d = 1; d <= daysInMonth; ++d) {
    const dateStr = month ? `${month}-${d.toString().padStart(2, "0")}` : undefined;
    daysArr.push(dateStr ? (dayMap[dateStr] || { date: dateStr }) : null);
  }

  return (
    <div className="w-full max-w-md bg-zinc-900 rounded-xl p-4 shadow-lg">
      <div className="text-xl font-semibold text-zinc-100 mb-4 text-center">
        {month ? getMonthName(month) : ''}
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-zinc-400 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {daysArr.map((entry, idx) => {
          if (!entry || !entry.date) return <div key={idx} />;
          const { date, completed, completionPercent } = entry;
          let bg = "bg-zinc-800";
          let text = "text-zinc-300";
          if (completed === true && !isCustom) {
            bg = "bg-green-600";
            text = "text-white";
          } else if (completed === false && !isCustom) {
            bg = "bg-zinc-700";
            text = "text-zinc-400";
          } else if (isCustom && typeof completionPercent === "number") {
            const g = Math.round(100 + (completionPercent * 1.55));
            const b = Math.round(100 + (completionPercent * 0.5));
            bg = `bg-[rgb(34,${g},${b})]`;
            text = "text-white";
            if (completionPercent === 0) {
              bg = "bg-zinc-800";
              text = "text-zinc-300";
            }
          }
          const isSelected = selectedDate === date;
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer transition ${bg} ${text} ${isSelected ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-zinc-900 z-10' : ''}`}
              style={isCustom && typeof completionPercent === "number" && completionPercent > 0 ? { background: `linear-gradient(135deg, #22c55e ${completionPercent}%, #27272a 0%)` } : {}}
            >
              {date && typeof date === 'string' ? Number(date.split("-")[2]) || '' : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}
function Progress() {
  const [groupedData, setGroupedData] = useState({});
  const [allDays, setAllDays] = useState([]); // flat array: {date, routines}
  const [selectedTask, setSelectedTask] = useState(TASK_OPTIONS[0]);

  // Fetch and group data on mount
  useEffect(() => {
    const fetchAndGroup = async () => {
      try {
        const res = await fetch(`${API_URL}/data`);
        const data = await res.json();
        if (!data) return;

        // Extract history and today
        const { history = {}, today = [], currentDate } = data;

        // Merge today into history for analytics
        const mergedHistory = { ...history };
        if (currentDate && today && today.length > 0) {
          mergedHistory[currentDate] = today;
        }

        // Group by month
        const grouped = {};
        const allDaysArr = [];
        Object.entries(mergedHistory).forEach(([date, routines]) => {
          const month = date.slice(0, 7); // YYYY-MM
          if (!grouped[month]) grouped[month] = [];
          const dayObj = { date, routines };
          grouped[month].push(dayObj);
          allDaysArr.push(dayObj);
        });

        // Sort months newest first, and days within month ascending
        const sortedMonths = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
        const result = {};
        for (const month of sortedMonths) {
          result[month] = grouped[month].sort((a, b) => a.date.localeCompare(b.date));
        }

        setGroupedData(result);
        // Sort allDaysArr by date ascending
        setAllDays(allDaysArr.sort((a, b) => a.date.localeCompare(b.date)));
      } catch (err) {
        console.error("Failed to fetch or process progress data", err);
      }
    };
    fetchAndGroup();
  }, []);

  // Timeline: render all months, newest first

  const isCustom = selectedTask === "Custom Tasks";
  const sortedMonths = useMemo(() => Object.keys(groupedData).sort((a, b) => b.localeCompare(a)), [groupedData]);
  const [activeMonthIdx, setActiveMonthIdx] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [viewMode, setViewMode] = useState("calendar");
  const scrollRef = useRef(null);
  const dropdownRef = useRef(null);

  // Keep activeMonthIdx in sync with sortedMonths
  useEffect(() => {
    if (activeMonthIdx >= sortedMonths.length) {
      setActiveMonthIdx(0);
    }
  }, [sortedMonths, activeMonthIdx]);

  // Keyboard navigation for months (not dropdown)
  useEffect(() => {
    function handleKeyDown(e) {
      // Only handle if focus is NOT in dropdown
      const dropdown = dropdownRef.current;
      if (!dropdown || document.activeElement !== dropdown) {
        if (sortedMonths.length === 0) return;
        if (e.key === "ArrowRight") {
          setActiveMonthIdx(idx => {
            const next = Math.min(idx + 1, sortedMonths.length - 1);
            scrollToMonth(next);
            return next;
          });
        } else if (e.key === "ArrowLeft") {
          setActiveMonthIdx(idx => {
            const prev = Math.max(idx - 1, 0);
            scrollToMonth(prev);
            return prev;
          });
        }
      }
    }
    function scrollToMonth(idx) {
      if (!scrollRef.current) return;
      const container = scrollRef.current;
      const monthBlocks = container.querySelectorAll(".month-block");
      if (monthBlocks[idx]) {
        const block = monthBlocks[idx];
        const blockRect = block.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const offset = blockRect.left - containerRect.left - (containerRect.width / 2) + (blockRect.width / 2);
        container.scrollBy({ left: offset, behavior: "smooth" });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line
  }, [sortedMonths.length]);

  // Center timeline on active month when changed (mouse/touch/arrow)
  useEffect(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const monthBlocks = container.querySelectorAll(".month-block");
    if (monthBlocks[activeMonthIdx]) {
      const block = monthBlocks[activeMonthIdx];
      const blockRect = block.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const offset = blockRect.left - containerRect.left - (containerRect.width / 2) + (blockRect.width / 2);
      container.scrollBy({ left: offset, behavior: "smooth" });
    }
  }, [activeMonthIdx, sortedMonths]);

  // Compute taskHistory for a given month
  function getTaskHistoryForMonth(month) {
    if (!selectedTask || allDays.length === 0) return [];
    if (!isCustom) {
      return allDays
        .filter(({ date }) => date.startsWith(month))
        .map(({ date, routines }) => {
          const routine = routines.find(r => r.name === selectedTask);
          return {
            date,
            completed: routine ? !!routine.completed : false
            // ...existing code...
          };
        });
    } else {
      return allDays
        .filter(({ date }) => date.startsWith(month))
        .map(({ date, routines }) => {
          const custom = routines.filter(r => r.isDefault === false);
          if (custom.length === 0) {
            return { date, completed: false, completionPercent: 0 };
          }
          const completedCustom = custom.filter(r => r.completed).length;
          const percent = Math.round((completedCustom / custom.length) * 100);
          return {
            date,
            completed: completedCustom === custom.length && custom.length > 0,
            completionPercent: percent
            // ...existing code...
          };
        });
    }
  }

  // Find routines for selectedDate
  const selectedDayRoutines = useMemo(() => {
    const found = allDays.find(d => d.date === selectedDate);
    return found ? found.routines : [];
  }, [allDays, selectedDate]);

  // Safe guard for groupedData
  if (!groupedData || Object.keys(groupedData).length === 0) return null;
  // Loader UI (if needed)
  // {isServerWaking && <Loader />} // Add loader UI if required

  // --- Monthly analytics for Graph view ---
  const monthlyAnalytics = Object.entries(groupedData)
    .map(([month, days]) => {
      let trackedDays = 0;
      let completedDays = 0;
      days.forEach(day => {
        if (!day.routines) return;
        const routine = day.routines.find(r => r.name === selectedTask);
        if (!routine) return;
        trackedDays++;
        if (routine.isDefault) {
          if (routine.completed === true) completedDays++;
        } else {
          if (typeof routine.completionPercent === 'number' && routine.completionPercent > 0) completedDays++;
        }
      });
      const completionRate = trackedDays > 0 ? Math.round((completedDays / trackedDays) * 100) : 0;
      return { month, completionRate };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  if (typeof window !== 'undefined') {
    // Only log in browser
    console.log("Monthly analytics:", monthlyAnalytics);
  }

  return (
    <div className="min-h-screen w-full max-w-md mx-auto bg-zinc-950 flex flex-col items-center px-3 py-6 pb-24">
      <div className="flex justify-center w-full">
        <div className="w-full max-w-md mx-auto">
          {/* Header row: view toggle left, dropdown right */}
          <div className="flex justify-between items-center w-full mb-5 gap-2 flex-wrap">
            <div className="flex gap-2">
              <button
                type="button"
                className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${viewMode === 'calendar' ? 'bg-zinc-800 text-green-400 shadow' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
                onClick={() => setViewMode('calendar')}
              >
                Calendar
              </button>
              <button
                type="button"
                className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${viewMode === 'graph' ? 'bg-zinc-800 text-green-400 shadow' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
                onClick={() => setViewMode('graph')}
              >
                Graph
              </button>
            </div>
            <select
              ref={dropdownRef}
              className="bg-zinc-900 text-zinc-100 border border-zinc-700 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-green-500 transition w-fit min-w-[170px] ml-auto"
              value={selectedTask}
              onChange={e => setSelectedTask(e.target.value)}
            >
              {TASK_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          {/* Only show DayDetailsPanel in calendar mode */}
          {viewMode === 'calendar' && (
            <DayDetailsPanel date={selectedDate} routines={selectedDayRoutines} />
          )}
          {viewMode === 'calendar' && sortedMonths[activeMonthIdx] && (
            <MonthCalendar
              month={sortedMonths[activeMonthIdx]}
              taskHistory={getTaskHistoryForMonth(sortedMonths[activeMonthIdx])}
              isCustom={isCustom}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          )}
          {viewMode === 'graph' && (
            <div className="w-full flex flex-col items-center justify-center mt-6">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={(() => {
                    if (monthlyAnalytics.length === 1) {
                      // Add baseline point for visualization only
                      return [
                        { month: "Start", completionRate: 0, shortMonth: "Start" },
                        {
                          ...monthlyAnalytics[0],
                          shortMonth: (() => {
                            const [y, m] = monthlyAnalytics[0].month.split("-");
                            return new Date(Number(y), Number(m) - 1).toLocaleString(undefined, { month: "short" });
                          })()
                        }
                      ];
                    }
                    // Normal case: map all analytics
                    return monthlyAnalytics.map(d => ({
                      ...d,
                      shortMonth: (() => {
                        const [y, m] = d.month.split("-");
                        return new Date(Number(y), Number(m) - 1).toLocaleString(undefined, { month: "short" });
                      })()
                    }));
                  })()}
                  margin={{ top: 16, right: 24, left: 8, bottom: 8 }}
                >
                  <defs>
                    <linearGradient id="emeraldLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                      <stop offset="100%" stopColor="#4ade80" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="emeraldArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.13} />
                      <stop offset="100%" stopColor="#18181b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="shortMonth"
                    tick={{ fill: "#a1a1aa", fontSize: 14, fontWeight: 500 }}
                    axisLine={{ stroke: "#27272a" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#71717a", fontSize: 13 }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <RechartsTooltip
                    content={<GraphTooltip />}
                    cursor={{ stroke: "#52525b", strokeDasharray: "3 3" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completionRate"
                    stroke={false}
                    fill="url(#emeraldArea)"
                    fillOpacity={1}
                    isAnimationActive={true}
                    animationDuration={900}
                    animationEasing="ease-out"
                  />
                  <Line
                    type="monotone"
                    dataKey="completionRate"
                    stroke="url(#emeraldLine)"
                    strokeWidth={3}
                    dot={{ r: 4, stroke: "#22c55e", strokeWidth: 2, fill: "#18181b", filter: "drop-shadow(0 0 6px #4ade8088)" }}
                    activeDot={{ r: 6, stroke: "#22c55e", strokeWidth: 2, fill: "#4ade80", filter: "drop-shadow(0 0 10px #4ade80cc)" }}
                    animationDuration={900}
                    animationEasing="ease-out"
                    filter="drop-shadow(0 0 12px #4ade80aa)"
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="text-zinc-500 text-xs mt-3 text-center select-none">
                Your growth graph builds as you stay consistent.
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="w-full flex justify-center mt-6">
        <div
          ref={scrollRef}
          className="flex flex-row gap-6 min-w-fit overflow-x-auto pb-4 snap-x snap-mandatory justify-center"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {sortedMonths.map((month, idx) => (
            <div
              key={month}
              className={`flex-shrink-0 month-block snap-center${idx === activeMonthIdx ? "" : ""}`}
              style={{ scrollMarginLeft: 32, scrollMarginRight: 32 }}
            >
              {/* Only render the current month calendar above, others in timeline */}
              {idx !== activeMonthIdx && month && viewMode === 'calendar' && (
                <MonthCalendar
                  month={month}
                  taskHistory={getTaskHistoryForMonth(month)}
                  isCustom={isCustom}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Progress;

