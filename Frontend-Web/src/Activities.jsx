import { useEffect, useState } from 'react';
import ActivityCard from './ActivityCard';

function Activities() {
  const [activities, setActivities] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || '';

  useEffect(() => {
    fetch(`${API_URL}/activities`)
      .then(res => res.json())
      .then(setActivities);
  }, []);

  return (
    <div className="activities-container">
      {activities.map(activity => (
        <ActivityCard key={activity._id} activity={activity} />
      ))}
    </div>
  );
}

export default Activities;
