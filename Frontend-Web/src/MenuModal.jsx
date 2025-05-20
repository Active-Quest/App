import React, { useState, useEffect } from "react";
import "./MenuModal.css";

const THEME_OPTIONS = [
  { value: "blue",   label: "Blue",   color: "#415A77" },
  { value: "yellow", label: "Yellow", color: "#FFDA3D" },
  { value: "red",    label: "Red",    color: "#640D14" },
  { value: "purple", label: "Purple", color: "#9667E0" },
  { value: "orange", label: "Orange", color: "#FF9505" },
  { value: "green",  label: "Green",  color: "#3E8914" },
];

const MenuModal = ({ onClose }) => {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "green"
  );
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Apply and persist theme
  useEffect(() => {
    THEME_OPTIONS.forEach(t =>
      document.body.classList.remove(`theme-${t.value}`)
    );
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      const res = await fetch(
        "http://activequest.ddns.net:3000/user/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        // Successful login: refresh or redirect as needed
        window.location.reload();
      } else {
        alert(data.message || "Login failed");
      }
    } catch {
      alert("Server error during login");
    }
  };

  // Handle registration form submission
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    if (password !== confirm) {
      alert("Passwords must match");
      return;
    }
    try {
      const res = await fetch(
        "http://activequest.ddns.net:3000/user/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        alert("Registration successful! Please log in.");
        setView("login");
      } else {
        alert(data.message || "Registration failed");
      }
    } catch {
      alert("Server error during registration");
    }
  };

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal">

        {/* Login / Register forms */}
        {view === "login" ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <h3>Login</h3>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button type="submit">Login</button>
            <p>
              Don’t have an account?{' '}
              <span className="switch-view" onClick={() => setView("register")}>Register</span>
            </p>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <h3>Register</h3>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
            <button type="submit">Register</button>
            <p>
              Already have an account?{' '}
              <span className="switch-view" onClick={() => setView("login")}>Login</span>
            </p>
          </form>
        )}

        {/* Theme picker */}
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

        {/* Close button */}
        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </>
  );
};

export default MenuModal;
