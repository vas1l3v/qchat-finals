var express = require('express');
var router = express.Router();

router.get('/', function(req, res){
    if(req.isAuthenticated()){
        res.render('home',{layout:false});
    }else{
        res.render('login', {layout: 'auth_layout'});
    }
        
    
});

router.get('/home', function(req, res){
    res.render('home',{layout:false});
});

module.exports = router;