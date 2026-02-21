import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import logo from "../assets/logo.png";
import homeIcon from "../assets/home.png";
import progressIcon from "../assets/progress.png";
import logIcon from "../assets/log.png";

function BottomNav() {
  const location = useLocation();
  const [homeError, setHomeError] = useState(false);
  const [progressError, setProgressError] = useState(false);
  const [logError, setLogError] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 flex justify-around py-3" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Link
        to="/"
        className={location.pathname === "/" ? "text-white flex flex-col items-center active:scale-90 transition-transform duration-150" : "text-zinc-500 flex flex-col items-center active:scale-90 transition-transform duration-150"}
      >
        <img src={homeIcon} className="w-6 h-6 mb-1" alt="MonkMode" />
      </Link>

      <Link
        to="/progress"
        className={location.pathname === "/progress" ? "text-white flex flex-col items-center active:scale-90 transition-transform duration-150" : "text-zinc-500 flex flex-col items-center active:scale-90 transition-transform duration-150"}
      >
        {!progressError ? (
          <img
            src={progressIcon}
            alt="Progress"
            className="w-6 h-6 mb-1"
            onError={() => setProgressError(true)}
          />
        ) : (
          <span className="mb-1">Progress</span>
        )}
      </Link>

      <Link
        to="/log"
        className={location.pathname === "/log" ? "text-white flex flex-col items-center active:scale-90 transition-transform duration-150" : "text-zinc-500 flex flex-col items-center active:scale-90 transition-transform duration-150"}
      >
        {!logError ? (
          <img
            src={logIcon}
            alt="Log"
            className="w-6 h-6 mb-1"
            onError={() => setLogError(true)}
          />
        ) : (
          <span className="mb-1">Log</span>
        )}
      </Link>
    </div>
  );
}

export default BottomNav;
