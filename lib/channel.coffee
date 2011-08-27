$redis = require './adapter'
config = require './config'
colors = require 'colors'
{EventEmitter} = require 'events'
{AcroLetters} = require './AcroLetters'
acro = new AcroLetters()

class Channel extends EventEmitter
  log: (msg) -> console.log "channel: #{@name} - #{msg}".yellow

  remove_available: -> $redis.srem 'game:available-channels', @name

  make_available: -> $redis.sadd 'game:available-channels', @name

  new_letters: ->
    letters = acro.fetch()
    $redis.hset "channel:letters", @name, letters
    letters

  get_letters: (cb) ->
    $redis.hget "channel:letters", @name, (err, letters) ->
      if letters
        cb letters
      else
        cb new_letters

  get_round: (cb) ->
    $redis.hget "channel-round", @name, (err, round) ->
      cb round || 0

  next_round: (cb) ->
    self = this
    $redis.hincrby "channel-round", @name, 1, (err, round) ->
      if round > config.rules.max_rounds
        $redis.hset "channel-round", self.name, 0
        self.log "reset to round 0"
        self.emit 'round reset'
      else
        letters = self.new_letters()
        self.log "entered round #{round} with #{letters}"
        self.emit 'new round', letters

      cb() if cb

  add_user: (uid) ->
    self = this
    $redis.rpush @list, uid, (err, len) ->
      if len > config.rules.max_players
        self.emit 'error', 'too many players'
        self.remove_available()
      else
        self.log "(#{len}) - new player: #{uid}"
        self.emit 'new player', uid
        if len >= config.rules.min_players
          self.get_round (round) ->
            self.next_round(-> self.emit 'game started') if round == 0
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
      self.log "STARTED with #{len} users"
      if len >= config.rules.max_players
        self.emit 'error', 'too many players'
      else
        self.emit 'ready'

module.exports = Channel
