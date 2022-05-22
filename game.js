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
}
class Snake extends Array{
    constructor(ws, ...params) {
        super(...params);
        this.ws = ws;
        this.color = Math.ceil(Math.random()*360);
    }
	move(dir) {
		var head = this[0];
		this.pop();

		var [x, y] = map.coords(head);
		var {w, h} = map;
		if(dir == 0) ++x;
		if(dir == 1) --y;
		if(dir == 2) --x;
		if(dir == 3) ++y;

		// if(wallKill) {
		// 	if(x <  0) this.dead = 1;
		// 	if(x >= w) this.dead = 1;
		// 	if(y <  0) this.dead = 1;
		// 	if(y >= h) this.dead = 1;
		// }else{
		// 	if(x <  0) x += w;
		// 	if(x >= w) x -= w;
		// 	if(y <  0) y += h;
		// 	if(y >= h) y -= h;
		// }

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
{
    let txt = "6789abc";
    let all = "0123456789abcdef";
    var randomOf = arr => arr[Math.floor(Math.random() * arr.length)];
    var rndClr = () => "#" + randomOf([
        [randomOf(all), randomOf(txt), randomOf(all)],
        [randomOf(all), randomOf(all), randomOf(txt)],
        [randomOf(txt), randomOf(all), randomOf(all)]
    ]).join("");
}
var map = new TileMap(15, 15);
var apple = -1;
var Snakes = [];
var randomTile = () => Math.floor(Math.random() * map.max);

var wallKill = 1;
var showGrid = 1;

function loop() {
    let l = Snakes.length;
    let alive = false;
    for(let i = 0; i < l; i++) {
        let snake = Snakes[i];
        if(snake.dead) continue;

        alive = true;
        snake.move(snake.dir);
        // if(snake[0] == apple) {
        //     let tail = snake[snake.length - 1];
        //     snake.push(tail, tail);
        //     apple = -1;
        // }
        // for(let j = i-1; j > -1; --j) {
        //     let snek = Snakes[j];
        //     if(snek.dead) continue;
        //     if(snek.includes(snake[0])) {
        //         snake.dead = true;
        //         if(snake[0] == snek[0]) {
        //             snek.dead = true;
        //         }
        //     }
        // }
    }
    if(!alive) Game.restart();
    if(apple == -1) do{
        apple = randomTile();
    }while(appleInSnake());
}
function appleInSnake() {
    for(let snake of Snakes) {
        if(snake.includes(apple)) {
            return true;
        }
    }
}

var Game = {
    Snake, loop,
    restart() {
        apple = -1;
        var i = 0;
        Snakes = [];
        for(let ws of this.sockets) {
            let p = i * 4 * map.w;
            let snake = new Snake(ws, [p]);
            Snakes.push(snake);
            ws.sendData({snake: [p], color: snake.color, restart: 1});
            ++i;
        }
    },
    remove(ws) {
        for(let snake of Snakes) {
            if(snake.ws == ws) snake.dead = 1;
        }
    },
    update(ws, Snake) {
        for(let snake of Snakes) {
            if(snake.ws == ws) {
                snake.dead = Snake.dead;
                snake.length = 0;
                for(let i = 0; i in Snake; i++) {
                    snake[i] = Snake[i];
                }
                snake.dir = Snake.dir;
            }
        }
    },
    newApple() {
        apple = -1;
    },
    get apple() {
        return apple;
    },
    get Snakes() {
        return Snakes;
    }
};
module.exports = Game;