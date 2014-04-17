
/**
 * Module dependencies.
 */
var connect      = require('connect');
var http         = require('http');
var path         = require('path');

var express      = require('express');
var partials     = require('express-partials');

var routes_index = require('./routes/index');
var routes_user  = require('./routes/user');

var room         = require('./routes/room');
var game_sockets = require('./game-sockets');

var db           = require('./db/user');

var nodemailer   = require("nodemailer");
var crypto       = require('crypto');
var app          = express();

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
    app.use(redirectUnmatched);
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Catches all unmatched urls and redirects them to the home page
function redirectUnmatched(req, res) {
  res.redirect("/");
}

app.get('/'               , routes_index.index);
app.get('/howto'          , routes_index.howto);
app.get('/ready'          , room.waiting);
app.get('/play/:hash'     , room.play);
app.get('/emailPassword'  , routes_user.emailpassword);
app.get('/profile'        , routes_user.profile);
app.get('/changePassword' , routes_user.changePassword);
app.get('/changeEmail'    , routes_user.changeEmail);
app.get('/lobby'          , room.lobby);
app.get('/logout'         , routes_user.logout);


app.post('/login'          , routes_user.login);

//post for new user page
app.post('/newuser'        , routes_user.createUser);

//post for forgot password page
app.post('/emailpassword'  , routes_user.getPassword);


app.post('/changePassword' , routes_user.changepw);
app.post('/changeEmail'    , routes_user.changeMail);

// the server variable will be necessary for socket.io
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


var io = require("socket.io").listen(server);
game_sockets.start(io, cookieParser, sessionStore);
