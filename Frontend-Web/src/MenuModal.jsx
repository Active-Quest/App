import React, { useState, useEffect, useRef } from "react";
import "./MenuModal.css";

const THEME_OPTIONS = [
    { value: "blue", label: "Blue", color: "#415A77" },
    { value: "yellow", label: "Yellow", color: "#FFDA3D" },
    { value: "red", label: "Red", color: "#640D14" },
    { value: "purple", label: "Purple", color: "#9667E0" },
    { value: "orange", label: "Orange", color: "#FF9505" },
    { value: "green", label: "Green", color: "#3E8914" },
];

const API_URL = process.env.REACT_APP_API_URL || "http://activequest.ddns.net:3002";

const MenuModal = ({ onClose }) => {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "green");
    const [view, setView] = useState("login");
    const [user, setUser] = useState(null);
    const [firstName, setFirst] = useState("");
    const [lastName, setLast] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);

    useEffect(() => {
        THEME_OPTIONS.forEach(t => document.body.classList.remove(`theme-${t.value}`));
        document.body.classList.add(`theme-${theme}`);
        localStorage.setItem("theme", theme);
    }, [theme]);

    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_URL}/users/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                } else {
                    localStorage.removeItem("token");
                }
            } catch {
                console.warn("Failed to fetch user profile.");
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const handleProfileImageClick = () => {
        fileInputRef.current.click();
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("profileImage", file);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/users/upload-profile`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (res.ok) {
                const updated = await res.json();
                setUser(prev => ({ ...prev, profileImage: updated.profileImage || null }));
            } else {
                alert("Failed to upload image");
            }
        } catch (err) {
            alert("Upload error");
        }
    };

    const handleLogin = async e => {
        e.preventDefault();
        if (!email || !password) return;

        try {
            const res = await fetch(`${API_URL}/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok && data.token && data.user) {
                localStorage.setItem("token", data.token);
                setUser(data.user);
            } else {
                alert(data.message || "Login failed");
            }
        } catch {
            alert("Server error during login");
        }
    };

    const handleRegister = async e => {
        e.preventDefault();
        if (!firstName || !lastName || !email || !password) return;
        if (password !== confirm) {
            alert("Passwords must match");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/users/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firstName, lastName, email, password }),
            });

            const data = await res.json();
            if (res.ok) {
                alert("Registration successful! Please log in.");
                setView("login");
                setFirst(""); setLast(""); setEmail(""); setPassword(""); setConfirm("");
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
                {loading ? (
                    <div className="auth-form">Loading...</div>
                ) : user ? (
                    <div className="auth-form">
                        <h3>Welcome, {user.firstName}!</h3>
                        <img
                            src={
                                user.profileImage
                                    ? `${API_URL}${user.profileImage}`
                                    : "/default-avatar.png"
                            }
                            alt="Profile"
                            className="profile-picture"
                            onClick={handleProfileImageClick}
                            style={{ cursor: "pointer" }}
                        />
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={handleImageChange}
                        />
                        <button onClick={() => {
                            localStorage.removeItem("token");
                            setUser(null);
                            setView("login");
                        }}>
                            Logout
                        </button>
                    </div>
                ) : view === "login" ? (
                    <form className="auth-form" onSubmit={handleLogin}>
                        <h3>Login</h3>
                        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                        <button type="submit">Login</button>
                        <p>
                            Don’t have an account?{" "}
                            <span className="switch-view" onClick={() => setView("register")}>Register</span>
                        </p>
                    </form>
                ) : (
                    <form className="auth-form" onSubmit={handleRegister}>
                        <h3>Register</h3>
                        <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirst(e.target.value)} />
                        <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLast(e.target.value)} />
                        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                        <input type="password" placeholder="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)} />
                        <button type="submit">Register</button>
                        <p>
                            Already have an account?{" "}
                            <span className="switch-view" onClick={() => setView("login")}>Login</span>
                        </p>
                    </form>
                )}

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

                {!user && !loading && (
                    <button className="close-btn" onClick={onClose}>
                        Close
                    </button>
                )}
            </div>
        </>
    );
};

export default MenuModal;
