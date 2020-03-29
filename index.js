var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var mongoose = require('mongoose');
var moment = require('moment');
//mongodb+srv://vasilev:<PASSWORD>@cluster0-njwwu.mongodb.net/test?retryWrites=true
mongoose.connect('mongodb://localhost/qchat');
//mongoose.connect('mongodb+srv://vasilev:663896@cluster0-njwwu.mongodb.net/test?retryWrites=true');
//mongod --dbpath C:\MongoDB\data

var db = mongoose.connection;
var User = require('./models/user');
var Message = require('./models/message');

var routes = require('./routes/index');
var users = require('./routes/users');
var messages = require('./routes/messages');

var _ = require('underscore');
// Init App
var app = express();


// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Express Session
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// Connect Flash
app.use(flash());

// Global Vars
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});



app.use('/', routes);
app.use('/users', users);
app.use('/messages', messages);

// Set Port
app.set('port', (process.env.PORT || 5000));

var http = require('http').Server(app);
var io = require('socket.io')(http);

//When server restarts, delete all active connections
User.find({}, function(err, users){
  for(var i = 0; i < users.length; i++){
    users[i].activeConnections = [];
    users[i].unsuccessfulLoginAttempts = 0;
    users[i].restrictedLoginDate = null;
    users[i].save(function(err){
      if (err) { return next(err); }
    });
  }
});

io.on('connection', function(socket){
    socket.on('test', function(data){
      console.log(data);
    });

    socket.on('new-connection', function(data){
      socket.user = data;
      if(socket.user != null && typeof(socket.user != 'undefined')){
        User.getUserByUsername(data, function(err, user){
          //  user.socketId = socket.id;
          if(user.activeConnections != null & typeof(user.activeConnections) != 'undefined'){
            user.activeConnections.push(socket.id);
            var numOfActiveConnections = user.activeConnections.length;
            user.lastActiveConnection = user.activeConnections[numOfActiveConnections - 1];
            user.save(function(err) {
              if (err) { return next(err); }
            });
          }
        });
      }
    });

    //when the user logs out, the server refreshes all active connections( no session, login page)
    socket.on('logout', function(data){
      if(socket.user != null && typeof(socket.user != 'undefined')){
        User.getUserByUsername(socket.user, function(err, user){
          if(user.activeConnections != null & typeof(user.activeConnections) != 'undefined'){
            for(var i = 0; i < user.activeConnections.length; i++){
              socket.broadcast.to(user.activeConnections[i]).emit('logout', data);
            }
          }
        });
      }
    });

 //   console.log('a user connected');
    socket.on('chat-message', function(msg){
        console.log(msg);
        var chatName = socket.user > msg["to"] ? socket.user + msg["to"] : msg["to"] + socket.user;
        const maxChars = 100;
        if(msg["msg"].length > maxChars){
          msg["msg"] = msg["msg"].substring(0, maxChars);
        }
        var message = new Message({
          chatName : chatName,
          sender: socket.user,
          receiver: msg["to"],
          messageBody: msg["msg"],
          date: new Date()
        });

        message.save(function(err) {
          if (err) { return next(err); }
        });
        //broadcasts message to all users active socket connections ( so it can appear in all opened tabs )
        User.findOne({username: msg["to"]}, function(err, user){
          for(var i = 0; i < user.activeConnections.length; i++){
            socket.broadcast.to(user.activeConnections[i]).emit('chat-message', {msg: msg["msg"], from: socket.user, profilePicURL: msg["profilePicURL"]});
          }
        });
    });

    socket.on('go-online', function(msg){
      //  socket.broadcast.emit('login', msg);
        if(msg["username"] != null && typeof(msg["username"]) != 'undefined'){
          User.getUserByUsername(msg["username"], function(err, user){
            var friendIds = [];
            if(user.relationships.length != 0 && typeof(user.relationships) != 'undefined' && user.relationships != null){
              user.relationships.forEach(function(item){
                if(item.relationshipStatus == 'friend'){
                  friendIds.push(item.userId);
                }
              });
              User.getAllFriendRequests(friendIds, function(err, users){
                users.forEach(function(item){
                  if(item.activeConnections.length != 0){
                    for(var i = 0; i < item.activeConnections.length; i++){
                      socket.broadcast.to(item.activeConnections[i]).emit('friend-online', {username: user.username, socketId: socket.id});
                    }
                  }
                });
              });
            }
            
          });
        }
        
    });

    socket.on('disconnect', function(){
      if(socket.user != null && typeof(socket.user != 'undefined')){
        User.getUserByUsername(socket.user, function(err, user){
          if(user.activeConnections.length != 0){
            for(var i = 0; i < user.activeConnections.length; i++){
              if(user.activeConnections[i] == socket.id){
                //returns all elements except for those who didn't match the condition
                user.activeConnections = _.reject(user.activeConnections, function(item){
                  return item == socket.id;
                });
                var numOfActiveConnections = user.activeConnections.length;
                user.lastActiveConnection = user.activeConnections[numOfActiveConnections - 1];
                user.save(function(err) {
                  if (err) { return err; } //used to be next(err) but srv crashes (if issue)
                });
              }
            }
          }

          if(user.activeConnections.length == 0){
            var friendIds = [];
            if(user.relationships.length != 0 && typeof(user.relationships) != 'undefined' && user.relationships != null){
              user.relationships.forEach(function(item){
                if(item.relationshipStatus == 'friend'){
                  friendIds.push(item.userId);
                }
    
              });

              User.getAllFriendRequests(friendIds, function(err, users){
                users.forEach(function(item){
                  if(item.activeConnections.length != 0){
                    for(var i = 0; i < item.activeConnections.length; i++){
                      socket.broadcast.to(item.activeConnections[i]).emit('friend-offline', {username: user.username});
                    }
                  }
                });
              });
            }
          }
        });
      }
    });

    //send friend request
    socket.on('friend-request', function(data){
      User.findOne({username:data["to"]}, function(err, user){
        for(var i = 0; i < user.activeConnections.length; i++){
          socket.broadcast.to(user.activeConnections[i]).emit('friend-request', {status:data["status"], username: data["username"]});
        }
      });
    });

    socket.on('remove-friend', function(data){
      User.findOne({username:data["to"]}, function(err, user){
        for(var i = 0; i < user.activeConnections.length; i++){
          socket.broadcast.to(user.activeConnections[i]).emit('remove-friend', {username: data["username"]});
        }
      });
    });
  });

  

http.listen(app.get('port'), '127.0.0.1'/*'192.168.53.2'*/ || 'localhost', function(){
	console.log('Server started on port ' + app.get('port'));
});