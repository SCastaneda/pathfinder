
/*
 * GET home page, or home page with error.
 */

exports.index = function(req, res){
	
  res.render('index', { title: 'Pathfinder', errorMessage: '', infoMessage: ''});
}

exports.indexError = function(req, res){
  res.render('index', { title: 'Pathfinder', errorMessage:'Invalid username or password', infoMessage: ''});
}

exports.indexEmailSent = function(req, res){
  res.render('index', { title: 'Pathfinder', errorMessage: '', infoMessage:'Your password has been sent to your email'});
}

exports.indexUserCreated = function(req, res){
  res.render('index', { title: 'Pathfinder', errorMessage:'', infoMessage: 'You account has been created, please login'});
}


