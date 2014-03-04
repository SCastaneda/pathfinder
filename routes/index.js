
/*
 * GET home page.
 */

exports.index = function(req, res){
	
  res.render('index', { title: 'Pathfinder', errorMessage:''});
};

exports.indexError = function(req, res){
  res.render('index', { title: 'Pathfinder', errorMessage:'Invalid username or password'});
};
