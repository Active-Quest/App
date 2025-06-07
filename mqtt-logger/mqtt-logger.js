require('dotenv').config();
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const Activity = require('./models/activityModel.js');
const Event = require('./models/eventModel.js');

//Load ENV Vars
const mqttHost = process.env.MQTT_HOST;
const mqttTopic = process.env.MQTT_TOPIC;
const mongoUri = process.env.MONGO_URI;

//Validate Required Config
if (!mqttHost || !mqttTopic || !mongoUri) {
  console.error('Missing required environment variables: MONGO_URI, MQTT_HOST, or MQTT_TOPIC');
  process.exit(1);
}

let eventsUsers = {};

//Connect to MongoDB
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

//Connect to MQTT Broker
const mqttClient = mqtt.connect(`mqtt://${mqttHost}`, {
  keepalive: 60,
  reconnectPeriod: 5000 // Reconnect every 5s
});

mqttClient.on('connect', () => {
  console.log(`Connected to MQTT broker at ${mqttHost}`);
  mqttClient.subscribe(mqttTopic, (err) => {
    if (err) {
      console.error(`MQTT subscription error: ${err.message}`);
    } else {
      console.log(`Subscribed to topic: ${mqttTopic}`);
    }
  });
});

mqttClient.on('message', async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
  
      const activityId = data.activityId?.toString();
      const userId = data.userId?.toString();
      const eventId = data.eventId?.toString();
  
      if (!activityId || !userId) {
        console.error('Missing activityId or userID in message');
        return;
      }

      if (!eventsUsers[eventId]) {
        eventsUsers[eventId] = [];
      }
  
      if(!eventsUsers[eventId].includes(userId)){
        eventsUsers[eventId].push(userId);
      }

      const existing = await Activity.findOne({ activityId:activityId });
  
      const waypoint = {
        lat: data.latitude?.toString() || '',
        lon: data.longitude?.toString() || '',
        alt: data.altitude?.toString() || '',
        time: new Date()
      };

      if (existing) {
        existing.waypoints.push(waypoint);
        await existing.updateOne({
          $push: { waypoints: waypoint },
          $inc: { distance: data.distance }, //increment the new distance to the total
          duration: data.duration
        });
        console.log(`Updated existing activity: ${activityId}`);
        return
      } else {
        const newActivity = new Activity({
          activityId,
          userId,
          eventId: eventId,
          startTime: new Date(),
          duration: '0:01',
          distance: '0.00',
          waypoints: [waypoint],
          avgSpeed: 0
         
        });

       

        await newActivity.save();
        console.log(`Created new activity: ${activityId}`);
      }
      
    } catch (err) {
      console.error('Failed to save message:', err.message);
    }
  });

  
setInterval( async () => {
  for (const eventId in eventsUsers) {
    console.log("Event id: "+eventId);
    const event = await Event.findOne({_id : eventId});
    if(event){
      await event.updateOne({
        activeUsers : eventsUsers[eventId].length
      })
      console.log("Number of users: "+eventsUsers[eventId].length);
    }
  }
  eventsUsers = {};
}, 30000);