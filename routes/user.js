
//renders newuser and forgot password pages
exports.newuser = function(req, res){
	
	if(req.session.errorMessage){
		res.render('newuser', {errorMessage: req.session.errorMessage});
	}
	else{
		res.render('newuser', {errorMessage: ''});
	}
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

