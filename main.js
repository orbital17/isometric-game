var Direction = {
	N: new Point(-1, -1),
	S: new Point(1, 1),
	W: new Point(-1, 1),
	E: new Point(1, -1),
	NE: new Point(0, -1),
	SE: new Point(1, 0),
	SW: new Point(0, 1),
	NW: new Point(-1, 0)
}

var Character = function(tile, position) {
	this.tile = tile;
	this.position = position;
	this.direction = "S";
	this.movingSpeed = 3;
	this.currentSpeed = 0;

	this.destination = null;
	this.walk_callback = null;
}

Character.prototype.move = function(direction) {
	this.direction = direction;
	this.currentSpeed = this.movingSpeed;
}

Character.prototype.stop = function() {
	this.currentSpeed = 0;
	if (this.onDestination()) {
		this.destination = null;
		walk_callback = this.walk_callback;
		this.walk_callback = null;
		walk_callback();
	}
}

Character.prototype.isMoving = function() {
	return (this.currentSpeed !== 0);
}

Character.prototype.walk = function(direction, distance, callback) {
	this.destination = this.position.add(Direction[direction].mult(distance));
	this.move(direction);
	this.walk_callback = callback;
}

Character.prototype.onDestination = function() {
	return (this.destination && this.position.distanceTo(this.destination) < 3);
}

var World = function() {
	this.map = [];
	this.treeProbability = 0.05;
	this.width = 10;
	this.height = 10;
	this.generateMap();

	this.tileSize = 60;

	var characterTile = this.getFreeRandomTile();
	this.character = new Character(characterTile,
		characterTile.mult(this.tileSize).add(new Point(this.tileSize / 2, this.tileSize / 2))
		);
}

World.prototype.timerEvent = function() {
	if (this.character.isMoving()) {
		var newPosition = this.character.position.add(
			Direction[this.character.direction].mult(this.character.currentSpeed)
			);
		var tile = this.getTileByPoint(newPosition);
		if (this.tileExists(tile) && !this.isTreeOnTile(tile) && !this.character.onDestination()) {
			this.character.position = newPosition;
			this.character.tile = tile;
		} else {
			this.character.stop();
		}
	}
}

World.prototype.getTileByPoint = function(point) {
	return new Point(Math.floor(point.x / this.tileSize), Math.floor(point.y / this.tileSize));
}

World.prototype.generateMap = function() {
	for(var i = 0; i < this.height; ++i) {
		this.map.push(Array(this.width));
		for (var j = 0; j < this.width; ++j) {
			if (Math.random() < this.treeProbability) {
				this.map[i][j] = 1;
			} else {
				this.map[i][j] = 0;
			}
		}
	}
}

World.prototype.tileExists = function(tile) {
	return (0 <= tile.x && tile.x < this.width && 0 <= tile.y && tile.y < this.height);
}

World.prototype.isTreeOnTile = function(tile) {
	return (this.map[tile.y][tile.x] === 1);
}

World.prototype.getRandomTile = function() {
	function random(n) {
		return Math.floor(Math.random() * n);
	}
	return new Point(random(this.width), random(this.height));
}

World.prototype.getFreeRandomTile = function() {
	do {
		tile = this.getRandomTile();
	} while (this.isTreeOnTile(tile));
	return tile;
}

World.prototype.click = function(point) {
	var end = this.getTileByPoint(point);
	if (this.tileExists(tile) && !this.isTreeOnTile(tile)) {
		var path = this.findPath(this.character.tile, end);
		if (path) {
			this.moveCharacterByPath(path);
		}
	}
}

World.prototype.moveCharacterByPath = function(path) {
	//path example: ["N", "W", "S", "E"]
	var i = 0;
	var that = this;
	(function walk_callback() {
		if (i >= path.length) return;
		that.character.walk(path[i], that.tileSize, walk_callback);
		++i;
	})();
}

World.prototype.noTreeBetweenNeighborTiles = function(first, second) {
	return first.x === second.x || first.y === second.y ||
		!(this.isTreeOnTile(new Point(first.x, second.y)) || this.isTreeOnTile(new Point(second.x, first.y)));
}

World.prototype.findPath = function(start, end) {
	var map = [];
	for(var j = 0; j < this.height; ++j) {
		map.push(this.map[j].slice());
	}
	var greys = [start];
	map[start.y][start.x] = {
		path: []
	};
	var that = this;
	var result = null;
	function checkTile(tile, previous, direction) {
		if (that.tileExists(tile) && map[tile.y][tile.x] === 0 && 
			that.noTreeBetweenNeighborTiles(tile, previous)) {
			map[tile.y][tile.x] = {
				path: map[previous.y][previous.x].path.slice()
			};
			map[tile.y][tile.x].path.push(direction);
			greys.push(tile);
			if (tile.equals(end)) {
				result = map[tile.y][tile.x].path;
				return true;
			}
		}
		return false;
	}
	var tile, i;
	var directions = ["NE", "SE", "SW", "NW", "N", "S", "W", "E"]
	while (greys.length > 0) {
		tile = greys.shift();
		for (i = 0; i < directions.length; ++i) {
			if (checkTile(tile.add(Direction[directions[i]]), tile, directions[i])) {
				return result;
			}
		}
	}
	return null;
}

World.prototype.changeTileSize = function(value) {
	var oldValue = this.tileSize;
	this.character.position = this.character.position.mult(value * 1.0 / oldValue);
	this.character.movingSpeed *= value * 1.0 / oldValue;
	this.tileSize = value;
}

var Painter = function(ctx, world) {
	this.ctx = ctx;
	this.world = world;
	this.offset = new Point(ctx.canvas.width / 2, 0);

	this.tile = new Image();
	this.tile.src = "tile.png";

	this.tree = new Image();
	this.tree.src = "tree.png";

	characterSpriteImage = new Image();
	characterSpriteImage.src = "char.png";

	this.characterSprites = {
		"NE": new Sprite(characterSpriteImage, 0, 0, 32, 32, 4),
		"SE": new Sprite(characterSpriteImage, 0, 32, 32, 32, 4),
		"NW": new Sprite(characterSpriteImage, 0, 64, 32, 32, 4),
		"SW": new Sprite(characterSpriteImage, 0, 96, 32, 32, 4),
		"S": new Sprite(characterSpriteImage, 0, 128, 32, 32, 4),
		"N": new Sprite(characterSpriteImage, 0, 160, 32, 32, 4),
		"E": new Sprite(characterSpriteImage, 0, 192, 32, 32, 6),
		"W": new Sprite(characterSpriteImage, 0, 224, 32, 32, 6),
	};


	this.images = [this.tile, this.tree, characterSpriteImage];
	this.projection = new Projection();
}

Painter.prototype.onloadImages = function(callback) {
	var loaded = 0, that = this;
	for (var i = 0; i < this.images.length; ++i) {
		this.images[i].onload = function() {
			loaded++;
			if (loaded === that.images.length) {
				callback();
			}
		}
	}
}

Painter.prototype.drawWorld = function() {
	var position;
	for(var i = 0; i < this.world.height; ++i) {
		for (var j = 0; j < this.world.width; ++j) {
			position = this.projection.toIsometric(new Point(j, i)).mult(this.world.tileSize);
			this.drawImage(this.tile, position);
			if (this.world.map[i][j] === 1) {
				this.drawImage(this.tree, position);
			}
			if (this.world.character.tile.x === j && this.world.character.tile.y === i) {
				this.drawCharacter();
			}
		}
	}
}

Painter.prototype.drawImage = function(image, position) {
	this.ctx.drawImage(
		image,
		position.x + this.offset.x - this.world.tileSize,
		position.y + this.offset.y - image.height * this.world.tileSize * 2 / image.width + this.world.tileSize,
		this.world.tileSize * 2,
		image.height * this.world.tileSize * 2 / image.width
		);
}

Painter.prototype.drawCharacter = function() {
	this.characterSprites[this.world.character.direction]
	.draw(this.ctx, this.projection.toIsometric(this.world.character.position).add(this.offset), this.world.tileSize / 2);
}

Painter.prototype.timerEvent = function() {
	if (this.world.character.isMoving()) {
		this.characterSprites[this.world.character.direction].changeFrame();
	}
}

var Handler = function(painter) {
	this.painter = painter;
	this.canvas = painter.ctx.canvas;

	this.dragBeginPosition = null;
	this.dragBeginOffset = null;

	var that = this;
	this.canvas.onmousedown = function(e)
	{
		that.mouseDown(e.clientX, e.clientY);
	};
	this.canvas.onmouseup = function(e)
	{
		that.mouseUp(e.clientX, e.clientY);
	};
	this.canvas.onmousemove = function(e)
	{
		that.mouseMove(e.clientX, e.clientY);
	};
	this.canvas.addEventListener('touchstart', function(e)
	{
		e.preventDefault();
		that.mouseDown(e.touches[0].clientX, e.touches[0].clientY);
	});
	this.canvas.addEventListener('touchmove', function(e)
	{
		e.preventDefault();
		that.mouseMove(e.touches[0].clientX, e.touches[0].clientY);
	});
	this.canvas.addEventListener('touchend', function(e)
	{
		e.preventDefault();
		that.mouseUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
	});
	document.onkeydown = function(e)
	{
		that.keyDown(e);
	};
	document.onkeyup = function(e)
	{
		that.keyUp(e);
	};

	this.canvas.onmousewheel = function(e) {
		var delta = 10;
		if (e.wheelDelta > 0) {
			that.painter.world.changeTileSize(that.painter.world.tileSize + delta);

		} else if (that.painter.world.tileSize > delta) {
			that.painter.world.changeTileSize(that.painter.world.tileSize - delta);
		}
	};

	this.wasDrag = false;
	this.keyByCode = {
		38: "Up",
		39: "Right",
		40: "Down",
		37: "Left"
	}
	this.keyPressed = {
		"Up": false,
		"Down": false,
		"Right": false,
		"Left": false
	};
}

Handler.prototype.mouseDown = function(x, y) {
	this.dragBeginPosition = new Point(x, y);
	this.dragBeginOffset = this.painter.offset;
}

Handler.prototype.mouseUp = function(x, y) {
	this.dragBeginPosition = null;
	this.dragBeginOffset = null;
	if (!this.wasDrag) {
		this.painter.world.click(this.painter.projection.toCartesian(
			new Point(x - this.painter.offset.x, y - this.painter.offset.y)
			));
	}
	this.wasDrag = false;
}

Handler.prototype.mouseMove = function(x, y) {
	if (this.dragBeginPosition) {
		this.wasDrag = true;
		this.painter.offset = new Point(
			this.dragBeginOffset.x + x - this.dragBeginPosition.x,
			this.dragBeginOffset.y + y - this.dragBeginPosition.y
			);
	}
}

Handler.prototype.keyDown = function(e) {
	var key = this.keyByCode[e.keyCode];
	if (key in this.keyPressed && !this.keyPressed[key]) {
		this.keyPressed[key] = true;
		this.updateCharacter();
	}
}

Handler.prototype.keyUp = function(e) {
	var key = this.keyByCode[e.keyCode];
	if (key in this.keyPressed) {
		this.keyPressed[key] = false;
		this.updateCharacter();
	}
}

Handler.prototype.updateCharacter = function() {
	var that = this;
	function arrowPressed(first, second) {
		var checked = {};
		if (first) {
			checked[first] = true;
		}
		if (second) {
			checked[second] = true;
		}
		var result = true;
		var arrows = ["Up", "Down", "Right", "Left"];
		for(var i = 0; i < 4; ++i) {
			result = result && (checked[arrows[i]] && that.keyPressed[arrows[i]] || 
				!checked[arrows[i]] && !that.keyPressed[arrows[i]]);
		}
		return result;
	}
	var direction;
	switch (true) {
		case arrowPressed("Up"):
			direction = "N";
			break;
		case arrowPressed("Right"):
			direction = "E";
			break;
		case arrowPressed("Down"):
			direction = "S";
			break;
		case arrowPressed("Left"):
			direction = "W";
			break;
		case arrowPressed("Up", "Right"):
			direction = "NE";
			break;
		case arrowPressed("Right", "Down"):
			direction = "SE";
			break;
		case arrowPressed("Down", "Left"):
			direction = "SW";
			break;
		case arrowPressed("Left", "Up"):
			direction = "NW";
			break;
	}
	if (direction) {
		this.painter.world.character.move(direction);
	} else {
		this.painter.world.character.stop();
	}
}


var Timer = function(callback, interval) {
	this.interval = interval;
	this.callback = callback;
}

Timer.prototype.start = function() {
	this.id = setInterval(this.callback, this.interval);
}

Timer.prototype.stop = function() {
	clearInterval(this.id);
}

var Game = function(ctx) {
	this.ctx = ctx;
	this.world = new World();
	this.painter = new Painter(ctx, this.world);
	this.handler = new Handler(this.painter);

	var that = this;
	var redraw = function() {
		that.redraw();
		requestAnimationFrame(redraw);
	}
	this.painter.onloadImages(redraw);

	(new Timer(function() {
		that.timerEvent();
	}, 1000/60.0)).start();
}

Game.prototype.redraw = function() {
	this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
	this.ctx.fillStyle = "black";
	this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
	this.painter.drawWorld();
}

Game.prototype.timerEvent = function() {
	this.painter.timerEvent();
	this.world.timerEvent();
}


window.onload = function () {
	var canvas = document.getElementById("game");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	var ctx = canvas.getContext("2d");
	var game = new Game(ctx);
}