config = require './config'
$redis = require './adapter'
Channel = require './channel'
channels = {}

module.exports =
  available_channel: (cb) ->
    $redis.srandmember 'game:available-channels', (err, name) ->
      name = name || "channel-#{(Math.random() * 99999) >> .5}"
      if channels[name]
        cb channels[name]
      else
        channels[name] = new Channel name
        channels[name].on 'ready', ->
          cb channels[name]

  #join: (name, uid, cb) ->
    #self = this
    


    #$redis.srandmember 'game:available-channels', (err, name) ->
      #name = name || self.random_channel()
      #channel = channels[name] = channels[name] || new Channel name
        #if !has_user and channel = channels[name]
      #channel.has_user uid, (has_user) ->
        #if !has_user and 
          #channel = channels[name] = new Channel this, name
        #else
          #channel = channels[name] = new Channel name
          #channel.on 'ready', ->
            #console.log "channel: #{name} ready"
            #channel.add_user uid
            #cb(null, channel)
          #channel.on 'error', (err) ->
            #console.log "Error: #{err}"
            #cb err
