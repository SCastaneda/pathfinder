
/**
 * Module dependencies.
 */
var connect  = require('connect');
var http     = require('http');
var path     = require('path');

var express  = require('express');
var partials = require('express-partials');

var routes   = require('./routes');
var routes_user = require('./routes/user');

var room     = require('./routes/room');
var game_sockets = require('./game-sockets');

var db       = require('./db/user');

var nodemailer = require("nodemailer");

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
//routes to funcitons that render the pages with different error messages
app.get('/emailPassword', routes_user.emailpassword);
app.get('/newuser', routes_user.newuser)

app.post('/ready', function(req, res) {

    // get the name and password of the user entered
    var name = req.body.name;
    var password = req.body.password;

    // here we save the name of the user in the session
    req.session.name = name;
   
    // verify user and password, redirected user to /ready if user and password are good, otherwise redirect him to index with an error message
  
	db.get_user(name, function(username, pass, mail){
		if((name == username) && (password == pass)){
			console.log('successful login');
			res.redirect('/ready');
		}
		else{
			console.log('failed login');
			req.session.errorMessage = "Invalid username or password";
			req.session.infoMessage = "";
			res.redirect('/');
		}
	});
});
//post for new user page
app.post('/newuser', function(req, res){

	//get info from the webpage
	var username = req.body.name;
	var password = req.body.password;
	var passwordVerify = req.body.passwordVerify;
	var email = req.body.email;
	var emailVerify = req.body.emailVerify;

	//testing messages
	console.log('new user');
	console.log(username);
	console.log(password);
	console.log(email);

	//if a field is blank redirect him to new user page with an error message
	if(((username == '' || password == '' )
		|| (passwordVerify ==''|| email == '')) 
		|| (emailVerify == ''))
		{

		req.session.errorMessage = "All fields required";
		res.redirect('/newuser');
	}

	//else if passwords or emails dont match redirect them with an error
	else if(password != passwordVerify){

		req.session.errorMessage = "Password feilds do not match";
		res.redirect('/newuser');	
	}
	else if(email != emailVerify){
		req.session.errorMessage = "Email fields do not match";
		res.redirect('/newuser');
	}

	//otherwise check if user already exists, if they do give them a redirect and an error, otherwise put them into the database 
	else{
		db.get_user(username, function(name, pass, mail){
	
			if(!name){
				console.log('user does not exists, adding db entry');
				db.create_user(username, password, email);
				req.session.errorMessage = "";
				req.session.infoMessage = "Your account has been created please login";
				res.redirect('/');
			}
			else{
				console.log('user exists');
				req.session.errorMessage = "Username already exists";
				res.redirect('/newuser');
			}
		});
	}

});

//post for forgot password page
app.post('/emailpassword', function(req, res){

	//get username from webpage
	var username = req.body.name;
	
	//testing messages
	console.log('email');
	console.log(username);

	//get user from database
	db.get_user(username, function(name, password, email){
	
		//if user exists send email and redirect to index
		if(name){
			console.log("user exists, sending email to " + email);
			

			//create reusable transport method (opens pool of SMTP connections)	
			var smtpTransport = nodemailer.createTransport("SMTP", {
				service: "Gmail",
				auth:{
					user: "pathmakers76@gmail.com",
					pass: "pathmakers1234"
				}
			});

			var email_text = "Your password is" + password;

			//setup email data with unicode symbols
			var mailOptions = {
				from: "The Pathmakers <pathmakers76@gmail.com>",
				to: email,
				subject: "Lost password",
				text: email_text
			}
			
			//send mail with defind transport object
			smtpTransport.sendMail(mailOptions, function(error, response){
				if(error){
					console.log(error);
				}
				else{
					console.log("Message send: " + response.message);
				}
				smtpTransport.close();
			});
			req.session.errorMessage = "";
			req.session.infoMessage = "Your password had been sent to your email address";
			res.redirect('/');
		}

		//redirect to forgot password page with error message
		else{
			console.log("user does not exists: cannot send email");
			req.session.errorMessage = "Username does not exists: cannot send email";
			res.redirect('/emailpassword');
		}
	});
});

// the server variable will be necessary for socket.io
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


var io = require("socket.io").listen(server);
game_sockets.start(io, cookieParser, sessionStore);


