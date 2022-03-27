var express = require('express');
const uuid = require('uuid');
var Game = require('./Game');
var app = express();
const HERTZ = 30; //Game updates per second
const port = process.env.PORT || 80;
var server = require('http')
	.createServer(app)
	.listen(port);
var io = require('socket.io')(server);
const uNRegex = new RegExp('^[a-zA-Z0-9_.-]{3,}$');

app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res, next) {
	res.sendFile(__dirname + '/public/index.html');
});

//User class
class User {
	constructor(socket) {
		this.socket = socket;
		this.username = socket.id;
		this.userId = "";
		this.game = { id: null, playing: false };
	}
}

//Stores all connected users
let users = {};
let matchmaking = [];
let privateRooms = {};
let games = {};

//Manages sockets
io.on('connection', socket => {
	console.log(`New client connected: ${socket.id}`);

	users[socket.id] = new User(socket);

	socket.broadcast.emit('player-broadcast', Object.keys(users).length);
	socket.emit('player-broadcast', Object.keys(users).length);
	users[socket.id].socket.emit('new-connection-client');

	socket.on('set-user-id', (userId) => {
		users[socket.id].userId = userId;
	});

	//Checks for duplicate usernames
	socket.on('play-online', (username, callback) => {
		console.log(`username start new game online: ${username}`);
		callback(true);
			socket.emit('matchmaking-begin');
			matchMaker(socket.id);
	});

	socket.on('change-username', (userInfo) => {
		for (var key in users) {
			var user = users[key];
			if (user.username == userInfo.username) {
				if (user.userId != userInfo.userId) {
					same_username = true;
				}
			}

			if (user.userId == userInfo.userId) {
				console.log('change username:', user.userId, userInfo.username);
				console.log('change username, socketId', socket.id);
				user.username = userInfo.username;
				user.socket.emit('change-username-result', userInfo);
			}
		}
	});

	socket.on('get-ping', callback => {
		callback(true);
	});

	socket.on('search-users', (data) => {
		const result = [];
		for (var key in users) {
			var user = { id: key, username: users[key].username, playing: users[key].game.playing };
			console.log('search-xxxx', user);
			if (user.username.trim().toLowerCase().includes(data.trim().toLowerCase())) {
				result.push(user);
			}
		}
		socket.emit('search-users-result', result);
		console.log('search-users', data, users, result);
	});

	socket.on('create-room', (username, callback) => {
		users[socket.id].username = username;
		let roomId = createRoom(socket);
		callback(true);
		console.log(roomId);
		socket.emit('create-room-result', roomId);
		console.log('t2')
		socket.emit('game-history-changed', getUserGameHistory(username));
	});

	socket.on('join-room', (player2) => {
		joinRoom(player2, socket);
	});

	socket.on('get-game-history', (savedUserName) => {
		socket.emit('game-history-changed', getUserGameHistory(savedUserName));
	});

	//Disconnects user
	socket.on('disconnect', () => {
		console.log(`Client Disconnected: ${users[socket.id].username}`);
		delete users[socket.id];
		socket.broadcast.emit('player-broadcast', Object.keys(users).length);
		if (matchmaking.length != 0 && matchmaking[0] == socket.id) {
			matchmaking = [];
		}
		//Removes user from current game and notifices other player - could use the game-id from player object but cbs
		for (key in games) {
			let game = games[key];
			let user = users[game.player1 == socket.id ? game.player2 : game.player1];
			if (user && user.socket) {
				user.socket.emit('player-left');
				console.log('t3')
				user.socket.emit('game-history-changed', getUserGameHistory(user.username));
			}
			if (game) {
				game.state = 3;
				game.ended_date = Date.now();
			}
		}
	});
});

//Very simple matchmaking, as soon as theres two people in queue it matches them together
//theoretically there should never be more than two people in the queue at any one time.
function matchMaker(new_player) {
	if (matchmaking.length != 0) {
		var game = new Game(
			matchmaking[0],
			users[matchmaking[0]].username,
			new_player,
			users[new_player].username
		);
		games[game.id] = game;

		//This is all completely un-needed but may be useful for future additions to the game
		users[matchmaking[0]].game.id = game.id;
		users[new_player].game.id = game.id;
		users[matchmaking[0]].game.playing = true;
		users[new_player].game.playing = true;

		users[new_player].socket.emit('game-history-changed', getUserGameHistory(users[new_player].username));
		users[matchmaking[0]].socket.emit('game-history-changed', getUserGameHistory(users[matchmaking[0]].username));

		//Tells players that a game has started - allows client to initialise view
		users[matchmaking[0]].socket.emit('game-started', {
			username: users[matchmaking[0]].username,
			player: 1,
			opp_username: users[new_player].username,
			ball: game.ball
		});
		users[new_player].socket.emit('game-started', {
			username: users[new_player].username,
			player: 2,
			opp_username: users[matchmaking[0]].username
		});
		console.log(`Game ${game.id} has started.`);
		matchmaking = [];
	} else {
		matchmaking.push(new_player);
	}
}

function createRoom(socket) {
	let roomId = uuid.v4();
	privateRooms[roomId] = socket.id;

	return roomId;
}

function joinRoom(player2, socketPlayer2) {
	users[socketPlayer2.id].username = player2.username;
	let user1Key = privateRooms[player2.roomId];
	let user2 = users[socketPlayer2.id];
	let user1 = users[user1Key];

	var game = new Game(
		user1Key,
		user1.username,
		socketPlayer2.id,
		user2.username
	);

	games[game.id] = game;

	users[user1Key].game.id = game.id;
	users[socketPlayer2.id].game.id = game.id;
	users[user1Key].game.playing = true;
	users[socketPlayer2.id].game.playing = true;

	//Tells players that a game has started - allows client to initialise view
	users[user1Key].socket.emit('game-started', {
		username: users[user1Key].username,
		player: 1,
		opp_username: users[socketPlayer2.id].username,
		ball: game.ball
	});
	users[socketPlayer2.id].socket.emit('game-started', {
		username: users[socketPlayer2.id].username,
		player: 2,
		opp_username: users[user1Key].username
	});

	users[game.player2].socket.emit('game-history-changed', getUserGameHistory(users[user1Key].username))
	users[game.player2].socket.emit('game-history-changed', getUserGameHistory(users[socketPlayer2.id].username))
}

function startGame(username1, username2) {

}

//Sends new game data to each of the respective players in each game, every x milliseconds
setInterval(() => {
	for (key in games) {
		let game = games[key];
		if (game.state == 2 || game.state == 3) {
			if (users[game.player1] && users[game.player1].socket) {
				users[game.player1].socket.emit('game-history-changed', getUserGameHistory(game.players[game.player1].username));
			}
			if (users[game.player2] && users[game.player2].socket) {
				users[game.player2].socket.emit('game-history-changed', getUserGameHistory(game.players[game.player2].username));
			}
			continue;
		}
		console.log(JSON.stringify(game));

		if (game.delayInterval > 0) {
			game.delayInterval--;
			continue;
		}

		game.update();
		data = {
			1: {
				score: game.players[game.player1].score,
				pos: game.players[game.player1].pos,
				winGames: game.players[game.player1].winGames
			},
			2: {
				score: game.players[game.player2].score,
				pos: game.players[game.player2].pos,
				winGames: game.players[game.player2].winGames
			},
			ball: game.ball
		};

		users[game.player2].socket.emit(
			'game-data',
			{
				score: data[2].score,
				self_win: data[2].winGames,
				opp_win: data[1].winGames,
				opp_score: data[1].score,
				opp_pos: data[1].pos,
				ball: data.ball,
				game_state: game.state,
				winner: game.winner,
				delayInterval: game.delayInterval
			},
			callback => {
				game.players[game.player2].pos = callback;
			}
		);
		users[game.player1].socket.emit(
			'game-data',
			{
				score: data[1].score,
				self_win: data[1].winGames,
				opp_win: data[2].winGames,
				opp_score: data[2].score,
				opp_pos: data[2].pos,
				ball: data.ball,
				game_state: game.state,
				winner: game.winner,
				delayInterval: game.delayInterval,
			},
			callback => {
				game.players[game.player1].pos = callback;
			}
		);
	}
}, (1 / HERTZ) * 1000);

function getUserGameHistory(username) {
	const history = [];
	for (key in games) {
		let game = games[key];
		console.log(username, Object.getOwnPropertyNames(games).length, game.players[game.player1].name, game.players[game.player2].name);
		if (game.players[game.player1].name == username || game.players[game.player2].name == username) {
			history.push({
				player1: game.players[game.player1].name,
				player2: game.players[game.player2].name,
				player1_score: game.players[game.player1].winGames,
				player2_score: game.players[game.player2].winGames,
				created_date: game.created_date,
				ended_date: game.ended_date,
				state: game.state
			});
		}
	}
	return history;
}