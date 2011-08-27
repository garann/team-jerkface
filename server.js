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
    .redirectPath('/');

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
  res.render('index',{players: []});
});

//channel.on('enoughForGame', function(ch) {
    //io.sockets.in(ch).emit('gameStarted', {});
    //channel.round.nextRound();
//});

//channel.round.on('start', function(ch) {
    //io.sockets.in(ch).emit('roundStarted', {letters: acro.fetch()});
    //setTimeout(function() { io.sockets.in(ch).emit('roundEnded', {}); }, config.rules.response_time);
//});

io.sockets.on('connection', function (socket) {
  var cookie = connect.utils.parseCookie(socket.handshake.headers.cookie)
    , sid = cookie['connect.sid'];
  
  session_store.get(sid, function (err, session) {
    console.log('socket.io session: ', session);
    if (!session || !session.uid) return;
    //game.join(id, function (err, channel_name) {
      //if (err) 
      //socket.join(channel_name);

      //// chat
      //socket.on('msg', function (msg) {
        //socket.broadcast.to(channel_name).emit('msg', { uid: uid, msg: msg });
      //});
    //});
  });
    //channel.find(uid, function(err, ch) {
        //if (!err) {
            //channel.findUsers(channel, function(err, users) {
                //if (users.length > 3)
                    //socket.emit('gameStarted', {});
                //if (!err) {
                    //socket.join(ch);
                    //io.sockets.in(channel).emit('rosterUpdated', users);
                //}
            //});
        //}
    //});

    //socket.on('responseSubmitted', function(data) {
        ////do something
    //});

});

app.listen(config.port); 
console.log('Listening on ' + app.address().port);
