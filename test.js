require('coffee-script'); // dont hate

var game = require('./lib/game');

game.available_channel(function (chan) {
  chan.add_user('bro')
  chan.add_user('bro3')
  chan.add_user('bro2', function () {
    chan.next_round()
    chan.on('new round', function (letters) {
      console.log("letters: ".red + letters)
      chan.submit_answer('bro2', 'alpine s d f')
      chan.submit_answer('bro', 'a s d f', function () {
        setTimeout(function() {
          chan.submit_answer('bro2', 'alpoopine s d f')
          chan.get_results(function (results) {
            console.log('results:'.red)
            console.dir(results)
          })
        }, 100)
        
      })
    })
    chan.on('error', function (error) {
      console.log(error.blue)
    })
  })
})
