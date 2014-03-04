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
                            player1_board: Schema.Types.Mixed,
                            board1_move_hash_table: [Schema.Types.Mixed],

                            player2_board: Schema.Types.Mixed,
                            board2_move_hash_table: [Schema.Types.Mixed],

                            winner: { type:String, default: ''},
                            loser:  { type:String, default: ''},

                            // 0 -> create maze phase
                            // 1 -> play phase
                            // 2 -> game has ended
                            current_phase: {
                                type: Number,
                                default: 0
                            },
                            whos_turn: String
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

// board will be the board submitted by the player object looks like so:
// {maze: connected nodes, current_position: number, end: number}
exports.player_ready = function(player, hash, board, cb) {
    roomModel.findOne({hash: hash}, function(err, room) {
        if(err) {
            throw err;
            return cb(false);
        }
        if(room == null) {
            return cb(false);
        }
        // player1 submitted their maze
        if(player === room.player1) {

            roomModel.update({hash: hash}, 
                {   
                    player1_ready: true, 
                    player1_board: board, 
                    board1_move_hash_table: create_move_hash_table(board.maze) 
                }, 
                function(err, numAffected, raw) {
                    if(err) {
                        return cb(false);
                        console.error("Error: " + err);
                    }

                    // if both players are ready, we return true and both players
                    if(room.player2_ready) {
                        return cb(true, room.player1, room.player2);
                    } else {
                        return cb(false);
                    }
            });

        // player2 submitted their maze
        } else if(player === room.player2) {
            roomModel.update({hash: hash}, 
                {   
                    player2_ready: true, 
                    player2_board: board, 
                    board2_move_hash_table: create_move_hash_table(board.maze)
                }, 
                function(err, numAffected, raw) {
                    if(err) {
                        return cb(false);
                        console.log("Error: " + err);
                    }

                    // if both players are ready, we return true and both players
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

    // decide who should go first
    var choose = 1+(Math.floor(Math.random()*100) %2);
    if(choose == 1) {
        room.whos_turn = player1;
    } else {
        room.whos_turn = player2;
    }

    console.log("Decided who goes first: "+ room.whos_turn);

    create_hash(player1, player2, function(hash) {
        room.hash = hash;
        room.save(function(err, room) {
            if(err) throw err;
            console.log("created room");
            cb(room.hash);
        });
    });

}

// need to know which room, player, and the from position, 
// as well as where the player wants to go
exports.handle_move_request = function(hash, player, from, to, cb) {
    // get the game room:
    roomModel.findOne({ hash:hash }, function(err, room){
        if(err) { console.error(err); return cb(false, "Error:" + err); }

        // make sure that the game in in play phase:
        if(room.current_phase != 1) {
            return cb(false, "Game is currently not in the play-phase!");
        }

        // make sure that it is this player's turn:
        if(room.whos_turn !== player) {
            return cb(false, "Please wait for your turn!");
        }

        var board;
        var move_hash_table;

        // figure out which player this is and the board he's playing on
        if(player === room.player1) {
            board           = room.player2_board;
            move_hash_table = room.board2_move_hash_table;
        } else if(player === room.player2) {
            board           = room.player1_board;
            move_hash_table = room.board1_move_hash_table;
        } else {
            var message = "Error: Player: " + player + " is not part of this game: " + room.hash + "\n"
                            "Players: " + room.player1 + ", " + room.player2;
            console.error(message);
            return cb(false, message);
        }


        // make sure that the from matches the stored current_position
        if(board.current_position !== from) {
            var message = "Move request from " + player + " not valid: \n" +
                          "Stored current position("+ board.current_position +") does not match given one("+ from +")";
            console.error(message);
            return cb(false, message);
        } else {
            var message = "Move request from " + player + " valid: \n" +
                          "Stored current position("+ board.current_position +") matches given one("+ from +")";
            console.log(message);
        }

        // now we can actually check if the move was to an available field,
        // or if it was toward a wall
        var can_move = check_move(move_hash_table, from, to);

        // no wall, update current_pos
        if(can_move) {
            board.current_position = to;

            var board_to_update;
            var next_player;
            if(player === room.player1) {
                
                next_player = room.player2;
                roomModel.update({hash: hash}, {player2_board: board, whos_turn: next_player}, function(err, numAffected, raw) {
                    if(err) { console.error(err); return cb(false, "Error:" + err); }
                    return cb(true);
                });

            } else if(player === room.player2) {

                next_player = room.player1;
                roomModel.update({hash: hash}, {player1_board: board, whos_turn: next_player}, function(err, numAffected, raw) {
                    if(err) { console.error(err); return cb(false, "Error:" + err); }
                    return cb(true);
                });
            }

        // there was a wall
        } else {
            var next_player;
            if(player === room.player1) {
                board_to_update = "player2_board";
                next_player = room.player2;
            } else if(player === room.player2) {
                board_to_update = "player1_board";
                next_player = room.player1;
            }

            // update next player!
            roomModel.update({hash: hash}, {whos_turn: next_player}, function(err, numAffected, raw) {
                if(err) { console.error(err); return cb(false, "Error:" + err); }
                return cb(false, "wall");
            });

        }

    });

}

exports.check_for_win = function(hash, cb) {
    roomModel.findOne({hash: hash}, function(err, room) {
        //check if the current_position == end for both boards

        // player 2 plays on player1's board
        if(room.player1_board.current_position === room.player1_board.end) {
            roomModel.update(
                {hash: hash}, 
                {winner: room.player2, loser: room.player1, current_phase: 2}, 
                function(err, numAffected, raw) {
                    if(err) { console.error(err); }
                    return cb(true, room.player2, room.player1);
                }
            );

        // player 1 plays on player2's board
        } else if(room.player2_board.current_position === room.player2_board.end) {
            roomModel.update(
                {hash: hash}, 
                {winner: room.player1, loser: room.player2, current_phase: 2}, 
                function(err, numAffected, raw) {
                    if(err) { console.error(err); }
                    return cb(true, room.player1, room.player2);
                }
            );
        } else {
            return cb(false);
        }

    });
}

exports.get_next_player = function(hash, cb) {
    roomModel.findOne({hash: hash}, function(err, room) {
        if(err) throw err;
        return cb(room.whos_turn);
    });
}

// each position stores which squares it can access
// this will allow for almost O(1) lookup times
function create_move_hash_table(maze) {
    var hash_table = [];
    for(var i = 0; i < maze.length; i++) {
        
        // if that location is empty, put in an empty array
        if(typeof hash_table[maze[i].a] === "undefined") {
            hash_table[maze[i].a] = [];
        }

        if(typeof hash_table[maze[i].b] === "undefined") {
            hash_table[maze[i].b] = [];
        }

        hash_table[maze[i].a].push(maze[i].b);
        hash_table[maze[i].b].push(maze[i].a);
    }
    return hash_table;
}

// almost O(1) lookup :)
function check_move(move_hash_table, from, to) {
    // if the requested move is not in the hashtable, indexOf returns -1, and we return false
    // else, indexOf returns a position and we return true
    return (move_hash_table[from].indexOf(to) === -1 ? false : true);
}

function create_hash(player1, player2, cb) {
    var md5 = require('crypto').createHash('md5');
    md5.update(player1);
    md5.update(player2);
    md5.update(Date.now().toString());
    cb(md5.digest('hex'));
}

