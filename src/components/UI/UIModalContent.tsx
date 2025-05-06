// components/UI/UIModalContent.tsx

const UIModalContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    padding: "1.5rem"
  }}>
    {children}
  </div>
);

export default UIModalContent;
