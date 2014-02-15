function User(socket, name) {
    this.socket = socket;
    this.name   = name;
}
var all_users = [];

exports.start = function(server, cookieParser, sessionStore) {
    var io = require("socket.io").listen(server);

    var SessionSockets = require('session.socket.io');
    var sessionSockets = new SessionSockets(io, sessionStore, cookieParser);

    // this event gets called when a user connects
    sessionSockets.on('connection', connect);

    
    function connect(err, socket, session) {

        // only let users in that have a session
        if(session.name) {
            var user = new User(socket, session.name);
            add_user(socket, user);
        } else {
            // redirects the user back to the home page /
            socket.emit('disconnect', {});
        }

        socket.on('disconnect', function() {
            disconnect(socket);
        });
    }

    function disconnect(socket) {
        get_user(socket, function(user) {
            if(user) {
                console.log(user.name + " disconnected");
            }
        });
        
        delete_user(socket, function(deleted) {
            if(deleted) {
                io.sockets.in('waiting').emit('update_total', { count: all_users.length });
            } else {
                console.log("can't update total: " + all_users);
            }
        });
    }

    // gets the user from the all_users array of 'Users'
    function get_user(socket, cb) {

        sessionSockets.getSession(socket, function(err, session) {
            for(var i = 0; i < all_users.length; i++) {
                if(all_users[i].name == session.name) {
                    cb(all_users[i]);
                }
                
            }
            console.log(session.name + ": " + all_users);
            cb(false);
        });
    }

    function delete_user(socket, cb) {

        sessionSockets.getSession(socket, function(err, session) {
            // find and remove user from all users list
            for(var i = 0; i < all_users.length; i++) {
                if(all_users[i].name == session.name) {
                    all_users.splice(i, 1);
                    cb(true);
                }
            
            }
            console.log(session.name + ": " + all_users);
            cb(false);
        });
    }

    function add_user(socket, user) {
        // need to check if the user is already here, before we push
        get_user(socket, function(user_already_here) {
            if(!user_already_here) {
                console.log(user.name + " connected");
                all_users.push(user);
                console.log(all_users);

                // all users initially join the waiting room
                socket.join('waiting');
                io.sockets.in('waiting').emit('update_total', { count: all_users.length });

                if(all_users.length > 1) {
                    // grab 2 users, make a unique hash for them, 
                    // and redirect them to their game room

                }
            } else {
                console.log("already have socket, not added");
                console.log(all_users);
            }
        });
    }
}


