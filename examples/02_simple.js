var input = fs.createReadStream('input.txt');

var data = '';
input.on('readable', function () {
    var d;
    while ((d = input.read()) !== null) {
        data += d.toString();
    }
});

input.on('end', function () {
    console.log('%s', data);
});
