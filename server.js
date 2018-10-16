var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var exec = require('child_process').exec;

var uploader = multer({ dest: 'uploads/' });
var app = express();
app.use(bodyParser());

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.post('/upload', uploader.array('files'), function(req, res) {
    var files = req.files;
    console.log(files);

    var list = [];
    var promiseList = [];
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let fileName = file.filename;
        let origFileName = file.originalname;
        let beforeSize = file.size;

        let optPromise = new Promise(function(resolve, reject) {
            let destFile = 'outputs/' + origFileName;
            let cmd = 'svgo -q -i uploads/"' + fileName + '" -o ' + destFile + ' && ls -l ' + destFile + " | awk '{print $5}'";
            console.log(cmd);
            exec(cmd, function(err, stdout) {
                if (err) {
                    console.log(err);
                    return;
                }

                console.log('stdout: ' + stdout);
                let afterSize = parseInt(stdout);

                list.push({
                    origFileName: origFileName,
                    fileName: fileName,
                    beforeSize: beforeSize,
                    afterSize: afterSize,
                });

                resolve();
            });
        });

        promiseList.push(optPromise);
    }

    Promise.all(promiseList).then(function() {
        res.json({code: 0, data: {list: list}});
    });

});

app.get('/download', function(req, res) {
    let query = req.query;
    let filename = query.filename;
    let attach = query.attach;

    if (attach) {
        res.set('Content-Disposition', 'attachment; filename=' + filename);
    }
    res.set('Content-Type', 'image/svg+xml');
    res.sendFile(__dirname + '/outputs/' + filename);
});

app.listen(3001, function() {
    console.log('TinySVG Http Server Started. URL: http://localhost:3001');
});