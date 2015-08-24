var format = new Transform({ objectMode: true });
format._transform = function (ent, _, done) {
    var out = ent.name + ' (' +
      ent.size + 'b)\n';

    this.push(out);
    done();
};

var readdir = fs.createListStream(); /* sigh */

readdir.pipe(format).pipe(process.stdout);
