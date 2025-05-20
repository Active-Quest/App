var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var activitySchema = new Schema({
	'title' : String,
	'createdBy' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'user'
	},
	'type' : String,
	'startTime' : Date,
	'endTime' : Date,
	'duration' : String,
	'distance' : String,
	'waypoints' : {
		type: [Schema.Types.ObjectId],
		ref: Location,
		default : []
	}
	
	});

var Activity = mongoose.model('activity', activitySchema);
module.exports = Activity;
