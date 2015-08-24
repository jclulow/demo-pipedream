var format = new Transform();
format._transform = function (ent, _, done) {
    var out = ent.name + ' (' +
      ent.size + 'b)\n';

    this.push(out);
    done();
};

var readdir = fs.createListStream(); /* sigh */

readdir.pipe(format).pipe(process.stdout);
