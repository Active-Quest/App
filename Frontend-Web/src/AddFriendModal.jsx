import React, { useState, useEffect } from "react";
import axios from 'axios';
import "./AddFriendModal.css";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

//const API_URL = process.env.REACT_APP_API_URL || "http://activequest.ddns.net:3002";
const API_URL = "http://activequest.ddns.net:3002";
//const API_URL = 'http://localhost:3002';

console.log("Using backend:", API_URL);

const storedUser = JSON.parse(localStorage.getItem("user"));
const userId = storedUser?._id;

const AddFriendModal = ({ onClose }) => {
     const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [results, setResults] = useState([]);

    const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.get(`${API_URL}/users/search`, {
        params: { firstName, lastName },
        headers: { 'Cache-Control': 'no-cache' }
      });
      console.log("Search results:", res.data);
      setResults(res.data);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleAddFriend = async (targetUserId) => {
    try {
      const response = await axios.put(`${API_URL}/users/${userId}/friends`, {
        friendId: targetUserId
      });
      console.log("Friend added:", response.data);
    } catch (err) {
      console.error("Failed to add friend:", err.response?.data || err.message);
    }
  };

    return (
        <>
            <div className="overlay" onClick={onClose} />
      <div className="modal add-friend-modal">
        <h3>Find and Add Friends</h3>
        <form onSubmit={handleSearch} className="auth-form">
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={e => setFirst(e.target.value)}
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={e => setLast(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        {results.length > 0 ? (
            <div className="search-results">
                {results
                    .filter(user => user._id !== userId)
                    .map(user => (
                        <div key={user._id} className="result-card">
                        <span>{user.firstName} {user.lastName} ({user.email})</span>
                        <FontAwesomeIcon
                            icon={faPlus}
                            className="add-icon"
                            onClick={() => handleAddFriend(user._id)}
                        />
                        </div>
                    ))}
            </div>
        ) : (
          <p className="text-center">No users found.</p>
        )}

        <button className="close-btn" onClick={onClose}>Close</button>
      </div>

        </>
    );
};

export default AddFriendModal;
