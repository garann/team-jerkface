require('coffee-script'); // dont hate

var game = require('./lib/game')
  , numbros = 0;

setInterval(function () {
  game.available_channel(function (channel) {
    channel.on('error', function (err) { console.log(err); })
    channel.get_users(function (users) {
      //console.log(users);
      channel.add_user('bro');
    });
  });
}, 500);
