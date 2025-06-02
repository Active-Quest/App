import { useEffect, useState } from 'react';
import './ActivityCard.css';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';

export default function ActivityCard({ activity }) {
  const [expanded, setExpanded] = useState(false);
  

  //console.log(activity);
  const path = Array.isArray(activity.waypoints)
  ? activity.waypoints.map(wp => [wp.lat, wp.lon])
  : [];

  return (
    <div className="activity-card-container">
      <div className="activity-card" onClick={() => setExpanded(!expanded)}>
        
        <div className="activity-data">
          <p><strong>Start Time:</strong> {new Date(activity.startTime).toLocaleString()}</p>
          <p><strong>Duration:</strong> {activity.duration}</p>
          <p><strong>Distance:</strong> {activity.distance} km</p>
        </div>

        {expanded && (
          <div className="expanded-section">
            <MapContainer
            center={path[0]}
            zoom={20}
            style={{height:'400px',width:'100%'}}
            >
            
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <Polyline positions={path} color='blue'/>
            </MapContainer>

            <p><strong>Avg Speed:</strong> {activity.avgSpeed ?? 'N/A'} km/h</p>
            <p><strong>Event ID:</strong> {activity.eventId}</p>
          </div>

        )}
      </div>
    </div>
  );
}
