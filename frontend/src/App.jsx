import { useEffect, useState } from "react";
import { listenForInstall } from "./utils/installPrompt";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Progress from "./pages/Progress";
import BottomNav from "./components/BottomNav";
import Log from "./pages/Log";

function App() {
  useEffect(() => {
    listenForInstall();
  }, []);
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const [isServerWaking, setIsServerWaking] = useState(false);
  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <Routes>
        <Route path="/" element={<Home isServerWaking={isServerWaking} setIsServerWaking={setIsServerWaking} />} />
        <Route path="/progress" element={<Progress isServerWaking={isServerWaking} setIsServerWaking={setIsServerWaking} />} />
        <Route path="/log" element={<Log setHideBottomNav={setHideBottomNav} isServerWaking={isServerWaking} setIsServerWaking={setIsServerWaking} />} />
        {/* Removed Settings route */}
      </Routes>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}

export default App;
