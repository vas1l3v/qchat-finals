var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var Friend = require('./friend');
var _ = require('underscore');

var UserSchema = mongoose.Schema({
    username:{
        type:String,
        index:true
    },
    password:{
        type:String
    },
    email:{
        type:String
    },
    firstName:{
        type:String
    },
    lastName:{
        type:String  
    },
    profilePicURL:{
        type:String,
        default:"/imgs/default-prof-pic.jpg"
    },
    description:{
        type:String,
        default:"Describe yourself in a few words"
    },
    socketId:{
        type:String,
        default:null
    },
    lastActiveConnection:{
        type:String
    },
    unsuccessfulLoginAttempts:{
        type:Number,
        default:0
    },
    maxLoginAttempts:{
        type:Number,
        default:3
    },
    restrictedLoginDate:{
        type:Date,
        default:null
    },
    activeConnections:[],
    relationships:[Friend.FriendSchema]
});

var User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function(newUser, callback){
    bcrypt.genSalt(10, function(err, salt){
        bcrypt.hash(newUser.password, salt, function(err, hash){
            newUser.password = hash;
            newUser.save(callback);
        });
    })
}

module.exports.checkForExistingUser = function(user, callback){
    User.findOne({username: user.username}, callback);
}

module.exports.checkForExistingEmail = function(userEmail, callback){
    User.findOne({email: userEmail}, callback);
}

module.exports.getUserByUsername = function(username, callback){
    var query = {username: username};
    User.findOne(query, callback);
}

module.exports.getUserById = function(id, callback){
    User.findById(id, callback);
}

//checks if both passwords match during registration
module.exports.comparePassword = function(candidatePassword, hash, callback){
    bcrypt.compare(candidatePassword, hash, function(err, isMatch){
        if(err) throw err;
        callback(null, isMatch);
    });
}

//returns users by name, case insensitive
module.exports.searchDirectory = function(name, callback){
    User.find({$or:[{username: new RegExp(name, "i")}, 
                    {firstName: new RegExp(name, "i")},
                    {lastName: new RegExp(name, "i")}]},
                callback).select("-password -email -_id -__v");
}

//updates the socketId of the user when the user logs in, _id is not a string but an ObjectId (needs to be parsed to ObjectId)
module.exports.updateSocketId = function(socketId, userId){
    User.findOne({"_id" : mongoose.Types.ObjectId(userId)}, function(err, user){
        if (err) { return next(err); }
        user.socketId = socketId;
        user.save(function(err) {
           if (err) { return next(err); }
        });
    });
}

//adds friend in relationships array for both users(the one sending the request and the one receiving the request)
/*request statuses
    req-sent:  the user has sent a friend request
    req-recv:  the user has received a friend request
    friend:    the user is already in a friend relationship
*/

module.exports.sendFriendRequest = function(username, friendUsername, callback){
    User.findOne({"username" : username}, function(err, user){
        if (err) { return next(err); }

        User.getUserByUsername(friendUsername, function(err, friendUser){
            if(err) throw err;
            
            //check if both users already are in some kind of relationship
            var isInRelationship = false;
            for(var i = 0; i < user.relationships.length; i++){
                if(user.relationships[i].userId == friendUser._id){
                    isInRelationship = true;
                    //there is already a relationship between the users
                    callback(500);
                }
            }

            //if not push sent request, and receive request to relationships array
            if(!isInRelationship){
                user.relationships.push({userId: friendUser._id, relationshipStatus: "req-sent"});
                user.save(function(err) {
                    if (err) { return next(err); }
                });

                friendUser.relationships.push({userId: user._id, relationshipStatus: "req-recv"});
                friendUser.save(function(err) {
                    if (err) { return next(err); }
                });
                //relationship successfully added
                callback(200);
            }
        });
  
            /*    pri logvane  da se vzemat vsichki priqteli na user-a i da se slojat v Actions taba
            */

            
         //   console.log(user.username + " with id = " + user._id + " sends");
         //   console.log(friendUser.username + " with id = " + friendUser._id + " recieves");
    });
}

module.exports.handleFriendRequest = function(username, friendUsername, action){
    User.getUserByUsername(username, function(err, user){
        if (err) { return next(err); }

        User.getUserByUsername(friendUsername, function(err, friendUser){
            if(err) throw err;
            
            //check if both users already friends
            var isInRelationship = false;
            for(var i = 0; i < user.relationships.length; i++){
                if(user.relationships[i].userId == friendUser._id && user.relationships[i].relationshipStatus == 'friend'){
                    isInRelationship = true;
                    break;
                }
            }

            //if not push friend to both users statuses
            if(!isInRelationship){

                if(action == 'accept'){
                        //    user.relationships.push({userId: friendUser._id, relationshipStatus: "friend"});
                    user.relationships.forEach(function(item) {
                        if(item["userId"] == friendUser._id){
                            item["relationshipStatus"] = "friend";
                        }
                    });
                    user.save(function(err) {
                        if (err) { return next(err); }
                    });

                //    friendUser.relationships.push({userId: user._id, relationshipStatus: "friend"});
                    friendUser.relationships.forEach(function(item) {
                        if(item["userId"] == user._id){
                            item["relationshipStatus"] = "friend";
                        }
                    });
                    friendUser.save(function(err) {
                        if (err) { return next(err); }
                    });
                }

                else if(action == 'decline'){
                    //TO DO
                    //returns all elements except for those who didn't match the condition
                    user.relationships = _.reject(user.relationships, function(obj){
                        return obj["userId"] == friendUser._id;
                    });

                    user.save(function(err) {
                        if (err) { return next(err); }
                    });

                    friendUser.relationships = _.reject(friendUser.relationships, function(obj){
                        return obj["userId"] == user._id;
                    });

                    friendUser.save(function(err) {
                        if (err) { return next(err); }
                    });
                }
            
            }
        });
            /*
                dobavi priqtelstvo v 2ta friendship array-a 
                req-sent - user-a e dal pokana za priqtelstvo
                req-recv - user-a e poluchil pokana za priqtelstvo
                friend - userite sa priqteli
                obmisli statusite pak

                pri logvane  da se vzemat vsichki priqteli na user-a i da se slojat v Actions taba
            */

            
         //   console.log(user.username + " with id = " + user._id + " sends");
         //   console.log(friendUser.username + " with id = " + friendUser._id + " recieves");
    });
}

//get all users who have /req-recv/ status in the relationship array
module.exports.getAllFriendRequests = function(ids, callback){
    User.find({_id: {$in: ids}}, {}, {sort:{username: -1}}, callback);
}



//db.users.update({username:"qchattest"}, {username:"qchattest", profilePicURL:"/imgs/default-prof-pic.jpg", socketID:null, name:"qwe", email:"qeqeq@abv.bg"})