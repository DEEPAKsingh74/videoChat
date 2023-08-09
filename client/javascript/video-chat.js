const socket = io("http://127.0.0.1:5000");
let room_id = null;
let userId = false;
let localStream;
let remoteStream;
let peerConnection;


function getRandomId() {
	const timeStamp = new Date().getTime().toString(16);
	const randomPart = (Math.random() * 100000000000).toString(16).substring(0, 8);
	return `${timeStamp}${randomPart}`.toUpperCase();
}

const server = {
	iceServers : [
		{urls : ['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302']}
	]
}

const createPeerConnection = async()=>{
	peerConnection = new RTCPeerConnection(server);

	remoteStream = new MediaStream();
	document.querySelector(".remote").srcObject = remoteStream;

	localStream.getTracks().forEach((track) => {
		peerConnection.addTrack(track, localStream);
	});

	peerConnection.ontrack = (event)=>{
		event.streams[0].getTracks().forEach((track)=>{
			remoteStream.addTrack(track);
		})
	}

	peerConnection.onicecandidate = (event)=>{
		if(event.candidate){
			socket.emit("icecandidate", {room_id : room_id, candidate : candidate});
		}
	}
}


const createOffer = async()=>{
	await createPeerConnection();
	const offer = await peerConnection.createOffer();
	await peerConnection.setLocalDescription(offer);

	socket.to(room_id).emit("offer", {room_id : room_id, offer : offer});
}

const addAnswer = async(answer)=>{
	if(!peerConnection.currentRemoteDescription){
		peerConnection.setRemoteDescription(answer);
	}
}

const createAnswer = async(offer)=>{
	await createPeerConnection();
	await peerConnection.setRemoteDescription(offer);
	let answer = await peerConnection.createAnswer();
	await peerConnection.setLocalDescription(answer);

	socket.to(room_id).emit("answer", {room_id : room_id, answer : answer});
}

const init = async()=>{
	localStream = await navigator.mediaDevices.getUserMedia({audio : false, video : true})
	document.querySelector(".local").srcObject = localStream;

	createOffer();
}

$(document).ready(function(){

	$("#chat-msg").on("click", function(){
		$(".chat-messages").css({"display" : "block"});
	})
	$(".cut-chat").on("click", function(){
		$(".chat-messages").css({"display" : "none"});
	})

	$("#mic").on("click", function(){
		let currentSrc = $(this).attr("src");
		let newSrc = (currentSrc == "./images/mic.png" ? "./images/mute.png" : "./images/mic.png");
		$(this).attr('src', newSrc);
	})
	$("#video").on("click", function(){
		let currentSrc = $(this).attr("src");
		let newSrc = (currentSrc == "./images/video.png" ? "./images/video-mute.png" : "./images/video.png");
		$(this).attr('src', newSrc);
	})


	$("#new-chat").on("click", function () {
		if (room_id) {
			socket.emit("userDisconnect", { room_id: room_id });
		}
		socket.emit("joinNewChat", { type: "video" });
	});

	socket.on("waitingSocketVideo", () => {
		$("#new-chat").css({ "display": "none" });
		$(".input-message").html("<span class='connecting'>Connecting...</span>");
		$(".body").css({ "background-color": "rgb(48, 71, 87)" });
		$(".body").html(`<img src="./images/chat-loading.gif" class="chat-load-img"/>`);
	})

	socket.on("chatRoomJoined", (data) => {
		$("#new-chat").css({ "display": "flex" });
		userId = getRandomId();
		room_id = data.room_id;
		init();
		let inputBox = $("<input>", {
			id: "input-msg",
			type: "text",
			placeholder: "Type a message."
		});
		let sendButton = $("<button>", {
			text: "Send"
		});
		$(".input-message").empty().append(inputBox, sendButton);

		$(".body").css({ "background-color": "rgba(118, 164, 165, 0.237)" });
		$(".body").empty();

		$(sendButton).click(function () {
			if (room_id) {
				const inputMessage = $("#input-msg").val();
				if (inputMessage != "") {
					socket.emit("chatMessage", { userId: userId, room_id: room_id, inputMessage: inputMessage });
					$("#input-msg").val("");
				}
			} else {
				alert("no chat joined");
			}
		});
	})


	socket.on("receivedMessage", (data) => {
		if (data.userId === userId) {
			const $divElement = $('<div class="you"></div>');
			const $paraElement = $(`<p>${data.inputMessage}</p>`);
			$divElement.append($paraElement);
			$(".body").append($divElement);
		} else {
			const $divElement = $('<div class="stranger"></div>');
			const $paraElement = $(`<p>${data.inputMessage}</p>`);
			$divElement.append($paraElement);
			$(".body").append($divElement);
		}
	})

	socket.on("userDisconnectedFromRoom", () => {
		$(".body").empty();
		$(".input-message").empty();
		const $spanTag = $("<span class='disconnect'>User disconnected, try a new chat..</span>");
		$(".body").append($spanTag);
	});


	socket.on("answer", (data)=>{
		addAnswer(data.answer);
	})

	socket.on("offer", (data)=>{
		createAnswer(data.offer);
	})

	socket.on("icecandidate", (data)=>{
		if(peerConnection){
			peerConnection.addIceCandidate(data.candidate);
		}
	})
})