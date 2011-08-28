config = require './config'
$redis = require './adapter'
Channel = require './channel'
channels = {}

module.exports =
  shuffle: (array) ->
    array.sort (item) -> 0.5 - Math.random()

  clear_available_channels: ->
    $redis.del 'game:available-channels'

  get_channel: (name, cb) ->
    if channels[name]
        cb channels[name]
      else
        channels[name] = new Channel name
        channels[name].on 'ready', ->
          cb channels[name]

  available_channel: (cb) ->
    self = this
    $redis.srandmember 'game:available-channels', (err, name) ->
      name = name || "channel-#{(Math.random() * 99999) >> .5}"
      self.get_channel name, cb
