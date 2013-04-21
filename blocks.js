
var
	BLOCK_WIDTH = 48,
	BLOCK_HEIGHT= 48,
	BLOCK_PIECES= 7,
	BLOCK_COLORS= 9,
	PIECE_WIDTHS = [3,4,3,2,3,3,3],
	BOARD_X = 200,
	BOARD_Y = 24,
	BOARD_WIDTH = 10,
	BOARD_HEIGHT= 18,

	loader = j5g3.loader(),
	assets = {
		spritesheet: loader.img('resources/blocks-ss.png'),
		background: loader.img('resources/light.png')
	},

	loading= j5g3.clip().add([
		j5g3.text({ 
			text: 'Loading: ',
			paint: function(context) {
				this.text = 'Loading: ' + loader.percentage;
				j5g3.Paint.Text.apply(this, [context]);
			}
		}),
	]),

	engine = j5g3.engine({ 
		stage_settings: { width: 640, height: 480 }, 
		startFn: function()
		{
			this.stage.add(loading);
			this.fps(32).run();
		}
	}),

	onReady = function()
	{
		document.body.appendChild(engine.stage.canvas);
	}
;

j5g3.ready(onReady);

loader.ready(function game()
{
var
	spritesheet = j5g3.spritesheet(assets.spritesheet).grid(10, 2),
	stage = engine.stage,

	Piece = j5g3.Clip.extend({

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

			var result = j5g3.map({ 
				sprites: spritesheet.sprites(), 
				map: this.mapData[0], 
				tw: BLOCK_WIDTH, 
				th: BLOCK_HEIGHT
			}); 

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
	
	}),

	Board = j5g3.Clip.extend({

		keyboard_delay: 10,

		init: function Board(p)
		{
			j5g3.Clip.apply(this, [p]);

			this.pieceMap = j5g3.map({ 
				sprites: spritesheet.sprites(), 
				map: this.map, 
				tw: BLOCK_WIDTH, 
				th: BLOCK_HEIGHT
			}); 

			this.clear();

			this.size(BLOCK_WIDTH * BOARD_WIDTH, BLOCK_HEIGHT * BOARD_HEIGHT)
			    .scale(0.5, 0.5)
			    .add(j5g3.rect({ fill: '#333', alpha: 0.3, width: this.width, height: this.height }))
			    .add(this.pieceMap)
			;

			this.add([ this.keyboard ]);
		},

		// Initialize Map
		clear: function()
		{
			var i = BOARD_HEIGHT+2;

			this.map = [];

			this.sprites = spritesheet.sprites();

			while (i--)
				this.map.push([10,0,0,0,0,0,0,0,0,0,0,10]);

			this.map.push([10,10,10,10,10,10,10,10,10,10,10,10]);
			this.pieceMap.map = this.map;
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
		},
		
		keyboard: function(evt) 
		{
		var 
			i = j5g3.h1.Key
		;
			if (i[38])
			{
				if (!this.keyboard_delay--)
				{
					current.rotate();
					this.keyboard_delay=10;
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
		}

	}),

	next_clip = j5g3.clip({ x: 48, y: 100 }),

	scoreboard= j5g3.clip({
			fill: '#fff', 
			font: '20px Arial',
			x: 460, y: 80
		}).add([
			j5g3.text(),
			j5g3.text({ y: 30 })
		]),

	background = j5g3.clip().add([
		j5g3.rect({ fill: '#008' }).size(stage.width, stage.height),
		assets.background,
		next_clip,
		scoreboard
	]),

	board= new Board({ x: 200, y: 24 }),

	scenes= {

		intro: j5g3.clip({ scaleX: 0.5, scaleY: 0.5 }).add([
			j5g3.map({ 
				x: 16, tw: 48, th: 48,
				sprites: spritesheet.sprites(),
				map: [ 
					j5g3.ary(26, 0, 2)
				]
			}),
			j5g3.text({ font: '40px Arial', x: 320, y: 200, text: 'Press any key to continue' }),
			j5g3.mtext({ 
				x: 320, y: 300, line_height: 40,
				font: '40px Arial',
				text: "Instructions:\n\n" +
					"Arrows: Movement\n" +
					"Up: Rotate\n" +
					"Spacebar: Hard Drop\n" +
					"Z: Rotate Counter-Clockwise\n" +
					"P: Pause"
			})
		]),

		game: j5g3.clip().add([
			background,
			board
		]),

		gameOver: j5g3.clip({ x: 100, y: 100 }).add(
			j5g3.text("Game Over")
		)
	}
;

	loading.remove();
	j5g3.h1.wait(function() { 
		scenes.intro.remove();
		stage.stop().add(scenes.game).play();
	});

	stage.stop().add(scenes.intro).play();
	j5g3.h1.Keyboard.capture();

});
