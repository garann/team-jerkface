require('coffee-script'); // don't hate, bro

var http = require('http') 
  , nko = require('nko')('cx/IKz4MDPXythy2')
  , everyauth = require('everyauth')
  , $redis = require('./lib/adapter')
  , connect = require('connect')
  , everyauth = require('everyauth')
  , express = require('express')
  , gzippo = require('gzippo')
  , RedisStore = require('connect-redis')(express)
  , io = require('socket.io')
  , config = require('./lib/config')
  , AcroLetters = require('./lib/AcroLetters.js').AcroLetters
  , acro = new AcroLetters()
  , game = require('./lib/game')
  , session_store = new RedisStore()
  , colors = require('colors')
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
  , gzippo.staticGzip(__dirname + "/public")
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
    if (req.session && req.session.uid) {
        return res.redirect('/index');
    }
  res.render('home');
});

var tmpUserListFunc = function(users) {
    usersLong = [];
    users.map(function(u) {
        usersLong.push({ username: u });
    });
    return usersLong;
}

app.get('/index', function(req, res) {
    game.available_channel(function(chan) {
        req.session.channel = chan;
        chan.get_users(function(users) {
            if (users.indexOf(req.session.uid) === -1) //  if user isn't in channel add them
                users.join(req.session.uid);
            var usersLong = tmpUserListFunc(users);
            res.render('index', { players: usersLong , userInfo: { username: req.session.uid } });
        });
    });
});

io.sockets.on('connection', function (socket) {
  var cookie = connect.utils.parseCookie(socket.handshake.headers.cookie)
    , sid = cookie['connect.sid'];
  
  session_store.get(sid, function (err, session) {
    if (!session || !session.uid || !session.channel) return;

      game.get_channel(session.channel.name, function(chan) {
          console.log('joining: '+chan.name.red);
          socket.join(chan.name);

          var haltGame = false;

          chan.get_users(function(users) {
              if (users.indexOf(session.uid) === -1) { //  if user isn't in channel add them
                  chan.add_user(session.uid, function(err) {
                      if (err)
                          throw new Error(err);
                  });
              } 
              
              if (config.env == 'development') {
                  if (users.length < 2) {
                      chan.add_user('bro1', function(){});
                      chan.add_user('bro2', function(){});
                  }
              }
          });


          chan.on('new user', function(uid) {
              chan.get_users(function(users) {
                  var usersLong = tmpUserListFunc(users);
                  io.sockets.in(chan.name).emit('rosterUpdated', { users: usersLong });
                  console.log((uid + ' joined '+chan.name).red);
              });
          });
          
          chan.on('game started', function() {
              io.sockets.in(chan.name).emit('gameStarted', {});
              console.log(('game started: '+chan.name).red);
          });

          chan.on('waiting for users', function() {
              haltGame = true;
          });

          chan.on('new round', function(acro) {
              io.sockets.in(chan.name).emit('roundStarted', {letters: acro});
              // TODO: implement game start / end / next round in Channel
              console.log(('round started: '+chan.name).red);
              setTimeout(function() {
                  //get responses[] = {username,  response, votes}
                  // if responses.length ( kill room )
                  io.sockets.in(chan.name).emit('roundEnded', {});
                  io.sockets.in(chan.name).emit('votingStart', {});

                  console.log(('voting started: '+chan.name).red);

                  setTimeout(function() {
                      io.sockets.in(chan.name).emit('votingEnded', {});

                      //return round stats
                      io.sockets.in(chan.name).emit('roundEnded', {});

                      console.log(('voting ended: '+chan.name).red);

                      setTimeout(function() {
                          if (haltGame) {
                              io.sockets.in(chan.name).emit('gameEnded', {});
                              console.log(('game halted').red);
                          } else {
                              chan.next_round(function() {});
                              console.log('next round: '+chan.name.red);                              
                          }
                      }, config.rules.roundEnd_time);
                  }, config.rules.vote_time);

              }, config.rules.response_time);
          });
          

          chan.on('round reset', function() {
              //get scores[] = {username, score}
              console.log(('round reset: '+chan.name).red);
              io.sockets.in(chan.name).emit('gameEnded', {});
          });

          chan.on('error', function(error) {
              console.log(('error: '+error).red);
          });

          socket.on('responseSubmitted', function(data) {
              console.log(('got response from ' + session.uid + ' in channel : ' + chan.name + ' answer: ' + data.response).red);
              // collect responses
              chan.submit_answer(session.uid, data.response, function(err) {
                  if (err)
                      socket.emit('responseError', { errorMessage: err });
              });
          });
          
          socket.on('voteSubmitted', function(data) {
              // collect votes
          });

          socket.on('msg', function(msg) {
              socket.broadcast.to(chan.name).emit('msg', {uid: session.uid, msg: msg});
          });
          
          socket.on('disconnect', function() {
              if (config.env == 'development') {
                  chan.remove_user('bro1');
                  chan.remove_user('bro2');
              }
              console.log("uid disconnect: " + session.uid);
              chan.remove_user(session.uid);
              socket.leave(chan.name);
          });

      });

  });
});

game.clear_available_channels();

app.listen(config.port); 
console.log('Listening on ' + app.address().port);
