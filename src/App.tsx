import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import NotificationsInitializer from "./components/Modal/NotificationsInitializer";
import OfflineBanner from "@/components/OfflineBanner";

import StartRedirect from "@/pages/StartRedirect";
import WalletHome from "@/pages/Wallet/Home";
import Sections from "@/pages/Wallet/Sections";
import Movements from "@/pages/Wallet/Movements";
import ShoppingHome from "@/pages/Shopping/Home";
import NewTrip from "@/pages/Shopping/NewTrip";
import ActiveTrip from "@/pages/Shopping/ActiveTrip";
import EditTrip from "@/pages/Shopping/EditTrip";
import ShoppingHistory from "@/pages/Shopping/History";
import ShoppingReports from "@/pages/Shopping/Reports";
import ShoppingStores from "@/pages/Shopping/Stores";
import ListHome from "@/pages/List/Home";
import Backups from "@/pages/Backups";
import Settings from "@/pages/Settings";
import About from "@/pages/About";
import Login from "@/pages/Auth/Login";

import { useScheduledTaskCleanup } from "./hooks/useScheduledTaskCleanup";
import { useTaskDueReminders } from "./hooks/useTaskDueReminders";

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
          path="/shopping"
          element={
            <AnyUserRoute>
              <ShoppingHome />
            </AnyUserRoute>
          }
        />
        <Route
          path="/shopping/history"
          element={
            <AnyUserRoute>
              <ShoppingHistory />
            </AnyUserRoute>
          }
        />
        <Route
          path="/shopping/reports"
          element={
            <AnyUserRoute>
              <ShoppingReports />
            </AnyUserRoute>
          }
        />
        <Route
          path="/shopping/stores"
          element={
            <AnyUserRoute>
              <ShoppingStores />
            </AnyUserRoute>
          }
        />
        <Route
          path="/shopping/new"
          element={
            <AnyUserRoute>
              <NewTrip />
            </AnyUserRoute>
          }
        />
        <Route
          path="/shopping/trip/:tripId"
          element={
            <AnyUserRoute>
              <ActiveTrip />
            </AnyUserRoute>
          }
        />
        <Route
          path="/shopping/edit/:tripId"
          element={
            <AnyUserRoute>
              <EditTrip />
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
  useTaskDueReminders();

  return (
    <AuthProvider>
      <Router>
        <OfflineBanner />
        <NotificationsInitializer />
        <AnimatedRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;