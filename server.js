require('coffee-script');
var http = require('http') 
  , nko = require('nko')('cx/IKz4MDPXythy2');

var app = http.createServer(function (req, res) { 
  res.writeHead(200, { 'Content-Type': 'text/html' }); 
  res.end('Hello, World'); 
});

app.listen(parseInt(process.env.PORT) || 7777); 
console.log('Listening on ' + app.address().port);
