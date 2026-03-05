import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import NotificationsInitializer from "./components/Modal/NotificationsInitializer";

import StartRedirect from "@/pages/StartRedirect";
import WalletHome from "@/pages/Wallet/Home";
import Sections from "@/pages/Wallet/Sections";
import Movements from "@/pages/Wallet/Movements";
import ListHome from "@/pages/List/Home";
import Backups from "@/pages/Backups";
import Settings from "@/pages/Settings";
import About from "@/pages/About";
import Login from "@/pages/Auth/Login";

import { useScheduledTaskCleanup } from "./hooks/useScheduledTaskCleanup";

import { AuthProvider } from "@/context/AuthContext";
import { PublicRoute, AnyUserRoute, AuthOnlyRoute } from "@/routes/guards";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Redirect */}
        <Route path="/" element={<StartRedirect />} />

        {/* Public */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/about"
          element={
            <PublicRoute>
              <About />
            </PublicRoute>
          }
        />

        {/* AnyUser (anon o auth) */}
        <Route
          path="/wallet"
          element={
            <AnyUserRoute>
              <WalletHome />
            </AnyUserRoute>
          }
        />
        <Route
          path="/wallet/sections"
          element={
            <AnyUserRoute>
              <Sections />
            </AnyUserRoute>
          }
        />
        <Route
          path="/wallet/movements"
          element={
            <AnyUserRoute>
              <Movements />
            </AnyUserRoute>
          }
        />
        <Route
          path="/list"
          element={
            <AnyUserRoute>
              <ListHome />
            </AnyUserRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <AnyUserRoute>
              <Settings />
            </AnyUserRoute>
          }
        />

        {/* AuthOnly */}
        <Route
          path="/backups"
          element={
            <AuthOnlyRoute>
              <Backups />
            </AuthOnlyRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<StartRedirect />} />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  useScheduledTaskCleanup();

  return (
    <AuthProvider>
      <Router>
        <NotificationsInitializer />
        <AnimatedRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;