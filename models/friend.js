var mongoose = require('mongoose');

var FriendSchema = mongoose.Schema({
    userId:{
        //type:mongoose.Schema.ObjectId
        type:String
    },
    relationshipStatus:{
        type:String
    }
});

var Friend = module.exports = mongoose.model('Friend', FriendSchema);
module.exports.FriendSchema = FriendSchema;