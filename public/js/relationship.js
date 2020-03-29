// // TO DO , all functions in appropriate namespace
// if (typeof QChat === 'undefined') QChat = {};

// if (typeof QChat.Relationship === 'undefined') QChat.Relationship = {
//     handleFriendRequest: function(username, htmlElem, action){
//         $.get('/users/userSocketId/' + username, function(data) {
//             //    if(data["status"] == 'online' && data["socketId"] != null){
//                     if(action == 'accept'){
//                         socket.emit('friend-request', {socketId: data["socketId"], status: "friend", username: $("#chatUsername").html()});
//                     }
//                     else if(action == 'decline'){
//                         socket.emit('friend-request', {socketId: data["socketId"], status: "declined", username: $("#chatUsername").html()});
//                     }
                    
//             //    }
//             });
    
//             if(action == 'accept'){
//                 $.ajax({
//                     url: '/users/acceptFriendRequest/' + username,
//                     type: 'PUT',
//                     success: function(result) {
//                         alertify.delay(3000).success("You have accepted " + username + "'s friend request!");
//                         $(htmlElem).closest('li').remove();
//                     }
//                 });
//             }
//             else if(action == 'decline'){
//                 $.ajax({
//                     url: '/users/decline-friend-request/' + username,
//                     type: 'PUT',
//                     success: function(result) {
//                         alertify.delay(3000).error("You have declined " + username + "'s friend request!");
//                         $(htmlElem).closest('li').remove();
//                     }
//                 });
//             }                       // das das das
//     },

//                 qweewq: function(){

//                                // daskjldjklasldas

//                 }

// }
function handleFriendRequest(username, htmlElem, action){
    // $.get('/users/userSocketId/' + username, function(data) {
    //     //    if(data["status"] == 'online' && data["socketId"] != null){
    //             if(action == 'accept'){
    //                 socket.emit('friend-request', {to: username,  status: "friend", username: QChat.Helpers.loggedUser["username"]});
    //             }
    //             else if(action == 'decline'){
    //                 socket.emit('friend-request', {to: username, status: "declined", username: QChat.Helpers.loggedUser["username"]});
    //             }
                
    //     //    }
    //     });
        if(action == 'accept'){
            socket.emit('friend-request', {to: username,  status: "friend", username: QChat.Helpers.loggedUser["username"]});
        }
        else if(action == 'decline'){
            socket.emit('friend-request', {to: username, status: "declined", username: QChat.Helpers.loggedUser["username"]});
        }

        if(action == 'accept'){
            $.ajax({
                url: '/users/acceptFriendRequest/' + username,
                type: 'PUT',
                success: function(result) {
                    renderFriendsList(function(chatMessage){
                        socket.emit('chat-message', chatMessage);
                    });
                //    alertify.delay(3000).success("You have accepted " + username + "'s friend request!");
                    alertify.notify("You have accepted " + username + "'s friend request!", 'success', 3);
                    $(htmlElem).closest('li').remove();
                    var notificationsCount = $("#notificationCounter").html();
                    var updatedCount = parseInt(notificationsCount) - 1;
                    $("#notificationCounter").html(updatedCount);
                    renderFriendsList(function(chatMessage){
                        socket.emit('chat-message', chatMessage);
                    });
                }
            });
        }
        else if(action == 'decline'){
            $.ajax({
                url: '/users/decline-friend-request/' + username,
                type: 'PUT',
                success: function(result) {
                //    alertify.delay(3000).error("You have declined " + username + "'s friend request!");
                    alertify.notify("You have declined " + username + "'s friend request!", 'success', 3);
                    $(htmlElem).closest('li').remove();
                    var notificationsCount = $("#notificationCounter").html();
                    var updatedCount = parseInt(notificationsCount) - 1;
                    $("#notificationCounter").html(updatedCount);
                }
            });
        }
        
}

//renders all friend request in the notifications tab on the client side
function renderNotifications(){
    $('#notificationsNav').empty();
    $.get('/users/requests/req-recv', function(data) {
        $("#notificationCounter").html(data.length);
        for(var i = 0; i < data.length; i++){
            $('#notificationsNav').append('<li id = ' + 'testID' +  ' class="nav-item">' + 
                                    '<a class="nav-link">' + 
                                        '<img class = "friend-pic" src=' + data[i].profPic + '>' +
                                        '<span class = "friend-name">' + data[i].username + '</span>' + 
                                        '<div id = "requestContainer">' + 
                                            '<span id = "acceptRequest" class = "glyphicon glyphicon-ok accept-req"></span>' +
                                            '<span id = "declineRequest" class = "glyphicon glyphicon-remove decline-req"></span>' +
                                        '</div>' +
                                    '</a>' + 
                                '</li>');
        }

        $('#notificationsLoading').remove();

        $(".accept-req").click(function(){
    
            var username = $(this).parent().siblings('.friend-name').html();
            
                // confirm dialog
            var acceptBtn = $(this);
            alertify.confirm("Do you really want to accept " + username + "'s friend request?", function () {
                // user clicked "ok"
                handleFriendRequest(username, acceptBtn, 'accept');
            }, function() {

            }).setHeader('<em> QChat </em> ');
            
            /*
                accept the friend request
                update statuses for both users
                from req-sent to friend
                from req-recv to friend
                
                update notifications tab ( remove the current friend request )
                show appropriate alert message ( You and username are now friends )
    
                make another get page for list of friends in actions tab
            */
        });
    
        $(".decline-req").click(function(){
            var username = $(this).parent().siblings('.friend-name').html();
            /*
                decline friend request
                update statuses for both users
                from req-sent to been-blocked
                from req-recv to has-blocked
    
                update notifications tab ( remove the current friend request )
                show appropriate alert message ( You have declined username's friend request )
    
            */
           var declineBtn = $(this);
           alertify.confirm("Do you really want to decline " + username + "'s friend request?", function () {
                // user clicked "ok"
                handleFriendRequest(username, declineBtn, 'decline');
            }, function() {

            }).setHeader('<em> QChat </em> ');

        });
    });
}

//renders all of users friends in the actions tab
//TO DO UPDATE ON WHEN THE USER IS 

function renderFriendsList(callback){
    $.get('/users/requests/friend', function(data) {
        data = _.sortBy(data, 'username');
        $('#friendsNav').empty();
        for(var i = 0; i < data.length; i++){
            //global object to save offsets for chats, 10 is default
            var id, status, online;
            if(data[i].activeConnections.length == 0){
                id =   data[i].username + "_offline";
                status = '<span id = ' + data[i].username + '_status class = "friend-offline material-icons">power</span>';
            } else{
                id =  data[i].username + "_online";
                status = '<span id = ' + data[i].username + '_status class = "friend-online material-icons">power</span>';
            }
            $('#friendsNav').append('<li id =' + id + ' class="nav-item friend-item">' + 
                                        '<a class="nav-link row">' + 
                                            '<img class = "friend-pic" src=' + data[i].profPic + '>' + 
                                            '<span class = "friend-name hidden-xs">' + data[i].username + '</span>' + 
                                            status + 
                                        '</a>' + 
                                    '</li>');
            QChat.ChatWindows.renderChatWindow(id, callback);                       
        }
    });
}



/*
<li id = "penko" class="nav-item">
    <a class="nav-link" href="#">
        <img class = "friend-pic" src="/imgs/test_prof_pic.jpg">
        <span class = "friend-name" style="">Penko Vasilev</span>
        <span class = "friend-online">Online</span>
    </a>
</li>

                        <li id = "maikati" class="nav-item">
                            <a class="nav-link" href="#">
                                <img class = "friend-pic" src="/imgs/test_prof_pic.jpg"> 
                                <span class = "friend-name">Maika ti</span>
                                <span class = "friend-offline">Offline</span>
                            </a>
                        </li>
*/