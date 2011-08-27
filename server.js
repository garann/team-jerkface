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
  , game = require('./lib/game')
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
      console.log(sess)
      return sess.uid = twitUser.screen_name;
    })
    .redirectPath('/');

var app = express.createServer(
    express.bodyParser()
  , express.static(__dirname + "/public")
  , express.cookieParser()
  , express.session({ secret: 'really secret, bro', store: new RedisStore })
  , everyauth.middleware()
);

io = io.listen(app);
everyauth.helpExpress(app);
app.configure(function () { 
  app.set('view engine', 'html');
  app.set('view options', {layout: false});
  app.register('.html', require('jqtpl').express) 
});

app.get('/:channel?', function (req, res) {
  //console.log(req)
  if (req.session.uid) users[req.cookies['connect.sid']] = req.session.uid;
  res.render('home', {params: req.params.channel});
  // save session data to redis instead of this
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
    , uid = users[cookie['connect.sid']];
  
  if (!uid) return;

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
