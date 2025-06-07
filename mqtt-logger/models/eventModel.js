var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var eventSchema = new Schema({
	'title' : String,
	'createdBy' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'user'
	},
	'type' : String,
	'startTime' : Date,
	'endTime' : Date,
	'description' : String,
	'goal' : Number,
	'activeUsers' : Number
	});

var event = mongoose.model('event', eventSchema);
module.exports = event;
