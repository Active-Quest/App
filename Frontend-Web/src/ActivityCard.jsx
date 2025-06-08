import { useEffect, useState } from 'react';
import './ActivityCard.css';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMap, faUser, faChartLine } from '@fortawesome/free-solid-svg-icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function ActivityCard({ activity }) {
  const [expanded, setExpanded] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUserData = async () => {
      const res = await fetch(`http://activequest.ddns.net:3002/users/${activity.userId}`);
      if (!res.ok) {
        console.warn("Failed to get activity user data");
        return;
      }
      const data = await res.json();
      setUser(data);
    };
    getUserData();
  }, [activity.userId]);

  const path = Array.isArray(activity.waypoints) && activity.waypoints.length > 0
    ? activity.waypoints.map(wp => [wp.lat, wp.lon])
    : [];

  const graphData = (activity?.avgSpeed || []).map((s, index) => ({
    index,
    speed: parseFloat(s.toFixed(3)),
    alt: parseFloat(activity.waypoints?.[index]?.alt ?? 0)
  }));

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

  const averageSpeed = Array.isArray(activity.avgSpeed) && activity.avgSpeed.length > 0
    ? (activity.avgSpeed.reduce((a, b) => a + b, 0) / activity.avgSpeed.length).toFixed(3)
    : 'N/A';

  return (
    <div className="activity-card-container">
      <div className="activity-card">
        <div className="activity-header">
          <FontAwesomeIcon icon={faUser} />{' '}
          <strong>{user?.firstName} {user?.lastName}</strong>
        </div>

        <div className="activity-table">
          <div className="table-row header">
            <div className="cell">Feature</div>
            <div className="cell">Activity</div>
          </div>
          <div className="table-row">
            <div className="cell">Duration</div>
            <div className="cell">{activity.duration}</div>
          </div>
          <div className="table-row">
            <div className="cell">Distance</div>
            <div className="cell">{(activity.distance / 1000).toFixed(3)} km</div>
          </div>
          <div className="table-row">
            <div className="cell">Avg Speed</div>
            <div className="cell">{averageSpeed} km/h</div>
          </div>
        </div>

        <div className="icon-toggle">
          <FontAwesomeIcon className="map-icon" icon={faMap} onClick={() => setExpanded(!expanded)} />
          <FontAwesomeIcon className="map-icon" icon={faChartLine} onClick={() => setShowGraph(!showGraph)} />
        </div>

        {expanded && path.length > 0 && (
          <div className="expanded-section">
            <MapContainer center={path[0]} zoom={20} style={{ height: '400px', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <Polyline positions={path} color="blue" />
              <Marker position={path[0]} icon={startIcon}>
                <Popup>Start</Popup>
              </Marker>
              <Marker position={path[path.length - 1]} icon={endIcon}>
                <Popup>Finish</Popup>
              </Marker>
            </MapContainer>
          </div>
        )}

        {showGraph && (
          <div className="expanded-section">
            <h4>Speed & Altitude</h4>
            <div className="graph-row">
              <div className="graph-box">
                <h5>Speed</h5>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis unit=" km/h" />
                    <Tooltip formatter={(value) => `${parseFloat(value).toFixed(2)}`} />
                    <Line type="monotone" dataKey="speed" stroke="#3DA35D" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="graph-box">
                <h5>Altitude</h5>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis unit=" m" />
                    <Tooltip formatter={(value) => `${parseFloat(value).toFixed(2)}`} />
                    <Line type="monotone" dataKey="alt" stroke="#96E072" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
