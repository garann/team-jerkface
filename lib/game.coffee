config = require './config'
$redis = require './adapter'
Channel = require './channel'
channels = {}

module.exports =
  join: (uid, cb) ->
    $redis.srandmember 'game:available-channels', (err, name) ->
      name = name || "channel-#{(Math.random() * 99999) >> .5}"
      channel = channels[name] = channels[name] || new Channel this, name
      channel.on 'ready', ->
        console.log "channel: #{name} ready"
        channel.add_user uid
        cb(null, channel)
      channel.on 'error', (err) ->
        console.log "Error: #{err}"
        cb err
