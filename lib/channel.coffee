$redis = require './adapter'
config = require './config'
{EventEmitter} = require 'events'

class Channel extends EventEmitter
  remove_available: -> $redis.srem 'game:available-channels', @name

  make_available: -> $redis.sadd 'game:available-channels', @name

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
    $redis.rpush @list, uid, (err, len) ->
      if len > config.rules.max_players
        self.emit 'error', 'too many players'
        self.remove_available()
      else
        console.log "channel: #{self.name} (#{len}) - new player: #{uid}"
        self.emit 'new player', uid
        if len < config.rules.max_players
          self.make_available()
        else
          self.remove_available()
  
  has_user: (user, cb) ->
    @get_users (users) ->
      cb user in users

  get_users: (cb) ->
    $redis.lrange @list, 0, -1, (err, users) -> cb users

  constructor: (@name) ->
    self = this
    @list = "chan:users-#{@name}"
    @emit 'error', "name can't be blank" if @name?.length == 0
    $redis.llen @list, (err, len) ->
      throw err if err?
      @size = len
      console.log "chan: #{self.name} has #{len} users"
      if len >= config.rules.max_players
        self.emit 'error', 'too many players'
      else
        self.emit 'ready'

module.exports = Channel
