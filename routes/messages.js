var express = require('express');
var router = express.Router();
var Message = require('../models/message');

router.get('/chat/:chatname', function(req, res){
    if(req.isAuthenticated()){
        Message.getAllMessages(req.params.chatname, req.query.offset, function(err, message){
            res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
            res.send(message);
        });
    }
});

router.get('/prevchat/:chatname', function(req, res){
    if(req.isAuthenticated()){
        Message.getPreviousMessages(req.params.chatname, req.query.offset, req.query.lastDate, function(err, message){
            res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
            res.send(message);
        });
    }
});

module.exports = router;