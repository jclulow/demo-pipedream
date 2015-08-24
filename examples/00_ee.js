server.get('/', function (err, res, next) {
    var backend = database.fetchData();
    var data = [];

    backend.on('data', function (d) {
        data.push(d);
    });
    backend.on('end', function () {
        res.write(data.join('\n'));
        res.end();
        next();
    });
});
