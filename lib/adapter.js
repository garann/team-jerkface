var redis = require('redis'),
    config = require('./config')
    $redis = redis.createClient(),
    subscriber = redis.createClient();

$redis.subscribe = subscriber.subscribe;
$redis.on = subscriber.on;

if (config.env === 'development') {
  $redis.set('bro', 'what\'s up bro?', function (err) {
    $redis.get('bro', function (err, resp) { console.log(resp); });
  });
}

module.exports = $redis;
