import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import NotificationsInitializer from "./components/Modal/NotificationsInitializer";

// Paginas
import StartRedirect from "./pages/StartRedirect";
import WalletHome from "./pages/Wallet/Home";
import Sections from "./pages/Wallet/Sections";
import Movements from "./pages/Wallet/Movements";
import ListHome from "./pages/List/Home";
import Backups from "./pages/Backups";
import Settings from "./pages/Settings";
import About from "./pages/About";

import { useScheduledTaskCleanup } from "./hooks/useScheduledTaskCleanup"

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Redirect to Start Page */}
        <Route path="/" element={<StartRedirect />} />

        {/* Wallet Routes */}
        <Route path="/wallet" element={<WalletHome />} />
        <Route path="/wallet/sections" element={<Sections />} />
        <Route path="/wallet/movements" element={<Movements />} />

        {/* List Routes */}
        <Route path="/list" element={<ListHome />} />

        {/* Other Routes */}
        <Route path="/backups" element={<Backups />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<About />} />

        {/* Catch-all Route */}
        <Route path="*" element={<StartRedirect />} />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  useScheduledTaskCleanup();
  

  return (
    <Router>
      <NotificationsInitializer />
      <AnimatedRoutes />
    </Router>
  );
};

export default App;
