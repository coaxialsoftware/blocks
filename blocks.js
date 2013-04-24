
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

	loader = j5g3.loader(),
	
	////////////////////////////
	//
	// Game Assets
	//
	////////////////////////////
	assets = {
		spritesheet: loader.img('resources/blocks-ss.png')

		/*audio: { 
			pop   : j5g3.id('audio-pop'),
			slide : j5g3.id('audio-slide'),
			rotate: j5g3.id('audio-rotate'),
			line  : j5g3.id('audio-line')
		}*/
	},
	
	///////////////////////////////
	//
	// ENTITIES
	//
	/////////////////////////////

	Piece = j5g3.Map.extend({

		_WIDTHS: [3,2,3,2,3,3,3],
		
		tw: BLOCK_WIDTH,
		th: BLOCK_HEIGHT,

		_get_map: function(piece, c)
		{
			switch (piece) {
			case 0: return [ [[c],[c],[c,c]], [[c,c,c],[c]], [[0,c,c],[0,0,c],[0,0,c]], [[0,0,c],[c,c,c]] ];
			case 1: return [ [[c],[c],[c],[c]], [[c,c,c,c]], [[c],[c],[c],[c]], [[c,c,c,c]] ];
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
				rows: map[0].length
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
		},

		tween: function(property, to)
		{
		var 
			me = this,
			from = { },
			_to = { }
		;
			me.moving = true;
			from[property] = me[property];
			_to[property] = to;

			return me.parent.add(j5g3.tween({ 
				target: me, 
				auto_remove: true, 
				duration: 2, 
				from: from, 
				to: _to,
				on_remove: function() { me.moving = false; }
			}));
		},
	
		rotate: function()
		{
			this.tween('rotation', this.rotation+Math.PI/2);
		},

		col: function(col)
		{
			this._col = col;
			this.x = col*BLOCK_WIDTH-this.cx;
		}

	}),

	Board = j5g3.Clip.extend({
	
		x: 10, y: 120,
		width: BLOCK_WIDTH*BOARD_WIDTH, height: BLOCK_HEIGHT*BOARD_HEIGHT,

		setup: function()
		{
			this.stretch(game.stage.width-20, game.stage.height-130);
			this.add([
				j5g3.rect({ stroke: '#eee', fill: '#333', alpha: 0.3, width: BLOCK_WIDTH*BOARD_WIDTH, height: BLOCK_HEIGHT*BOARD_HEIGHT })
			]);
			
			this.reset();
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
		
		update_score: function(n)
		{
			
		},
		
		reduce: function()
		{
		var
			map = this.map,
			y = map.length - 1,
			removed
		;
			while (y--)
				if (this.is_row_complete(map[y]))
				{
					this.reduce_row(map[y]);
					removed++;
				}
				
			if (removed)
				this.update_score(removed);
		},
		
		nail: function(piece)
		{
			
		},
		
		reset: function()
		{
		var
			i = BOARD_HEIGHT+2
		;
			this.map = [];
			while (i--)
				this.map.push([10, 0,0,0,0,0,0,0,0,0,0, 10]);
			
			this.map.push([10,10,10,10,10,10,10,10,10,10,10,10]);
		},

		add_piece: function(p)
		{
			this.add(p);
		}

	}),
	
	///////////////////////////////
	// 
	// Scenes
	//
	////////////////////////////
	
	Intro = j5g3.Clip.extend({

		x: 20,
		y: 150,
	
		on_click: function()
		{
			this.remove();
			game.stage.un('click', this.on_click);
			game.start_main();
		},
		
		setup: function()
		{
			this.add([
				j5g3.text({ fill: '#080', stroke: '#eee', font: 'bold 100px sans-serif', text: 'Blocks', paint: j5g3.Paint.TextStrokeFill }),
				j5g3.text({ y: 100, x: 60, fill: '#eee', text: 'Click to start', font: '40px sans-serif'  })
			]);
			game.stage.on('click', this.on_click, this);
		}

	}),
	
	GameOver = j5g3.Clip.extend({
		
		setup: function()
		{
			this.y = 20;
			this.add(j5g3.text('game over.'));
		}
		
	}),

	Main = j5g3.Clip.extend({

		speed: 1.5,
		
		scoreboard: j5g3.clip({ 
				fill: '#eee', font: '20px Arial', x: 240, y: 30
			})
			.add([ j5g3.text('Score:'), j5g3.text({ text: '0', y: 30 }) ])
		,
		next_container: j5g3.clip({ x: 50, y: 50, sx: 0.4, sy: 0.4 }),

		mousemove: function()
		{
			this.piece.col(Math.floor(this.mice.x/(game.stage.width/BOARD_WIDTH)));
		},

		click: function()
		{
			this.piece.rotate();
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
			this.mice.destroy();
			game.stage.add(new GameOver());
		},
		
		gravity: function()
		{
			this.piece.y += this.speed;
			
			if (this.piece.y > this.board.height)
				this.go_next();
		},
		
		update: function()
		{
			this.gravity();
				
			if (this.is_gameover())
				this.gameover();
		},

		setup: function()
		{
			this.board = new Board();
			this.add([ 
				this.scoreboard, 
				this.next_container,
				this.board,
				this.update.bind(this)
			]);
			this.next_piece = new Piece();
			this.go_next();

			this.mice = mice(game.stage.canvas);
			this.mice.mousemove = this.mousemove.bind(this);
			this.mice.click = this.click.bind(this);
		},

		go_next: function()
		{
			this.piece = this.next_piece;
			this.board.add_piece(this.next_piece);

			this.next_piece = new Piece();
			this.next_container.add(this.next_piece);
		}

	}),
	
	////////////////////////
	//
	// ENGINE
	//
	////////////////////////

	game = j5g3.engine({ 

		stage_settings: { width: 360, height: 640 }, 

		loading: j5g3.clip().add([
			j5g3.text({ 
				fill: '#eee',
				font: '30px sans-serif',
				x: 10, y: 40,
				text: 'Loading: ',
				paint: function(context) {
					this.text = 'Loading: ' + loader.progress;
					j5g3.Paint.Text.apply(this, [context]);
				}
			})
		]),

		start_main: function()
		{
			this.stage.add(new Main());
		},

		start_intro: function()
		{
			this.spritesheet = j5g3.spritesheet(assets.spritesheet).grid(10, 2);
			this.stage.add(new Intro());

			this.loading.remove();
		},

		startFn: function()
		{
			this.stage.add(this.loading);
			this.run();

			loader.ready(this.start_intro.bind(this));
		}
	})
;

