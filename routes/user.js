
//renders newuser and forgot password pages
exports.newuser = function(req, res){

	res.render('newuser', {errorMessage: req.session.errorMessage});
	req.session.errorMessage = "";
};
exports.emailpassword = function(req, res){

	res.render('emailpassword', {errorMessage: req.session.errorMessage});
	req.session.errorMessage = "";
};




