/**
 * Mice.js
 * 
 * Mouse, Touch and Keyboard events wrapper.
 * 
 * Events: 
 * 
 * - click (ENTER)
 * - fire (SPACEBAR or Right Click)
 * - move (Mouse move or Touch Move)
 * - left, right, down, up (Keys, touch or mouse)
 * 
 */
(function(window) {
"use strict";
var

	bind = function(fn, scope)
	{
		return (fn.bindfn = fn.bind ? fn.bind(scope) : function() { fn.apply(scope, arguments); });
	},
	
	Mice = function Mice(element, eventmap)
	{
		this.element = element;
		this.keyboard = {};
		this.keymap = {};
		
		extend(this.keymap, keymap);
		
		if (eventmap)
			extend(this, eventmap);
			
		if (window.navigator && window.navigator.isCocoonJS)
			this._calculate_pos = this._x_calculate_pos;
			
		// Mouse Events
		element.addEventListener('click', bind(this._click, this));
		element.addEventListener('mousemove', bind(this._mousemove, this));
		
		// Touch Event
		element.addEventListener('touchmove', bind(this._touchmove, this));
		element.addEventListener('touchstart', bind(this._touchstart, this));
		element.addEventListener('touchend', bind(this._touchend, this));
		
		// Keyboard Events
		element.addEventListener('keydown', bind(this._keydown, this));
		element.addEventListener('keyup', bind(this._keyup, this));
	},
	
	mice = window.mice = function(element, eventmap)
	{
		return new Mice(element, eventmap);
	},
	
	extend = function(a, b) 
	{
		for (var i in b)
			a[i] = b[i];
	},
	
	keymap = {
		32: 'fire',
		37: 'left',
		38: 'up',
		39: 'right',
		40: 'down'
	}
;

	extend(Mice.prototype, {/** @scope Mice.prototype */
		
		/// Cursor X position relative to element
		x: 0, 
		/// Cursor Y position relative to element
		y: 0,
		/// Change of X from previous event
		dx: 0, 
		/// Change of Y from previous event
		dy: 0,
		
		x_threshold: 30,
		y_threshold: 30,
		tap_delay: 200,
		
		/// Maps keycodes to actions
		keymap: null,
		
		/// Element to attach events to
		element: null,
		
		_set_pos: function(x, y)
		{
			this.dx = x - this.x;
			this.dy = y - this.y;
			
			this.x = x;
			this.y = y;
		},
		
		_calculate_pos: function(ev)
		{
		var
			scrollTop = document.body.scrollTop || document.documentElement.scrollTop,
			scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft,
			x = ev.clientX - this.element.offsetLeft + scrollLeft,
			y = ev.clientY - this.element.offsetTop + scrollTop
		;
			this._set_pos(x, y);
			ev.mice = this;
		},
		
		_x_calculate_pos: function(ev)
		{
		var
			touch = ev.changedTouches[0],
			x = touch.pageX,
			y = touch.pageY
		;
			this._set_pos(x, y);
			
			ev.mice = this;
		},
		
		_click: function(ev)
		{
			this._calculate_pos(ev);
			if (this.click) 
				return this.click(ev);
		},
		
		_mousemove: function(ev)
		{
			this._calculate_pos(ev);
			if (this.move) 
				return this.move(ev);
		},
		
		_keydown: function(ev)
		{
		var
			kc = ev.keyCode,
			fn = this.keymap[kc]
		;
			ev.mice = this;
				
			if (fn && this[fn])
				return this[fn](ev);
		},
		
		_keyup: function(ev)
		{
			
		},
		
		_touchmove: function(ev)
		{
			this._mousemove(ev);
				
			this._touch_action(ev);
		},
		
		_touch_action: function(ev)
		{
			var
				tdx = this.x - this._tx,
				tdy = this.y - this._ty
			;

			if (this.left && tdx < -this.x_threshold)
			{
				this._tx = this.x;
				this.left(ev);
			}
			else if (this.right && tdx > this.x_threshold)
			{
				this._tx = this.x;
				this.right(ev);
			}
			
			if (this.up && tdy < -this.y_threshold)
			{
				this._ty = this.y;
				this.up(ev);
			} else if (this.down && tdy > this.y_threshold)
			{
				this._ty = this.y;
				this.down(ev);
			}
		},
		
		_touchstart: function(ev)
		{
			this._touchstart_t = Date.now();
			this._tx = ev.touches[0].pageX;
			this._ty = ev.touches[0].pageY;
		},
		
		_touchend: function(ev)
		{
			this._calculate_pos(ev);
		
			if (this.click && (Date.now() - this._touchstart_t <= this.tap_delay))
				this.click(ev);
				
			this._touch_action(ev);
		},
		
		destroy: function()
		{
			this.element.removeEventListener('click', this._click.bindfn);
			this.element.removeEventListener('mousemove', this._mousemove.bindfn);
			// Touch Event
			this.element.removeEventListener('touchmove', this._touchmove.bindfn);
			this.element.removeEventListener('touchstart', this._touchstart.bindfn);
			this.element.removeEventListener('touchend', this._touchend.bindfn);
			
			// Keyboard Events
			this.element.removeEventListener('keydown', this._keydown.bindfn);
			this.element.removeEventListener('keyup', this._keyup.bindfn);
		}
		
	});

})(this);