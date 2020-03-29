$(window).bind('load', function(){
    var friendsDivHeight = window.innerHeight - $("#actions-nav").position().top - 100;
    $("#actions").height(friendsDivHeight);

    var directoryDivHeight = window.innerHeight - $("#directory-nav").position().top - 100;
    $("#directory").height(directoryDivHeight);

    var notificationDivHeight = window.innerHeight - $("#notifications-nav").position().top - 100;
    $("#notifications").height(notificationDivHeight);
 });


$(window).resize(function() {
    var friendsDivHeight = window.innerHeight - $("#actions-nav").position().top - 100;
    $("#actions").height(friendsDivHeight);

    var directoryDivHeight = window.innerHeight - $("#directory-nav").position().top - 100;
    $("#directory").height(directoryDivHeight);

    var notificationDivHeight = window.innerHeight - $("#notifications-nav").position().top - 100;
    $("#notifications").height(notificationDivHeight);
});

$("#actions-nav").click(function(){
    var friendsDivHeight = window.innerHeight - $("#actions-nav").position().top - 100;
    $("#actions").height(friendsDivHeight);
    $("#friendsNav").children().show();
    $("#searchInput").val("");
});

$("#directory-nav").click(function(){
    var directoryDivHeight = window.innerHeight - $("#directory-nav").position().top - 100;
    $("#directory").height(directoryDivHeight);
    $("#directoryNav").empty();
});

$("#notifications-nav").click(function(){
    var notificationDivHeight = window.innerHeight - $("#notifications-nav").position().top - 100;
    $("#notifications").height(notificationDivHeight);
});

