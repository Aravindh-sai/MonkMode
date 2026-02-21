import { useState, useEffect } from "react";
const API_URL = "http://localhost:5000";
const today = new Date().toISOString().split("T")[0];

const DEFAULT_ROUTINES = [
  { name: "Gym", completed: false, isDefault: true },
  { name: "Eat Healthy", completed: false, isDefault: true },
  { name: "Drink Water", completed: false, isDefault: true },
  { name: "Prototype Progress", completed: false, isDefault: true },
  { name: "Study", completed: false, isDefault: true }
];

function mergeRoutines(defaults, dbRoutines) {
  // Map DB routines by name for quick lookup
  const dbMap = {};
  dbRoutines.forEach(r => {
    dbMap[r.name] = r;
  });

  // Merge defaults with DB by name, DB completion overrides
  const merged = defaults.map(def => {
    if (dbMap[def.name]) {
      return { ...def, ...dbMap[def.name] };
    }
    return { ...def };
  });

  // Append custom (non-default) routines from DB
  dbRoutines.forEach(r => {
    if (!defaults.some(def => def.name === r.name)) {
      merged.push({ ...r, isDefault: false });
    }
  });

  return merged;
}

function calculateStreak(history, routines) {
  // Get all days in history + today
  const allDates = Object.keys(history).concat(today);
  // Remove duplicates, sort descending
  const uniqueDates = Array.from(new Set(allDates)).sort((a, b) => b.localeCompare(a));
  // Helper: all completed
  const allCompleted = (list) =>
    Array.isArray(list) && list.length > 0 && list.every(r => r.completed);

  let streak = 0;
  let current = new Date(today);

  // Today
  if (allCompleted(routines)) streak++;

  // Go backwards from yesterday
  while (true) {
    current.setDate(current.getDate() - 1);
    const dateKey = current.toISOString().split("T")[0];
    const routinesList = history[dateKey];
    if (!routinesList || !allCompleted(routinesList)) break;
    streak++;
  }

  return streak;
}

function Home() {
  const [routines, setRoutines] = useState([]);
  const [history, setHistory] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [newRoutine, setNewRoutine] = useState("");

  // Fetch and hydrate on mount
  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/data`);
        let data = await res.json();

        // If no document, initialize
        if (!data || !data.currentDate) {
          if (ignore) return;
          setRoutines([...DEFAULT_ROUTINES]);
          setHistory({});
          setIsLoaded(true);
          return;
        }

        const savedDate = data.currentDate;
        const dbToday = Array.isArray(data.today) ? data.today : [];
        const dbHistory = data.history || {};

        let routinesForToday;
        let historyForState = { ...dbHistory };

        // If new day, push yesterday into history, reset today
        if (savedDate !== today) {
          if (dbToday.length > 0) {
            historyForState[savedDate] = dbToday.map(({ name, completed, isDefault }) => ({
              name,
              completed,
              isDefault
            }));
          }
          routinesForToday = [...DEFAULT_ROUTINES];
        } else {
          routinesForToday = mergeRoutines(DEFAULT_ROUTINES, dbToday);
        }

        if (ignore) return;
        setRoutines(routinesForToday);
        setHistory(historyForState);
        setIsLoaded(true);
      } catch (err) {
        // Fallback: show defaults, empty history
        if (!ignore) {
          setRoutines([...DEFAULT_ROUTINES]);
          setHistory({});
          setIsLoaded(true);
        }
      }
    };
    fetchData();
    return () => { ignore = true; };
  }, []);

  // Save effect: only after load, on routines/history change
  useEffect(() => {
    if (!isLoaded) return;
    const saveData = async () => {
      try {
        await fetch(`${API_URL}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentDate: today,
            today: routines,
            history: history
          })
        });
      } catch (err) {
        // Optionally handle save error
      }
    };
    saveData();
  }, [routines, history, isLoaded]);

  // UI handlers
  const toggleRoutine = (index) => {
    setRoutines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], completed: !updated[index].completed };
      return updated;
    });
  };

  const addRoutine = () => {
    if (!newRoutine.trim()) return;
    setRoutines(prev => [
      ...prev,
      { name: newRoutine.trim(), completed: false, isDefault: false }
    ]);
    setNewRoutine("");
  };

  const deleteRoutine = (index) => {
    setRoutines(prev => prev.filter((_, i) => i !== index));
  };

  // Progress
  const completedCount = routines.filter(r => r.completed).length;
  const totalCount = routines.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  // Streak
  const streak = calculateStreak(history, routines);

  return (
    <div className="min-h-screen w-full max-w-md mx-auto text-zinc-100 flex flex-col px-3 pb-24">
      <div className="w-full max-w-md mx-auto py-8">
        <h1 className="text-3xl font-semibold mb-1">MonkMode</h1>
        <p className="text-zinc-400 mb-6">Discipline. Consistency. Progress.</p>
        <div className="bg-zinc-900 rounded-xl p-4 mb-6 flex justify-between items-center">
          <div>
            <p className="text-l font-semibold">{today}</p>
            <p className="text-sm text-zinc-400">Current Streak</p>
            <p className="text-xl font-semibold">🔥 {streak} days</p>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-xl p-4 mb-6">
          <p className="text-sm text-zinc-400 mb-1">Today's Progress</p>
          <p className="text-lg font-medium">
            {completedCount} / {totalCount} completed — {progressPercent}%
          </p>
          <div className="w-full bg-zinc-800 rounded-full h-3 mt-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-xl p-4 mb-6">
          <h2 className="text-lg font-medium mb-3">Routines</h2>
          <ul className="space-y-3">
            {routines.map((routine, index) => (
              <li
                key={routine._id || routine.name}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all
                  ${routine.completed ? "bg-green-900/40" : "bg-zinc-800"}`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={routine.completed}
                    onChange={() => toggleRoutine(index)}
                    className="w-5 h-5"
                  />
                  <span>{routine.name}</span>
                </div>
                {!routine.isDefault && (
                  <button
                    onClick={() => deleteRoutine(index)}
                    className="text-red-400 text-sm"
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-zinc-900 rounded-xl p-4">
          <h3 className="text-lg font-medium mb-3">Add Routine</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newRoutine}
              onChange={(e) => setNewRoutine(e.target.value)}
              placeholder="Enter routine"
              className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 outline-none"
            />
            <button
              onClick={addRoutine}
              className="bg-white text-black px-4 rounded-lg font-medium"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
