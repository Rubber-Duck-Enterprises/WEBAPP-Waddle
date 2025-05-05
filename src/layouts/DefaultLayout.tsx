import React, { useState } from "react";
import Drawer from "../components/Drawer";
import BottomNav from "../components/BottomNav";
import Header from "../components/Header";
import { motion } from "framer-motion";

const DefaultLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw" }}>
      <Header onOpenMenu={() => setDrawerOpen(true)} />

      <main style={{ flex: 1, overflowY: "auto", paddingBottom: "56px" }}>
        <motion.div
          key="page-content"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      <BottomNav />
      <Drawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
};

export default DefaultLayout;
