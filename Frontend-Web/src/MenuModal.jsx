import React, { useState, useEffect } from "react";
import "./MenuModal.css";

const THEME_OPTIONS = [
  { value: "blue",   label: "Blue",   color: "#415A77" },
  { value: "yellow",  label: "Yellow",  color: "#FFDA3D" },
  { value: "red",   label: "Red",   color: "#640D14" },
  { value: "purple", label: "Purple", color: "#9667E0" },
  { value: "orange", label: "Orange", color: "#FF9505" },
  { value: "green",  label: "Green",  color: "#3E8914" },
];

const MenuModal = ({ onClose }) => {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "green"
  );

  useEffect(() => {
    THEME_OPTIONS.forEach(t =>
      document.body.classList.remove(`theme-${t.value}`)
    );
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal">

        <div className="theme-picker">
          {THEME_OPTIONS.map(t => (
            <button
              key={t.value}
              className={`theme-dot${theme === t.value ? " selected" : ""}`}
              style={{ backgroundColor: t.color }}
              onClick={() => setTheme(t.value)}
              aria-label={t.label}
            />
          ))}
        </div>

        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </>
  );
};

export default MenuModal;
