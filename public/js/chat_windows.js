if (typeof QChat === 'undefined') QChat = {};

if (typeof QChat.ChatWindows === 'undefined') QChat.ChatWindows = {
    createChatWindow: function(id, chatMessagesId, username, callback){
        $("#" + chatMessagesId).empty();
        $.ajax({
            url: '/users/userinfo/' + username,
            type: 'GET',
            success: function(result) {
                var status = result["connections"].length == 0 ? 'friend-offline-win' : 'friend-online-win';
                var chatWindowId = id;
                if($("#" + chatWindowId).length == 0){
                    $("#mainRightSide").append('<div class = "friends chat-container" id = ' + chatWindowId + ' style ="display:none;">' + 
                                                    '<div class="row chat-profile-info">' + 
                                                        '<div class="col-lg-3 col-12  chat-window-profile"><img id = ' + username + '_friendProfile' +  ' class="chat-profile-pic-fr rounded-circle" src=' + result["profilePic"] + '>' + 
                                                        '</div>' + 
                                                        '<div class="col-lg-6  hidden-xs hidden-sm chat-window-profile" style = "margin-top:5px !important;">' + 
                                                        '<h4 class="card-title" style="">' + 
                                                        result["firstName"] + ' ' + result["lastName"] + ' (' + result["userName"] + ')' + '</h4>' + 
                                                            '<i id = ' + username + '_status_win ' + 'style = "font-size:40px;" class = "material-icons ' + status + '">power</i>' + 
                                                        '</div>' + 
                                                        '<div class="col-lg-3 hidden-xs hidden-sm chat-window-profile long-text" style = "margin-top:5px !important;">' + 
                                                            result["description"] + 
                                                        '</div>' + 
                                                    '</div>' + 

                                                    '<div id = ' + chatMessagesId + ' class = "chat-messages" class="row">' + 

                                                    '</div>' + 

                                                    '<div style = "height:100%;" class="row chat-message-area-wrapper">' + 
                                                        '<form style = "margin:0 auto;width:90%;margin-top:3%;" class="navbar-form" id="messageForm" role="sendMsg">' + 
                                                            '<div style = "height:15%;" class="input-group add-on">' + 
                                                            '<textarea style = "height:80%;" class="chat-message-area form-control" placeholder="Type a message..."></textarea>' + 
                                                            '</div>' + 
                                                        '</form>' + 
                                                    //    '<textarea style = "width:90%;height:90%;" class = "chat-message-area form-control"></textarea>' + 
                                                    '</div>' + 
                                                '</div>');
                }
                if(callback && typeof callback === "function") {
                    callback();
                    $("#" + username + "_friendProfile").off('click');
                    $("#" + username + "_friendProfile").click(function(){
                        $.ajax({
                            url: '/users/userinfo/' + username,
                            type: 'GET',
                            success: function(result) {
                                QChat.ChatWindows.renderProfileCard(result);
                            }
                        });
                    });

                    var loggedUserUsername = QChat.Helpers.loggedUser.username;
                    var chatName = loggedUserUsername > username ? loggedUserUsername + username : username + loggedUserUsername;
                    var currentOffset = 10;
                    
                    QChat.ChatWindows.renderHistory(chatName, username, currentOffset);
                    /* Experimental // Renders history last 10 msgs */
                    QChat.ChatWindows.renderScrollingHistory(chatName, username, chatMessagesId, currentOffset);
                }
                
                
                

                
            }
        });
        
         
    },

    renderChatWindow: function(friendId, callback){
        var cleanId = friendId.split('_')[0];
        var chatWindowId = cleanId + '_chatWindow';
        var chatMessagesId = cleanId + '_chatMessages';
        QChat.ChatWindows.createChatWindow(chatWindowId, chatMessagesId, cleanId);
        $('li[id^=' + friendId + ']').click(function(){
            $('li[id^="' + cleanId + '_"]').find('a').css({"background-color":""});
            if($("#" + chatWindowId == 0)){
                var that = this;//reference to list element
                QChat.ChatWindows.createChatWindow(chatWindowId, chatMessagesId, cleanId, function(){
                    $("#mainRightSide").children().hide();
                    $("#friendsNav").children().removeClass('active');
                    $(that).addClass('active');
                    var chatboxId = cleanId + '_chatBoxArea';
                    $('#' + chatWindowId).find("textarea").attr("id", chatboxId);
                //    $('#' + chatWindowId).find(".chat-messages").attr("id", chatMessagesId);
                    //move scroll to bottom
                    $('#' + chatWindowId).show();
                    
                    $('#' + chatboxId).off('focus');
                    $('#' + chatboxId).focus(function(){
                        $('li[id^="' + cleanId + '_"]').find('a').css({"background-color":""});
                    });

                    $('#' + chatboxId).off('keypress');
                    $('#' + chatboxId).keypress(function (e) {
                        var code = (e.keyCode ? e.keyCode : e.which);
                        var chatMessage;
                        if (code == 13) {
                            chatMessage = $('#' + chatboxId).val();
                            if(chatMessage.length > 0){
                                var msgObjJSON = {
                                    to: cleanId,
                                    msg: chatMessage,
                                    profilePicURL: QChat.Helpers.loggedUser["profilePicURL"]
                                };
                                const maxChars = 100;
                                if(msgObjJSON["msg"].length > maxChars){
                                    msgObjJSON["msg"] = msgObjJSON["msg"].substring(0, maxChars);
                                }
                                QChat.ChatWindows.renderChatMessage(msgObjJSON["msg"], msgObjJSON["to"], QChat.Helpers.loggedUser["profilePicURL"], 'send');
                                callback(msgObjJSON);
                                $('#' + chatboxId).val("");
                            }
                            return false;
                        }
                    });
                });
            }
            //test period
            $('li[id^=' + friendId + ']').off('click');
            $('li[id^=' + friendId + ']').click(function(){
                $('li[id^="' + cleanId + '_"]').find('a').css({"background-color":""});
                $("#mainRightSide").children().hide();
                $("#friendsNav").children().removeClass('active');
                $(this).addClass('active');
                $('#' + chatWindowId).show();
            });
        });
    },

    renderChatMessage: function(chatMsg, user, profilePic, status, date, history){
        var chatMsgElem = '<div class="chat-message ' + (status == 'send' ? 'msg-sent' : 'msg-recv') + '">' + 
                                '<img class = "prof-pic" src="' + profilePic + '" alt="Avatar" style="width:100%;">' + 
                                '<p>' + chatMsg + '</p>' + 
                                '<span class="time-right">' + moment(new Date()).to(date) + '</span>' + 
                            '</div>';
        
        if(history == true){
            $("#" + user + "_chatMessages").prepend(chatMsgElem);
        }else{
            $("#" + user + "_chatMessages").append(chatMsgElem);
            $("#" + user + "_chatMessages").prop("scrollHeight");
            //scroll always goes on bottom
            var chatMsgDiv = document.getElementById(user + "_chatMessages");
            if(chatMsgDiv != null){
                chatMsgDiv.scrollTop = chatMsgDiv.scrollHeight;
            }
        }
       
        $('.prof-pic').on("error", function () {
            this.src = '/imgs/default-prof-pic.jpg'
        });
        
    },

    renderProfileCard: function(data){
        var profileCardHTML = [];
        profileCardHTML.push('<div class="card testimonial-card chat-profile-win">'); 
        profileCardHTML.push('<div class="card-up indigo lighten-1">');
        profileCardHTML.push('</div>');
        profileCardHTML.push('<div class="avatar mx-auto white"> ');
        profileCardHTML.push('<a>');
        profileCardHTML.push('<img id="profilePic" class="chat-profile-pic rounded-circle" src=' + data["profilePic"] + '>');
        profileCardHTML.push('</a>');  
        profileCardHTML.push('</div> <div class="card-body" style="text-align: center;">');
        profileCardHTML.push('<h4 class="card-title">' + data["firstName"] + " " + data["lastName"] + '</h4>');
        profileCardHTML.push('<h4 class="card-title">Email address is currently hidden' /*+ data["email"]*/ + '</h4>');
        profileCardHTML.push('<hr>');
        profileCardHTML.push('<p>' + data["description"] + '</p>');
        profileCardHTML.push('</div>');
        profileCardHTML.push('<button id = ' + data["userName"] + '_remove ' + 'class="btn btn-danger remove-friend ajs-ok"> Remove Friend</button>');
        profileCardHTML.push('</div>');
        alertify.alert(profileCardHTML.join('')).setHeader('<em> ' + data["userName"] + ' </em> ');
        $("#" + data["userName"] + "_remove").off('click');
        $("#" + data["userName"] + "_remove").click(function(){
            socket.emit('remove-friend', {to: data["userName"], username: QChat.Helpers.loggedUser.username});
            $.ajax({
                url: '/users/remove-friend/' + data["userName"],
                type: 'POST',
                success: function(result) {
                    location.reload();
                }
            });
        });
        
    },

    renderScrollingHistory: function(chatName, username, chatMessagesId, currentOffset){
        $("#" + chatMessagesId).scroll(function(){
                if( $("#" + chatMessagesId).scrollTop() == 0 ){
                    $.ajax({
                        url: '/messages/prevchat/' + chatName,
                        type: 'GET',
                        data: {offset: currentOffset, lastDate: QChat.Helpers.LastRendered[username]},
                        success: function(result){
                            if(result.length > 0){
                                result = _.sortBy(result, 'date').reverse();//sort descending
                                QChat.Helpers.LastRendered[username] = result[result.length - 1]["date"];//get last rendered msg date
                                for(var i = 0; i < result.length; i++){
                                    if(result[i]["sender"] == QChat.Helpers.loggedUser.username){
                                        QChat.ChatWindows.renderChatMessage(result[i]["messageBody"], result[i]["receiver"], QChat.Helpers.loggedUser["profilePicURL"], 'send', result[i]["date"], true);
                                    }else{
                                        QChat.ChatWindows.renderChatMessage(result[i]["messageBody"], result[i]["sender"], 'imgs/profiles/' + username + '-pic', 'recv', result[i]["date"], true);
                                    }
                                }
                                $("#" + chatMessagesId).scrollTop(200);
                            }
                            

                        }
                    });
                }
                
            });
    },

    renderHistory: function(chatName, username, currentOffset){
        $.ajax({
            url: '/messages/chat/' + chatName,
            type: 'GET',
            data: {offset: currentOffset},
            success: function(result){
                result = _.sortBy(result, 'date');
                QChat.Helpers.LastRendered[username] = result[0]["date"];
                for(var i = 0; i < result.length; i++){
                    if(result[i]["sender"] == QChat.Helpers.loggedUser.username){
                        QChat.ChatWindows.renderChatMessage(result[i]["messageBody"], result[i]["receiver"], QChat.Helpers.loggedUser["profilePicURL"], 'send', result[i]["date"]);
                    }else{
                        QChat.ChatWindows.renderChatMessage(result[i]["messageBody"], result[i]["sender"], 'imgs/profiles/' + username + '-pic', 'recv', result[i]["date"]);
                    }
                    
                }
            }
        });
    }
}