const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
const { v4: uuidv4 } = require('uuid');

const port = process.env.PORT || 5000;

const app = express()
app.use(cors({ origin: "http://127.0.0.1:5500" }))

const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: "http://127.0.0.1:5500",
		methods: ["GET", "POST"]
	}
})

let waitingSocket = null;
let waitingSocketVideo = null;

io.on("connection", (socket) => {

	socket.on("joinNewChat", (data) => {
		if (data.type == "text") {
			if (!waitingSocket) {
				waitingSocket = socket;
				socket.emit("waitingSocket");
			} else {
				const room_id = uuidv4();
				socket.join(room_id);
				waitingSocket.join(room_id);
				io.to(room_id).emit("chatRoomJoined", { room_id });
				waitingSocket = null;
			}
		} else {
			if (!waitingSocketVideo) {
				waitingSocketVideo = socket;
				socket.emit("waitingSocketVideo");
			} else {
				const room_id = uuidv4();
				socket.join(room_id);
				waitingSocketVideo.join(room_id);
				io.to(room_id).emit("chatRoomJoined", { room_id });
				waitingSocketVideo = null;
			}
		}
	})

	socket.on("offer", (data)=>{
		socket.to(data.room_id).emit("offer", data);
	})
	socket.on("answer", (data)=>{
		socket.to(data.room_id).emit("answer", data);
	})
	socket.on("icecandidate", (data)=>{
		socket.to(data.room_id).emit("icecandidate", data);
	})

	socket.on("chatMessage", (data) => {
		io.to(data.room_id).emit("receivedMessage", data);
	})


	socket.on("userDisconnect", (data) => {
		if (data.room_id) {
			io.to(data.room_id).emit("userDisconnectedFromRoom");
			socket.leave(data.room_id);
		}
	})


});

server.listen(port, (err) => {
	if (err) {
		console.log("Error Starting server...!!");
	}
	console.log(`Server is running on port: ${port}`);
})