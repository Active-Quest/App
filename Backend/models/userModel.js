var mongoose = require('mongoose');
var bcrypt = require('bcrypt')
var Schema   = mongoose.Schema;

var userSchema = new Schema({
	'firstName' : String,
	'lastName' : String,
	'email' : String,
	'password' : String,
	'friends' : {
		type: [Schema.Types.ObjectId],
		ref: 'user',
		default : []
	}
});

userSchema.pre('save', function(next){
	var user = this;
	bcrypt.hash(user.password, 10, function(err, hash){
		if(err){
			return next(err);
		}
		user.password = hash;
		next();
	});
});

userSchema.statics.authenticate=async function (email,password) {
	try{
		const user = await this.findOne({email});
		if(!user){
			return null;
		}
		const match = await bcrypt.compare(password,user.password);
		if(match){
			return user;
		}else{
			return null;
		}

	} catch (err){
		throw err;
	}
}

var User = mongoose.model('user', userSchema);
module.exports = User;
