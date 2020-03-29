        alertify.set('notifier','position', 'bottom-left');
        /*initialize socket on client */
        var socket = io();
        socket.on('connect', function() {
            $.ajax({
                type: "GET",
                url: "/users/userinfo",
                success: function(data)
                {
                    $("#chatUsername").html(data["firstName"] + " " + data["lastName"] + " (" + data["userName"] + ")");
                    $("#description").html(data["description"]);
                    $("#profilePic")[0].src = data["profilePic"];
                    
                    //info about logged user
                    QChat.Helpers.loggedUser = {
                        username: data["userName"],
                        firstName: data["firstName"],
                        lastName: data["lastName"],
                        profilePicURL: data["profilePic"],
                        description: data["description"]
                    };

                //    if(sessionStorage.getItem('login') == 'initialLogin'){
                        socket.emit('go-online', {username: data["userName"], socketId: socket.id});
                        
                        sessionStorage.setItem('login', 'logged-in');
                //    }
                    socket.emit('new-connection', data["userName"]);
                },
                error: function(xhr, ajaxOptions, thrownError){

                }
            });
        });

        function logoutEmit(){
            socket.emit('logout', 'logout');
        }
        //user info form on profile picture click
        $('#profilePopup').click(function(){
            $.ajax({
                url: '/users/userinfo',
                type: 'GET',
                cache: false,
                success: function(result) {
                    alertify.confirm('<form enctype="multipart/form-data" id = "userProfile" method = "post" action = "/users/update-profile" style = "text-align:center;"> <label></label>' + 
                                '<img id = "profileChange" class="chat-profile-pic rounded-circle" src=' + result["profilePic"] + '>' +
                                    '<div class="form-group">' + 
                                        '<label>First Name</label>' + 
                                        '<input type="text" class="form-control" id="firstName" name = "fName" placeholder="First Name" value = ' + result["firstName"] + '>' +
                                    '</div>' +  
                                    '<div class="form-group">' + 
                                        '<label>Last Name</label>' + 
                                        '<input type="text" class="form-control" id="lName" name = "lName" placeholder="Last Name" value =' + result["lastName"] + '>' +
                                    '</div>' + 
                                    '<div class="form-group">' +  
                                        '<label>Email</label>' +  
                                        '<input type="text" class="form-control" id = "mail" name = "email" placeholder="Email" value =' + result["email"] + '>' + 
                                    '</div>' + 
                                    '<div class="form-group">' +  
                                        '<label>Description</label>' +  
                                        '<textarea style = "resize:none;" class="form-control" id = "description" name = "description" placeholder="Description">' +
                                        result["description"] + 
                                        '</textarea>' + 
                                    '</div>' +
                                    '<label style = "display:block;" class="btn btn-default form-control">' + 
                                        'Upload a photo <input id = "uploadImage" onchange="QChat.Helpers.readURL(this);" name = "uploadImage" type="file" size = "50" hidden>' + 
                                    '</label>' +
                                    '</br>' + 
                                    ' <a class="btn btn-default form-control" onclick = "logoutEmit();" href = "/users/logout">Logout</a>' + 
                            '</form>', function (ev) {
                            var data = new FormData($("#userProfile")[0]);
                            $.ajax({
                                    type: 'post',
                                    url: '/users/update-profile',
                                    data: data,
                                    enctype: 'multipart/form-data',
                                    cache: false,
                                    processData: false,
                                    contentType: false,
                                    success: function () {
                                        $("#profilePic").attr('src', $("#profileChange").attr('src'));
                                        alertify.confirm("Successful update", function(ev){
                                            location.reload();
                                        }, function(ev){
                                            location.reload();
                                        }).setHeader('<em> QChat </em> ');
                                        
                                    },
                                    error: function(data){
                                        var err_code = data.responseJSON.error;
                                        var err_message = "";
                                        if(err_code == "descr_length"){
                                            err_message = "Descripton must be no more than 80 characters.";
                                        }else if(err_code == "not_email"){
                                            err_message = "Invalid email address.";
                                        }
                                        alertify.confirm("Unsuccessful update! " + err_message, function(ev){
                                            location.reload();
                                        }, function(ev){
                                            location.reload();
                                        }).setHeader('<em> QChat </em> ');
                                    }
                                });

                            $("#userProfile").on('submit',function (e) {
                                
                               e.preventDefault();
                            });

                        }, function(ev){
                            $("#profileChange").attr('src', $("#profilePic").attr('src'));
                            $("#uploadImage").val('');
                        }).setHeader('<em> My profile </em> ');
                }
            });
        //    $('#logout').find('a').attr('href', '/users/logout');
        //    socket.emit('logout', 'logout');
        
            
        });

        socket.on('logout', function(data){
            window.location.reload();
        });
        //when the user logs in broadcast a message to let his friends know he is online
        
      //  socket.on('go-onine')
//        

        $("#mainChatNav li").click(function(){
            $("#mainChatNav li").removeClass("active");
            $(".opt-tabs").hide();
            $(this).addClass("active");
            var navigator = $(this).attr("id").split("-")[0];
            $("#" + navigator).show();

        });

        $("#friendsNav li").click(function(){
            $("#friendsNav li").removeClass("active");
            $(".friends").hide();
            $(this).addClass("active");
            var navigator = "chat_" + $(this).attr("id");
            $("#" + navigator).show();
        });

        $(function(){
            $('#searchForm').on('submit',function(event){
                event.preventDefault() ;
                var input = $("#searchInput").val();
                if(input == ''){
                    alertify.alert("Invalid input!").setHeader('<em> QChat </em> ');
                }
                if($("#directory-nav").hasClass("active") && input != '' && typeof(input) != 'undefined'){
                    QChat.Helpers.searchDirectory(input);
                }
            });
        });
        
        $("#searchBtn").click(function(){
            
            //if directory tab is clicked, search in directory for all users
            var input = $("#searchInput").val();
            if(input == ''){
                alertify.alert("Invalid input!").setHeader('<em> QChat </em> ');
            }
            if($("#directory-nav").hasClass("active") && input != '' && typeof(input) != 'undefined'){
                QChat.Helpers.searchDirectory(input);
            }

            //check for friends tab, search for last actions with friends /* Client Side search???? */


            //notifications, probably filter friends requests /* Client Side search???? */

        });

        $("#searchInput").keyup(function(e){
            var input = this.value.toUpperCase();
            if($("#actions-nav").hasClass("active") && typeof(input) != 'undefined'){
                var friendsList = $("#friendsNav").children();
                var pattern = new RegExp('^' + input);
                for(var i = 0; i < friendsList.length; i++){
                    if(!$(friendsList[i]).find('.friend-name').html().toUpperCase().match(pattern)){
                        $(friendsList[i]).hide();
                    }else{
                        $(friendsList[i]).show();
                    }
                }
            }
        });

        function sendMessage(chatMessage){
            socket.emit('chat-message', chatMessage);
        }

        socket.on('chat-message', function(msg){
            $('li[id^="' + msg["from"] + '_"]').find('a').css({"background-color":"#ff9933", "color":"#000000"});
            QChat.ChatWindows.renderChatMessage(msg["msg"], msg['from'], msg['profilePicURL']);
            var audio = new Audio('/sounds/unconvinced.mp3');
            audio.play();
        });

        
        socket.on('friend-online', function(data){
        //    alertify.log(data["username"] + ' has come online');
            alertify.notify(data["username"] + ' has come online', 'custom', 3);
        //    $("#status").html("Online");
            $("#" + data["username"] + "_status").attr('class', 'friend-online material-icons');
            $("#" + data["username"] + "_status_win").attr('class', 'friend-online-win material-icons');
        });

        socket.on('friend-offline', function(data){
        //    alertify.log(data["username"] + ' has gone offline');
            alertify.notify(data["username"] + ' has gone offline', 'custom', 3);
        //    $("#status").html("Offline");
            $("#" + data["username"] + "_status").attr('class', 'friend-offline material-icons');
            $("#" + data["username"] + "_status_win").attr('class', 'friend-offline-win material-icons');
        });

        //handle friend-request real time
        socket.on('friend-request', function(data){
            if(data["status"] == 'req-sent'){
                var audio = new Audio('/sounds/friend_request.mp3');
                audio.play();
            //    alertify.delay(3000).log(data["username"] + ' sent you a friend request!');
                alertify.notify(data["username"] + ' sent you a friend request!', 'custom', 3);
                renderNotifications();
            }else if(data["status"] == 'friend'){
                var audio = new Audio('/sounds/accept.mp3');
                audio.play();
            //    alertify.delay(3000).success(data["username"] + ' accepted your friend request!');
                alertify.notify(data["username"] + ' accepted your friend request!', 'success', 3);
                renderFriendsList(sendMessage);
            }else if(data["status"] == 'declined'){
                var audio = new Audio('/sounds/reject.mp3');
                audio.play();
                alertify.notify(data["username"] + ' declined your friend request!', 'error', 3);
            //    alertify.delay(3000).error(data["username"] + ' declined your friend request!');
            }
        //    alert("you got a friend request, check notifications");
        });

        socket.on('remove-friend', function(data){
            //    alertify.log(data["username"] + ' has gone offline');
                alertify.notify(data["username"] + ' removed you from his/hers friend list', 'custom', 3);
                $("#mainRightSide").empty();
                renderFriendsList(sendMessage);
        });
        
        //renders notifications tab, function is located in relationship.js
        renderNotifications();

        
        //renders friends list, function is located in relationship.js
        renderFriendsList(sendMessage);