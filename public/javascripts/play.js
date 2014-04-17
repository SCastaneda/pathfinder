var dim, start, room;
var socket = io.connect("");

socket.on('disconnect', go_home);
socket.on('start_create_maze_phase', function(data) {

    // assigning this variable to access later when we create the new board element
    // this may not be needed
    dim = data.maze_dim;

    generate_board(data.maze_dim);
    $('#announcements').html("Build your maze, and click 'I'm ready', when you're done!");
});

socket.on('waiting_on_other_player', function() {
    $('#ready_btn').html('waiting on the other player!');
    $('#ready_btn').attr('disabled', 'disabled');
    $('#announcements').html('waiting on the other player...');
});


// this comes back after a move was submitted:
socket.on('move_response', function(data) {
    if (data.move) {
        // if the move was validated by the server
        log_turn(to_square, from_square, "You", true, false);
        // Update the html
        $("#o"+from_square).removeClass("current");
        $("#o"+to_square).removeClass("selected");
        $("#o"+to_square).addClass("current");

        // if from_square was the start square
        if (from_square === start) {
            $("#o"+from_square).addClass("start");
        }

        // from because the old to, the new to_square doesn't exist yet
        from_square = to_square;
        to_square = null;
    } else {
        // Move blocked by wall

        log_turn(to_square, from_square, "You", false, false);

        // get the id of the blocking wall and show a wall there
        var id = get_wall_id(from_square, to_square, dim);
        // console.log("wall id:"+id);
        $("#w"+id).addClass("red");

        // reset selected square;
        $("#o"+to_square).removeClass("selected");
        to_square = null;
    }

    // console.log(data);
});

// this comes back when it's the other player's turn
socket.on('other_players_turn', function(data) {
    // console.log("it's the other player's turn");
    $("#log").append("It's the other player's turn.\n");
    $('#log').scrollTop($('#log')[0].scrollHeight);

    $('#submit').attr('disabled', 'disabled');
    current_turn = false;

    // initialize the other player's position if it's the first round
    if (other_current === null) {
        other_current = maze.getStartId();
        $('#s'+other_current).addClass('current');
    }
});

// this comes back when it's your turn
socket.on('your_turn', function(data) {

    if (other_current !== null) {
        // if it's not the first round

        // log the other players turn
        log_turn(data.to, data.from, "The other guy", data.move, false);
        if (data.move) {
            other_current = data.to;

            // update the html
            $('#s'+data.from).removeClass('current');
            $('#s'+data.to).addClass('current');
        }

    } else {
        // if it's the first round
        other_current = maze.getStartId();
        $('#s'+other_current).addClass('current');
    }

    // log
    $("#log").append("It's your turn!\n");
    $('#log').scrollTop($('#log')[0].scrollHeight);

    $('#submit').removeAttr('disabled');
    current_turn = true;
});

// comes back when a player wins, get's checked after every move
socket.on('game_over', function(data) {
    current_turn = false;
    showModal('Game over!', data.winner + " wins! " + data.loser +
        " just needs to realise that winning isn't everything. You'll get 'em next time tiger!");

    if (data.end) {
        $("#o"+data.end).addClass('end');
    }
});

// server side maze-validation response
socket.on('maze_validation', function(data) {
    if (!data.valid_maze) {
        $('#log').append('Your maze was not valid. Please fix it and resubmit');
        $('#log').scrollTop($('#log')[0].scrollHeight);
    }
    // console.log(data);
});

function go_home(data) {
    window.location.replace("/");
}

function log_turn(to, from, player, valid, won) {
    var move_message;

    if (to-from < -1) {
        move_message = "up";
    } else if (to-from >1) {
        move_message = "down";
    } else if (to-from <0) {
        move_message = "left";
    } else {
        move_message = "right"
    }

    if (valid) {
        $("#log").append(player + " moved " + move_message + ".<br>");
    } else {
        $("#log").append(player+" tried to move " + move_message + ", but FAILED HORRIBLY.<br>");
    }

    $('#log').scrollTop($('#log')[0].scrollHeight);
}

function showModal(title, body) {
    $('#theModalTitle').html(title);
    $('#theModalBody').html(body);
    $('#theModal').modal('show');
}

