import React, { useState } from "react";
import Drawer from "@/components/Navigation/Drawer";
import Header from "@/components/Navigation/Header";
import { motion } from "framer-motion";
import UIMotionEffectLayer from "@/components/UI/UIFullScreenEffectLayer";

const ListLayout: React.FC<{
  children: React.ReactNode;
  floating?: React.ReactNode;
}> = ({ children, floating }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw" }}>
      <Header onOpenMenu={() => setDrawerOpen(true)} />

      <main style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        <motion.div
          key="page-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>

        {floating}
      </main>

      <Drawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
      <UIMotionEffectLayer />
    </div>
  );
};

export default ListLayout;