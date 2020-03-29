var express = require('express');
var router = express.Router();
var User = require('../models/user');
var passportLocalMongoose = require('passport-local-mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var moment = require('moment');
var schedule = require('node-schedule');
var _ = require('underscore');


//middleware for file upload
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'public/imgs/profiles');
    },
    filename: function(req, file, cb){
        cb(null, req.user.username + "-pic");
        //req.user.username + "-pic"
    }
})

//store png and jpeg only
var fileFilter = (req, file, cb) => {
    if(file.mimetype == 'image/jpeg' || file.mimetype == 'image/png'){
        cb(null, true);
    }else{
        cb(null, false);
    }
};

var upload = multer({
    storage: storage, 
    limits: {
        //files max 2mb
        fileSize: 1024 * 1024 * 2
    },
    fileFilter: fileFilter
});

//Register
router.get('/register', function(req, res){
    res.render('register', {layout: 'auth_layout'});
});

//Login
router.get('/login', function(req, res){
    res.render('login', {layout: 'auth_layout'});
});

//Register
router.post('/register', function(req, res){
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var confirmPassword = req.body.confirmPassword;
    
    req.checkBody('firstName', 'First name is required').notEmpty();
    req.checkBody('lastName', 'Last name is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('username', 'Username should be between 6 and 10 characters').isLength({min:6, max:10});
    req.checkBody('username', 'Username must be alphabetical characters and numbers only').matches(/^[a-zA-Z0-9]*$/);
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('confirmPassword', 'Passwords do not match').equals(req.body.password);

    var errors = req.validationErrors();

    if(errors){
      res.render('register', {
        layout: 'auth_layout',
        errors:errors
      });
    } else{
        var newUser = new User({
            firstName: firstName,
            lastName: lastName,
            email: email,
            username: username,
            password: password
        });

        User.checkForExistingUser(newUser, function(err,obj) {
            if(err) throw err;
            if(obj){
   
                req.flash('error_msg', 'Username already exists');
                res.redirect('/users/register');
            }else{
                User.checkForExistingEmail(newUser.email, function(err, user){
                    if(user){
                        req.flash('error_msg', 'Email is already taken');
                        res.redirect('/users/register');
                    }else{
                        User.createUser(newUser, function(err, user){
                            if(err) throw err;
                        });
                        req.flash('success_msg', 'You are registered and can now log in');
                        res.redirect('/users/login');
                    }
                });
                
            }
        });
    }
});

passport.use(new LocalStrategy(
    function(username, password, done) {
        User.getUserByUsername(username, function(err, user){
            if(err) throw err;
            if(!user){
                return done(null, false, {message: 'Unknown User'});
            }
            
            //if 3 attempts, restrict logging in with this account for 10 minutes
            if(user.unsuccessfulLoginAttempts >= user.maxLoginAttempts){
                if(user.restrictedLoginDate != null){
                    return done(null, false, {message: 'You have exceeded the maximum of unsuccessful login atempts. Try again at ' + moment(user.restrictedLoginDate).format('HH:mm:ss')});
                }else{
                    user.restrictedLoginDate = moment(new Date()).add(10, 'm').toDate();
                    //scheduled event ( 10 minutes restriction )
                    var lockExpire = schedule.scheduleJob(user.restrictedLoginDate, function(){
                        user.restrictedLoginDate = null;
                        user.unsuccessfulLoginAttempts = 0;
                        user.save(function(err){
                            return err;
                        });
                    });
                    user.save(function(err){
                        return err;
                    });
                    return done(null, false, {message: 'You have exceeded the maximum of unsuccessful login atempts. Try again at ' + moment(user.restrictedLoginDate).format('HH:mm:ss')});
                }
                
                
            }

            User.comparePassword(password, user.password, function(err, isMatch){
                if(err) throw err;
                if(isMatch){
                    //set attempts to 0
                    user.restrictedLoginDate = null;
                    user.unsuccessfulLoginAttempts = 0;
                    user.save(function(err){
                        return err;
                    });
                    return done(null, user);
                }else{
                    //+1 unsuccessful attempt
                    user.unsuccessfulLoginAttempts++;
                    user.save(function(err) {
                        if (err) { return next(err); }
                    });
                    var attemptsLeft = user.maxLoginAttempts - user.unsuccessfulLoginAttempts;
                    return done(null, false, {message: 'Invalid password! You have ' + attemptsLeft + ' attempts left.'});
                }
            });
      });
    }
    ));

passport.serializeUser(function(user, done){
    done(null, user.id);
});

passport.deserializeUser(function(id, done){
    User.getUserById(id, function(err, user){
        done(err, user);
    });
});

//Login authentication
router.post('/login',
    passport.authenticate('local', {successRedirect: '/', failureRedirect:'/users/login', failureFlash: true}),
    function(req, res){
        res.redirect('/');
});


//Logout
router.get('/logout', function(req, res){
    //user socketId updates to null, so the user is offline
    
    
    if(req.isAuthenticated){
        req.logout();
    }
    

    req.flash('success_msg', 'You are logged out');

    res.redirect('/users/login');
});

//keypress user search in directory
router.get('/search/:user', function(req, res){
    if(req.isAuthenticated()){
        var username = req.params.user;
        User.searchDirectory(username, function(err, user){
            if(err) throw err;
            res.send(user);
        });
    }else{
        res.redirect('/users/login');
    }
});

//json response with user's personal information
router.get('/userInfo', function(req, res){
    if(req.isAuthenticated()){
        var userObjJSON = {
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            userName: req.user.username,
            profilePic: req.user.profilePicURL,
            description: req.user.description,
            email: req.user.email
        };
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.send(userObjJSON);
    }else{
        res.redirect('/users/login');
    }
});

router.post('/update-profile', upload.single('uploadImage'), function(req, res){
    User.findOne({_id: req.user._id}, function(err, user){
        if(err) {
            res.status(500).send({ error: "invalid_user" });
        }else{
            user.firstName = req.body.fName;
            user.lastName = req.body.lName;
            user.email = req.body.email;
            user.description = req.body.description;
            user.profilePicURL = 'imgs/profiles/' + req.user.username + '-pic';
            req.checkBody('email', 'Email is not valid').isEmail()
            if(user.description.length > 80){
                res.status(500).send({ error: "descr_length" });
            } else if(req.validationErrors()){
                res.status(500).send({ error: "not_email" });
            }else{
                user.save(function(err) {
                    if (err) { return next(err); }
                });
                res.sendStatus(200);
            }
        }
        
    });
});

router.get('/userinfo/:username', function(req, res){
    if(req.isAuthenticated()){
        User.findOne({username: req.params.username}, function(err, user){
            var userObjJSON = {
                firstName: user.firstName,
                lastName: user.lastName,
                userName: user.username,
                profilePic: user.profilePicURL,
                description: user.description,
                connections: user.activeConnections,
                email: user.email
            };

            res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
            res.send(userObjJSON);
        });
        
    }else{
        res.redirect('/users/login');
    }
});

//when the user logs in put req to update socketId field
router.put('/userSocketId/:socketId', function(req, res){
    if(req.isAuthenticated()){
        User.updateSocketId(req.params.socketId, req.user._id);
    }
   
});

router.get('/userSocketId/:username', function(req, res){
    if(req.isAuthenticated){
        User.getUserByUsername(req.params.username, function(err, user){
            if(err) throw err;
            if(!user){

            }else{
                var statusObjJSON = {};
                if(user.lastActiveConnection == null){
                    statusObjJSON = {
                        status: "offline",
                        socketId: null
                    }
                } else{
                    statusObjJSON = {
                        status: "online",
                        socketId: user.lastActiveConnection
                    }
                }
                res.send(statusObjJSON);
            }
        });
    }
});

router.put('/addFriend/:username', function(req, res){
    if(req.isAuthenticated()){
        User.sendFriendRequest(req.user.username, req.params.username, function(status){
            res.sendStatus(status);
        });
        
    }
});

router.put('/acceptFriendRequest/:username', function(req, res){
    if(req.isAuthenticated()){
        User.handleFriendRequest(req.user.username, req.params.username, 'accept');
        res.sendStatus(200);
    }
});

router.put('/decline-friend-request/:username', function(req, res){
    if(req.isAuthenticated()){
        User.handleFriendRequest(req.user.username, req.params.username, 'decline');
        res.sendStatus(200);
    }
});

router.get('/requests/:action', function(req, res){
    if(req.isAuthenticated){
        User.getUserById(req.user._id, function(err, user){
            var relationships = user.relationships;
            var userIds = [];
            for(var i = 0; i < relationships.length; i++){
                //req-recv status (user who has sent you a friend request)
                if(relationships[i].relationshipStatus == req.params.action){
                    userIds.push(relationships[i].userId);
                }
            }

            User.getAllFriendRequests(userIds, function (err, array) {
                if (err) {
                    throw err;
                } else {
                  var userObjJSON = {};
                  array.forEach(o => userObjJSON[o._id] = o);
                  var arr_users = userIds.map(id => ({username: userObjJSON[id].username, profPic: userObjJSON[id].profilePicURL, socketId: userObjJSON[id].lastActiveConnection, activeConnections: userObjJSON[id].activeConnections}));
                  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
                  res.send(arr_users);
                }
            });
            //
        });
    }
});

router.post('/remove-friend/:username', function(req, res){
    if(req.isAuthenticated){
        var friendUser = req.params.username;
        var currentUser = req.user.username;
        User.getUserByUsername(friendUser, function(err, friend){
            User.getUserByUsername(currentUser, function(err, current){
                current.relationships = _.reject(current.relationships, function(obj){ return obj.userId == friend._id; });
                current.save(function(err) {
                    if (err) { return next(err); }
                });
    
                friend.relationships = _.reject(friend.relationships, function(obj){ return obj.userId == current._id; });
                friend.save(function(err) {
                    if (err) { return next(err); }
                });
    
                res.status(200).send();
            });
        });
    }
    
});

module.exports = router;