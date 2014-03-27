/*
    Any data we want to send to the pages, 
    will be put in the {} braces as the 2nd argument 
    to the render function, as a 'key: value' pair (without the quotes)
*/
var db_room = require("../db/rooms");

exports.waiting = function(req, res){

    if(req.session.name) {
        // serves the page in 'view/rooms/waiting.ejs' 
        res.render('rooms/waiting', { name: req.session.name });
    } else {
        res.redirect('/');
    }

};

exports.play = function(req, res) {
    var hash = req.params.hash;

    // first, check if the hash is a valid hash and 
    // that no 2 others are already playing in it.
    db_room.validate_player(req.session.name, hash, function(status, message) {
        if (status === true) {
            // serves the page in 'view/rooms/play.ejs'
            console.log(req.session.name + " allowed in room " + hash + ": " + message);
            res.render('rooms/play', {name: req.session.name, room: hash });
        } else {
            res.redirect('/ready');
        }
    });
};

exports.lobby = function(req, res) {
    if(req.session.name) {
        //
        res.render('rooms/lobby', {name: req.session.name});
    } else {
        res.redirect('/');
    }
}
