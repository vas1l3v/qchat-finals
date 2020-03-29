var mongoose = require('mongoose');

var MessageSchema = mongoose.Schema({
    chatName:{
        type:String
    },

    sender:{
        type:String
    },

    receiver:{
        type:String
    },

    messageBody:{
        type:String
    },

    date:{
        type: Date
    }
});



var Message = module.exports = mongoose.model('Message', MessageSchema);
module.exports.MessageSchema = MessageSchema;

module.exports.getAllMessages = function(chatName, offset, callback){
//    Message.find({chatName: chatName}, {}, callback).skip(1).limit(10).sort({"date": -1});
    Message.find({chatName: chatName}, {}, {sort:{date: -1}}, callback).limit(parseInt(offset));
}

module.exports.getPreviousMessages = function(chatName, offset, lastDate, callback){
//    Message.find({chatName: chatName}, {}, callback).skip(1).limit(10).sort({"date": -1});
    console.log(lastDate);
    Message.find({chatName: chatName, date: {$lt: lastDate}}, {}, {sort:{date: -1}}, callback).limit(parseInt(offset));
}