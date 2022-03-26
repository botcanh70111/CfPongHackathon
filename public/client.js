var host = window.location.href;
console.log(host);
var socket = io.connect('localhost');

let game_state;

//Changes text on searching for match page
let i = '';
let interval = setInterval(() => {
	document.getElementById('searching-for-match').innerHTML =
		'Game is started. \n Wating for other user' + i;
	i += '.';
	if (i == '.....') i = '';
}, 500);

window.onload = function (e) {
	if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
		document.getElementById('twoplayers').style.display = 'none';
	}
	let savedUserName = localStorage.getItem('user_name');
	if (savedUserName) {
		document.getElementById('input-username').value = savedUserName;
		socket.emit('get-game-history', savedUserName);
	}
};

//Control Ping
let ping_interval = setInterval(() => {
	// let time = Date.now();
	// socket.emit('get-ping', callback => {
	// 	document.getElementById('ping').innerHTML = `Ping: ${Date.now() -
	// 		time}ms`;
	// });
}, 500);

//Gets number of online players
socket.on('player-broadcast', players => {
	document.getElementById('online-players').innerHTML = `Users online: ${players}`;
});

//Game has begun
socket.on('game-started', data => {

	//Play sound when start game
	var audio = new Audio('./assets/start-game.mp3');
	audio.play();

	clearInterval(interval);
	game_state = new Pong(
		data.username,
		data.player,
		data.opp_username,
		data.ball
	);
	interval = setInterval(() => {
		game_state.update();
	}, (1 / 60) * 1000);
	document.getElementById('match-making').remove();
	document.getElementById('gameplay').style.display = 'flex';
	fit_canvas();
});

//Gets new game data and mutates gamestate
socket.on('game-data', (data, callback) => {
	game_state.game.self.score = data.score;
	game_state.game.opp.score = data.opp_score;
	game_state.game.ball = data.ball;
	game_state.game.opp.pos = data.opp_pos;
	game_state.game.self.winGames = data.self_win;
	game_state.game.opp.winGames = data.opp_win;
	callback(game_state.game.self.pos);

	if (data.game_state == 2) {
		setTimeout(() => {
			document.getElementById('gameplay').style.display = 'none';

			alert(`Player ${data.winner} win!`);
			location.reload();
		}, 1000);
	}
});

//Makes matchmaking div visible
socket.on('matchmaking-begin', () => {
	document.getElementById('match-making').style.display = 'block';
});

//Fit canvas to screen on resize
window.addEventListener('resize', fit_canvas);
function fit_canvas() {
	let canvas = document.getElementById('drawing-canvas');
	let parent = document.getElementById('gameplay');
	canvas.height = parent.offsetHeight - 10;
	canvas.width = parent.offsetWidth - 10;
}

//Sends username to server
function setUsername() {
	socket.emit(
		'set-username',
		document.getElementById('input-username').value,
		callback => {
			if (callback) {
				document.getElementById('start-screen').remove();
				console.log('username changed successfully');
			}
		}
	);
	localStorage.setItem('user_name', document.getElementById('input-username').value);
}


// create room
function createRoom() {
	socket.emit(
		'create-room',
		document.getElementById('input-username').value,
		callback => {
			console.log(callback);
			if (callback) {
				console.log("Create room successfully.");
			}
		}
	);
}


// create room
function joinRoom() {
	socket.emit(
		'join-room',
		{
			roomId: document.getElementById('input-room').value,
			userName: document.getElementById('input-username').value
		},
		callback => {
			console.log(callback);
			if (callback) {
				console.log("Joined room.");
			}
		}
	);
}

//Single Player vs CPU
function singlePlayer() {
	//Controls
	//Keyboard
	let KEYMAP = {};
	KEYMAP[87] = false;
	KEYMAP[83] = false;
	KEYMAP[38] = false;
	KEYMAP[40] = false;
	document.addEventListener('keydown', function (event) {
		KEYMAP[event.keyCode] = true;
	});
	document.addEventListener('keyup', function (event) {
		KEYMAP[event.keyCode] = false;
	});
	game = new Game(
		0,
		2,
		1,
		4
	)
	game_state = new Pong(
		"Player One",
		1,
		"Player Two",
		[50, 50]
	);
	clearInterval(interval);
	interval = setInterval(() => {
		if (KEYMAP[87] || KEYMAP[38]) game_state.upSelf();
		if (KEYMAP[83] || KEYMAP[40]) game_state.downSelf();
		game_state.update();
		game.update();
		game_state.game.self.score = game.players[0].score;
		game.players[0].pos = game_state.game.self.pos
		game_state.game.opp.score = game.players[1].score;
		game.players[1].pos = game_state.game.opp.pos
		game_state.game.ball = game.ball;
		if (game_state.game.opp.pos < game_state.game.ball[1]) game_state.game.opp.pos += 0.65;
		if (game_state.game.opp.pos > game_state.game.ball[1]) game_state.game.opp.pos -= 0.65;
	}, (1 / 60) * 1000);

	document.getElementById('match-making').remove();
	document.getElementById('gameplay').style.display = 'flex';
	fit_canvas();
}

//Two Player 1v1
function oneVerseOne() {
	//Controls
	//Keyboard
	let KEYMAP = {};
	KEYMAP[87] = false;
	KEYMAP[83] = false;
	KEYMAP[38] = false;
	KEYMAP[40] = false;
	document.addEventListener('keydown', function (event) {
		KEYMAP[event.keyCode] = true;
	});
	document.addEventListener('keyup', function (event) {
		KEYMAP[event.keyCode] = false;
	});
	game = new Game(
		0,
		2,
		1,
		4
	)
	game_state = new Pong(
		"Player One",
		1,
		"Player Two",
		[50, 50]
	);
	clearInterval(interval);
	interval = setInterval(() => {
		if (KEYMAP[87]) game_state.upSelf();
		if (KEYMAP[83]) game_state.downSelf();
		if (KEYMAP[38]) game_state.upOpp();
		if (KEYMAP[40]) game_state.downOpp();
		game_state.update();
		game.update();
		game_state.game.self.score = game.players[0].score;
		game.players[0].pos = game_state.game.self.pos
		game_state.game.opp.score = game.players[1].score;
		game.players[1].pos = game_state.game.opp.pos
		game_state.game.ball = game.ball;
	}, (1 / 60) * 1000);

	document.getElementById('match-making').remove();
	document.getElementById('gameplay').style.display = 'flex';
	fit_canvas();
}

//Handles opponent leaving game
socket.on('player-left', () => {
	socket.disconnect();
	document.location.reload();
});

//Mouse
$('#drawing-canvas').mousemove(function (e) {
	let mouse_pos = getMousePos(e);
	game_state.game.self.pos =
		(mouse_pos.y / document.getElementById('drawing-canvas').height) * 100;
});

function getMousePos(evt) {
	let canvas = document.getElementById('drawing-canvas');
	var rect = canvas.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}

function searchUserOnline() {
	let searchUser = document.getElementById('input-search-user').value;
	console.log('searchUserOnline: ', searchUser);
	socket.emit('search-users', searchUser);
}

//Mobile
document.addEventListener('touchstart', touchHandler);
document.addEventListener('touchmove', touchHandler);

function touchHandler(e) {
	if (e.touches) {
		let playerY =
			e.touches[0].pageY -
			document.getElementById('drawing-canvas').offsetTop;
		game_state.game.self.pos =
			(playerY / document.getElementById('drawing-canvas').height) * 100;
		e.preventDefault();
	}
}

document.getElementById('input-search-user').addEventListener('change', (data) => {
	socket.emit('search-users', data.target.value);
});


socket.on('search-users-result', result => {
	console.log(result);
})

socket.on('create-room-result', roomId => {
	console.log(roomId);
	document.getElementById("roomId").value = roomId;
	document.getElementById("roomId").style.display = "block";
});

socket.on('game-history-changed', data => {
	console.log('game histories', data);
	if (data && data.length > 0) {
		const historyEl = document.getElementById('game-history');
		data.sort(function (a, b) { return b.created_date - a.created_date }).forEach(history => {
			historyEl.innerHTML += `<p>${new Date(history.created_date).toString()} | ${history.player1} vs ${history.player2} (${history.player1_score}-${history.player2_score})</p>`
		});
	}
});