import React, { useState , useEffect} from 'react';
import axios from 'axios';
import './Friends.css';

const storedUser = JSON.parse(localStorage.getItem("user"));
const userId = storedUser?._id;

const BASE_URL = "http://activequest.ddns.net:3002";
//const BASE_URL = 'http://localhost:3002';

const Friends = () => {
  const [friends, setFriends] = useState([]);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
            const res = await axios.get(`${BASE_URL}/users/${userId}/friends`);
            console.log("Friends List:", res.data);
            setFriends(res.data);
            } catch (err) {
            console.error("Error fetching friends:", err.response?.data || err.message);
            }
        };

        if (userId) {
            fetchFriends();
        }
    }, []);


  return (
    <div className="events-page">

        {friends.length === 0 ? (
            <h1 className="text-center text-gray-500">No friends found.</h1>
            ) : (
            friends.map(user => (
                <div key={user._id} className="event-card">
                <div className="event-header">
                    <h3>{user.firstName} {user.lastName}</h3>
                </div>
                <p>Email: {user.email}</p>
                </div>
            ))
        )}

      
    </div>
  );
};

export default Friends;
