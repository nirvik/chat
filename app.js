var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var http = require('http');
var app = express();
var port = process.env.PORT || 8000;
var sio = require('socket.io');

var server = http.createServer(app);
server.listen(port);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var io = sio.listen(server); //listen to events

var CLIENT_DICT = {};
var SOCKETS_OF_CLIENTS = {};

console.log("OKAY THIS SHIT IS LISTENING ON " + port);

function userjoined(uName){

	// you kinda need to broadcast it to everybody
	var users = Object.keys(CLIENT_DICT);
	Object.keys(SOCKETS_OF_CLIENTS).forEach(function(id){
		io.sockets.connected[id].emit('userJoined',{
		'username':uName,
		});
	});
}

function userLeft(uName){	
	// To all
	io.sockets.emit('userLeft',{'username':uName});
}


function usernameAlreadyInUse(sId,uName){
	setTimeout(function(){
		io.sockets.connected[sId].emit('error1',{'UserNameInUse':true});
	},500);
}

function userNameAvailable(sId,uName){

	setTimeout(function() {
		io.sockets.connected[sId].emit('welcome',{'username':uName,'currentUsers':JSON.stringify(Object.keys(CLIENT_DICT))});
	},500);
}

io.sockets.on('connection',function(client){	
	client.on('set username',function(username){
		if(CLIENT_DICT[username]==undefined){	
			SOCKETS_OF_CLIENTS[client.id]  = username;
			CLIENT_DICT[username] = client.id;
			userNameAvailable(client.id,username);
			userjoined(username);
		}
		else{
			usernameAlreadyInUse(client.id,username);
		}
	});

	client.on('message',function(msg){
		console.log(msg.target);
		if(msg.target == 'All'){
			io.sockets.emit('message',{
				source:msg.source,
				message:msg.message,
				target:msg.target
			});
		}

		else {
				
			io.sockets.connected[CLIENT_DICT[msg.target]].emit('message',{
				source:msg.source,
				message:msg.message,
				target:msg.target
			});
		}
	});

	client.on('disconnect',function(msg){
		var uName = SOCKETS_OF_CLIENTS[client.id];
		delete SOCKETS_OF_CLIENTS[client.id];
		delete CLIENT_DICT[uName];

		userLeft(uName);
	});
});





module.exports = app;
