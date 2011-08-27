$redis = require './adapter'
config = require './config'
{EventEmitter} = require 'events'

class Channel extends EventEmitter
  list: -> "users-#{@name}"

  get_round: (cb) ->
    $redis.hget "channel-round", @name, (err, round) ->
      cb err, round || 0
  
  next_round: ->
    self = this
    $redis.hincrby "channel-round", @name, 1, (err, round) ->
      if round > config.rules.max_rounds
        $redis.hset "channel-round", self.name, 0
        self.emit "error", "round number exceeded max rounds"
      else
        console.log "channel #{self.name} entered round #{round}"

  add_user: (uid) ->
    self = this
    $redis.rpush @list(), uid, (err, len) ->
      if len > config.rules.max_players
        self.emit 'error', 'too many players'
      else
        console.log "channel: #{self.name} (#{len}) - new player: #{uid}"
        self.emit 'new player', uid

  get_users: (cb) ->
    $redis.lrange @list(), 0, -1, (err, users) -> cb users

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
