var mongoose         = require('mongoose');
var db               = mongoose.connect('mongodb://localhost/pathfinder');
var Schema           = mongoose.Schema;

var roomSchema  = new Schema({
                            player1:    String,
                            player2:    String,
                            hash:       String,
                            start_date: {   type: String, 
                                            default: Date.now },
                            winner:     String
                        });

var roomModel = mongoose.model('rooms', roomSchema);