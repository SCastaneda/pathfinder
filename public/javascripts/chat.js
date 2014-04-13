// START: stubs for chat
// to handle incoming messages:
socket.on('broadcast_message', displayMessage);

function displayMessage(data) {
    var new_message = '<strong>' + data.by + '</strong>' + ": " + data.message + "<br>";
    $('#chat').append(new_message);
    $('#chat').scrollTop($('#chat')[0].scrollHeight);
}

// to send messages:
function sendMessage() {
    // store
    var message = $('#new_message').val();
    // don't send empty messages
    if(message === '') { return false; }

    // clear new message box
    $('#new_message').val('');
    socket.emit('send_message', { message: message });
}

// END: stubs for chat