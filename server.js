var http = require('http') 
  , nko = require('nko')('cx/IKz4MDPXythy2')
  , everyauth = require('everyauth')
  , $redis = require('./lib/adapter')
  , connect = require('connect')
  , everyauth = require('everyauth')
  //, twitter = require('./lib/twitter')(everyauth)
  , express = require('express')
  , io = require('socket.io')
  , config = require('./lib/config')
  , users = {}

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

io.listen(app);
everyauth.helpExpress(app);
app.configure(function () { app.set('view engine', 'jade'); });

app.get('/', function (req, res) {
  //if (req.session.uid) users[req.cookies['connect.sid']] = req.session.uid;
  console.log(req.session)
  res.render('home');
});

app.listen(config.port); 
console.log('Listening on ' + app.address().port);
