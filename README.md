# pipedream

The `j` and `k` keys move forwards and backwards through the deck.

The `r` key will reset the current animation.  The `s` key will show the demo
source, if one exists.  The `t` key returns to the title screen.

Run the tool in a large-font terminal with at least, say, 70x20 cells.

```
$ npm install
...

$ node pipedream.js
```

If you have a dark background in your terminal, the defaults are probably
good.  Otherwise, try:

```
$ BG=light node pipedream.js
```
