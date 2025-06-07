import { useEffect, useState } from 'react';
import './ActivityCard.css';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMap } from '@fortawesome/free-solid-svg-icons';

export default function ActivityCard({ activity }) {
  const [expanded, setExpanded] = useState(false);
  const [user,setUser] = useState(null);
  
  useEffect(()=>{
    const getUserData = async() => {
      const res = await fetch(`http://activequest.ddns.net:3002/users/${activity.userId}`);
      if(!res.ok){
        console.warn("Failed to get activity user data");
        return;
      }

      const data = await res.json();
      setUser(data);
    }
    getUserData();
  });


  //console.log(activity);
  const path = Array.isArray(activity.waypoints)
  ? activity.waypoints.map(wp => [wp.lat, wp.lon])
  : [];

  const startIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [15, 21],
    shadowSize: [41, 41]
  });

  const endIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [15, 21],
    shadowSize: [41, 41]
  });

  return (
    <div className="activity-card-container">
      <div className="activity-card">
        <div className="activity-data">
          <p><strong>{user?.firstName} {user?.lastName}</strong></p>
          <p><strong>Duration:</strong> {activity.duration}</p>
          <p><strong>Distance:</strong> {(activity.distance/1000).toFixed(3)} km</p>
        </div>

        <FontAwesomeIcon className="map-icon" icon={faMap} onClick={() => setExpanded(!expanded)}/>

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
            <Marker position={path[0]} icon={startIcon}>
              <Popup>Start</Popup>
            </Marker>

            <Marker position={path[path.length-1]} icon={endIcon}>
              <Popup>Finish</Popup>
            </Marker>
            </MapContainer>
            <p><strong>Start Time:</strong> {new Date(activity.startTime).toLocaleString()}</p>
            <p><strong>Avg Speed:</strong> {activity.avgSpeed ?? 'N/A'} km/h</p>
            <p><strong>Event ID:</strong> {activity.eventId}</p>
          </div>

        )}
      </div>
    </div>
  );
}
