import React from "react";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {}

const UITextInput: React.FC<Props> = (props) => {
  return (
    <input
      {...props}
      style={{
        padding: "0.5rem",
        borderRadius: "8px",
        border: "1px solid var(--input-border-color)",
        backgroundColor: "var(--input-bg)",
        color: "var(--text-primary)",
        width: "100%",
        ...props.style,
      }}
    />
  );
};

export default UITextInput;
