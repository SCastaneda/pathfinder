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

            // these are just here for debugging...
            console.log("\nEDGE_MAP:\n");
            console.log(data["edge_map"]);

            console.log("TRUE CONNECTIONS:\n");
            console.log(data["true_connections"]);

            console.log("START: " + data["start"]);
            console.log("END: " + data["end"]);

            // validate maze, save maze in db
            validate_maze(data["true_connections"], data["start"], data["end"], function(valid_maze) {

                if(valid_maze) {
                    console.log(data["name"] + " submitted a valid maze!");
                    socket.emit("maze_validation", {valid_maze: true});
                    socket.emit('waiting_on_other_player', {});

                    var maze = { 
                        maze: data["true_connections"], 
                        start: data["start"], 
                        end: data["end"] 
                    };

                    db_room.player_ready(data['name'], data['room'], maze, function(both_ready, player1, player2) {

                        // if we have both players ready, we start the 'play' phase
                        if(both_ready) {
                            // 2 is the game phase
                            db_room.switch_game_phase(data["room"], 2);

                            get_user_by_name(player1, function(player) {
                                player.socket.emit('start_play_phase', {});
                            });

                            get_user_by_name(player2, function(player) {
                                player.socket.emit('start_play_phase', {});
                            });

                        }
                    });
                } else {
                    console.log(data["name"] + " submitted an invalid maze!");
                    socket.emit("maze_validation", {valid_maze: false});
                }
            });

            
        });

    }

    // checks the waiting room to see if 2 or more user are there, and dispatches them to a game.
    // this gets called everytime a new user joins the waiting room.
    function dispatch() {
        if(all_users_waiting.length > 1) {
            var player1 = all_users_waiting[0];
            var player2 = all_users_waiting[1];

            db_room.create_room(player1.name, player2.name, function(hash) {
                player1.socket.emit('dispatch_to_game', { hash: hash });
                player2.socket.emit('dispatch_to_game', { hash: hash });

                console.log("DISPATCHED " + player1.name + " AND " + player2.name + " to room " + hash);
            });
            
        }
    }

    function join_room(room, session, socket, user) {
        console.log(session.name);
        if(!session.name) {
            return socket.emit('disconnect', {});
        }


        if(room == 'waiting') {
            // joins user to the waiting room, and dispatches 2 users to a game
            join_waiting(socket, user);
        } else {
            // validate that room exists
            // validate that user is allowed to join room
            socket.join(room);
            user.room = room;
            all_users_playing.push(user);
            console.log("ALL USERS PLAYING:\n");
            console.log(all_users_playing);


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

                // all users initially join the waiting room
                socket.join('waiting');
                io.sockets.in('waiting').emit('update_total', { count: all_users_waiting.length });
                user.room = 'waiting';
                console.log("ALL USERS WAITING:\n");
                console.log(all_users_waiting);

                dispatch();

            } else {
                console.log("already have socket, not added");
                console.log(all_users_waiting);
            }
        });
    }
}

// server-side maze validation code
// maze will be an array of connected squares e.g. [{a: 0, b: 1 }, {...}, ...]
// uses breadth first search
function validate_maze(maze, start, end, cb) {

    var queue   = [start];
    var visited = [];
    var next;

    while(true) {

        // if the queue is empty, and we still haven't found one, we are done.
        if(queue.length == 0) {
            return cb(false);
        }

        // get the first elem of array
        next = queue.shift();
        if( next === end ) {
            return cb(true);
        }

        visited.push(next);

        add_possible_moves(next);
    }



    // searches the maze array for num, and adds it's pair to the queue
    // only if it is not in the visited array
    function add_possible_moves(num) {
        for(var i = 0; i < maze.length; i++) {
            if(maze[i].a == num && visited.indexOf(maze[i].b) == -1) {
                queue.push(maze[i].b);
            } else if (maze[i].b == num && visited.indexOf(maze[i].a) == -1) {
                queue.push(maze[i].a);
            }
        }
    }

}





