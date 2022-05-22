const http = require('http');
const fs = require('fs');
/*const opts = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};*/
const express = require('express');
const path = require('path');
// const app = express();
// app.use(express.json());
// app.use(express.static("Game"));
// //Default URL for website
// app.use('/', function(_req, res) {
// 	//__dirname : It will resolve to your project folder.
// 	res.sendFile(path.join(__dirname + '/Game/index.html'));
// });
// //Object.assign(app, opts);
// const server = http.createServer(app);
// const port = 3000;
// server.listen(port);
// console.debug('Server listening on port ' + port);
{//Game server
const app = express();
app.use(express.json());
app.use(express.static("Game"));
//Default URL for website
app.use('/', function(_req, res) {
	//__dirname : It will resolve to your project folder.
	res.sendFile(path.join(__dirname + '/Game/index.html'));
});
const server = http.createServer(app);
const port = 4000;
server.listen(port);
console.debug('Game listening on port ' + port);
	
const WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({server});
}

wss.on('connection', async ws => {
	ws.onmessage = event => {
		var obj;
		try{
			obj = JSON.parse(event.data);
		}catch(err) {}
		if(obj instanceof Object)
			onData(obj);
	};
	var close = () => {
		console.log("Left");
		Game.remove(ws);
	};
	var room, name;
	ws.onclose = close;
	ws.onerror = close;
	var sendData = data => (
		// console.log(data),
		ws.send(JSON.stringify(data))
	);
	ws.sendData = sendData;
	/**@param {clientData} data*/
	var onData = async data => {
		/**@type {serverData}*/
		var reply = {};
		// if(data.update) reply.time = `${time}`;

		if(data.snake) {
			Game.update(ws, data.snake);
		}
		if(data.EAT) {
			Game.newApple();
		}
		if(data.update) {
			// reply.apple = Game.apple;
			let arr = [];
			for(let snake of Game.Snakes) {
				if(snake.ws == ws) continue;
				var obj = {...snake};
				delete obj.ws;
				arr.push(obj);
			}
			reply.snakes = arr;
			// console.log(arr);
		}
		
		if(Object.keys(reply).length) {
			sendData(reply);
		}
	};
	console.log("Joined");
	ws.update = () => onData({update: true});
});

var time = 0n;
var lastApple;
function update() {
	++time;
	Game.loop();
	wss.clients.forEach(ws => {
		ws.update();
	});
	if(Game.apple != lastApple) {
		lastApple = Game.apple;
		wss.clients.forEach(ws => {
			ws.sendData({apple: lastApple});
		});
	}
}
var Game = require("./game.js");
Game.sockets = wss.clients;
setInterval(update, 150);

const {networkInterfaces: net} = require("os");
const { Snake } = require('./game');
let nets = net();
for(let n in nets) {
	for(let ip of nets[n]) {
		if(ip.family == "IPv4" && !ip.internal) {
			console.log(ip.address);
		}
	}
}