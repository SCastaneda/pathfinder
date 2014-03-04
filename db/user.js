var mongoose         = require('mongoose');
var Schema           = mongoose.Schema;

var userSchema  = new Schema({
                            username:    String,
                            password:    String,
                            email:       String,
                        });

var userModel = mongoose.model('user', userSchema);

exports.create_user = function(username, password, email, cb) {
    var user = new userModel();
    user.username = username;
    user.password = password;
    user.email = email;

    user.save(function(err) {
          if(!err) 
            console.log("created user");
        })
};


exports.get_user = function(username, cb) {
    userModel.findOne({username: username}, function(err, user){
    	if(err) {throw err;}
	if(user == null){
		console.log("user does not exist");
		return cb(null);
	}
	else{
		console.log("user exists");
		return cb(user.username, user.password, user.email);
	}	
    });
}

 
