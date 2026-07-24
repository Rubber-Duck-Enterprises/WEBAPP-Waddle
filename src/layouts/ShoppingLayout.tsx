import React, { useState } from "react";
import Drawer from "@/components/Navigation/Drawer";
import Header from "@/components/Navigation/Header";
import ShoppingBottomNav from "@/components/Navigation/ShoppingBottomNav";
import { motion } from "framer-motion";
import styles from "./Layout.module.css";

const ShoppingLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <Header onOpenMenu={() => setDrawerOpen(true)} />

      <main className={styles.mainWithBottomNav}>
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

      <ShoppingBottomNav />
      <Drawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
};

export default ShoppingLayout;
