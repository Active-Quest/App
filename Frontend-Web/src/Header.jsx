import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Header.css";
import ActiveQuestLogo from './ActiveQuest.png';
import MenuModal from './MenuModal.jsx';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Header = () => {
    const [showMenu, setShowMenu] = useState(false);
  
    // Toggle Menu modal
    const toggleMenu = () => {
         setShowMenu(prev => !prev);
    };
  
  
    return (
    <>
      {/* Header bar */}
      <div className="header">
          <img  src={ActiveQuestLogo}   alt="ActiveQuest logo" className="header-logo" />
        
          <div className="icon-button" onClick={toggleMenu}>
            <FontAwesomeIcon icon="user" />
          </div>
      </div>

      {/* Menu Modal */}
      {showMenu && <MenuModal onClose={() => setShowMenu(false)}/>}
    </>
  );
};

export default Header;
