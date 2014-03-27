var db = require('../db/user');
var crypto = require('crypto');
var nodemailer = require("nodemailer");

exports.login = function(req, res){

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
			req.session.loggedin = true;
			req.session.wins = wins;
			req.session.losses = losses;

			console.log('successful login');
			console.log('testing: wins is: ' + wins);

			res.redirect('/profile');
		}
		else{

			console.log('failed login');
			req.session.errorMessage = "Invalid username or password";
			req.session.infoMessage = "";
			res.redirect('/');
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
};
exports.emailpassword = function(req, res){

	if(req.session.errorMessage){
		res.render('emailpassword', {errorMessage: req.session.errorMessage});
	}
	else{
		res.render('emailpassword', {errorMessage: ''});
	}
	req.session.errorMessage = "";
};
exports.profile = function(req, res){
	
	if(req.session.name){
		if(req.session.infoMessage){
			res.render('profile', {name: req.session.name, wins: req.session.wins, losses: req.session.losses, infoMessage: req.session.infoMessage});
		}
		else{
			res.render('profile', {name: req.session.name, wins: req.session.wins, losses: req.session.losses, infoMessage: ""});
		}
	}
	else{
		res.redirect('/');
	}
	req.session.infoMessage = "";
};
exports.changePassword = function(req, res){
	
	if(req.session.name){
		if(req.session.errorMessage){
			res.render('changePassword', {errorMessage: req.session.errorMessage});
		}
		else{
			res.render('changePassword', {errorMessage: ""});
		}
	}
	else{
		res.redirect('/');
	}
	req.session.errorMessage = "";
};

exports.changeEmail = function(req, res){
	
	if(req.session.name){
		if(req.session.errorMessage){
			res.render('changeEmail', {errorMessage: req.session.errorMessage});
		}
		else{
			res.render('changeEmail', {errorMessage: ""});
		}
	}
	else{
		res.redirect('/');
	}
	req.session.errorMessage = "";
};

exports.createUser = function(req, res){

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

		req.session.errorMessage = "Password fields do not match";
		res.redirect('/newuser');	
	}

	//otherwise check if user already exists, if they do give them a redirect and an error, otherwise put them into the database 
	else{
		db.get_user(username, function(name, pass, mail, salt, wins, losses){
	
			if(!name){
				
				db.check_email(email, function(emailExists){

				if(!emailExists){

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
					console.log('email exists');
					req.session.errorMessage = "Email already exists";
					res.redirect('/newuser');
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

};

exports.getPassword = function(req, res){

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
};

exports.changepw = function(req, res){

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
};

exports.changeMail = function(req, res){

	var email = req.body.email;

	console.log("testing change email submit");

	if(email == ""){
		req.session.errorMessage = "All fields required";
		res.redirect('/changeEmail');
	}
	else{
	db.check_email(email, function(email_exists){
	
	if(!email_exists){

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
	}
	else{
		req.session.errorMessage = "Email already exists";
		console.log('email already exists');
		res.redirect('/changeEmail');
	}
	});
	}
};

exports.logout = function(req, res){

	req.session.name = "";
	req.session.loggedin = "";
	res.redirect('/');

}
