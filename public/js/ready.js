$(function () {
  var socket = io.connect()
    , user_info;

  socket.on('connect', function () {
    console.log('connected');
  });
  
  socket.on('auth', function (_user_info) {
    // okay we're ready to go!
    console.log('user info: ', _user_info)
    user_info = _user_info;
    $('div#content').html('hi, ' + user_info.uid);
  });
});
