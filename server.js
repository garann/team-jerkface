require('coffee-script'); // don't hate, bro

var http = require('http') 
  , nko = require('nko')('cx/IKz4MDPXythy2')
  , everyauth = require('everyauth')
  , $redis = require('./lib/adapter')
  , connect = require('connect')
  , everyauth = require('everyauth')
  , express = require('express')
  , RedisStore = require('connect-redis')(express)
  , io = require('socket.io')
  , config = require('./lib/config')
  , AcroLetters = require('./lib/AcroLetters.js').AcroLetters
  , acro = new AcroLetters()
  , game = require('./lib/game')
  , session_store = new RedisStore()
  , users = {};

everyauth
  .twitter
    .myHostname(config.host)
    .consumerKey(config.twitter_key)
    .consumerSecret(config.twitter_secret)
    .findOrCreateUser(function (sess, accessToken, accessSecret, twitUser) {
      return sess.uid = twitUser.screen_name;
    })
    .redirectPath('/index');

var app = express.createServer(
    express.bodyParser()
  , express.static(__dirname + "/public")
  , express.cookieParser()
  , express.session({ secret: 'really secret, bro', store: session_store })
  , everyauth.middleware()
);

io = io.listen(app);
everyauth.helpExpress(app);
app.configure(function () { 
  app.set('views', __dirname + '/views')
  app.set('view engine', 'html');
  app.set('view options', {layout: false});
  app.register('.html', require('jqtpl').express) 
});

app.get('/', function (req, res) {
  res.render('home');
});

app.get('/index', function(req, res) {
    game.available_channel(function(chan) {
        req.session.channel = chan;
        chan.get_users(function(users) {
            users.join(req.session.uid);
            if (users.indexOf(req.session.uid) === -1) { //  if user isn't in channel add them
                chan.add_user(req.session.uid, function(err) {
                    if (err)
                        throw new Error(err);
                });
            }
            usersLong = [];
            users.map(function(u) {
                usersLong.push({ username: u });
            });
            res.render('index', { players: usersLong, userInfo: { username: req.session.uid } });
        });
    });
});

io.sockets.on('connection', function (socket) {
  var cookie = connect.utils.parseCookie(socket.handshake.headers.cookie)
    , sid = cookie['connect.sid'];
  
  session_store.get(sid, function (err, session) {
    if (!session || !session.uid || !session.channel) return;

      game.get_channel(session.channel.name, function(chan) {
          chan.on('new user', function(uid) {
              chan.get_users(function(users) {
                  io.sockets.in(chan.name).emit('rosterUpdated', users);
              });
          });
          
          chan.on('game started', function() {
              io.sockets.in(chan.name).emit('gameStarted', {});
          });

          chan.on('new round', function(acro) {
              io.sockets.in(chan.name).emit('roundStarted', {letters: acro});
              setTimeout(function() {
                  //get responses[] = {username,  response, votes}
                  // if responses.length ( kill room )
                  io.sockets.in(chan.name).emit('roundEnded', {});
                  io.sockets.in(chan.name).emit('votingStart', {});

                  setTimeout(function() {
                      io.sockets.in(chan.name).emit('votingEnded', {});
                  }, config.rules.vote_time);

              }, config.rules.response_time);
          });

          chan.on('round reset', function() {
              //get scores[] = {username, score}
              io.sockets.in(chan.name).emit('gameEnded', {});
          });

          chan.on('error', function(error) {
              console.log(error);
          });

      });

      socket.on('responseSubmitted', function(data) {
          // collect responses
      });

      socket.on('voteSubmitted', function(data) {
          // collect votes
      });

      socket.on('msg', function(msg) {
          socket.broadcast.to(chan.name).emit('msg', {uid: session.uid, msg: msg});
      });
  });

});

app.listen(config.port); 
console.log('Listening on ' + app.address().port);
