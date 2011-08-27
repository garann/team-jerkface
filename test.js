require('coffee-script'); // dont hate

var Game = require('./lib/game')
  , game = new Game();

game.join(null, 'broasaurus_rex', function (err, chan) {
  game.join(chan.name, 'bronameth', function (err, chan) {
    game.join(chan.name, 'bro', function (err, chan) {
  
    });
  });
  game.join(chan.name, 'bronameth', function (err, chan) {
    game.join(chan.name, 'bro', function (err, chan) {
      chan.get_users(console.log)
    });
  });
  game.join(chan.name, 'bronameth', function (err, chan) {
    game.join(chan.name, 'bro', function (err, chan) {
  
    });
  });
  game.join(chan.name, 'bronameth', function (err, chan) {
    game.join(chan.name, 'bro', function (err, chan) {
  
    });
  });
  game.join(chan.name, 'bronameth', function (err, chan) {
    game.join(chan.name, 'bro', function (err, chan) {
  
    });
  });
  game.join(chan.name, 'bronameth', function (err, chan) {
    game.join(chan.name, 'bro', function (err, chan) {
      
    });
  });
});
