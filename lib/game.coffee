config = require './config'
$redis = require './adapter'
Channel = require './channel'

class Game
  constructor: (@io) ->

  join: (name, uid, cb) ->
    name = name || "channel-#{(Math.random() * 99999) >> .5}"
    channel = new Channel this, name
    channel.on 'ready', ->
      console.log "channel: #{name} ready"
      channel.add_user uid
      cb(null, channel)
    channel.on 'error', (err) ->
      console.log "Error: #{err}"
      cb err

module.exports = Game
