import UIToggle from "../components/UI/UIToggle";
import { useTheme } from "../hooks/useTheme";

import DefaultLayout from "../layouts/DefaultLayout";

const Sections: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <DefaultLayout>
      <UIToggle
        label={theme === "light" ? "🌞 Claro" : "🌚 Oscuro"}
        checked={theme === "dark"}
        onChange={toggleTheme}
      />
    </DefaultLayout>
  );
};

export default Sections;
