
/**
 * Module dependencies.
 */
var connect  = require('connect');
var http     = require('http');
var path     = require('path');

var express  = require('express');
var partials = require('express-partials');

var routes   = require('./routes');

var room     = require('./routes/room');
var game_sockets = require('./game-sockets');

var db       = require('./db/user');


var app = express();

var cookieParser = express.cookieParser('JAHAUSnajksdjKAHSD819238127389');
var sessionStore = new connect.middleware.session.MemoryStore();

app.configure(function() {
    // all environments
    app.set('port', process.env.PORT || 3000);
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(cookieParser);
    app.use(express.session({ store: sessionStore }));
    app.use(partials());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/ready', room.waiting);
app.get('/play/:hash', room.play);
//mark added these ************
app.get('/indexError', routes.indexError);
app.get('/newuser', room.newuser);
app.get('/newuserError', room.newuserError);
app.get('/newuserError2', room.newuserError2);
app.get('/emailpassword', room.emailpassword);
app.get('/emailpasswordError', room.emailpasswordError);

app.post('/ready', function(req, res) {

    // get the name the user entered
    var name = req.body.name;
    var password = req.body.password;

    // here we save the name of the user in the session
    req.session.name = name;
   
    // now let's redirect him to the ready page
  
	db.get_user(name, function(username, pass, mail){
		if((name == username) && (password == pass)){
			console.log('successful login');
			res.redirect('/ready');
		}
		else{
			console.log('failed login');
			res.redirect('/indexError');
		}
	});
});
app.post('/newuser', function(req, res){

	var username = req.body.name;
	var password = req.body.password;
	var email = req.body.email;

	console.log('new user');
	console.log(username);
	console.log(password);
	console.log(email);

	if((username == '' || password == '' )|| email == ''){
		res.redirect('/newuserError');
	}
	else{
		db.get_user(username, function(name, pass, mail){
	
			if(!name){
				console.log('user does not exists, adding db entry');
				db.create_user(username, password, email);
				res.redirect('/');
			}
			else{
				console.log('user exists');
				res.redirect('/newuserError2');
			}
		});
	}

});
app.post('/emailpassword', function(req, res){

	var username = req.body.name;

	console.log('email');
	console.log(username);

	db.get_user(username, function(name, password, email){
	
		if(name){
			console.log("user exists, sending email to " + email);
			//send email
		}
		else{
			console.log("user does not exists: cannot send email");
			res.redirect('/emailpasswordError');
		}
	});
});

// the server variable will be necessary for socket.io
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


var io = require("socket.io").listen(server);
game_sockets.start(io, cookieParser, sessionStore);


