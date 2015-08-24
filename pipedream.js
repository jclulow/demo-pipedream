#!/usr/bin/env node
/* vim: set ts=8 sts=8 sw=8 noet: */

var mod_assert = require('assert-plus');
var mod_fs = require('fs');
var mod_path = require('path');
var mod_ansiterm = require('ansiterm');
var mod_linedraw = require('ansiterm/lib/linedraw');
var mod_jsprim = require('jsprim');
var lib_bannerfont = require('./bannerfont');

var LD = mod_linedraw.utf8;

var TERM;
var SCREEN;
var INPROG;
var FRAMES = [];

var FRAME_ID = 0;

var SIM_FAILURE = false;
var SIM_FAILFRAME = 0;

var SIM_EXPLOSION = null;

var TRANSITION = null;

var SOURCE;
var SHOW_SOURCE = false;

var TITLE_SCREEN = false;
var TITLE_FRAME = 0;

var REDRAW_PERIOD = 40;
var STATES_PER_REDRAW = 1;


var PALETTE_DARK = {
	pipe_line: 0,
	at_colour: 51,
	class_label: 201,
	class_status: 227,
	joyent: 208,
	asterisks: 45,
	pipe_label: 195,
	item_colours: [ 21, 27, 45, 81, 63, 98, 91, 110, 157, 133, 114, 142,
	    202, 226, 196, 201, 182, 178, 253, 248 ],
	title_colours: [ 19, 21, 33, 39, 45, 81, 75, 69, 63 ]
};
var PALETTE_LIGHT = {
	pipe_line: 243,
	at_colour: 51,
	class_label: 55,
	class_status: 202,
	joyent: 208,
	asterisks: 45,
	pipe_label: 19,
	item_colours: [ 52, 53, 19, 88, 124, 91, 235, 239, 94, 17, 28, 202,
	    204 ],
	// THIS _MIGHT_ BE BETTER, but who knows:
	    // title_colours: [ 19, 21, 27, 25, 33, 69, 63, 57 ]
	title_colours: [ 19, 21, 33, 39, 45, 81, 75, 69, 63 ]
};
var PALETTE = PALETTE_DARK;
if (process.env.BG === 'light') {
	PALETTE = PALETTE_LIGHT;
} else if (process.env.BG === 'dark') {
	PALETTE = PALETTE_DARK;
} else if (process.env.BG) {
	console.error('unknown Palette: %s', process.env.BG);
	process.exit(1);
}


function
create_frame(w, h)
{
	var rows = [];

	while (rows.length < h) {
		var col = [];

		while (col.length < w) {
			col.push({
				c_c: ' ',
				c_attr: 0,
				c_fg: 0,
				c_bg: 0,
				c_clear: true
			});
		}

		rows.push(col);
	}

	return ({
		f_id: FRAME_ID++,
		f_w: w,
		f_h: h,
		f_rows: rows
	});
}

function
copy_frame(oldfrm, newfrm)
{
	mod_assert.strictEqual(oldfrm.f_x, newfrm.f_x);
	mod_assert.strictEqual(oldfrm.f_y, newfrm.f_y);

	for (var y = 0; y < oldfrm.f_h; y++) {
		for (var x = 0; x < oldfrm.f_w; x++) {
			var oc = oldfrm.f_rows[y][x];
			var nc = newfrm.f_rows[y][x];

			nc.c_c = oc.c_c;
			nc.c_attr = oc.c_attr;
			nc.c_fg = oc.c_fg;
		}
	}
}

function
apply_frame()
{
	/*
	 * Draw every cell that has been updated:
	 */
	var nf = INPROG;
	var of = SCREEN;
	for (var y = 0; y < nf.f_h; y++) {
		for (var x = 0; x < nf.f_w; x++) {
			var oc = of.f_rows[y][x];
			var nc = nf.f_rows[y][x];

			if (!nc.c_clear &&
			    (oc.c_c === nc.c_c &&
			    oc.c_attr === nc.c_attr &&
			    oc.c_fg === nc.c_fg &&
			    oc.c_bg === nc.c_bg)) {
				continue;
			}

			TERM.moveto(x + 1, y + 1);
			if (nc.c_fg > 0) {
				TERM.colour256(nc.c_fg, false);
			}
			if (nc.c_bg > 0) {
				TERM.colour256(nc.c_bg, true);
			}
			TERM.write(nc.c_c);
			if (nc.c_fg > 0 || nc.c_bg > 0) {
				TERM.reset();
			}

			oc.c_c = nc.c_c;
			oc.c_fg = nc.c_fg;
			oc.c_bg = nc.c_bg;
			oc.c_attr = nc.c_attr;
			oc.c_clear = false;
		}
	}
}

function
draw_char(f, x, y, ch, attr, fg, bg)
{
	mod_assert.string(ch);
	mod_assert.strictEqual(ch.length, 1);

	if (x >= f.f_w || y >= f.f_h || x < 0 || y < 0) {
		return (false);
	}

	var c = f.f_rows[y][x];
	c.c_c = ch;
	c.c_attr = attr || 0;
	c.c_fg = fg || 0;
	c.c_bg = bg || 0;

	return (true);
}

function
draw_string(f, x, y, st, attr, fg)
{
	mod_assert.string(st);

	for (var i = 0; i < st.length; i++) {
		if (!draw_char(f, x++, y, st[i], attr, fg)) {
			return (false);
		}
	}

	return (true);
}


function
draw_title_string(f, x, y, st, offs)
{
	mod_assert.string(st);
	var clr = offs % PALETTE.title_colours.length;

	for (var i = 0; i < st.length; i++) {
		var bg = 0;
		if (st[i] != ' ') {
			bg = PALETTE.title_colours[clr];
		}
		if (!draw_char(f, x++, y, ' ', 0, 0, bg)) {
			return (false);
		}
		clr = (clr + 1) % PALETTE.title_colours.length;
	}

	return (true);
}

function
cancel_transition()
{
	clearTimeout(TRANSITION);
	TRANSITION = null;
}

function
set_transition()
{
	cancel_transition();
	TRANSITION = setTimeout(cancel_transition, 1000);
}

function
setup_terminal()
{
	var term = new mod_ansiterm.ANSITerm();

	term.clear();
	term.cursor(false);

	term.on('keypress', function (key) {
		if (key === 'q'.charCodeAt(0)) {
			TERM.clear();
			TERM.moveto(1, 1);
			process.exit(0);

		} else if (key === 's'.charCodeAt(0)) {
			if (SOURCE) {
				SHOW_SOURCE = true;
			}

		} else if (key === 't'.charCodeAt(0)) {
			TITLE_SCREEN = true;

		} else if (key === 'r'.charCodeAt(0)) {
			set_transition();
			reset();
			if (TITLE_SCREEN) {
				if (process.env.FIRST === 'source') {
					SHOW_SOURCE = true;
				}
				TITLE_SCREEN = false;
			}

		} else if (key === 'j'.charCodeAt(0)) {
			if (TITLE_SCREEN) {
				TITLE_SCREEN = false;
				set_transition();
				reset();
				if (process.env.FIRST === 'source') {
					SHOW_SOURCE = true;
				}

			} else if ((SIMNAMEIDX + 1) < SIMNAMES.length) {
				SIMNAMEIDX++;
				set_transition();
				reset();
				if (process.env.FIRST === 'source') {
					SHOW_SOURCE = true;
				}
			}

		} else if (key === 'k'.charCodeAt(0)) {
			if ((SIMNAMEIDX - 1) >= 0) {
				SIMNAMEIDX--;
				set_transition();
				reset();
				if (process.env.FIRST === 'source') {
					SHOW_SOURCE = true;
				}
			}

		}
	});

	return (term);
}

function
draw_box(f, x1, y1, x2, y2)
{
	draw_char(f, x1, y1, LD.topleft);
	draw_char(f, x1, y2, LD.bottomleft);
	draw_char(f, x2, y1, LD.topright);
	draw_char(f, x2, y2, LD.bottomright);

	for (var x = x1 + 1; x < x2; x++) {
		draw_char(f, x, y1, LD.horiz);
		draw_char(f, x, y2, LD.horiz);
	}

	for (var y = y1 + 1; y < y2; y++) {
		draw_char(f, x1, y, LD.verti);
		draw_char(f, x2, y, LD.verti);
	}
}

function
draw_buffer(f, x1, y1, x2, y2, name, buf, val, max)
{
	mod_assert.arrayOfObject(buf, 'buf');
	var pos = 0;

	var next_item = function () {
		if (pos < buf.length) {
			return (buf[pos++]);
		}
		return ({
			s: ' ',
			c: 0
		});
	};
	var nleft = function () {
		return (buf.length - pos);
	};

	draw_box(f, x1, y1, x2, y2);
	if (name) {
		draw_string(f, x1 + 1, y1, ' ' + name + ' ');
	}
	for (var y = y2 - 1; y > y1; y--) {
		for (var x = x2 - 1; x > x1; x--) {
			if (nleft() > 0) {
				var ni = next_item();
				draw_char(f, x, y, ni.s, false, ni.c);
			} else {
				draw_char(f, x, y, ' ');
			}
		}
	}

	var occ;
	if (max) {
		occ = ' ' + val + '/' + max;
	} else if (val || val === 0) {
		occ = '   ' + val;
	}
	if (occ) {
		draw_string(f, x2 - occ.length, y1 + 1, occ, 0, PALETTE.class_status);
	}

	if (nleft() < 1) {
		return (true);
	}
	return (false);
}

function
draw_explosion(f, startx, starty, buf, n)
{
	var nleak = n;
	var pos = 0;
	var next_item = function () {
		var ret = buf[pos];
		pos = (pos + 1) % buf.length;
		return (ret);
	};

	/*
	 * Draw leakage onto the floor...
	 */
	var y = starty;
	while (nleak-- > 0) {
		var ni = next_item();
		draw_char(f, startx, y++, ni.s, false, ni.c);
		if (y >= f.f_h) {
			break;
		}
	}

	/*
	 * Draw expanding puddle on the floor...
	 */
	nleak *= 96;
	y = f.f_h - 1;
	var x = startx;
	var xmag = 1;
	for (;;) {
		var able = false;

		if (nleak < 1) {
			break;
		}
		ni = next_item();
		if (draw_char(f, startx + xmag, y, ni.s, false, ni.c)) {
			able = true;
			nleak--;
		}

		if (nleak < 1) {
			break;
		}
		ni = next_item();
		if (draw_char(f, startx - xmag, y, ni.s, false, ni.c)) {
			able = true;
			nleak--;
		}

		if (!able) {
			y--;
			if (y === 0) {
				/*
				 * Explosion has completely consumed screen.
				 */
				return (true);
			}
			ni = next_item();
			if (draw_char(f, startx, y, ni.s, false, ni.c)) {
				able = true;
				nleak--;
			}
			xmag = 1;
		} else {
			xmag++;
		}
	}

	return (false);
}

function
draw_pipe(f, x1, y1, x2, y2, p)
{
	var horiz = '\u2504';
	var verti = '\u250a';

	var atpct = p.charge;
	if (atpct < 0)
		atpct = 0;
	if (atpct > 100)
		atpct = 100;

	if (x1 === x2) {
		for (var y = y1; y <= y2; y++) {
			draw_char(f, x1, y, verti, false, PALETTE.pipe_line);
		}
		if (p.active) {
			var y = Math.round((y2 - y1) * (atpct / 100)) + y1;
			draw_char(f, x1, y, p.active.s, false, p.active.c);
		}
		draw_char(f, x2, y2, 'V', false, PALETTE.pipe_line);
	} else if (y1 === y2) {
		if (p.label) {
			var lbl = p.label + '  ';
			draw_string(f, x1 + 1, y1 + 1, lbl, false,
			    PALETTE.pipe_label);
		}
		for (var x = x1; x <= x2; x++) {
			draw_char(f, x, y1, horiz, false, PALETTE.pipe_line);
		}
		if (p.active) {
			var x = Math.round((x2 - x1) * (atpct / 100)) + x1;
			draw_char(f, x, y1, p.active.s, false, p.active.c);
		}
		draw_char(f, x2, y2, '>', false, PALETTE.pipe_line);
	} else {
		throw (new Error('invalid pipe'));
	}
}

function
sim_failure(f)
{
	if (SIM_FAILURE) {
		return;
	}
	SIM_FAILURE = true;
	SIM_FAILFRAME = 0;

	var pdw = 4;
	var pdh = 2;
	var sfx = Math.round((f.f_w - 19) / 2);
	var sfy = Math.round((f.f_h - 5) / 2);

	var y = 0;
	for (var x = 0; x < f.f_w; x++) {
		for (var y = 0; y < f.f_h; y++) {
			var ch = ((x % 2 == 0) && (y % 2 == 0)) ? '*' : ' ';

			if (x >= (sfx - pdw) && x < (sfx + 19 + pdw) &&
			    y >= (sfy - pdh) && y < (sfy + 5 + pdh)) {
				draw_char(f, x, y, ' ');
			} else {
				draw_char(f, x, y, ch, 0, PALETTE.asterisks);
			}
		}
	}
}

function
count_type(typ)
{
	return (SIM.sims.filter(function (s) {
		return (s.type === typ);
	}).length);
}

function
width_factor(type)
{
	switch (type) {
	case 'readable':
	case 'writable':
		return (1);
	case 'transform':
		return (2);
	default:
		return (1);
	}
}

function
width_total(sim)
{
	return (sim.map(function (s) {
		return (width_factor(s.type));
	}).reduce(function (a, b) {
		return (a + b);
	}));
}

function
redraw()
{
	var f = INPROG;
	var nm = SIM.name; /* SIMNAMES[SIMNAMEIDX]; */
	if (SOURCE) {
		nm += ' [s]';
	} else {
		SHOW_SOURCE = false;
	}

	if (TITLE_SCREEN) {
		f = INPROG = create_frame(f.f_w, f.f_h);
		var txt = lib_bannerfont.make_banner('PipeDream', true);
		var xpos = Math.round((f.f_w - txt[0].length) / 2);
		txt.forEach(function (l, i) {
			TITLE_FRAME++;
			var offs = Math.floor(TITLE_FRAME / 12);
			draw_title_string(f, xpos, 4 + i, l, i + offs);
		});

		var l2 = 'An Artist\'s Impression Of Node Streams';
		xpos = f.f_w - l2.length - 3;
		draw_string(f, xpos, 12, l2);

		var l2 = 'Joshua M. Clulow';
		xpos = f.f_w - l2.length - 3;
		draw_string(f, xpos, f.f_h - 3, l2);
		var l2 = 'Joyent, Inc.';
		xpos = f.f_w - l2.length - 3;
		draw_string(f, xpos, f.f_h - 2, l2, 0, PALETTE.joyent);


	} else if (TRANSITION) {
		draw_string(f, 2, f.f_h - 2, nm || '');

	} else if (SHOW_SOURCE) {
		f = INPROG = create_frame(f.f_w, f.f_h);
		for (var i = 0; i < SOURCE.length; i++) {
			draw_string(f, 2, 1 + i, SOURCE[i]);
		}
		draw_string(f, 2, f.f_h - 2, nm);

	} else if (SIM_FAILURE) {
		var sfx = Math.round((f.f_w - 19) / 2);
		var sfy = Math.round((f.f_h - 5) / 2);
		SIM_FAILFRAME = (SIM_FAILFRAME + 1) % 20;
		if (SIM_FAILFRAME > 6) {
			draw_string(f, sfx, sfy + 0, '      H E A T      ');
			draw_string(f, sfx, sfy + 2, '    S H I E L D    ');
			draw_string(f, sfx, sfy + 4, 'S E P A R A T I O N');
		} else {
			draw_string(f, sfx, sfy + 0, '                   ');
			draw_string(f, sfx, sfy + 2, '                   ');
			draw_string(f, sfx, sfy + 4, '                   ');
		}

	} else if (SIM_EXPLOSION) {
		if (draw_explosion(f, SIM_EXPLOSION.se_x, SIM_EXPLOSION.se_y,
		    SIM_EXPLOSION.se_buf, SIM_EXPLOSION.se_count)) {
			    sim_failure(f);
		}

	} else {
		var total = width_total(SIM.sims);

		var w = f.f_w / total - 0.4;
		var sofar = 0;

		var y = 5;
		var x = 1;
		for (var i = 0; i < SIM.sims.length; i++) {
			var s = SIM.sims[i];
			var ww = Math.floor(width_factor(s.type) * w);

			if (i === SIM.sims.length - 1) {
				ww = f.f_w - sofar - 2;
			} else {
				sofar += ww + 1;
			}

			switch (s.type) {
			case 'readable':
				draw_readable(f, x, y, x + ww, y + 6, s);
				break;
			case 'writable':
				draw_writable(f, x, y, x + ww, y + 6, s);
				break;
			case 'transform':
				draw_transform(f, x, y, x + ww, y + 6, s);
				break;
			case 'pipe':
				s.label = '.pipe()';
				draw_pipe(f, x, y + 5, x + ww, y + 5, s);
				break;
			case 'call':
			case 'listener':
				draw_pipe(f, x, y + 5, x + ww, y + 5, s);
				break;
			case 'eventemitter':
				draw_eventemitter(f, x, y, x + ww, y + 6, s);
				break;
			case 'array':
				draw_array(f, x, y, x + ww, y + 6, s);
				break;
			}

			x += ww + 1;
		}

		draw_string(f, 2, f.f_h - 2, nm);
	}

	apply_frame();

	for (var i = 0; i < STATES_PER_REDRAW; i++) {
		state();
	}

	setTimeout(redraw, REDRAW_PERIOD);
}

function
draw_transform(f, x1, y1, x2, y2, t)
{
	/*
	 * The width of each buffer is half the space available, minus two
	 * interior border lines and the space for the work cell in the centre.
	 */
	var w = Math.round((x2 - x1 - 2 - 3) / 2);
	mod_assert.ok(w >= 1, 'transform too narrow');

	var x = x1;
	draw_buffer(f, x, y1, x + w, y2, false, t.buffer_in, t.buffer_in.length, t.buffer_max);
	x += w;
	var actbuf = [];
	if (t.active) {
		actbuf.push(t.active);
		if (t.factor && t.factor > 1) {
			var factf = Math.round((t.factor) * t.charge / 100);
			while (actbuf.length < factf) {
				actbuf.push(t.active);
			}
		}
	}
	draw_buffer(f, x, y1, x + 4, y2, false, actbuf);
	x += 4;
	draw_buffer(f, x, y1, x2, y2, false, t.buffer_out, t.buffer_out.length, t.buffer_max);

	/*
	 * Fill in special corners for centre buffer:
	 */
	var spectop = '\u2533';
	var specbot = '\u253b';

	draw_char(f, x1 + w, y1, spectop);
	draw_char(f, x1 + w + 4, y1, spectop);
	draw_char(f, x1 + w, y2, specbot);
	draw_char(f, x1 + w + 4, y2, specbot);

	if (t.active) {
		draw_string(f, x1 + w + 1, y1 + 1, 'ACT', 0, PALETTE.class_status);
		draw_string(f, x1 + w + 1, y1 + 2, 'IVE', 0, PALETTE.class_status);
	}

	if (t.name) {
		draw_string(f, x1 + 1, y1, ' ' + t.name + ' ');
	}

	draw_string(f, x1 + 1, y2, 'Transform', false, PALETTE.class_label);
}

function
draw_writable(f, x1, y1, x2, y2, w)
{
	var s = 'Writable';
	if (x2 - x1 - 2 < s.length) {
		s = 'Wrtble';
	}

	draw_buffer(f, x1, y1, x2, y2, w.name, w.buffer_in, w.buffer_in.length, w.buffer_max);
	draw_string(f, x1 + 1, y2, s, false, PALETTE.class_label);
	draw_pipe(f, x2 - 1, y2 + 1, x2 - 1, y2 + 4, w);
	draw_string(f, x2 - 6, y2 + 3, 'sink');
	draw_string(f, x2 - 8, y2 + 1, w.active ? 'ACTIVE' : '      ', 0, PALETTE.class_status);
}

function
draw_readable(f, x1, y1, x2, y2, r)
{
	draw_buffer(f, x1, y1, x2, y2, r.name, r.buffer_out, r.buffer_out.length, r.buffer_max);
	var s = 'Readable'
	if (x2 - x1 - 2 < 'Readable'.length) {
		s = 'Rdble';
	}
	draw_string(f, x1 + 1, y2, s, false, PALETTE.class_label);
	draw_pipe(f, x1 + 3, y1 - 4, x1 + 3, y1 - 1, r);
	draw_string(f, x1 + 5, y1 - 4, 'source');
	draw_string(f, x1 + 5, y1 - 1, (r.active && r.charge < 100) ? 'ACTIVE' : '      ', 0, PALETTE.class_status);
}

function
draw_eventemitter(f, x1, y1, x2, y2, ee)
{
	draw_buffer(f, x1, y1, x2, y2, ee.name, []);
	draw_string(f, x1 + 1, y2, 'EvtEmtr', false, PALETTE.class_label);
	draw_pipe(f, x1 + 3, y1 - 4, x1 + 3, y1 - 1, ee);
	draw_string(f, x1 + 4, y1 - 4, 'source');
}

function
draw_array(f, x1, y1, x2, y2, a)
{
	if (!draw_buffer(f, x1, y1, x2, y2, a.name, a.buffer_in, a.buffer_in.length)) {
		sim_explosion(x1 + 5, y2, a.buffer_in);
		return;
	}
	draw_string(f, x1 + 1, y2, 'Array', false, PALETTE.class_label);
}

function
find_sim(name)
{
	for (var i = 0; i < SIM.sims.length; i++) {
		var s = SIM.sims[i];

		if (s.name === name) {
			return (s);
		}
	}

	throw (new Error('unmatched name: ' + name));
}

var SEQ = make_seq();
var SEQPOS = 0;


var LASTCOL = -1;
function
rand_col()
{
	var idx;

	for (;;) {
		idx = Math.floor(Math.random() * PALETTE.item_colours.length);

		if (idx !== LASTCOL)
			break;
	}

	LASTCOL = idx;
	return (PALETTE.item_colours[idx]);
}

function
make_seq()
{
	var seq = [];

	for (var i = '0'.charCodeAt(0); i <= '9'.charCodeAt(0); i++) {
		seq.push(String.fromCharCode(i));
	}
	for (var i = 'A'.charCodeAt(0); i <= 'Z'.charCodeAt(0); i++) {
		seq.push(String.fromCharCode(i));
	}
	for (var i = 'a'.charCodeAt(0); i <= 'z'.charCodeAt(0); i++) {
		seq.push(String.fromCharCode(i));
	}

	return (seq);
}

function
char_gen()
{
	var ret = SEQ[SEQPOS];
	SEQPOS = (SEQPOS + 1) % SEQ.length;
	return (ret);
}

function
state_for(s)
{
	if (s.charge < 100) {
		s.charge += s.charge_per_cycle;
	}

	if (s.charge < 100) {
		return (false);
	}

	switch (s.type) {
	case 'readable':
		if (s.active === null && s.buffer_out.length < s.buffer_max) {
			s.active = {
				s: char_gen(),
				c: rand_col()
			};
			s.charge = -3 * s.charge_per_cycle;
			break;
		}
		if (s.active !== null && s.buffer_out.length < s.buffer_max) {
			s.buffer_out.push(s.active);
			s.active = null;
			break;
		}
		break;
	case 'writable':
		if (s.active !== null) {
			s.active = null;
			break;
		}
		if (s.active === null && s.buffer_in.length > 0) {
			s.active = s.buffer_in.shift();
			s.charge = 0;
			break;
		}
		if (s.active === null && s.buffer_in.length === 0) {
			s.charge = 100;
			break;
		}
		break;
	case 'transform':
		if (s.active === null && s.buffer_in.length > 0 &&
		    s.buffer_out.length < s.buffer_max) {
			s.active = s.buffer_in.shift();
			s.charge = 0;
			break;
		}
		if (s.active !== null) {
			var ff = s.factor || 1;
			for (var i = 0; i < ff; i++) {
				s.buffer_out.push(mod_jsprim.deepCopy(
				    s.active));
			}
			s.active = null;
			s.charge = 100;
			break;
		}
		break;
	case 'eventemitter':
		if (s.end) {
			break;
		}
		if (s.remain < 1) {
			s.end = true;
			break;
		}
		if (s.active !== null) {
			s.emitting = true;
			break;
		}
		if (s.active === null) {
			s.active = {
				s: char_gen(),
				c: rand_col()
			};
			s.charge = 0;
			s.remain--;
			break;
		}
		break;
	case 'call':
		var fr = find_sim(s.from);
		var to = find_sim(s.to);
		mod_assert.equal(fr.type, 'array');
		if (s.active !== null) {
			while (s.active.payload.length > 0) {
				to.buffer_in.push(s.active.payload.shift());
			}
			s.active = null;
			break;
		}
		if (s.active === null && fr.buffer_out.length > 0) {
			s.active = {
				s: '@',
				c: PALETTE.at_colour,
				payload: fr.buffer_out
			};
			fr.buffer_out = [];
			s.label = 'write()';
			s.charge = 0;
			break;
		}
		s.label = '';
		break;
	case 'listener':
		var fr = find_sim(s.from);
		var to = find_sim(s.to);
		if (s.end) {
			to.end = true;
			break;
		}
		if (s.active !== null) {
			to.buffer_in.push(s.active);
			s.active = null;
			break;
		}
		if (s.active === null && fr.emitting) {
			fr.emitting = false;
			s.label = '"data"';
			s.active = fr.active;
			fr.active = null;
			s.charge = 0;
			break;
		}
		if (fr.end) {
			s.label = '"end"';
			s.end = true;
			break;
		}
		break;
	case 'array':
		if (s.end) {
			s.buffer_out = s.buffer_in;
			s.buffer_in = [];
		}
		break;
	case 'pipe':
		var fr = find_sim(s.from);
		var to = find_sim(s.to);
		/*
		var tform_block = (to.buffer_out && to.buffer_out.length >=
		    to.buffer_max) || false;
		   */
		if (s.active === null &&
		    //to.active === null &&
		    //to.buffer_in.length < 1 &&
		    //!tform_block &&
		    to.buffer_in.length < to.buffer_max &&
		    fr.buffer_out.length > 0) {
			s.active = fr.buffer_out.shift();
			s.charge = 0;
			break;
		}
		if (s.active !== null) {
			to.buffer_in.push(s.active);
			s.active = null;
			break;
		}
		break;
	}
}

function
state()
{
	if (TITLE_SCREEN || SHOW_SOURCE || TRANSITION || SIM_FAILURE) {
		return;
	} else if (SIM_EXPLOSION !== null) {
		SIM_EXPLOSION.se_count++;
	} else {
		SIM.sims.map(state_for);
	}
}

function
sim_explosion(x, y, buf)
{
	if (SIM_EXPLOSION) {
		return;
	}

	SIM_EXPLOSION = {
		se_x: x,
		se_y: y,
		se_count: 0,
		se_buf: mod_jsprim.deepCopy(buf)
	};
}

function
load_file(x)
{
	try {
		return (mod_fs.readFileSync(x).toString());
	} catch (ex) {
		if (ex.code !== 'ENOENT')
			throw (ex);
		return (null);
	}
}

function
reset()
{
	var sz = TERM.size();
	SCREEN = create_frame(sz.w, sz.h);
	INPROG = create_frame(sz.w, sz.h);

	SIM_FAILURE = false;
	SIM_EXPLOSION = null;
	SHOW_SOURCE = false;

	var simname = SIMNAMES[SIMNAMEIDX];
	var tries = [
		simname,
		mod_path.join(__dirname, 'sims', simname),
		mod_path.join(__dirname, 'sims', simname + '.json')
	];

	var f;
	for (i = 0; i < tries.length; i++) {
		if ((f = load_file(tries[i]))) {
			try {
				SIM = JSON.parse(f);
				if ((f = load_file(tries[i].
				    replace(/sims/, 'examples').
				    replace(/\.json$/, '.js')))) {
					SOURCE = f.split(/\n/);
				} else {
					SOURCE = null;
				}
				return;
			} catch (ex) {
				console.error('ERROR: %s', ex.message);
				process.exit(1);
			}
		}
	}

	console.error('ERROR: could not find "%s"', SIMNAME);
	process.exit(1);
}

var SIMNAMEIDX = 0;
var SIMNAMES = [];
var SIM;
function
main(args)
{
	if (args.length < 1) {
		var dn = mod_path.join(__dirname, 'sims');
		SIMNAMES = mod_fs.readdirSync(dn).filter(function (a) {
			return (a.match(/\.json$/));
		}).sort();
	} else {
		SIMNAMES = [ args[0] ];
	}

	TERM = setup_terminal();

	TITLE_SCREEN = true;
	reset();

	redraw();
	state();
}

main(process.argv.slice(2));
