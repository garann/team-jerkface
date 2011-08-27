$redis = require './adapter'
config = require './config'
{EventEmitter} = require 'events'

class Channel extends EventEmitter
  list: -> "users-#{@name}"

  add_user: (uid) ->
    self = this
    $redis.rpush @list(), uid, (err, len) ->
      if len > config.rules.max_players
        self.emit 'error', 'too many players'
      else
        console.log "channel: #{self.name} (#{len}) - new player: #{uid}"
        self.emit 'new player', uid

  constructor: (@game, @name) ->
    self = this
    @emit 'error', "name can't be blank" if @name?.length == 0
    $redis.llen "users-#{@name}", (err, len) ->
      throw err if err?
      console.log "chan: #{self.name} has #{len} users"
      if len >= config.rules.max_players
        self.emit 'error', 'too many players'
      else
        self.emit 'ready'

  io: -> @game.io

module.exports = Channel
