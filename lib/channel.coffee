$redis = require './adapter'
config = require './config'
colors = require 'colors'
util = require 'util'
{EventEmitter} = require 'events'
{AcroLetters} = require './AcroLetters'
acro = new AcroLetters()

# TODO: implement waiting time between 3 users and game start
split_words = (ans) -> 
  ans.replace(/['-]/g,'').replace(/[^A-Za-z0-9 ]/g, ' ').toLowerCase().split(' ')

letters_for_answer = (answer) ->
  final = ""
  final += word[0] || '' for word in split_words answer
  final

sort_totals = (tot) ->
  arr = []
  arr.push { user: user, score:score } for user, score of tot
  arr.sort (i) -> -i.score
  arr

class Channel extends EventEmitter
  log: (msg) ->
    console.log "#{new Date()}"[16..23].cyan, "channel: #{@name} - #{msg}".yellow

  answer_valid: (ans, cb) ->
    self = this
    @get_letters (letters) ->
      answer_letters = letters_for_answer ans
      self.log answer_letters.cyan
      cb letters == answer_letters

  remove_available: -> $redis.srem 'game:available-channels', @name

  make_available: -> $redis.sadd 'game:available-channels', @name

  remove_previous_answer: (uid, round, cb) ->
    self = this
    $redis.hget "user_answer:#{@name}-#{round}", uid, (err, ans) ->
      $redis.zrem "scores:#{self.name}-#{round}", ans if ans
    $redis.hdel "user_answer:#{@name}-#{round}", uid, (err, resp) ->
      self.log "#{uid}'s previous answer removed'" if resp

  total_scores: (cb) ->
    totals = {}
    self = this
    for round in [1 .. config.rules.max_rounds]
      do (round) ->
        $redis.hgetall "channel:round-result:#{self.name}-#{round}", (err, results) ->
          for user, score of results
            totals[user] = (parseInt(totals[user] || 0)) + parseInt(score || 0)
          if round is config.rules.max_rounds
            self.log "Totals:"
            console.dir totals
            cb sort_totals totals

  submit_answer: (uid, answer, cb) ->
    self = this
    @get_round (round) ->
      return self.emit 'error', 'not ready for answer' if round is 0
      self.answer_valid answer, (valid) ->
        if valid
          self.remove_previous_answer uid, round
          $redis.hsetnx "answer_user:#{self.name}-#{round}", answer, uid, (err, success) ->
            if success
              $redis.hset "user_answer:#{self.name}-#{round}", uid, answer
              $redis.zadd "scores:#{self.name}-#{round}", 0, answer
              self.log "user: #{uid} submitted answer #{answer}"
              cb 'ok' if cb
            else
              self.log "answer already exists or something".red
              self.submit_answer uid, answer + '..', cb
        else
          self.log "invalid answer".blue
          cb 'answer not valid'
  
  get_answers: (cb) ->
    self = this
    @get_round (round) ->
      $redis.zrevrange "scores:#{self.name}-#{round}", 0, -1, (err, answers) ->
        self.emit 'error', 'no answers' if answers.length == 0
        self.log "get_answers(): #{answers.join(', ')}"
        cb answers

  get_results: (cb) ->
    self = this
    @get_round (round) ->
      $redis.zrevrange "scores:#{self.name}-#{round}", 0, -1, "WITHSCORES", (err, scores) ->
        results = []
        for i in [0 ... scores.length / 2]
          results.push { answer: scores[i * 2], score: scores[i * 2 + 1]}
        $redis.hgetall "answer_user:#{self.name}-#{round}", (err, users) ->
          for result in results
            result['user'] = users[result.answer]
          self.log "get_results(): "
          console.dir results
          self.set_round_scores round, results
          cb results

  set_round_scores: (round, round_results) ->
    self = this
    for result in round_results
      self.log "set_round_scores(#{round}): "
      console.dir round_results
      $redis.hset "channel:round-result:#{self.name}-#{round}", result.user, result.score

  user_voted_for: (uid, cb) ->
    self = this
    @get_round (round) ->
      $redis.hget "voted_for:#{self.name}-#{round}", uid, (err, ans) ->
        cb ans

  vote_for: (uid, answer) ->
    self = this
    self.log "#{uid} voted for #{answer}"
    @get_round (round) ->
      self.user_voted_for uid, (old_ans) ->
        if old_ans
          $redis.zincrby "scores:#{self.name}-#{round}", -1, old_ans
          self.log "#{uid} removing previous vote for #{old_ans}"
        $redis.hset "voted_for:#{self.name}-#{round}", uid, answer
        $redis.zincrby "scores:#{self.name}-#{round}", 1, answer

  new_letters: ->
    # letters = if config.env == 'development' then 'asdf' else acro.fetch()
    letters = acro.fetch()
    $redis.hset "channel:letters", @name, letters
    letters

  get_letters: (cb) ->
    self = this
    $redis.hget "channel:letters", @name, (err, letters) ->
      if letters
        cb letters
      else
        cb self.new_letters()

  get_round: (cb) ->
    $redis.hget "channel:round", @name, (err, round) ->
      cb round || 0

  next_round: (cb) ->
    self = this
    $redis.hincrby "channel:round", @name, 1, (err, round) ->
      if round > config.rules.max_rounds
        $redis.hset "channel:round", self.name, 0
        self.total_scores (results) ->
          self.emit 'round reset', results
          self.log "reset to round 0 -- total scores:"
          console.dir results
        self.end()
      else
        letters = self.new_letters()
        self.log "entered round #{round} with #{letters}"
        self.remove_old_results()
        self.emit 'new round', letters

      cb() if cb

  add_user: (uid, cb) ->
    self = this
    $redis.rpush @list, uid, (err, len) ->
      if len > config.rules.max_players
        self.emit 'error', 'too many users'
        self.remove_available()
        cb('too many users') if cb
      else
        self.log "(#{len}) - new user: #{uid}"
        self.emit 'new user', uid
        if len >= config.rules.min_players
          self.get_round (round) ->
            self.next_round(-> self.emit 'game started') if round == 0
        if len < config.rules.max_players
          self.make_available()
        else
          self.remove_available()
        cb() if cb

  remove_old_results: (round) ->
    $redis.del "scores:#{@name}-#{round}"
    $redis.del "user_answer:#{@name}-#{round}"
    $redis.del "answer_user:#{@name}-#{round}"
    $redis.del "voted_for:#{@name}-#{round}"
    $redis.del "channel:round-result:#{@name}-#{round}"

  remove_user: (uid, cb) ->
    self = this
    $redis.lrem @list, 1, uid, (err, user_removed) ->
      cb user_removed == 1 if cb
      self.emit 'user left channel'
      $redis.llen self.list, (err, len) ->
        if len == 0
          self.remove_available() 
          self.emit 'channel empty'
        else if len < config.rules.min_players
          self.emit 'waiting for users'
        else if len < config.rules.max_players
          self.make_available()

  has_user: (user, cb) ->
    @get_users (users) -> cb user in users

  get_users: (cb) ->
    $redis.lrange @list, 0, -1, (err, users) -> cb users

  constructor: (@name) ->
    self = this
    @list = "chan:users-#{@name}"
    @emit 'error', "name can't be blank" if @name?.length == 0
    @emit 'ready'
    $redis.llen @list, (err, len) ->
      self.log "initialized with #{len} users"
      self.emit 'ready'

  end: ->
    $redis.del @list
    $redis.hdel "channel:round", @name
    @remove_available()
    @log "game ended"

module.exports = Channel
