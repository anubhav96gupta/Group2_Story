var http = require('http').Server(app);
var io = require('socket.io')(http);


app.get('/', function(req, res){
  res.sendfile('highcharts.html');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
