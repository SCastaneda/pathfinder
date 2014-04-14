
/*
 * GET home page, or home page with error.
 */

exports.index = function(req, res){

	if(req.session.loggedin){
		res.redirect('/profile');
	} else {
    	if(req.session.errorMessage || req.session.infoMessage){

      		res.render('index', { session: req.session, title: 'Pathfinder' , errorMessage: req.session.errorMessage, infoMessage: req.session.infoMessage});
      	} else {	
      		res.render('index', { session: req.session, title: 'Pathfinder' , errorMessage: '', infoMessage: ''});
    	}
      	req.session.name = "";
    	req.session.errorMessage = "";
      	req.session.infoMessage = "";
	}
}



