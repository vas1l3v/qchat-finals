if (typeof QChat === 'undefined') QChat = {};

if (typeof QChat.Helpers === 'undefined') QChat.Helpers = {
    searchDirectory: function(input){
        $.get('/users/search/' + input, function(data) {
            $('#directoryNav').empty();
            for(var i = 0; i < data.length; i++){
                var socketId = "offline";
                if(data[i].socketId != null){
                    socketId = data[i].socketId;
                }
                $('#directoryNav').append('<li id = ' + socketId +  ' class="nav-item">' + 
                                            '<a class="nav-link">' + 
                                                '<img class = "friend-pic" src=' + data[i].profilePicURL + '>' +
                                                '<span class = "friend-name">' + data[i].username + '</span>' + 
                                                '<span id = "" class = "glyphicon glyphicon-plus add-friend"></span>' +
                                            '</a>' + 
                                        '</li>');
            }
            
            //add friend button (Plus sign)
                    $('.add-friend').click(function(){
                // confirm dialog
                    var username = $(this).siblings('.friend-name').html();
                    alertify.confirm("Do you really want to add " + username + " ?", function () {
                        // user clicked "ok"
                        // console.log(username);
                        // $.get('/users/userSocketId/' + username, function(data) {
                        //     if(data["status"] == 'online' && data["socketId"] != null){
                        //         socket.emit('friend-request', {to: username, status: "req-sent", username: QChat.Helpers.loggedUser["username"]});
                        //     }
                        // });

                        
    
                        $.ajax({
                            url: '/users/addFriend/' + username,
                            type: 'PUT',
                            success: function(result) {
                                //alertify.delay(3000).success("You have sent " + username + " a friend request!");
                                alertify.notify("You have sent " + username + " a friend request!", 'success', 3);
                                socket.emit('friend-request', {to: username, status: "req-sent", username: QChat.Helpers.loggedUser["username"]});
                            },
                            error: function(){
                                alertify.alert("You have already sent " + username + " a friend request or you have a friend request pending! <br/> Check your notifications!").setHeader('<em> QChat </em> ');
                            }
                        });
                    }, function() {
                        // user clicked "cancel"
                    });
                });
            
            });
            $("#searchInput").val("");
    },

    extractSocketId: function(id){
        var splittedString = id.split('_');
        var socketId = '';
        for(var i = 1; i < splittedString.length; i++){
            socketId += splittedString[i];
        }
        return socketId;
    },

    readURL: function(input) {
        console.log('1');
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            console.log(2);
            reader.onload = function (e) {
                $('#profileChange')
                    .attr('src', e.target.result)
            };

            reader.readAsDataURL(input.files[0]);
        }
    },

    loggedUser: {
        username: null,
        firstName: null,
        lastName: null,
        profilePicURL: null,
        description: null
    },

    LastRendered:{}
}
