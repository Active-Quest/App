import React, { useState , useEffect} from 'react';
import axios from 'axios';
import './Friends.css';

const storedUser = JSON.parse(localStorage.getItem("user"));
const userId = storedUser?._id;

const BASE_URL = "http://activequest.ddns.net:3002";
//const BASE_URL = 'http://localhost:3002';

const Friends = () => {
  const [friends, setFriends] = useState([]);
   const [events, setEvents] = useState([]);

    useEffect(() => {
    const fetchFriendsAndEvents = async () => {
      try {
        const [friendsRes, eventsRes] = await Promise.all([
          axios.get(`${BASE_URL}/users/${userId}/friends`),
          axios.get(`${BASE_URL}/events`)
        ]);

        setFriends(friendsRes.data);
        setEvents(eventsRes.data);
      } catch (err) {
        console.error("Error fetching data:", err.response?.data || err.message);
      }
    };

    if (userId) {
      fetchFriendsAndEvents();
    }
  }, []);

  const getUserEventName = (friendId) => {
    const event = events.find(event =>
      Array.isArray(event.activeUsers) && event.activeUsers.includes(friendId)
    );
    return event ? event.title : null;
  };


  return (
    <div className="events-page">
      {friends.length === 0 ? (
        <h1 className="text-center text-gray-500">No friends found.</h1>
      ) : (
        friends.map(user => {
          const eventName = getUserEventName(user._id);

          return (
            <div key={user._id} className="event-card">
              <div className="event-header">
                <h3>{user.firstName} {user.lastName}</h3>
                {eventName && (
                  <span className="event-name">
                    <h3>Event: {eventName}</h3>
                  </span>
                )}
              </div>
              <p>Email: {user.email}</p>
            </div>
          );
        })
      )}
    </div>
  );
};

export default Friends;
