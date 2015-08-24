/* vim: set ts=8 sts=8 sw=8 noet: */
/*
 * CDDL HEADER START
 *
 * The contents of this file are subject to the terms of the
 * Common Development and Distribution License, Version 1.0 only
 * (the "License").  You may not use this file except in compliance
 * with the License.
 *
 * You can obtain a copy of the license at usr/src/OPENSOLARIS.LICENSE
 * or http://www.opensolaris.org/os/licensing.
 * See the License for the specific language governing permissions
 * and limitations under the License.
 *
 * When distributing Covered Code, include this CDDL HEADER in each
 * file and include the License file at usr/src/OPENSOLARIS.LICENSE.
 * If applicable, add the following below this CDDL HEADER, with the
 * fields enclosed by brackets "[]" replaced with your own identifying
 * information: Portions Copyright [yyyy] [name of copyright owner]
 *
 * CDDL HEADER END
 */
/*	Copyright (c) 1984, 1986, 1987, 1988, 1989 AT&T	*/
/*	  All Rights Reserved  	*/


/*
 * Copyright 2005 Sun Microsystems, Inc. All rights reserved.
 * Use is subject to license terms.
 */

var nchars = 128;      /* number of chars in char set */
var nlines =   7;       /* number of lines in a banner character */

var pposs = 85;        /* number of print positions */
                        /* on a line (must be multiple of 4) */
                        /* followed by end of string character */
var pospch = 8;        /* number of char positions per banner char */
var chpln  = 10;       /* number of banner characters per line */


var chars = [
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/* below "040" */
	0, "000", "000", "000", "000", "000", "000", 	/*  */
	"034", "034", "034", "010", 0, "034", "034", 	/* ! */
	"0167", "0167", "042", 0, 0, 0, 0,		/* " */
	"024", "024", "0177", "024", "0177", "024", "024", 	/* # */
	"076", "0111", "0110", "076", "011", "0111", "076", 	/* $ */
	"0161", "0122", "0164", "010", "027", "045", "0107", 	/* % */
	"030", "044", "030", "070", "0105", "0102", "071", 	/* & */
	"034", "034", "010", "020", 0, 0, 0,    	/* ' */
	"014", "020", "040", "040", "040", "020", "014", 	/* ( */
	"030", 4, 2, 2, 2, 4, "030",		/* ) */
	0, "042", "024", "0177", "024", "042", 0, 	/* * */
	0, "010", "010", "076", "010", "010", 0,   	/* + */
	0, 0, 0, "034", "034", "010", "020",    	/* , */
	0, 0, 0, "076", 0, 0, 0,			/* - */
	0, 0, 0, 0, "034", "034", "034",		/* . */
	1, 2, 4, "010", "020", "040", "0100",   	/* / */
	"034", "042", "0101", "0101", "0101", "042", "034", 	/* 0 */
	"010", "030", "050", "010", "010", "010", "076", 	/* 1 */
	"076", "0101", 1, "076", "0100", "0100", "0177", 	/* 2 */
	"076", "0101", 1, "076", 1, "0101", "076", 	/* 3 */
	"0100", "0102", "0102", "0102", "0177", 2, 2, 	/* 4 */
	"0177", "0100", "0100", "0176", 1, "0101", "076", 	/* 5 */
	"076", "0101", "0100", "0176", "0101", "0101", "076", /* 6 */
	"0177", "0102", "04", "010", "020", "020", "020", 	/* 7 */
	"076", "0101", "0101", "076", "0101", "0101", "076", 	/* 8 */
	"076", "0101", "0101", "077", 1, "0101", "076", 	/* 9 */
	"010", "034", "010", 0, "010", "034", "010", 	/* : */
	"034", "034", 0, "034", "034", "010", "020", 	/* ; */
	4, "010", "020", "040", "020", "010", 4,    	/* < */
	0, 0, "076", 0, "076", 0, 0,		/* = */
	"020", "010", 4, 2, 4, "010", "020",    	/* > */
	"076", "0101", 1, "016", "010", 0, "010", 	/* ? */
	"076", "0101", "0135", "0135", "0136", "0100", "076", 	/* @ */
	"010", "024", "042", "0101", "0177", "0101", "0101",   	/* A */
	"0176", "0101", "0101", "0176", "0101", "0101", "0176", 	/* B */
	"076", "0101", "0100", "0100", "0100", "0101", "076", 	/* C */
	"0176", "0101", "0101", "0101", "0101", "0101", "0176", 	/* D */
	"0177", "0100", "0100", "0174", "0100", "0100", "0177", 	/* E */
	"0177", "0100", "0100", "0174", "0100", "0100", "0100", 	/* F */
	"076", "0101", "0100", "0117", "0101", "0101", "076", 	/* G */
	"0101", "0101", "0101", "0177", "0101", "0101", "0101", 	/* H */
	"034", "010", "010", "010", "010", "010", "034",		/* I */
	1, 1, 1, 1, "0101", "0101", "076",			/* J */
	"0102", "0104", "0110", "0160", "0110", "0104", "0102", 	/* K */
	"0100", "0100", "0100", "0100", "0100", "0100", "0177", 	/* L */
	"0101", "0143", "0125", "0111", "0101", "0101", "0101", 	/* M */
	"0101", "0141", "0121", "0111", "0105", "0103", "0101", 	/* N */
	"0177", "0101", "0101", "0101", "0101", "0101", "0177", 	/* O */
	"0176", "0101", "0101", "0176", "0100", "0100", "0100", 	/* P */
	"076", "0101", "0101", "0101", "0105", "0102", "075", 	/* Q */
	"0176", "0101", "0101", "0176", "0104", "0102", "0101", 	/* R */
	"076", "0101", "0100", "076", 1, "0101", "076",		/* S */
	"0177", "010", "010", "010", "010", "010", "010",		/* T */
	"0101", "0101", "0101", "0101", "0101", "0101", "076", 	/* U */
	"0101", "0101", "0101", "0101", "042", "024", "010",   	/* V */
	"0101", "0111", "0111", "0111", "0111", "0111", "066", 	/* W */
	"0101", "042", "024", "010", "024", "042", "0101",    	/* X */
	"0101", "042", "024", "010", "010", "010", "010",		/* Y */
	"0177", 2, 4, "010", "020", "040", "0177",		/* Z */
	"076", "040", "040", "040", "040", "040", "076",		/* [ */
	"0100", "040", "020", "010", "004", "002", "001",		/* \ */
	"076", 2, 2, 2, 2, 2, "076",			/* ] */
	"010", "024", "042", 0, 0, 0, 0,			/* ^ */
	0, "000", "000", "000", "000", "000", "0177",		/* _ */
	"034", "034", "010", "04", 0, 0, 0,			/* ` */
	0, "014", "022", "041", "077", "041", "041", 	/* A */
	0, "076", "041", "076", "041", "041", "076", 	/* B */
	0, "036", "041", "040", "040", "041", "036", 	/* C */
	0, "076", "041", "041", "041", "041", "076", 	/* D */
	0, "077", "040", "076", "040", "040", "077", 	/* E */
	0, "077", "040", "076", "040", "040", "040", 	/* F */
	0, "036", "041", "040", "047", "041", "036", 	/* G */
	0, "041", "041", "077", "041", "041", "041", 	/* H */
	0, "004", "004", "004", "004", "004", "004", 	/* I */
	0, "001", "001", "001", "001", "041", "036", 	/* J */
	0, "041", "042", "074", "044", "042", "041", 	/* K */
	0, "040", "040", "040", "040", "040", "077", 	/* L */
	0, "041", "063", "055", "041", "041", "041", 	/* M */
	0, "041", "061", "051", "045", "043", "041", 	/* N */
	0, "036", "041", "041", "041", "041", "036", 	/* O */
	0, "076", "041", "041", "076", "040", "040", 	/* P */
	0, "036", "041", "041", "045", "042", "035", 	/* Q */
	0, "076", "041", "041", "076", "042", "041", 	/* R */
	0, "036", "040", "036", "001", "041", "036", 	/* S */
	0, "037", "004", "004", "004", "004", "004", 	/* T */
	0, "041", "041", "041", "041", "041", "036", 	/* U */
	0, "041", "041", "041", "041", "022", "014", 	/* V */
	0, "041", "041", "041", "055", "063", "041", 	/* W */
	0, "041", "022", "014", "014", "022", "041", 	/* X */
	0, "021", "012", "004", "004", "004", "004", 	/* Y */
	0, "077", "002", "004", "010", "020", "077", 	/* Z */
	"034", "040", "040", "0140", "040", "040", "034", 	/* { */
	"010", "010", "010", 0, "010", "010", "010", 	/* | */
	"034", 2, 2, 3, 2, 2, "034",		/* } */
	"060", "0111", "06", 0, 0, 0, 0,		/* ~ */
	0, "000", "000", "000", "000", "000", "000" 	/* DEL */
];

var TABLE = {};

function
extract_char_impl(c)
{
	var cc = c.charCodeAt(0);
	var out = [];

	for (var i = 0; i < nlines; i++) {
		var ltr = chars[cc * nlines + i];
		var s = '';

		if (typeof (ltr) === 'string') {
			ltr = parseInt(ltr, 8);
		}

		for (var j = 0; j < pospch; j++) {
			if (((ltr << j) & 0x40) != 0) {
				s += '#';
			} else {
				s += ' ';
			}
		}

		out.push(s);
	}

	/*
	 * Create the "narrow" width version of the character as well:
	 */
	var ldg = out.map(leading_spaces).reduce(reduce_min);
	var trl = out.map(trailing_spaces).reduce(reduce_min);
	var outn = out.map(function (a) {
		a = a.substr(ldg);
		a = a.substr(0, a.length - trl);
		return (a);
	});

	return ({
		f: out,
		n: outn
	});
}

function
extract_range(from, to)
{
	for (var i = from.charCodeAt(0); i <= to.charCodeAt(0); i++) {
		var c = String.fromCharCode(i);

		TABLE[c] = extract_char_impl(c);
	}
}

function
extract_char(c)
{
	TABLE[c] = extract_char_impl(c);
}

extract_range('A', 'Z');
extract_range('a', 'z');
extract_range('0', '9');
[ '|', '`', '@', '{', '}', '_', '\'', '"', '[', ']', '(', ')',
    ' ', '\\', '/', '.', ',', ';', ':' ].forEach(extract_char);

function
leading_spaces(s)
{
	if (!s.trim()) {
		return 100;
	}
	var m = s.match(/^( +)[^ ]/);
	if (m) {
		return (m[1].length);
	}
	return (0);
}

function
trailing_spaces(s)
{
	if (!s.trim()) {
		return 100;
	}
	var m = s.match(/.*[^ ]( +)$/);
	if (m) {
		return (m[1].length);
	}
	return (0);
}

function
reduce_min(a, b)
{
	return (Math.min(a, b));
}

function
make_banner(s, narrow)
{
	var out = [];
	while (out.length < nlines) {
		out.push('');
	}
	for (var i = 0; i < s.length; i++) {
		var t = TABLE[s[i]] || TABLE[' '];
		var tt = narrow ? t.n : t.f;

		for (var j = 0; j < tt.length; j++) {
			if (out[j] !== '')
				out[j] += '  ';
			out[j] += tt[j];
		}
	}
	return (out);
}

module.exports = {
	make_banner: make_banner
};
