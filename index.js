/**
 * Created by developer on 16/11/14.
 */
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
    res.send('<h1>Hello world</h1>');
});

// 房间用户名单
var roomInfo = {};

var nsp = io.of('/chat');
nsp.on('connection', function (socket) {
    // console.log(socket);
    var url = socket.request.headers.referer;
    var splited = url.split('/');
    var roomID = splited[splited.length - 1];   // 获取房间ID
    var user = '';

    // 将用户昵称加入房间名单中
    if (!roomInfo[roomID]) {
        roomInfo[roomID] = [];
    }

    // console.log(url);
    // console.log('roomID:', roomID);


    socket.on('online', function (data) {
        var data = JSON.parse(data);
        user = data.user;
        roomInfo[roomID].push(user);
        socket.join(roomID);
        // 通知房间内人员
        socket.to(roomID).emit('join', user, roomInfo[roomID]);
        console.log(user + '加入了' + roomID);
    });


    socket.on('disconnect', function () {
        // 从房间名单中移除
        var index = roomInfo[roomID].indexOf(user);
        if (index !== -1) {
            roomInfo[roomID].splice(index, 1);
        }

        socket.leave(roomID);
        nsp.to(roomID).emit('leave', user, roomInfo[roomID]);
        console.log(user + '退出了' + roomID);
    });



    socket.on('msg', function (message) {
        console.log('message: ' + message);
        // 验证如果用户不在房间内则不给发送
        if (roomInfo[roomID].indexOf(user) === -1) {
            return false;
        }
        socket.broadcast.in(roomID).emit('msg', user, message);
        socket.broadcast.emit('msg', 'testname', 'testmsg');
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});

