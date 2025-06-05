require('dotenv').config();
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const Activity = require('./models/activityModel.js');

//Load ENV Vars
const mqttHost = process.env.MQTT_HOST;
const mqttTopic = process.env.MQTT_TOPIC;
const mongoUri = process.env.MONGO_URI;

//Validate Required Config
if (!mqttHost || !mqttTopic || !mongoUri) {
  console.error('Missing required environment variables: MONGO_URI, MQTT_HOST, or MQTT_TOPIC');
  process.exit(1);
}

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
const mqttClient = mqtt.connect(`mqtt://${mqttHost}`);

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
  
      if (!activityId || !userId) {
        console.error('Missing activityId or userID in message');
        return;
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
          $inc: { distance: newDistance } 
        });
        console.log(`Updated existing activity: ${activityId}`);
        return
      } else {
        const newActivity = new Activity({
          activityId,
          userId,
          eventId: new mongoose.Types.ObjectId(),
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
  
