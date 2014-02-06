var total_users;

exports.start = function(server) {
    var io = require("socket.io").listen(server);
    total_users = 0;

    // this event gets called when a user connects
    io.sockets.on('connection', connect);

    
    function connect(socket) {
        total_users++
        console.log("A new user connected");

        // all users initially join the waiting room
        socket.join('waiting');
        io.sockets.in('waiting').emit('update_total', { count: total_users });

        if(total_users > 1) {
            // grab 2 users, make a unique hash for them, 
            // and redirect them to their game room

        }


        socket.on('disconnect', disconnect);
    }

    function disconnect() {
        console.log("A user disconnected");
        total_users--;
        io.sockets.in('waiting').emit('update_total', { count: total_users });
    }
}
