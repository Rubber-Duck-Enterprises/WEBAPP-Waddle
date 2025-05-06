import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Home from "./pages/Home";
import Sections from "./pages/Sections";
import Movements from "./pages/Movements";
import Backups from "./pages/Backups";
import Settings from "./pages/Settings";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/wallet" element={<Home />} />
        <Route path="/wallet/sections" element={<Sections />} />
        <Route path="/wallet/movements" element={<Movements />} />
        <Route path="/backups" element={<Backups />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
};

export default App;
