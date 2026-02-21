import { useState, useEffect, useRef } from "react";

const API_URL = "http://localhost:5000";
function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function Log({ setHideBottomNav }) {
  const today = new Date().toISOString().split("T")[0];

  const [logText, setLogText] = useState("");
  const [saved, setSaved] = useState(true);
  const [viewMode, setViewMode] = useState("daily");
  const [allLogs, setAllLogs] = useState({});
  const [expandedDate, setExpandedDate] = useState(null);
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState("");
  const ruleListRef = useRef(null);

  const timeoutRef = useRef(null);

  // Hide bottom nav when in RuleBook
  useEffect(() => {
    if (setHideBottomNav) {
      setHideBottomNav(viewMode === "rules");
    }
    // On unmount, always show nav
    return () => {
      if (setHideBottomNav) setHideBottomNav(false);
    };
  }, [viewMode, setHideBottomNav]);
  // Load today's log, all logs, and rules on mount
  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await fetch(`${API_URL}/data`);
        const data = await res.json();
        if (data.logs) {
          setAllLogs(data.logs);
        }
        if (data.logs && data.logs[today]) {
          setLogText(data.logs[today]);
        }
        if (data.rules) {
          setRules(data.rules);
        }
      } catch (err) {
        console.error("Failed to load log", err);
      }
    };
    fetchLog();
  }, []);

  // Auto-save logic (debounced)
  useEffect(() => {
    if (!logText) return; // don't run on empty
    const handler = setTimeout(() => {
      console.log("Sending to backend:", logText);
      fetch(`${API_URL}/save-log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          date: today,
          text: logText
        })
      })
        .then(() => setSaved(true))
        .catch(err => console.error("Save failed:", err));
    }, 1200);
    return () => {
      clearTimeout(handler);
      setSaved(false);
    };
  }, [logText]);

  // Build sorted logs array (excluding today)
  const sortedLogs = Object.entries(allLogs)
    .filter(([date]) => date !== today)
    .sort((a, b) => new Date(b[0]) - new Date(a[0]));

  // Add rule handler
  const handleAddRule = async () => {
    if (!newRule.trim()) return;
    try {
      const res = await fetch(`${API_URL}/add-rule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: newRule })
      });
      const result = await res.json();
      if (result.rules) {
        setRules(result.rules);
        setNewRule("");
        setTimeout(() => {
          if (ruleListRef.current) {
            ruleListRef.current.scrollTo({
              top: ruleListRef.current.scrollHeight,
              behavior: "smooth"
            });
          }
        }, 100);
      }
    } catch (err) {
      console.error("Failed to add rule", err);
    }
  };
  function handleRuleInputKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddRule();
    }
  }

  return (
    <div className="min-h-screen w-full max-w-md mx-auto bg-zinc-950 text-zinc-100 flex flex-col px-3 pb-24">
      <div className="w-full max-w-md mx-auto py-8">
        <div className="flex justify-center gap-2 mb-6">
          <button
            type="button"
            className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${viewMode === 'daily' ? 'bg-zinc-800 text-green-400 shadow' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
            onClick={() => setViewMode('daily')}
          >
            Daily Log
          </button>
          <button
            type="button"
            className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${viewMode === 'rules' ? 'bg-zinc-800 text-green-400 shadow' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
            onClick={() => setViewMode('rules')}
          >
            Rule Book
          </button>
        </div>

        {viewMode === "daily" && (
          <>
            <h1 className="text-2xl font-semibold mb-1">Daily Log</h1>
            <p className="text-zinc-400 mb-6">
              Reflect. Write. Reset.
            </p>
            <div className="bg-zinc-900 rounded-xl p-4 mb-4">
              <p className="text-sm text-zinc-400 mb-2">
                {new Date(today).toDateString()}
              </p>
              <textarea
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
                placeholder="Write how your day went... what you learned... what you felt..."
                className="w-full h-64 bg-zinc-800 rounded-lg p-3 outline-none resize-none text-sm"
              />
            </div>
            <div className="text-xs text-zinc-500 transition-all">
              {saved ? "Saved ✓" : "Saving..."}
            </div>

            {/* Timeline View */}
            {sortedLogs.length > 0 && (
              <div className="mt-8 relative pl-6 border-l border-zinc-800">
                {sortedLogs.map(([date, text]) => {
                  const formattedDate = new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' });
                  const expanded = expandedDate === date;
                  const preview = text.length > 120 ? text.slice(0, 120) + "..." : text;
                  return (
                    <div key={date} className="mb-6 relative">
                      <div className="absolute -left-[9px] top-1 w-3 h-3 bg-green-500 rounded-full"></div>
                      <div
                        className={`transition-all duration-300 cursor-pointer select-text`}
                        onClick={() => setExpandedDate(expanded ? null : date)}
                      >
                        <p className="text-sm text-zinc-400 font-medium">{formattedDate}</p>
                        <div className="mt-1 text-sm text-zinc-300">
                          {expanded ? text : preview}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {viewMode === "rules" && (
          <div className="relative flex flex-col min-h-screen">
            <div
              ref={ruleListRef}
              className="flex-1 overflow-y-auto pb-28 space-y-4 min-h-[300px]"
            >
              {rules.length === 0 && (
                <div className="text-center mt-20 text-zinc-500">
                  <div className="text-3xl mb-3">📘</div>
                  <p>No rules yet.</p>
                  <p className="text-xs mt-1">Add your first lesson below.</p>
                </div>
              )}
              {rules.map((rule, index) => (
                <div
                  key={index}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 shadow-sm hover:border-green-500/40 transition flex justify-between items-start animate-fade-in duration-300"
                  style={{ opacity: 1, transition: 'opacity 0.3s' }}
                >
                  <div className="flex gap-3">
                    <div className="text-green-400 text-lg">📜</div>
                    <div className="text-zinc-100 text-sm leading-relaxed">
                      {rule.text}
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 ml-3 whitespace-nowrap">
                    {formatDate(rule.createdAt)}
                  </div>
                </div>
              ))}
            </div>

            {/* Floating input card, fixed at bottom */}
            <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50">
              <div className="w-full max-w-md px-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg flex items-center gap-2 px-3 py-2">
                  <input
                    className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-500 outline-none"
                    style={{ scrollMarginBottom: '120px' }}
                    placeholder="Write a new rule..."
                    value={newRule}
                    onChange={e => setNewRule(e.target.value)}
                    onKeyDown={handleRuleInputKeyDown}
                  />
                  <button
                    className="bg-white/80 hover:bg-green-600 text-black font-semibold px-4 py-1.5 rounded-lg transition"
                    onClick={handleAddRule}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Log;
