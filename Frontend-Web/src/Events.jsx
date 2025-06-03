import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Events.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

const storedUser = JSON.parse(localStorage.getItem("user"));
const userId = storedUser?._id;

const Events = () => {
    const [events, setEvents] = useState([]);
    const [formVisible, setFormVisible] = useState(false);

    const [form, setForm] = useState({
        title: '',
        type: 'walk',
        startTime: '',
        endTime: '',
        description: '',
        goal: 0,
    });

    // Dev
    //const BASE_URL = 'http://localhost:3001';

    // Relese
    const BASE_URL = 'http://activequest.ddns.net:3002';

    useEffect(() => {
        axios.get(`${BASE_URL}/events`)
            .then(res => setEvents(res.data))
            .catch(err => console.error(err));
    }, [BASE_URL]);

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        try {
            const res = await axios.post(`${BASE_URL}/events`, {
                ...form,
                userId: userId
            });
            if (!userId) {
                alert("Please log in to create an event.");
                return;
            }

            setEvents(prev => [...prev, res.data]);
            setForm({
                title: '',
                type: 'walk',
                startTime: '',
                endTime: '',
                description: '',
                goal: 0
            });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="events-page">
            {/* Toggle button */}
            <div className="toggle-box" onClick={() => setFormVisible(prev => !prev)}>
                <span>Create Event</span>
                <span className={`arrow ${formVisible ? 'up' : 'down'}`}>▾</span>
            </div>

            {/* Form */}
            {formVisible && (
                <div className="event-form">
                    <div className="form-group">
                        <label htmlFor="title">Title</label>
                        <input id="title" name="title" value={form.title} onChange={handleChange} placeholder="Title" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="type">Type</label>
                        <select id="type" name="type" value={form.type} onChange={handleChange}>
                            <option value="walk">Walk</option>
                            <option value="run">Run</option>
                            <option value="bike">Bike</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="startTime">Start Time</label>
                        <input type="datetime-local" id="startTime" name="startTime" value={form.startTime} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="endTime">End Time</label>
                        <input type="datetime-local" id="endTime" name="endTime" value={form.endTime} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="goal">Goal (km)</label>
                        <input type="number" id="goal" name="goal" value={form.goal} onChange={handleChange} />
                    </div>

                    <div className="form-group full-width">
                        <label htmlFor="description">Description</label>
                        <textarea id="description" name="description" value={form.description} onChange={handleChange} placeholder="Description" />
                    </div>

                    <div className="form-group full-width">
                        <button onClick={handleSubmit}>＋</button>
                    </div>
                </div>
            )}

            {/* Event List */}
            <div className="event-list">
                {events.map(event => (
                    <div key={event._id} className="event-card">
                        <div className="event-header">
                            <h3>{event.title}</h3>
                            <div className="event-users">
                                <FontAwesomeIcon icon={faUser} className="user-icon" />
                                <span className="user-count">0</span>
                            </div>
                        </div>
                        <p>Type: {event.type} | Goal: {event.goal} km</p>
                        <p>
                            {new Date(event.startTime).toLocaleString()} →{" "}
                            {event.endTime ? new Date(event.endTime).toLocaleString() : "Ongoing"}
                        </p>
                        <p>{event.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Events;
