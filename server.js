var http = require('http') 
  , nko = require('nko')('cx/IKz4MDPXythy2')
  , everyauth = require('everyauth')
  , $redis = require('./lib/adapter')
  , connect = require('connect')
  , everyauth = require('everyauth')
  , express = require('express')
  , io = require('socket.io')
  , config = require('./lib/config')
, AcroLetters = require('./lib/AcroLetters.js').AcroLetters
, acro = new AcroLetters()
, game = require('./lib/game')
  , users = {};

everyauth
  .twitter
    .myHostname(config.host)
    .consumerKey(config.twitter_key)
    .consumerSecret(config.twitter_secret)
    .findOrCreateUser(function (sess, accessToken, accessSecret, twitUser) {
      return sess.uid = twitUser.screen_name;
    })
    .redirectPath('/');

var app = express.createServer(
    express.bodyParser()
  , express.static(__dirname + "/public")
  , express.cookieParser()
  , express.session({ secret: 'really secret, bro'})
  , everyauth.middleware()
);

io = io.listen(app);
everyauth.helpExpress(app);
app.configure(function () { app.set('view engine', 'jade'); });

app.get('/:channel?', function (req, res) {
    game.getChannel(req.params.channel, function(err) {
        res.render('home', {req.params.channel, error: err});
    });

  // save session data to redis instead of this
  console.log(req.session.uid)
  if (req.session.uid) users[req.cookies['connect.sid']] = req.session.uid;
  console.log(req.cookies)
  console.log(req.session)
});

channel.on('enoughForGame', function(ch) {
    io.sockets.in(ch).emit('gameStarted', {});
    channel.round.nextRound();
});

channel.round.on('start', function(ch) {
    io.sockets.in(ch).emit('roundStarted', {letters: acro.fetch()});
    setTimeout(function() { io.sockets.in(ch).emit('roundEnded', {}); }, config.rules.response_time);
});

io.sockets.on('connection', function (socket) {
  var cookie = connect.utils.parseCookie(socket.handshake.headers.cookie)
    , uid = users[cookie['connect.sid']];
  
  if (!uid) return;

    channel.find(uid, function(err, ch) {
        if (!err) {
            channel.findUsers(channel, function(err, users) {
                if (users.length > 3)
                    socket.emit('gameStarted', {});
                if (!err) {
                    socket.join(ch);
                    io.sockets.in(channel).emit('rosterUpdated', users);
                }
            });
        }
    });

    socket.on('responseSubmitted', function(data) {
        //do something
    });

});

app.listen(config.port); 
console.log('Listening on ' + app.address().port);
