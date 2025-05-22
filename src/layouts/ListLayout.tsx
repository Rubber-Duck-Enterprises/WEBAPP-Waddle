import React, { useState } from "react";
import Drawer from "@/components/Navigation/Drawer";
import Header from "@/components/Navigation/Header";
import { motion } from "framer-motion";
import FloatingActionButton from "@/components/Navigation/FloatingActionButton";
import UIMotionEffectLayer from "@/components/UI/UIFullScreenEffectLayer";

const ListLayout: React.FC<{ children: React.ReactNode; activeListId: string | "all" }> = ({
  children,
  activeListId,
}) => {
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

      <FloatingActionButton activeListId={activeListId} />
      <Drawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
      <UIMotionEffectLayer />
    </div>
  );
};

export default ListLayout;
