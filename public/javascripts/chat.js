var socket=io();
var myUserName;



function enableUserName(enabled){
	$('input#userName').prop('disabled',!enabled);
}

function setFeedback(fb) {
  $('span#feedback').html(fb);
}

function appendNewUser(uName,notify){
	$('select#users').append($('<option></option>').val(uName).html(uName));
	if(notify && (uName != myUserName)){
		$('#msgWindow').append("<span id='admin-msg'> ==>"+uName+" has joined the chatroom</span><br>");
	}
}


function appendNewMessage(msg){
	var html;
	if(msg.target=='All'){
		html = "<span class='all-msg'>"+msg.source+"  :"+msg.message+"</span><br>";
	}

	else{
		html = "<span class='private'>"+msg.source+"(P):   "+msg.message+"</span>";
	}
	$("#msgWindow").append(html);
}

function handleLeftUsers(msg){
	$("select#users option[value='"+msg.username+"']").remove();
}


function setUserName(){
	myUserName = $('input#userName').val();
	socket.emit('set username',$('input#userName').val(),function(data){
		console.log("emit set user name " + data);
	});

	console.log("User name " + myUserName + " is set.");
}


function sendMessage(){

	var targetUsers = $('select#users').val();
	socket.emit('message',{
	
		"inferSrcUser":true,
		"source":myUserName,
		"target":targetUsers,
		"message":$('input#msg').val()

	});
	$('input#msg').val("");
}

function setCurrentUsers(usersStr){
    $('select#users >option').remove()
    appendNewUser('All', false)
    JSON.parse(usersStr).forEach(function(name) {
    	appendNewUser(name, false);
    });
    $('select#users').val('All').attr('selected', true);
}

$(function(){
	
	socket.on('userJoined',function(msg){
		appendNewUser(msg.username,true);
	});

	socket.on('userLeft',function(msg){
		handleLeftUsers(msg);
	});
	socket.on('message',function(msg){
		console.log("received a message " + msg.message);
		appendNewMessage(msg);
	});
	socket.on('welcome',function(grazia){
		setFeedback("<span style='color: green'> Username available. You can begin chatting.</span>");
		setCurrentUsers(grazia.currentUsers);
	});
	socket.on('error1',function(msg){
		console.log('error recvd on client side ');
		if(msg.UserNameInUse){
			setFeedback("<span style='color: red'> Username already in use. </span>");
		}
	});

	//set username
	$('input#userName').change(setUserName);
	$('input#msg').change(sendMessage);
	$('input#userName').keypress(function(e){
		if(e.code==13){
			setUserName();
			e.stopPropagation();
			e.stopped = true;
			e.preventDefault();
		}
	});
	$('input#msg').keypress(function(e){
		if(e.code == 13){
			sendMessage();
			e.stopPropagation();
			e.stopped = true;
			e.preventDefault();
		}
	});
});

