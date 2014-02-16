function User(socket, name) {
    this.socket = socket;
    this.name   = name;
    this.room   = '';
}
var all_users_waiting = [];
var all_users_playing = [];
var maze_size = 5;

db_room = require('./db/rooms');

exports.start = function(io, cookieParser, sessionStore) {

    var SessionSockets = require('session.socket.io');
    var sessionSockets = new SessionSockets(io, sessionStore, cookieParser);

    // this event gets called when a user connects
    sessionSockets.on('connection', connect);

    
    function connect(err, socket, session) {
        // if the user didn't log in, send him to the login page
        if(session.name) {
            var user = new User(socket, session.name);
        } else {
            socket.emit('disconnect', {});
        }

        socket.on('disconnect', function() {
            disconnect(socket);
        });
        socket.on('join_room', function(data) {
            join_room(data['room'], session, socket, user);
        });

        // event for user clicking the ready button
        socket.on('player_ready', function(data) {
            db_room.player_ready(data['name'], data['room'], function(num_ready, player1, player2) {
                socket.emit('waiting_on_other_player', {});

                // if we have both players ready, we start the 'play' phase
                if(num_ready == 2) {
                    get_user_by_name(player1, function(player) {
                        player.socket.emit('start_play_phase', {});
                    });

                    get_user_by_name(player2, function(player) {
                        player.socket.emit('start_play_phase', {});
                    });
                }


            });
        });

    }

    function join_room(room, session, socket, user) {
        if(room == 'waiting') {
            // joins user to the waiting room, and dispatches 2 users to a game
            join_waiting(socket, user);
        } else {
            // validate that room exists
            // validate that user is allowed to join room

            // once validated, we allow the users to join the room
            socket.join(room);
            user.room = room;
            all_users_playing.push(user);

            // once we have both players in the room, we start the create maze phase
            socket.emit('start_create_maze_phase', { maze_dim: maze_size });

        }
    }

    function disconnect(socket) {
        get_user(socket, function(user) {
            if(user) {
                console.log(user.name + " disconnected");
            }
        });
        
        delete_user(socket, function(deleted) {
            if(deleted) {
                io.sockets.in('waiting').emit('update_total', { count: all_users_waiting.length });
            } else {
                console.log("can't update total: " + all_users_waiting);
            }
        });
    }


    function get_user_by_name(name, cb) {
        for(var i = 0; i < all_users_waiting.length; i++) {
            if(name == all_users_waiting[i].name) {
                return cb(all_users_waiting[i]);
            }
        }

        for(var i = 0; i < all_users_playing.length; i++) {
            if(name == all_users_playing[i].name) {
                return cb(all_users_playing[i]);
            }
        }
        return cb(false);
    }

    // gets the user from the all_users array of 'Users'
    function get_user(socket, cb) {

        sessionSockets.getSession(socket, function(err, session) {
            for(var i = 0; i < all_users_waiting.length; i++) {
                if(all_users_waiting[i].name == session.name) {
                    return cb(all_users_waiting[i]);
                }
                
            }

            for(var i = 0; i < all_users_playing.length; i++) {
                if(all_users_playing[i].name == session.name) {
                    return cb(all_users_playing[i]);
                }
                
            }
            console.log(session.name + ": " + all_users_waiting);
            console.log(session.name + ": " + all_users_playing);
            return cb(false);
        });
    }

    function delete_user(socket, cb) {

        sessionSockets.getSession(socket, function(err, session) {
            // find and remove user from all users list
            for(var i = 0; i < all_users_waiting.length; i++) {
                if(all_users_waiting[i].name == session.name) {
                    all_users_waiting.splice(i, 1);
                    return cb(true);
                }
            
            }

            for(var i = 0; i < all_users_playing.length; i++) {
                if(all_users_playing[i].name == session.name) {
                    all_users_playing.splice(i, 1);
                    return cb(true);
                }
            
            }
            console.log(session.name + ": " + all_users_waiting);
            console.log(session.name + ": " + all_users_playing);
            return cb(false);
        });
    }

    // add user to waiting room
    function join_waiting(socket, user) {
        // need to check if the user is already here, before we push
        get_user(socket, function(user_already_here) {
            if(!user_already_here) {
                console.log(user.name + " connected");
                all_users_waiting.push(user);
                console.log(all_users_waiting);

                // all users initially join the waiting room
                socket.join('waiting');
                io.sockets.in('waiting').emit('update_total', { count: all_users_waiting.length });
                user.room = 'waiting';
                console.log(all_users_waiting);

                if(all_users_waiting.length > 1) {
                    // grab 2 users, make a unique hash for them, 
                    // and redirect them to their game room

                }

            } else {
                console.log("already have socket, not added");
                console.log(all_users_waiting);
            }
        });
    }
}


