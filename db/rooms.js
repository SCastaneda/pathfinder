var mongoose         = require('mongoose');
var db               = mongoose.connect('mongodb://localhost/pathfinder');
var Schema           = mongoose.Schema;

var roomSchema  = new Schema({
                            player1:    String,
                            player2:    String,
                            hash:       String,
                            start_date: {   
                                type: String, 
                                default: Date.now 
                            },
                            num_ready: {
                                type: Number,
                                default: 0
                            },
                            winner: {
                                type: String,
                                default: ''
                            },
                            current_phase: {
                                type: String, 
                                default: ''
                            }
                        });

var roomModel = mongoose.model('rooms', roomSchema);

exports.validate_player = function(player, hash, cb) {
    roomModel.findOne({hash: hash}, function(err, room) {
        if(err) { throw err; }
        if(room == null) {
            console.log(player+" room is null");
            return cb(false, "room does not exist");
        }

        if(room.winner !== '') {
            console.log(player + " is winning");
            return cb(false, "game already completed");
        }

        if(room.player1 === player || room.player2 === player) {
            console.log(player + " allowed: " + room.player1 + " " + room.player2);
            return cb(true, "player allowed");
        }
        return cb(false, "player not allowed");
    });

}


exports.player_ready = function(player, hash, cb) {
    roomModel.findOne({hash: hash}, function(err, room) {
        if(err) {
            throw err;
            cb(false);
        }
        if(room == null) {
            return cb(false);
        }

        var new_num_ready = room.num_ready+1;


        roomModel.update({hash: hash}, {num_ready: new_num_ready}, function(err, numberAffected, raw) {
            if(err) {
                cb(false); 
                throw err;
            }
            console.log("Room "+ hash+ " number of players ready: " + new_num_ready);
            return cb(new_num_ready, room.player1, room.player2);
        });

    });
}

exports.create_room = function(player1, player2, cb) {
    var room = new roomModel();
    room.player1 = player1;
    room.player2 = player2;
    create_hash(player1, player2, function(hash) {
        room.hash = hash;
        room.save(function(err, room) {
            if(err) throw err;
            console.log("created room");
            cb(room.hash);
        });
    });

}

function create_hash(player1, player2, cb) {
    var md5 = require('crypto').createHash('md5');
    md5.update(player1);
    md5.update(player2);
    md5.update(Date.now().toString());
    cb(md5.digest('hex'));
}


