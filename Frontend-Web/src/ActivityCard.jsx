import { useState } from 'react';
import './ActivityCard.css';

export default function ActivityCard({ activity }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="activity-card-container">
      <div className="activity-card" onClick={() => setExpanded(!expanded)}>
        <div className="map-placeholder">
          <strong>Waypoints / Map</strong>
          <ul className="waypoint-list">
            {activity.waypoints.map((wp, index) => (
              <li key={index}>
                lat: {wp.lat}, lon: {wp.lon}, alt: {wp.alt}
              </li>
            ))}
          </ul>
        </div>

        <div className="activity-data">
          <p><strong>Start Time:</strong> {new Date(activity.startTime).toLocaleString()}</p>
          <p><strong>Duration:</strong> {activity.duration}</p>
          <p><strong>Distance:</strong> {activity.distance} km</p>
        </div>

        {expanded && (
          <div className="expanded-section">
            <p><strong>Avg Speed:</strong> {activity.avgSpeed ?? 'N/A'} km/h</p>
            <p><strong>Event ID:</strong> {activity.eventId}</p>
          </div>
        )}
      </div>
    </div>
  );
}
