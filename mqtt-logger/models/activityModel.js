var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var activitySchema = new Schema({
	'userId' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'user'
	},
	'eventId' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'event'
	},
	'startTime' : Date,
	'duration' : String,
	'distance' : String,
	'waypoints' : [{
		lat : String,
		lon : String,
		alt : String,
		time : Date
	}],
	'avgSpeed' : Number,
	});

var Activity = mongoose.model('activity', activitySchema);
module.exports = Activity;
