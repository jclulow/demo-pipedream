var input = fs.createReadStream('input.txt');
var output = fs.createWriteStream('output.txt');

input.pipe(output);

input.on('end', function () { ... });
output.on('finish', function () { ...  });

output.on('data', function (d) {
    console.log('read %d bytes of data', d.length);
});
