var mongoose         = require('mongoose');
var Schema           = mongoose.Schema;
var crypto           = require('crypto');

var userSchema  = new Schema({
                            username:    String,
                            password:    String,
                            salt:        String,
                            email:       String,
                            wins: {
                                type: Number,
                                default: 0
                            },
                            losses: {
                                type: Number,
                                default: 0
                            }
                });

var userModel = mongoose.model('user', userSchema);

exports.create_user = function(username, password, email, cb) {
    var user = new userModel();
    user.username = username;
    user.email = email;
    user.salt = crypto.randomBytes(128).toString('base64');
    console.log(user.salt);

    hash_password(password, user.salt, function(hash){
    
    user.password = hash;
    console.log("hash: " + hash);

    user.save(function(err) {
          if(err) throw err; 
            console.log("created user");
        return cb(true);
        });

    });
};

exports.inc_wins = function(username, cb) {
    userModel.findOne({username: username}, function(err, user) {
        userModel.update({username: username}, {wins: user.wins+1}, function(err, numberAffected, raw){
            if(err){
                return cb(false);
                throw err;
            } else {
                return cb(true);
            }
        });
    });
};

exports.inc_losses = function(username, cb) {
    userModel.findOne({username: username}, function(err, user) {
        userModel.update({username: username}, {losses: user.losses+1}, function(err, numberAffected, raw){
            if(err){
                return cb(false);
                throw err;
            } else {
                return cb(true);
            }
        });
    });
};
exports.get_user = function(username, cb) {
    userModel.findOne({username: username}, function(err, user){
        if(err) {throw err;}
        if(user == null){
            console.log("user does not exist");
            return cb(null);
        } else {
            console.log("user exists");
            return cb(user.username, user.password, user.salt, user.email, user.wins, user.losses);
        }    
    });
};

exports.check_email = function(email, cb){
    userModel.findOne({email: email}, function(err, user){
    if(err) {throw err;}
    if(user == null){
        console.log("email does not exist");
        return cb(null);
    }
    else{
        console.log("email exists");
        return cb(user.email);
    }
    });
};

exports.resetPassword = function(username, password, cb){

    console.log("testing: db changePassword reached.");
    console.log(username);
    console.log(password);
    var salt = crypto.randomBytes(128).toString('base64');
    console.log(salt);
    
    hash_password(password, salt, function(hash){

        console.log("hash: " + hash);

        userModel.update({username: username}, {password: hash, salt: salt}, function(err, numberAffected, raw){
            if(err){
                cb(false);
                throw err;
            }
            console.log("I think the password and salt is updated");
            return cb(password);
        });
    });
};


exports.changeEmail = function(email, name, cb){

    console.log("testing: db changeEmail reached.");
    console.log(name);
    console.log(email);
    userModel.update({username: name}, {email: email}, function(err, numberAffected, raw){
        if(err){
            cb(false);
            throw err;
        }
        console.log("I think the password is updated");
        return cb(true);
    });
};

function hash_password(password, salt, cb) {
    var md5 = crypto.createHash('md5');
    md5.update(password);
    md5.update(salt);
    return cb(md5.digest('hex'));
}

exports.hash_password = function(password, salt, cb) {
    var md5 = crypto.createHash('md5');
    md5.update(password);
    md5.update(salt);
    return cb(md5.digest('hex'));
};

