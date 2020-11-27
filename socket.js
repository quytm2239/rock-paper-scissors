var common_room = 777;
var joinedPlayer = [];
var choices = [];
var roundStart = false;

var CronJob = require('cron').CronJob;
var job = new CronJob('* * * * * *', function() {
  console.log('You will see this message every second');
}, null, true, 'America/Los_Angeles');
job.start();

module.exports = function(io) {
    console.log('->*<3- [SOCKETCHAT is LOADED] ->*<3-');
    io.on('connection', function (socket) {
        console.log(socket.id + ' connected');

        socket.on('join_game', function (data) {

          var suffix = '' + (Math.floor(Math.random() * 1000) + 1000);

          socket.username = data + '@' + suffix;
          socket.room = common_room;
          socket.join(common_room);
          joinedPlayer.push[socket];

          socket.emit('your_info', {
              username: socket.username
          });

          var room = io.sockets.adapter.rooms[common_room];
          io.sockets["in"](common_room).emit('join_game', room.length);
        });

        // when the client emits 'new message', this listens and executes
        socket.on('move', function (data) {
            console.log(data);
            if (roundStart == false) { return; }

            var mSecondsTime = new Date().getTime();

            var jsonData = {
              username : socket.username,
              choice: data,
            };

            choices.push(jsonData);
        });

        // when the user disconnects.. perform this
        socket.on('disconnect', function () {
            io.sockets["in"](socket.room).emit('user_left',{
                username: socket.username
            });
            console.log(socket.username + ' has left room: ' + socket.room);
        });
    });
};
