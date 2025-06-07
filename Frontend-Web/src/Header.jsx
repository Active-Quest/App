import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Header.css";
import ActiveQuestLogo from './ActiveQuest.png';
import MenuModal from './MenuModal.jsx';
import AddFriendModalModal from './AddFriendModal.jsx';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faUsers } from "@fortawesome/free-solid-svg-icons";

const Header = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);

  const toggleMenu = () => {
    setShowMenu(prev => !prev);
  };

  const toggleFriend = () => {
    setShowAddFriend(prev => !prev);
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


        <div className="icon-group">
          <div className="icon-button" onClick={toggleFriend}>
            <FontAwesomeIcon icon={faUsers} />
          </div>

          <div className="icon-button" onClick={toggleMenu}>
            <FontAwesomeIcon icon={faUser} />
          </div>
        </div>
      </div>

      {/* Menu Modal */}
      {showMenu && <MenuModal onClose={() => setShowMenu(false)} />}
      {showAddFriend && <AddFriendModalModal onClose={() => setShowAddFriend(false)} />}
    </>
  );
};

export default Header;
