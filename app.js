
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
var crypto   = require('crypto');
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
app.get('/emailPassword', routes_user.emailpassword);
app.get('/newuser', routes_user.newuser);
app.get('/profile', routes_user.profile);
app.get('/changePassword', routes_user.changePassword);
app.get('/changeEmail', routes_user.changeEmail);

app.post('/login', function(req, res) {

    // get the name and password of the user entered
    var name = req.body.name;
    var password = req.body.password;
   
    // verify user and password, redirected user to /ready if user and password are good, otherwise redirect him to index with an error message
  
	db.get_user(name, function(username, pass, salt, mail, wins, losses){

		if(username == name){

		db.hash_password(password, salt, function(hash){

		console.log("salt: " + salt);
		console.log("hash: " + hash);

		if(hash == pass){

			req.session.name = name;
			req.session.wins = wins;
			req.session.losses = losses;

			console.log('successful login');
			console.log('testing: wins is: ' + wins);

			res.redirect('/profile');
		}
		});
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

	//testing messages
	console.log('new user');
	console.log(username);
	console.log(password);
	console.log(email);

	//if a field is blank redirect him to new user page with an error message
	if((username == '' || password == '' )
		|| (passwordVerify ==''|| email == '')) 
		{
		
		req.session.errorMessage = "All fields required";
		res.redirect('/newuser');
	}

	//else if passwords or emails dont match redirect them with an error
	else if(password != passwordVerify){

		req.session.errorMessage = "Password feilds do not match";
		res.redirect('/newuser');	
	}

	//otherwise check if user already exists, if they do give them a redirect and an error, otherwise put them into the database 
	else{
		db.get_user(username, function(name, pass, mail, salt, wins, losses){
	
			if(!name){
				console.log('user does not exists, adding db entry');
				db.create_user(username, password, email, function(created){
				if(created){
					req.session.errorMessage = "";
					req.session.infoMessage = "Your account has been created please login";
					res.redirect('/');
				}
				else{
					console.log('error account not created');
					res.redirect('/');
				}
				});
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
	db.get_user(username, function(name, password, salt, email, wins, losses){
	
		//if user exists send email and redirect to index
		if(name){

			//generate new random password

			var pass = crypto.randomBytes(4).toString('base64');
			db.resetPassword(username, pass, function(pass){
			
			if(pass){
			var email_text = "Your new password is " + pass;
			console.log("user exists, sending email to " + email);
			

			//create reusable transport method (opens pool of SMTP connections)	
			var smtpTransport = nodemailer.createTransport("SMTP", {
				service: "Gmail",
				auth:{
					user: "pathmakers76@gmail.com",
					pass: "pathmakers1234"
				}
			});


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
			else{
			console.log("error: pw wasn't changed when trying to reset pw");
			res.redirect('/');

			}
			});
		}
		//redirect to forgot password page with error message
		else{
			console.log("user does not exists: cannot send email");
			req.session.errorMessage = "Username does not exists: cannot send email";
			res.redirect('/emailpassword');
		}
	});
});
app.post('/findgame', function(req, res){

	console.log("testing profile post");
	res.redirect('/ready');

});
app.post('/changePassword', function(req, res){

	var oldPassword = req.body.oldPassword;
	var newPassword = req.body.newPassword;
	var varifyPassword = req.body.verifyNewPassword;
	console.log("testing change pw submit");

	if((oldPassword == "" || newPassword == "")|| varifyPassword == ""){
		req.session.errorMessage = "All fields required";
		res.redirect('/changePassword');
	}	

	else{
	db.get_user(req.session.name, function(name, pass, salt, mail, wins, losses){
		
		db.hash_password(oldPassword, salt, function(hash){
		if(pass != hash){
		
			//display error message
			req.session.errorMessage = "Your old password is incorrect";
			res.redirect('/changePassword');
		}
		else{

			if(newPassword != varifyPassword){

				//display error message
				req.session.errorMessage = "Password fields do not match";
				res.redirect('/changePassword');

			}
			else{

				console.log("attempting to change password");		
				
				db.resetPassword(req.session.name, newPassword, function(updated){
					if(updated){
						
						req.session.infoMessage = "Your password has been changed";
						res.redirect('/profile');
					}
					else{
						console.log("error, info was not entered into database");
						res.redirect('/profile');
					}
				});
			}
		}
		});
	});
	}
});

app.post('/changeEmail', function(req, res){

	var email = req.body.email;

	console.log("testing change email submit");

	db.changeEmail(email, req.session.name, function(updated){
		if(updated){
					
			req.session.infoMessage = "Your email has been changed";
			res.redirect('/profile');
		}
		else{
			console.log("error, info was not entered into database");
			res.redirect('/profile');
		}
	});
});


// the server variable will be necessary for socket.io
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


var io = require("socket.io").listen(server);
game_sockets.start(io, cookieParser, sessionStore);


