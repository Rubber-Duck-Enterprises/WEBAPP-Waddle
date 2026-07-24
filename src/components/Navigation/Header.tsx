import React from "react";
import MenuButton from "./MenuButton";
import styles from "./Navigation.module.css";

type Props = {
  onOpenMenu: () => void;
};

const Header: React.FC<Props> = ({ onOpenMenu }) => {
  return (
    <div className={styles.header}>
      <MenuButton onClick={onOpenMenu} />
      <span className={styles.headerTitle}>Waddle 🐤</span>
      <div className={styles.headerSpacer} />
    </div>
  );
};

export default Header;
