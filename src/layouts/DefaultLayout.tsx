import React, { useState } from "react";
import Drawer from "@/components/Navigation/Drawer";
import Header from "@/components/Navigation/Header";
import { motion } from "framer-motion";

const DefaultLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw" }}>
      <Header onOpenMenu={() => setDrawerOpen(true)} />

      <main style={{ flex: 1, overflowY: "auto" }}>
        <motion.div
          key="page-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      <Drawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
};

export default DefaultLayout;
