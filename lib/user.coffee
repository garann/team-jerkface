$redis = require './adapter'
config = require './config'
{EventEmitter} = require 'events'

class User extends EventEmitter
  constructor: (@uid) ->
  
  channel: (cb) ->
    $redis.hget 'users:channels', @uid, (err, name) -> cb name

  join: (name) ->
    $redis.hset 'users:channels', @uid, name
