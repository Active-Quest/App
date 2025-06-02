import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Header.css";
import ActiveQuestLogo from './ActiveQuest.png';
import MenuModal from './MenuModal.jsx';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Header = () => {
  const [showMenu, setShowMenu] = useState(false);

  const toggleMenu = () => {
    setShowMenu(prev => !prev);
  };

  return (
    <>
      {/* Header Bar */}
      <div className="header">
        <img src={ActiveQuestLogo} alt="ActiveQuest logo" className="header-logo" />

        <div className="nav-buttons">
          <Link to="/" className="nav-button">Activity</Link>
          <Link to="/events" className="nav-button">Event</Link>
          <Link to="/friends" className="nav-button">Friends</Link>
        </div>

        <div className="icon-button" onClick={toggleMenu}>
          <FontAwesomeIcon icon="user" />
        </div>
      </div>

      {/* Menu Modal */}
      {showMenu && <MenuModal onClose={() => setShowMenu(false)} />}
    </>
  );
};

export default Header;
