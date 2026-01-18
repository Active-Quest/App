const net = require('net');
const mongoose = require('mongoose');
const crypto = require('crypto');


const TCP_PORT = 1234;

const MONGO_URI =
  'mongodb+srv://Matic:murko2004@activequest.ge3s7st.mongodb.net/ActiveQuest?retryWrites=true&w=majority&appName=ActiveQuest';

const TEST_USER_ID = new mongoose.Types.ObjectId(
  '68471c1455a109c36608bafd'
);


const activitySchema = new mongoose.Schema({
  activityId: String,
  userId: mongoose.Schema.Types.ObjectId,
  startTime: Date,
  duration: String,
  distance: Number,
  avgSpeed: [Number],
  waypoints: [],
});

const Activity = mongoose.model(
  'Activity',
  activitySchema,
  'activities' // ActiveQuest.activities
);


let currentActivity = null;
let lastPacketTs = 0;


mongoose
  .connect(MONGO_URI, { dbName: 'ActiveQuest' })
  .then(() =>
    console.log('MongoDB connected → ActiveQuest.activities')
  )
  .catch((err) => {
    console.error('MongoDB error:', err);
    process.exit(1);
  });


const server = net.createServer((socket) => {
  console.log(' TCP client connected');

  socket.on('data', async (data) => {
    try {
      const msg = data.toString().trim();
      console.log('TCP:', msg);

      const payload = JSON.parse(msg);

      // PRIČAKUJEMO ARRAY
      if (!Array.isArray(payload.values)) {
        console.warn('Invalid payload: values is not array');
        return;
      }

      // throttle: 20s
      const now = Date.now();
      if (now - lastPacketTs < 20_000) return;
      lastPacketTs = now;


      if (!currentActivity) {
        currentActivity = await Activity.create({
          activityId: crypto.randomUUID(),
          userId: TEST_USER_ID,
          startTime: new Date(),
          duration: '00:00',
          distance: 0,
          avgSpeed: [],
          waypoints: [],
        });

        console.log(
          'Created new activity:',
          currentActivity._id.toString()
        );
      }


      const speeds = payload.values
        .map(Number)
        .filter((v) => !isNaN(v));

      if (speeds.length === 0) {
        console.warn('No valid numbers in values array');
        return;
      }

      const elapsedMs =
        Date.now() - currentActivity.startTime.getTime();
      const minutes = Math.floor(elapsedMs / 60000);
      const seconds = Math.floor((elapsedMs % 60000) / 1000);

      const duration =
        String(minutes).padStart(2, '0') +
        ':' +
        String(seconds).padStart(2, '0');

      await Activity.updateOne(
        { _id: currentActivity._id },
        {
          $push: { avgSpeed: { $each: speeds } },
          $set: { duration },
        }
      );

      console.log(' Added avgSpeed values:', speeds);
    } catch (err) {
      console.error('TCP parse/save error:', err.message);
    }
  });

  socket.on('end', () => {
    console.log(' TCP client disconnected');
  });
});


server.listen(TCP_PORT, () => {
  console.log(` TCP server listening on ${TCP_PORT}`);
});
