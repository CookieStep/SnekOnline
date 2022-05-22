var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");

var ws;
async function wsSetup() {
	ws = new WebSocket(location.href.replace("http", "ws"));
	ws.open = new Promise(r=>ws.onopen = r);
	ws.onmessage = ev => onData(JSON.parse(ev.data));
	ws.onclose = err => {
		alert("Connection to server lost, please reload the page");
	};
	await ws.open;
}
function sendData(obj) {
	ws.send(JSON.stringify(obj));
}
function onData(obj) {
	if("apple" in obj) apple = obj.apple;
	if(obj.restart) {
		delete snake.dead;
		snake.dir = 0;
		snake.lastDir = 0;
		if(!run) setTimeout(loop, 150);
	}
	if(obj.color) snake.color = obj.color;
	if(obj.snake) {
		snake.length = 0;
		snake.dead = obj.snake.dead;
		let l = obj.snake.length;
		for(let i = 0; i < l; i++) {
			snake[i] = obj.snake[i];
		}
	}
	if(obj.snakes) {
		Snakes = [snake];
		for(let snek of obj.snakes) {
			let snake = new Snake(0);
			Object.assign(snake, snek);
			Snakes.push(snake);
		}
	}
}
function updateSnake() {
	sendData({snake: {...snake}});
}

onload = () => {
	document.body.appendChild(canvas);
	onresize();
	wsSetup();
	init();
};
onresize = () => {
	canvas.width = innerWidth;
	canvas.height = innerHeight;
};

class TileMap{
    constructor(w=1, h=1) {
        this.w = w;
        this.h = h;
    }
    index(x, y) {
        return x + y * this.w;
    }
    coords(i) {
        var x = i % this.w;
        return [x, (i - x)/this.w];
    }
    get max() {
        return this.index(this.w-1, this.h-1)+1;
    }
    draw() {
        ctx.fillStyle = "black";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 0.1;
        ctx.strokeRect(0, 0, this.w, this.h);

        if(showGrid) for(let i = 0; i < this.max; i++) {
            var [x, y] = this.coords(i);
            ctx.strokeRect(x, y, 1, 1);
        }
    }
}
class Snake extends Array{
	move(dir) {
		var head = this[0];
		this.pop();

		var [x, y] = map.coords(head);
		var {w, h} = map;
		if(dir == 0) ++x;
		if(dir == 1) --y;
		if(dir == 2) --x;
		if(dir == 3) ++y;

		if(wallKill) {
			if(x <  0) this.dead = 1;
			if(x >= w) this.dead = 1;
			if(y <  0) this.dead = 1;
			if(y >= h) this.dead = 1;
		}else{
			if(x <  0) x += w;
			if(x >= w) x -= w;
			if(y <  0) y += h;
			if(y >= h) y -= h;
		}

		if(!this.dead) {
			head = map.index(x, y);
			if(this.includes(head)) {
				this.dead = true;
			}
			this.unshift(head);
		}else{
			this.unshift([x, y]);
		}

		this.lastDir = dir;
	}
	dir = 0;
	lastDir = 0;
}
var binds = {
	KeyD: 0,
	KeyW: 1,
	KeyA: 2,
	KeyS: 3,
	ArrowRight: 0,
	ArrowUp:    1,
	ArrowLeft:  2,
	ArrowDown:  3
};
onkeydown = ({code}) => {
	if(code in binds) {
		var dir = binds[code];
		var a = Math.abs(snake.lastDir - dir);
		if(a != 2 && a != 0) {
			snake.dir = dir;
		}else{
			if(snake.dir != snake.lastDir) {
				snake.nextDir = dir;
			}
		}
	}

	if(snake.dead && code == "Space") {
		init();
	}
}

var map = new TileMap(15, 15);
var snake = new Snake(0);
var apple = -1;
var ID;
var randomTile = () => Math.floor(Math.random() * map.max);

var wallKill = 1;
var showGrid = 1;
var run = false;
var Snakes = [];

function init() {

	loop();
}
function loop() {
	run = true;
	var ME = snake;
	// snake.move(snake.dir);
	// if(snake[0] == apple) {
	// 	let tail = snake[snake.length - 1];
	// 	snake.push(tail, tail);
	// 	sendData({EAT: true});
	// 	do{
	// 		apple = randomTile();
	// 	}while(snake.includes(apple));
	// }

	var l = Snakes.length;
    for(let i = 0; i < l; i++) {
        let snake = Snakes[i];
        if(snake.dead) continue;

        alive = true;
		if(snake == ME && snake.lastDir != snake.dir) {
			updateSnake();
		}
        snake.move(snake.dir);
		if("nextDir" in snake) {
			snake.dir = snake.nextDir;
			delete snake.nextDir;
		}
        if(snake[0] == apple) {
            let tail = snake[snake.length - 1];
            snake.push(tail, tail);
			if(snake == ME) {
				apple = -1;
				sendData({EAT: true});
			}
        }
        for(let j = i-1; j > -1; --j) {
            let snek = Snakes[j];
            if(snek.dead) continue;
            if(snek.includes(snake[0])) {
                snake.dead = true;
                if(snake[0] == snek[0]) {
                    snek.dead = true;
                }
            }
        }
		if(snake.dead && snake == ME) {
			updateSnake();
		}
    }

	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.translate((canvas.width-35*map.w)/2, (canvas.height-35*map.h)/2);
	ctx.scale(35, 35);
	map.draw();

	for(let snake of Snakes) {
		ctx.fillStyle = snake.dead? "#000": (snake.color? `hsl(${snake.color}, 100%, 50%)`: "#0f0");
		let last;
		let p = .2;
		let w = 1 - p*2;
		for(let i of snake) {
			let x, y;
			if(typeof i == "number") {
				[x, y] = map.coords(i);
			}else{
				[x, y] = i;
			}
			ctx.fillRect(x+p, y+p, w, w);

			let lx, ly;
			if(typeof last == "number") {
				[lx, ly] = map.coords(last);
			}else if(last) {
				[lx, ly] = last;
			}
			ctx.fillRect((lx+x)/2+p, (ly+y)/2+p, w, w);

			last = i;
		}
	}
	{
		let p = .1;
		let w = 1 - p*2;

		let [x, y] = map.coords(apple);
		ctx.fillStyle = "#f00";
		ctx.fillRect(x+p, y+p, w, w);
	}

	ctx.resetTransform();
	// if(!snake.dead) {
		setTimeout(loop, 150);
	// }else run = false;
}