import React, { useState } from "react";
import Drawer from "@/components/Navigation/Drawer";
import Header from "@/components/Navigation/Header";
import { motion } from "framer-motion";
import UIMotionEffectLayer from "@/components/UI/UIFullScreenEffectLayer";
import styles from "./Layout.module.css";

const ListLayout: React.FC<{
  children: React.ReactNode;
  floating?: React.ReactNode;
}> = ({ children, floating }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <Header onOpenMenu={() => setDrawerOpen(true)} />

      <main className={styles.mainRelative}>
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
