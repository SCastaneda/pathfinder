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
                            player1_ready: {
                                type: Boolean,
                                default: 0
                            },
                            player2_ready: {
                                type: Boolean,
                                default: 0
                            },
                            // player 1 plays on player2's board and vice-versa
                            player1_board: [Schema.Types.Mixed],
                            player2_board: [Schema.Types.Mixed],
                            winner: {
                                type: String,
                                default: ''
                            },
                            // 0 -> create maze phase
                            // 1 -> game phase
                            current_phase: {
                                type: Number,
                                default: 0
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

exports.switch_game_phase = function(hash, phase) {
    roomModel.findOne({hash: hash}, function(err, room){
        if(err) {
            throw err;
        }
        if(room !== null) {
            roomModel.update({hash: hash}, {current_phase: phase}, function(err, numAffected, raw) {
                if(err) {
                    throw err;
                }

                console.log("room " + hash + " switched game phase to phase number: " + phase);
            });
        }

    });
}


// maze will be the maze submitted by the player object looks like so:
// {maze: connected nodes, start: number, end: number}
exports.player_ready = function(player, hash, maze, cb) {
    roomModel.findOne({hash: hash}, function(err, room) {
        if(err) {
            throw err;
            cb(false);
        }
        if(room == null) {
            return cb(false);
        }

        if(player === room.player1) {
            
            roomModel.update({hash: hash}, {player1_ready: true, player1_board: maze}, function(err, numAffected, raw) {
                if(err) {
                    cb(false);
                    console.log("Error: " + err);
                }

                if(room.player2_ready) {
                    return cb(true, room.player1, room.player2);
                } else {
                    return cb(false);
                }
            });

        } else if(player === room.player2) {
            roomModel.update({hash: hash}, {player2_ready: true, player2_board: maze}, function(err, numAffected, raw) {
                if(err) {
                    cb(false);
                    console.log("Error: " + err);
                }

                if(room.player1_ready) {
                    return cb(true, room.player1, room.player2);
                } else {
                    return cb(false);
                }
            });
        } else {
            return cb(false);
        }
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

