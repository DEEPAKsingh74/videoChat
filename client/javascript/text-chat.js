let socket = io("http://127.0.0.1:5000");
let isChatJoined = false;
let userId = false;


function getRandomId() {
	const timeStamp = new Date().getTime().toString(16);
	const randomPart = (Math.random() * 100000000000).toString(16).substring(0, 8);
	return `${timeStamp}${randomPart}`.toUpperCase();
}

$(document).ready(function () {

	$(".new-chat").on("click", function () {
		if (isChatJoined) {
			socket.emit("userDisconnect", { room_id: isChatJoined });
		}
		socket.emit("joinNewChat", { type: "text" });
	});

	socket.on("waitingSocket", () => {
		$(".new-chat").css({ "display": "none" });
		$(".footer").html("<span class='connecting'>Connecting...</span>");
		$(".body").css({ "background-color": "rgb(48, 71, 87)" });
		$(".body").html(`<img src="./images/chat-loading.gif" class="chat-load-img"/>`);
	})

	socket.on("chatRoomJoined", (data) => {
		$(".new-chat").css({ "display": "flex" });
		userId = getRandomId();
		isChatJoined = data.room_id;

		let inputBox = $("<input>", {
			id: "input-msg",
			type: "text",
			placeholder: "Type a message."
		});
		let sendButton = $("<button>", {
			text: "Send"
		});
		$(".footer").empty().append(inputBox, sendButton);


		$(".body").css({ "background-color": "rgba(118, 164, 165, 0.237)" });
		$(".body").empty();

		$(sendButton).click(function () {
			if (isChatJoined) {
				const inputMessage = $("#input-msg").val();
				if (inputMessage != "") {
					console.log('chat');
					socket.emit("chatMessage", { userId: userId, room_id: isChatJoined, inputMessage: inputMessage });
					$("#input-msg").val("");
				}
			} else {
				alert("no chat joined");
			}
		});
	});


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
		$(".footer").empty();
		const $spanTag = $("<span class='disconnect'>User disconnected, try a new chat..</span>");
		$(".body").append($spanTag);
	});


})