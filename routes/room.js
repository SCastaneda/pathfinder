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

//renders newuser and forgot password pages
exports.newuser = function(req, res){

	res.render('newuser', {errorMessage: ''});
};
exports.emailpassword = function(req, res){

	res.render('emailpassword', {errorMessage: ''});
};
exports.newuserError = function(req, res){

	res.render('newuser', {errorMessage: 'All fields required'});
};
exports.newuserErrorMatchingPassword = function(req, res){

	res.render('newuser', {errorMessage: 'Password fields do not match'});
};
exports.newuserErrorMatchingEmail = function(req, res){

	res.render('newuser', {errorMessage: 'Email fields do not match'});
};
exports.newuserErrorUserExists = function(req, res){

	res.render('newuser', {errorMessage: 'Username already exists'});
};
exports.emailpasswordError = function(req, res){

	res.render('emailpassword', {errorMessage: 'Username does not exists'});
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
