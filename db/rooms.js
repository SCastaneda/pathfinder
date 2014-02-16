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
                            winner:     String
                        });

var roomModel = mongoose.model('rooms', roomSchema);

exports.player_ready = function(player, hash, cb) {
    roomModel.findOne({"hash": hash}, function(err, room) {
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
        });

        return cb(new_num_ready, room.player1, room.player2);
    });
}