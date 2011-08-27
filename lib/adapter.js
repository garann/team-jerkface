var redis = require('redis'),
    client = redis.createClient(),
    subscriber = redis.createClient();

module.exports = client;
module.exports.subscribe = subscriber.subscribe;
module.exports.on = subscriber.on;
