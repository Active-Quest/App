var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var activitySchema = new Schema({
	'firstName' : String,
	'lastName' : String,
	'email' : String,
	'password' : String,
	'friends' : {
		type: [Schema.Types.ObjectId],
		ref: 'activity',
		default : []
	}
});


var Activity = mongoose.model('activity', activitySchema);
module.exports = Activity;
