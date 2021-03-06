
var
	///////////////////////////
	//
	// Game Constants
	//
	///////////////////////////
	BLOCK_WIDTH = 48,
	BLOCK_HEIGHT= 48,
	BLOCK_PIECES= 7,
	BLOCK_COLORS= 9,
	BOARD_WIDTH = 10,
	BOARD_HEIGHT= 18,

	j5g3 = window.j5g3,
	loader = j5g3.loader(),
	fx = j5g3.fx,

	////////////////////////////
	//
	// Game Assets
	//
	////////////////////////////
	assets = {
		background: loader.img('resources/background.jpg'),
		spritesheet: loader.img('resources/blocks-ss.png'),
		logo: loader.img('resources/logo.png'),
		play: loader.img('resources/play.png'),
		score: loader.img('resources/score.png'),
		gameover: loader.img('resources/gameover.png'),

		audio: {
			'pop'   : loader.audio('resources/pop.ogg'),
			'slide' : loader.audio('resources/slide.ogg'),
			'rotate': loader.audio('resources/rotate.ogg'),
			'line'  : loader.audio('resources/line.ogg'),
			'gameover': loader.audio('resources/gameover.mp3')
		}
	},

	///////////////////////////////
	//
	// ENTITIES
	//
	/////////////////////////////

	Piece = j5g3.Map.extend({

		_WIDTHS: [3,4,3,2,3,3,3],

		tw: BLOCK_WIDTH,
		th: BLOCK_HEIGHT,

		row: 1,
		col: 0,

		_get_map: function(piece, c)
		{
			switch (piece) {
			case 0: return [ [[c],[c],[c,c]], [[c,c,c],[c]], [[0,c,c],[0,0,c],[0,0,c]], [[], [0,0,c],[c,c,c]] ];
			case 1: return [ [[0,c],[0,c],[0,c],[0,c]], [[],[c,c,c,c],[],[]], [[0,0,c],[0,0,c],[0,0,c],[0,0,c]], [[],[],[c,c,c,c],[]] ];
			case 2: return [ [[c],[c,c],[c]], [[c,c,c],[0,c],[]], [[0,0,c],[0,c,c],[0,0,c]], [[],[0,c],[c,c,c]] ];
			case 3: return [ [[c,c],[c,c]],[[c,c],[c,c]],[[c,c],[c,c]],[[c,c],[c,c]] ] ;
			case 4: return [ [[0,c],[0,c],[c,c]], [[c],[c,c,c],[]], [[0,c,c],[0,c],[0,c]], [[],[c,c,c],[0,0,c]] ];
			case 5: return [ [[0,c],[c,c],[c]], [[c,c],[0,c,c],[]], [[0,0,c],[0,c,c],[0,c]], [[],[c,c],[0,c,c]] ];
			case 6: return [ [[c],[c,c],[0,c]], [[0,c,c],[c,c],[]], [[0,c],[0,c,c],[0,0,c]], [[],[0,c,c],[c,c]] ];
			}
		},

		_get_piece: function()
		{
		var
			p = j5g3.irand(7),
			map = this._get_map(p, 1+j5g3.irand(9))
		;
			return {
				map: map,
				cols: this._WIDTHS[p],
				rows: map[0].length,
				rotation: 0
			};
		},

		init: function Piece()
		{
			j5g3.Map.apply(this);

			this.sprites = game.spritesheet.sprites();
			this.piece = this._get_piece();

			this.size(BLOCK_WIDTH*this.piece.cols, BLOCK_HEIGHT*this.piece.rows);
			this.cx = -this.width/2;
			this.cy = -this.height/2;
			this.map = this.piece.map[0];
			this.cache();
		},

		each_block: function(fn)
		{
		var
			map = this.piece.map[this.piece.rotation],
			l = map.length, i
		;
			while (l--)
				for (i=0; i<map[l].length; i++)
					if (map[l][i] &&
						fn(map[l][i], this.row+l,
							this.col+i, this))
							return;
		},

		tween: function(property, to)
		{
		var
			me = this,
			from = { },
			_to = { }
		;
			if (me.moving)
				return;

			me.clear_cache();
			me.moving = true;
			from[property] = me[property];
			_to[property] = to;

			return me.parent.add(j5g3.tween({
				target: me,
				auto_remove: true,
				duration: 3,
				from: from,
				to: _to,
				on_remove: function() {
					me.moving = false;
					me.cache();
				}
			}));
		},

		down: function(speed)
		{
			this.y += speed;
			this.row = Math.floor((this.cy + this.y) / BLOCK_HEIGHT)+1;
		},

		rotate: function(dir, verify)
		{
			var
				d = dir || 1,
				r = this.piece.rotation += d
			;

			if (r === 4)
				this.piece.rotation=0;
			else if (r === -1)
				this.piece.rotation=3;

			if (verify && verify(0,0))
			{
				game.sound('rotate');
				this.tween('rotation', this.rotation+Math.PI/2*dir);
			} else
				this.piece.rotation -= d;
		},

		set_col: function(c)
		{
			this.x = c * BLOCK_WIDTH - this.cx;
			this.col = c+1;
		},

		left: function(notween)
		{
			if (notween)
				this.x -= BLOCK_WIDTH;
			else
				this.tween('x', this.x-BLOCK_WIDTH);

			this.col -= 1;
		},

		right: function(notween)
		{
			if (notween)
				this.x += BLOCK_WIDTH;
			else
				this.tween('x', this.x+BLOCK_WIDTH);

			this.col += 1;
		}

	}),

	Board = j5g3.Clip.extend({

		x: 20, y: 140,
		width: BLOCK_WIDTH*BOARD_WIDTH,
		height: BLOCK_HEIGHT*BOARD_HEIGHT,

		setup: function()
		{
			this.stretch(game.stage.width-this.x*2, game.stage.height-this.y-this.x);
			this.reset();
		},

		shake: function()
		{
			game.stage.add(fx.Animate.shake(game.stage));
		},

		is_row_complete: function(row)
		{
		var
			l = row.length
		;
			while (l--)
				if (!row[l])
					return false;

			return true;
		},

		/**
		 * Returns false if movement is not allowed.
		 * TODO This could be optimized
		 */
		verify: function(x, y)
		{
		var
			map = this.map,
			result = true
		;
			this.piece.each_block(function(block, row, col, p)
			{
				if (map[row+y][col+x])
				{
					result = false;
					return result;
				}
			});

			return result;
		},

		reduce: function()
		{
		var
			map = this.map,
			y = map.length - 1,
			removed=0
		;
			while (y--)
				if (this.is_row_complete(map[y]))
				{
					this.reduce_row(map[y], y++);
					removed++;
				}

			if (removed)
				this.on_score(removed);
		},

		remove_piece: function(p)
		{
			var t = fx.Animate.expand(p);
			t.to.x = p.x - p.width/2;
			t.to.y = p.y - p.height/2;
			t.on_remove = function() { p.remove(); };

			this.add([ t, fx.Animate.fade_out(p) ]);
		},

		reduce_row: function(row, n)
		{
		var
			i = 1,
			map = this.map
		;
			game.sound('line');

			for (; i<row.length-1; i++)
				this.remove_piece(row[i]);

			for (; n>1; n--)
				for (i=1; i<=BOARD_WIDTH; i++)
				{
					map[n][i] = map[n-1][i];
					map[n][i].y += BLOCK_HEIGHT;
				}

			map[0]=[10,0,0,0,0,0,0,0,0,0,0,10];
		},

		nail: function()
		{
		var
			me = this,
			map = this.map,
			sprite
		;
			game.sound('pop');
			this.piece.each_block(function(block, row, col, p)
			{
				map[row][col] = sprite = game.spritesheet.sprite(block+10);
				me.add(sprite.pos(
					(col-1)*BLOCK_WIDTH,
					(row-1)*BLOCK_HEIGHT
				));
			});
			this.piece.remove();
			this.reduce();
		},

		reset: function()
		{
		var
			i = BOARD_HEIGHT+1
		;
			this.map = [];
			while (i--)
				this.map.push([10, 0,0,0,0,0,0,0,0,0,0, 10]);

			this.map.push([10,10,10,10,10,10,10,10,10,10,10,10]);
		},

		add_piece: function(p)
		{
			p.set_col(4);
			p.y = -p.cy - BLOCK_HEIGHT;
			this.add(this.piece = p);
		}

	}),

	ScoreBoard = j5g3.Clip.extend({

		fill: '#eee',
		font: '34px sans-serif',
		x: 240,
		y: 20,
		width: 150,
		height: 60,

		setup: function()
		{
			this.score = j5g3.text({ text: '0', x: 110, y: 0 });
			this.level = j5g3.text({ text: '1', x: 110, y: 48 });
			this.add([
				j5g3.image(assets.score).pos(0, 10),
				this.score,
				this.level
			]);
		},

		points: function(p)
		{
			this.score.text = parseInt(this.score.text, 10)+p;
			this.invalidate();
		}

	}),

	///////////////////////////////
	//
	// Scenes
	//
	////////////////////////////

	Intro = j5g3.Clip.extend({

		x: 96,
		y: 150,

		on_click: function()
		{
			this.remove();
			this.mice.remove();
			game.start_main();
		},

		setup: function()
		{
		var
			logo = j5g3.image(assets.logo).pos(0, -200),
			play = j5g3.image(assets.play).pos(100, 200).set({ alpha: 0 });
			tween = j5g3.tween({
				target: logo, to: { y: 0 }, auto_remove: true,
				duration: 20
			}),
			tween2 = fx.Animate.fade_in(play)
		;
			this.add([ logo, play, tween, tween2 ]);

			game.background.add(j5g3.image(assets.background));
			game.background.invalidate();

			this.mice = j5g3.in(game.stage.canvas)
				.on({ 'button': this.on_click.bind(this) })
			;
		}

	}),

	GameOver = j5g3.Clip.extend({

		y: 200,
		x: 120,

		font: 'bold 45px sans-serif',
		fill: '#eee',
		stroke: '#000',

		on_click: function()
		{
			this.remove();
			this.mice.remove();
			game.stage.add(new Intro());
		},

		setup: function()
		{
			var text = j5g3.text('Restart').pos(120, 300);
			text.paint = j5g3.Paint.TextStrokeFill;

			this.add([
				j5g3.image(assets.gameover),
				text
			]);

			text.align_text('center');

			this.mice = j5g3.in(game.stage.canvas)
				.on({ 'button': this.on_click.bind(this) })
			;
		}

	}),

	Help = j5g3.Clip.extend({

		setup: function()
		{
			this.add([
				j5g3.text("CONTROLS"),
				j5g3.mtext("Drag Left/Right/Down to move.\n\n" +
				"Drag Up to Rotate.\n\nFlick Down to Hard Drop.")
			]);
		}

	}),

	Main = j5g3.Clip.extend({

		speed: 1.5,
		level: 0,

		scoreboard: null,
		next_container: null,

		left: function(ev)
		{
			if (!this.piece.moving && this.board.verify(-1, 1))
				this.piece.left(ev.type==='touchmove');
		},

		right: function(ev)
		{
			if (!this.piece.moving && this.board.verify(1, 1))
				this.piece.right(ev.type==='touchmove');
		},

		click: function()
		{
			if (!this.piece.moving)
				this.piece.rotate(1, this.board.verify.bind(this.board));
		},

		is_gameover: function()
		{
		var
			i = 1,
			map = this.board.map[0]
		;
			for (;i<=BOARD_WIDTH; i++)
				if (map[i])
					return true;
		},

		gameover: function()
		{
			this.remove();
			this.boardbg.remove();
			this.scoreboard.remove();
			this.next_container.remove();
			this.mice.remove();
			game.sound('gameover');
			game.background.invalidate();
			game.stage.add(new GameOver());
		},

		gravity: function()
		{
			this.piece.down(this.speed);

			if (this.board.verify(0, 1)===false)
			{
				this.board.nail();
				this.go_next();
			}
		},

		down: function()
		{
			this.piece.down(BLOCK_HEIGHT/2);
			this.gravity();
		},

		slide: function()
		{
			game.sound('slide');

			while (this.board.verify(0, 1))
			{
				this.piece.down(BLOCK_HEIGHT/2);
			}

			this.board.shake();
			this.gravity();
			this.mice.suspend(300);
		},

		update_frame: function()
		{
			this.gravity();

			if (this.is_gameover())
				this.gameover();
		},

		score: function(removed)
		{
			this.level += removed;
			this.scoreboard.points({
				1: 100,
				2: 250,
				3: 400,
				4: 800
			}[removed]);

			if (this.level > 10)
			{
				this.speed += 0.2;
				this.level = this.level-10;
				this.scoreboard.level.text = parseInt(this.scoreboard.level.text,10) + 1;
			}
		},

		setup: function()
		{
			this.board = new Board();
			this.boardbg = j5g3.rect({
				x: this.board.x, y: this.board.y,
				sx: this.board.sx, sy: this.board.sy,
				width: this.board.width, height: this.board.height,
				fill: '#000', alpha: 0.5
			});

			this.scoreboard = new ScoreBoard();
			this.next_container = j5g3.clip({
				x: 50, y: 30, sx: 0.4, sy: 0.4,
				width: 100, height: 100
			});

			game.background.add([
				this.scoreboard,
				this.next_container,
				this.boardbg
			]).invalidate();

			this.next_piece = new Piece();
			this.add([ this.board ]).go_next();

			this.mice = j5g3.in(game.stage.canvas).on({
				'up': this.click.bind(this),
				'left': this.left.bind(this),
				'right': this.right.bind(this),
				'down': this.down.bind(this),
				'buttonB': this.slide.bind(this)
			});

			this.board.on_score = this.score.bind(this);
		},

		go_next: function()
		{
			this.piece = this.next_piece.remove();
			this.board.add_piece(this.next_piece);

			this.next_piece = new Piece();

			this.next_piece.pos(-this.next_piece.cx, -this.next_piece.cy);
			this.next_container.add(this.next_piece)
				.invalidate();
		}

	}),

	////////////////////////
	//
	// ENGINE
	//
	////////////////////////

	game = j5g3.engine({

		stage_settings: {
			width: 480,
			height: 800,
			container: true
		},

		loading: new j5g3.gdk.Loading({
			loader: loader,
			on_remove: function() {
				game.start_intro();
			}
		}),

		// TODO replace with some library
		sound: function(name)
		{
			assets.audio[name].currentTime = 0;
			assets.audio[name].play();
		},

		start_main: function()
		{
			this.stage.add(new Main());
		},

		start_intro: function()
		{
			this.spritesheet = j5g3.spritesheet(assets.spritesheet).grid(10, 2);
			this.stage.add(new Intro());
		},

		startFn: function()
		{
			this.stageManager = new j5g3.gdk.StageManager(this.stage);
			this.background = this.layer({
				background: true
			});

			this.stage.add(this.loading);
			this.run();
		}
	})
;

