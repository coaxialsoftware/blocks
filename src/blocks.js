
var
	/* CONSTANTS */
	BLOCK_WIDTH = 48,
	BLOCK_HEIGHT= 48,
	BLOCK_PIECES= 7,
	BLOCK_COLORS= 9,
	PIECE_WIDTHS = [3,4,3,2,3,3,3],
	BOARD_X = 200,
	BOARD_Y = 24,
	BOARD_WIDTH = 10,
	BOARD_HEIGHT= 18,
	WIDTH = 640,
	HEIGHT= 480,

	/* Elements */
	_ss,
	audio
;

function game(j5g3)
{
	_ss = j5g3.spritesheet('spritesheet').grid(10,2);

	audio = { 
		pop   : j5g3.id('audio-pop'),
		slide : j5g3.id('audio-slide'),
		rotate: j5g3.id('audio-rotate'),
		line  : j5g3.id('audio-line')
	};
var
	engine = this,
	
	restart = game.restart = function()
	{
		board.clear();
		j5g3.id('game-over').style.display = 'none';
		current.remove();
		current = 0;
		go_next();
		engine.resume();
		j5g3.id('screen').style.display = 'block';
		lines = 0; score = 0;
		updateScore();
		j5g3.h1.Keyboard.capture();
	},

	game_over = function()
	{
		j5g3.h1.Keyboard.release();
		j5g3.id('game-over').style.display = 'block';
		engine.stage.canvas.style.display = 'none';
		engine.pause();
	},

	/* Gets next piece as a clip, and centers it to its origin */
	get_next = function()
	{
		return new game.Piece({ 
			piece: parseInt(j5g3.rand(BLOCK_PIECES)),
			color: parseInt(j5g3.rand(BLOCK_COLORS))+1,
			board: board
		});
	},

	check_game_over = function()
	{
		var i=1, map=board.map[0];
		for (; i<BOARD_WIDTH; i++)
			if (map[i])
				return game_over();
	},

	go_next = function() {
		// TODO replace this please.
		var starty = { 2: -1, 3: -.5, 4: 0 }, mapY = { 2: 2, 3: 1, 4: 0 }, mapX = { 2: 0, 3: BLOCK_WIDTH/4, 4: BLOCK_WIDTH/2 };
		check_game_over();

		if (current)
			current.nail();

		window.current = current = next.remove().set({
		              x: (BOARD_X + Math.floor(BOARD_WIDTH/2)*BLOCK_WIDTH/2 + (mapX[next.mapWidth])),
			      y: (BOARD_Y + -BLOCK_HEIGHT/4*starty[next.mapHeight]),
			      mapY: (mapY[next.mapHeight]),
			      mapX: 4
		});

		engine.stage.add(current);
		next_box.add(next = get_next());
		updateScore();
	},

	gravity = function() {
		if (engine.stage.is_playing() && current.down())
			go_next();
	},

	keyboard_delay,

	resume = function()
	{
		window.removeEventListener('keypress', resume, true);
		j5g3.id('pause').style.display='none';
		j5g3.canvas.style.display = 'block';
		engine.resume();
	},

	pause = function()
	{
		engine.pause();
		j5g3.canvas.style.display = 'none';
		j5g3.id('pause').style.display = 'block';
		window.addEventListener('keypress', resume, true);
	},

	keyboard = function(evt) {

		var i = j5g3.h1.Key;
		if (i[38])
		{
			if (!keyboard_delay--)
			{
				current.rotate();
				keyboard_delay=10;
			}
		}
		else if (i[37]) current.left();
		else if (i[39]) current.right();
		else if (i[40]) { current.down();current.down();current.down();current.down();current.down();current.down(); }
		else if (i[32]) { 
			if (!keyboard_delay--)
			{
				audio.slide.currentTime=0;
				audio.slide.play();
				keyboard_delay=10;
				while (!current.down());
			}
		}
		else if (i[90]) {
			if (!keyboard_delay--)
			{
				current.rotateCC();
				keyboard_delay=10;
			}
		}
		else if (i[80]) {
			pause();
		}
		else
			keyboard_delay=0;
	},

	speed = 15,

	// Screen Element
	current,

	score = 0, lines = 0,
	scoreText, linesText,
	
	updateScore= function()
	{
		scoreText.text = ('Score: ' + score);
		linesText.text = ('Lines: ' + lines);
	}, 

	board= new game.Board({ x: BOARD_X, y: BOARD_Y }),
	next = get_next(),
	next_box,
	
	background = j5g3.clip().add([
		j5g3.rect({ fill: '#008' }).size(this.stage.width, this.stage.height),
		j5g3.image('background'),

		next_box = j5g3.clip({x: 48, y: 100}).add(next),

		// Stats
		j5g3.clip({ 
			fill: '#fff', 
			font: '20px Arial',
			x: 460, y: 80
		}).add([
			scoreText = j5g3.text(),
			linesText = j5g3.text({ y: 30 })
		])
	]).size(WIDTH, HEIGHT)
;

	game.addLines = function(n)
	{
		lines += n;
		score += { 1: 100, 2: 250, 3: 400, 4: 800, 0: 0 }[n];

		updateScore();
	};

	updateScore();

	this.stage.add([background, board, keyboard]);

	go_next();
	setInterval(gravity, speed);

	this.run();
	j5g3.h1.Keyboard.capture();
}

game.load = function ()
{
	j5g3.id('loading').style.display = 'none';
	j5g3.id('start').style.display = 'block';
}

game.start = function ()
{
	j5g3.id('screen').style.display = 'block';
	j5g3.id('start').style.display = 'none';
	j5g3.engine(game);
}

j5g3.ready(function() { 
	game.load();
});

game.Board = j5g3.Clip.extend({

	init: function Board(properties)
	{
		j5g3.Clip.apply(this, arguments);

		this._pieceMap = j5g3.map({ 
			x: -BLOCK_WIDTH, y: -BLOCK_HEIGHT*2, 
			sprites: _ss.sprites(), map: this.map, 
			tw: BLOCK_WIDTH, th: BLOCK_HEIGHT
		}); 

		this.clear();

		this.size(BLOCK_WIDTH * BOARD_WIDTH, BLOCK_HEIGHT * BOARD_HEIGHT)
		    .scale(0.5, 0.5)
		    .add(j5g3.rect({ fill: '#333', alpha: 0.3, width: this.width, height: this.height }))
		    .add(this._pieceMap)
		;
	},

	// Initialize Map
	clear: function()
	{
		var i = BOARD_HEIGHT+2;

		this.map = [];

		this.sprites = _ss.sprites();

		while (i--)
			this.map.push([10,0,0,0,0,0,0,0,0,0,0,10]);

		this.map.push([10,10,10,10,10,10,10,10,10,10,10,10]);
		this._pieceMap.map = this.map;
		return this;
	},

	/* Checks completed lines */
	reduce: function()
	{
		var map=this.map, y = map.length-1, x, row, bw = BOARD_WIDTH, rowc=0, n=0;

		while (y--)
		{
			row = map[y];
			rowc= true;
			for (x=1; x<=bw; x++)
				if (!row[x])
				{
					rowc=false;
					break;
				}

			if (rowc)
			{
				this.reduceRow(y++);
				n++;
			}
		}

		n && game.addLines(n);
	},

	reduceRow: function(row)
	{
		audio.line.currentTime=0;
		audio.line.play();

		var map = this.map, x;
		for (; row>1; row--)
		{
			for (x=1; x<=BOARD_WIDTH; x++)
				map[row][x] = map[row-1][x];
		}
		map[0]=[10,0,0,0,0,0,0,0,0,0,0,10];
	}
});

/* CLASSES */
game.Piece = j5g3.Clip.extend({

	board: null, 
	mapX: 0, 
	mapY: 0, 
	mapWidth: 0, 
	piece: 0, 
	color: 0, 

	/* private */
	_get_map: function(piece, c)
	{
		switch (piece) {
		case 0: return [ [[c],[c],[c,c]], [[c,c,c],[c],[]], [[0,c,c],[0,0,c],[0,0,c]], [[],[0,0,c],[c,c,c]] ];
		case 1: return [ [[0,c],[0,c],[0,c],[0,c]], [[],[c,c,c,c],[],[]], [[0,0,c],[0,0,c],[0,0,c],[0,0,c]], [[],[],[c,c,c,c],[]] ];
		case 2: return [ [[c],[c,c],[c]], [[c,c,c],[0,c],[]], [[0,0,c],[0,c,c],[0,0,c]], [[],[0,c],[c,c,c]] ];
		case 3: return [ [[c,c],[c,c]],[[c,c],[c,c]],[[c,c],[c,c]],[[c,c],[c,c]] ] ;
		case 4: return [ [[0,c],[0,c],[c,c]], [[c],[c,c,c],[]], [[0,c,c],[0,c],[0,c]], [[],[c,c,c],[0,0,c]] ];
		case 5: return [ [[0,c],[c,c],[c]], [[c,c],[0,c,c],[]], [[0,0,c],[0,c,c],[0,c]], [[],[c,c],[0,c,c]] ];
		case 6: return [ [[c],[c,c],[0,c]], [[0,c,c],[c,c],[]], [[0,c],[0,c,c],[0,0,c]], [[],[0,c,c],[c,c]] ];
		
		}
	},

	// Creates a new map object based on the template and color specified
	_piece: function(template, color)
	{
		this.mapData = this._get_map(template, color);
		this.mapCur  = 0;

		var result = j5g3.map({ sprites: _ss.sprites(), map: this.mapData[0], tw: BLOCK_WIDTH, th: BLOCK_HEIGHT}); 

		this.mapWidth = PIECE_WIDTHS[template];
		this.mapHeight= this.mapData[0].length;

		return result.size(BLOCK_WIDTH*this.mapWidth, BLOCK_HEIGHT*this.mapHeight);
	},

	init: function Piece(properties)
	{
		j5g3.Clip.apply(this, arguments);

		this.map = this._piece(properties.piece, properties.color);
		this.add(this.map)
			.scale(0.5, 0.5)
			.size(this.map.width, this.map.height)
			.align_children('origin')
		;
	},

	tween: function(property, to)
	{
	var 
		me = this,
		from = { },
		_to = { }
	;
		me.moving = true;
		from[property]=this[property];
		_to[property] = to;

		return this.add(j5g3.tween({ 
			target: this, 
			auto_remove: true, 
			duration: 2, 
			from: from, 
			to: _to,
			on_remove: function() { me.moving = false; }
		}));
	},

	_swapDimensions: function() {
		var temp = this.mapHeight;
		this.mapHeight = this.mapWidth;
		this.mapWidth=temp;
		this.size(this.height, this.width);
	},

	rotate: function()
	{
		var old = this.mapCur;
		this.mapCur += this.mapCur==3 ? -3 : 1;
		this._swapDimensions();

		if (this.verify(0,0))
		{
			audio.rotate.currentTime=0;
			audio.rotate.play();
			this.tween('rotation', this.rotation+Math.PI/2);
		} else
		{
			this._swapDimensions();
			this.mapCur=old;
		}
	},

	rotateCC: function()
	{
		var old = this.mapCur;
		this.mapCur -= this.mapCur==0 ? -3 : 1;
		this._swapDimensions();

		if (this.verify(0,0))
		{
			audio.rotate.currentTime=0;
			audio.rotate.play();
			this.tween('rotation', this.rotation-Math.PI/2);
		} else
		{
			this._swapDimensions();
			this.mapCur=old;
		}
		
	},

	getCurrentMap: function()
	{
		return this.mapData[this.mapCur];
	},

	left: function()
	{
		if (!this.moving && this.verify(-1,1))
		{
			this.tween('x', this.x-BLOCK_WIDTH/2);
			this.mapX--;
		}
	},

	right: function()
	{
		if (!this.moving && this.verify(1, 1))
		{
			this.tween('x', this.x+BLOCK_WIDTH/2);
			this.mapX++;
		}
	},

	down: function()
	{
		if (this.verify(0, 1))
		{
			this.y++;
			this.mapY += 1/(BLOCK_HEIGHT/2);
		} else
			return true;
	},

	nail: function()
	{
		// Copy to board
		var srcX, srcY = this.mapHeight, destX=this.mapX+1, destY=Math.floor(this.mapY),
		    map=this.board.map, piece=this.getCurrentMap();
		audio.pop.currentTime = 0;
		audio.pop.play(); 

		while (srcY--)
			for (srcX=0; srcX<this.mapWidth; srcX++)
				if (piece[srcY][srcX])
					map[destY+srcY][destX+srcX] = piece[srcY][srcX]+10;
		this.remove();
		this.board.reduce();
	},

	verify: function(x, y)
	{
	var 
		srcX, 
		srcY= this.mapHeight, 
		destX= this.mapX+1+x, 
		destY= Math.floor(this.mapY)+y,
		map= this.board.map, 
		piece= this.getCurrentMap()
	;
		while (srcY--)
			for (srcX=0; srcX<this.mapWidth; srcX++)
				if (piece[srcY][srcX] && map[destY+srcY][destX+srcX])
					return false;

		return true;
	}

})
