

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Progress from "./pages/Progress";
// Removed Settings import
import BottomNav from "./components/BottomNav";
import Log from "./pages/Log";
import { useState } from "react";

function App() {
  const [hideBottomNav, setHideBottomNav] = useState(false);
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-950 pb-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/log" element={<Log setHideBottomNav={setHideBottomNav} />} />
          {/* Removed Settings route */}
        </Routes>
        {!hideBottomNav && <BottomNav />}
      </div>
    </BrowserRouter>
  );
}

export default App;
