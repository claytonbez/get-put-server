var args = process.argv;
var portIndex = args.indexOf('--port');
if(portIndex < 0){
    console.log('Error: add --port <port number> as parameters when starting this script.now exiting');
    process.exit();
}
var serverPort = parseInt(args[portIndex+1]);
const fs = require('fs-extra');
const path = require('path');
const io = require('socket.io')(serverPort);
const ss = require('socket.io-stream');
var colors = require('colors');
var requestCounter = 0 ;
io.on('connection', (socket) => {
    requestCounter++;
    console.log(`connected -> ${socket.id}`);
    socket.on('disconnect', () => {
        console.log('#'+requestCounter);
    });
    socket.on('get',(folder)=>{
        console.log('GET>>'.green,folder.green);
        var filepath = path.join(__dirname, "folders", folder + '.zip');
        var foldersPath = path.join(__dirname, "folders");
        fs.stat(foldersPath, (err, stat) => {
            if(!err){
                let sendStream = ss.createStream();
                ss(socket).emit('get-file',sendStream,folder);
                var sc = fs.createReadStream(filepath);
                sc.on('finish',()=>{
                   socket.emit('get-success');
                });
                sc.pipe(sendStream);
            }
        });
    });
    ss(socket).on('put',(receiveStream,folder)=>{
        console.log('PUT<<'.yellow, folder.yellow);
        var foldersPath = path.join(__dirname,'folders');
        var zipfile = folder + ".zip";
        var file = path.join(foldersPath, zipfile );
        fs.ensureDir(foldersPath, (err) => {
            if(!err){
                var sendStream = ss.createStream();
                var wrs = fs.createWriteStream(file);
                wrs.on('finish', () => {
                    socket.emit('put-success');
                });
                receiveStream.pipe(wrs);
            }
        });
    });
});
console.log('GetPut Server bound to port %s', serverPort);