import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import NotificationsInitializer from "./components/Modal/NotificationsInitializer";
import { AuthProvider } from "@/context/AuthContext";
import { RequireAuth } from "@/guards/RequireAuth";

// Paginas
import Login from "@/pages/Auth/Login";
import StartRedirect from "@/pages/StartRedirect";
import WalletHome from "@/pages/Wallet/Home";
import Sections from "@/pages/Wallet/Sections";
import Movements from "@/pages/Wallet/Movements";
import ListHome from "@/pages/List/Home";
import Backups from "@/pages/Backups";
import Settings from "@/pages/Settings";
import About from "@/pages/About";

import { useScheduledTaskCleanup } from "./hooks/useScheduledTaskCleanup"

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Redirect to Start Page */}
        <Route path="/" element={<StartRedirect />} />
        <Route path="/login" element={<Login />} />

        {/* Wallet Routes */}
        <Route path="/wallet" element={
          <RequireAuth>
            <WalletHome />
          </RequireAuth>
        }/>
        <Route path="/wallet/sections" element={
          <RequireAuth>
            <Sections />
          </RequireAuth>
        }/>
        <Route path="/wallet/movements" element={
          <RequireAuth>
            <Movements />
          </RequireAuth>
        }/>

        {/* List Routes */}
        <Route path="/list" element={
          <RequireAuth>
            <ListHome />
          </RequireAuth>
        } />

        {/* Other Routes */}
        <Route path="/backups" element={
          <RequireAuth>
            <Backups />
          </RequireAuth>
        } />
        <Route path="/settings" element={
          <RequireAuth>
            <Settings />
          </RequireAuth>
        } />
        <Route path="/about" element={
          <RequireAuth>
            <About />
          </RequireAuth>
        } />

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
      <AuthProvider>
        <NotificationsInitializer />
        <AnimatedRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
