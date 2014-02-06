
/**
 * Module dependencies.
 */

var express  = require('express');
var partials = require('express-partials');
var http     = require('http');
var path     = require('path');

var routes   = require('./routes');
var room     = require('./routes/room');

var app = express();
// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(partials());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/ready', room.waiting);
app.get('/play/:hash', room.play);

app.post('/ready', function(req, res) {
    // get the name the user entered
    var name = req.body.name;

    // here we save the name of the user in the session
    req.session.name = name;

    // now let's redirect him to the ready page
    res.redirect('/ready');
})

// the server variable will be necessary for socket.io
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


var waiting_room = require('./waiting');
waiting_room.start(server);


