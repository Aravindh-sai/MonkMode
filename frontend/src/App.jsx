

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Progress from "./pages/Progress";
// Removed Settings import
import BottomNav from "./components/BottomNav";
import Log from "./pages/Log";
import { useState, useEffect } from "react";
import { listenForInstall } from "./utils/installPrompt";
  useEffect(() => {
    listenForInstall();
  }, []);

function App() {
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const [isServerWaking, setIsServerWaking] = useState(false);
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-950 pb-20">
        <Routes>
          <Route path="/" element={<Home isServerWaking={isServerWaking} setIsServerWaking={setIsServerWaking} />} />
          <Route path="/progress" element={<Progress isServerWaking={isServerWaking} setIsServerWaking={setIsServerWaking} />} />
          <Route path="/log" element={<Log setHideBottomNav={setHideBottomNav} isServerWaking={isServerWaking} setIsServerWaking={setIsServerWaking} />} />
          {/* Removed Settings route */}
        </Routes>
        {!hideBottomNav && <BottomNav />}
      </div>
    </BrowserRouter>
  );
}

export default App;
