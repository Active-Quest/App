import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Header.css";
import ActiveQuestLogo from './ActiveQuest.png';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Header = () => {

  return (
    <>
      {/* Header bar */}
      <div className="header">
          <img  src={ActiveQuestLogo}   alt="ActiveQuest logo" className="header-logo" />
        
          <div className="icon-button">
            <FontAwesomeIcon icon="user" />
          </div>
      </div>
    </>
  );
};

export default Header;
