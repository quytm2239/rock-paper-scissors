var common_room = 777;
var joinedPlayer = [];
var choices = [];
var roundStart = false;
var roundWait = false;
const roundTime = 5;
const waittingTime = 5;
var choiceType = ["Rock", "Paper", "Scissors"]

var timer = roundTime;

const CronJob = require('cron').CronJob;

function findWinner() {
    if (choices.length == 1) {
      var choice = choiceType[Math.floor(Math.random() * choiceType.length)];
      choices.push({
          name: "Unbeatable BOT",
          choice: choice,
      });
    }
    const sameResult = choices.map(x => x.choice);
    var set = new Set(sameResult);
    console.log(set);

    if (set.length == 1 || set.length == choiceType.length) {
        for (var i in choices) {
            choices[i].state = "Draw";
        }
        return {
            result: "Draw",
            choices: choices
        }
    }
    let myArr = Array.from(set)

    var group1 = choices.filter(choice => myArr[0] == choice.choice);
    var group2 = choices.filter(choice => myArr[1] == choice.choice);

    if (group1.length == 0 || group2.length == 0) {
        for (var i in choices) {
            choices[i].state = "Error";
        }
        return {
            result: "Error",
            choices: choices
        }
    }

    var player1 = group1[0]
    var player2 = group2[0]

    if (player1.choice == "Paper") {
        var win = "Scissors"
        if (player2.choice == win) {
            for (var i in choices) {
                choices[i].state = choices[i].choice == win ? "Win" : "Lose";
            }
        } else {
            for (var i in choices) {
                choices[i].state = choices[i].choice == "Paper" ? "Win" : "Lose";
            }
        }
    } else if (player1.choice == "Scissors") {
        var win = "Rock"
        if (player2.choice == win) {
            for (var i in choices) {
                choices[i].state = choices[i].choice == win ? "Win" : "Lose";
            }
        } else {
            for (var i in choices) {
                choices[i].state = choices[i].choice == "Scissors" ? "Win" : "Lose";
            }
        }
    } else { // case: Rock
        var win = "Paper"
        if (player2.choice == win) {
            for (var i in choices) {
                choices[i].state = choices[i].choice == win ? "Win" : "Lose";
            }
        } else {
            for (var i in choices) {
                choices[i].state = choices[i].choice == "Rock" ? "Win" : "Lose";
            }
        }
    }
    console.log(choices);
    return {
        result: "Draw",
        choices: choices
    }
}

module.exports = function(io) {
    console.log('->*<3- [SOCKETCHAT is LOADED] ->*<3-');

    var job = new CronJob('* * * * * *', function() {
        if (joinedPlayer.length >= 2) {
            if (timer == 0) { // zero
                if (roundWait) {
                    // in waitting for new round
                    roundStart = true; // end wait -> start new round
                    roundWait = false;
                    console.log('End waitting -> Start new round');
                    timer = roundTime;
                    io.sockets["in"](common_room).emit('move', {
                        waitForPlayer: false,
                        allow: true
                    });
                } else {
                    // NOT in waitting for new round, a round starting
                    // end this round and send result
                    roundStart = false;
                    roundWait = true;
                    io.sockets["in"](common_room).emit('move', {
                        waitForPlayer: false,
                        allow: false
                    });
                    io.sockets["in"](common_room).emit('result', findWinner());
                    choices = []; // clear data
                    timer = waittingTime;
                    console.log('End round -> Start waitting');
                }
                io.sockets["in"](common_room).emit('count_down', {
                    roundStart: roundStart,
                    roundWait: roundWait,
                    timer: timer
                });
                timer -= 1; // decrease timer
            } else { // if timer > 0
                if (roundWait) {
                    // in waitting for new round
                    roundStart = false;
                    console.log('Round is waitting: ' + timer);
                } else {
                    // NOT in waitting for new round, a round starting
                    roundStart = true;
                    console.log('Round is starting: ' + timer);
                }
                io.sockets["in"](common_room).emit('count_down', {
                    roundStart: roundStart,
                    roundWait: roundWait,
                    timer: timer
                });
                timer -= 1; // decrease timer

            }
        } else { // dont have enough player
            if (roundWait || roundStart) {
                io.sockets["in"](common_room).emit('move', {
                    waitForPlayer: true,
                    allow: false
                });
            }
            roundStart = false;
            roundWait = false;
            choices = [];
            timer = roundTime; // reset for new round
            console.log('Waitting for enough player!');
        }
    }, null, true, 'America/Los_Angeles');

    //------------------------------------------------------------------------------
    io.on('connection', function(socket) {
        console.log(socket.id + ' connected');

        job.start();

        socket.on('join_game', function(data) {

            var suffix = '' + (Math.floor(Math.random() * 1000) + 1000);

            socket.username = data + '@' + suffix;
            socket.room = common_room;
            socket.join(common_room);
            joinedPlayer.push(socket);
            console.log('joinedPlayer: ' + joinedPlayer.length);

            socket.emit('your_info', {
                username: socket.username
            });
            console.log(socket.username + ' just joined game.');

            var room = io.sockets.adapter.rooms[common_room];
            io.sockets["in"](common_room).emit('join_game', {
                join_game: room.length
            });
        });

        // when the client emits 'new message', this listens and executes
        socket.on('move', function(data) {
            console.log(data);
            if (roundStart == false) {
                socket.emit('move', {
                    allow: false
                });
                return;
            }
            var found = false;
            for (i = 0; i < choices.length; i++) {
                if (choices[i].name == socket.username) {
                    choices[i].choice = data;
                    found = true;
                    break; //Stop this loop, we found it!
                }
            }
            if (!found) {
                choices.push({
                    name: socket.username,
                    choice: data,
                });
            }
        });

        // when the user disconnects.. perform this
        socket.on('disconnect', function() {

            joinedPlayer.forEach(function(item, index, object) {
                if (item.username === socket.username) {
                    object.splice(index, 1);
                }
            });

            io.sockets["in"](socket.room).emit('user_left', {
                username: socket.username,
                joinedPlayer: joinedPlayer.length
            });
            console.log(socket.username + ' has left room: ' + socket.room);
        });
    });
};
