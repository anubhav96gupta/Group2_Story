var SerialPort = require("serialport");
var app = require('express')();
var xbee_api = require('xbee-api');
var KNN = require('ml-knn');
var fs = require('fs');
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use('/fonts', express.static(__dirname + '/frontend/fonts'));
app.use('/images', express.static(__dirname + '/frontend/images'));
app.use('/', express.static(__dirname + '/frontend'));


app.get('/localization', function(req, res){
  res.sendfile('frontend/index.html');
});

var C = xbee_api.constants;
var XBeeAPI = new xbee_api.XBeeAPI({
  api_mode: 2
});

var count = 0;
var flag = [0,0,0,0];
var portName = process.argv[2];
var knn = new KNN();

var sampleDelay = 2000;
var dataset = [[0, 0, 0, 0]];

portConfig = {
  baudRate: 9600,
  parser: XBeeAPI.rawParser()
};

http.listen(4000, function(){
  console.log('listening on *:4000');
});

var sp;
sp = new SerialPort.SerialPort(portName, portConfig);

io.on('connection', function(socket)
{
  console.log('a user connected');
  socket.on('disconnect', function(){
  });
 socket.on('states', function(state)
  {
    var ManualCommandPacket = 
    {
    type: C.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST,
    destination64: "000000000000ffff",
    broadcastRadius: 0x01,
    options: 0x00,
    data: state
    }
    sp.write(XBeeAPI.buildFrame(ManualCommandPacket));
    //sp.write(state + "\n");
    console.log('message: ' + state); // + msg
    //io.emit('updated bStates', state);
  });
});



var train = [[39.4,60.1,81.8,49.9],
[46.3,68.9,82.6,53.8],
[44.2,71.8,80.1,48.1],
[44.3,75,78.5,48],
[39.4,66.2,78.3,53.3],
[41,68,80.6,45],
//1
[38.3,57.3,78.7,62.4],
[42.8,65.6,82.1,49.3],
[45.1,63.5,85.8,55.4],
[43.9,62.9,85.9,57.8],
[49.5,60.3,83.8,48.8],
[41.9,66.3,79.4,60.8],
[41.6,66,76.2,61.3],
[50.8,65.9,82.6,49.5],
[52.8,63.9,83.9,49.8],
[47.2,61.9,83.2,56.5],
[46.4,66.2,80.1,55.3],
[51.1,60.3,78.7,60.7],
[48.9,57.7,78.4,62.9],
[48.6,58.3,81.3,64.3],
[46.6,60.8,83.1,64.3],
//2
[51,68.9,78.6,68.6],
[48.9,63.9,79.9,59.3],
[51.6,57.7,80.9,57.9],
[50.3,55.3,82.9,62],
[55.8,56.8,74.7,64.8],
[59.9,62.4,81.5,64.5],
[59.7,64.4,77.1,65.3],
[59,60.4,74.5,66.3],
[60.4,59.6,76.5,65.2],
[56.7,60.1,80.3,69.7],
[50.1,57.3,76.1,67.3],
[49.4,57.2,80.2,67.7],
[58.7,63.8,73.5,68.8],
[57.6,63.1,78.8,70.7],
//3
[53.8,56.2,71.1,72.7],
[57.3,53.8,70.1,68.9],
[54.3,54.3,70.9,69.2],
[54.4,63.1,72.2,68.6],
[58.8,55,74.9,70.6],
[59.2,56.6,70.5,68.2],
[54.1,57.1,74.5,67.4],
[54.1,56.4,72.2,65.4],
[56.3,56.6,74.2,68.2],
[55.2,50.6,70.9,69.9],
[57.6,60.4,72.3,70.6],
[59.4,62,68.5,68.3],
[63.2,54.4,71.4,74.9],
[59.5,58.3,69.5,72.8],
//4
[57.1,45.3,68.5,73.6],
[60,48.1,62.9,66.3],
[58.2,49.3,62,75.3],
[57.1,50.4,63.9,75.8],
[56.4,50.1,67.7,72.5],
[59.2,51.4,66.3,74.7],
[58.9,49.6,63.9,75.1],
[66,49.5,69.5,73.6],
[62.1,51.3,67.7,75],
[66.2,51.3,67,78.6],
[62.1,50,68.7,72.3],
[61.9,63.4,64.7,75.4],
[59.4,41.4,63.8,78.9],
[63.5,44.4,58.5,74.3],
[60.7,42.6,58.9,75.9],
[65.1,40,60.8,72.3],
[69.4,38.4,59.7,71.6],
//5
[64,46.2,62,76],
[61.9,40.1,54.1,70.5],
[54,37,51.8,69.7],
[53.7,35.6,51.8,68.3],
[54.8,35.3,55.3,67.1],
[56.8,38.1,45.8,71.8],
//6
[68.2,53.5,63,75.9],
[70.7,44.9,52.7,76.1],
[73.5,45.5,55.3,77.7],
[76.1,43.9,59.2,77.6],
[76.9,46.9,55.8,76.4],
[72.5,50.3,50.7,69.1],
[69.1,47.4,47.4,66],
[77.2,50.2,55,72.7],
[78.9,48.5,57.2,74.1],
[74.6,51.7,55.4,77.7],
[74.6,51.3,57.7,78.5],
[75.5,55.8,47,75.3],
[74.4,60.2,45.1,77.6],
[77.7,51.8,49.1,75.3],
[79.1,54,48,77.7],
[77.5,53.2,48.4,71.8],
[75.9,52.6,45.6,72.1],
[78.3,57.6,49.8,71],
[81.7,53.2,48.2,76.5],
[78.7,52.1,47.1,75.4],
[80.5,51.5,45.3,73],
[76.6,58.1,47.8,71.3],
[77,57.9,45.7,68.6],
[71.4,55,47.9,68.2],
//7
[80.3,57,45.9,51.6],
[69.2,60.8,45.6,59.2],
[72.6,56.1,39.3,61.4],
[74.4,54.5,39.8,61.3],
[70.7,55.1,36.3,59.7],
[75.4,57.1,42.4,60.6],
//8
[69.9,57.4,48.7,58.9],
[77.7,57.6,52.9,61.6],
[70.1,56.8,47.1,69.9],
[68.9,57.9,50.4,65.8],
[79.9,58.2,49.5,54.9],
[75.9,60.7,44.5,67.3],
[69.8,68.4,45.1,57.7],
[69.7,69.8,46.8,59.6],
[70.8,68.3,52.7,55.2],
[72,68.6,53.7,56.8],
[70.7,68.5,52.8,62.2],
[69.7,62.8,49.3,61],
[69.5,65.7,49.5,62.8],
[67.3,61.5,48.1,61.1],
[74.7,61.2,45.5,59.2],
[70.8,69.8,48.6,61.9],
[67.9,65.5,61.9,66.8],
[76.9,68.3,61.1,65.5],
//9
[73.3,67.3,62.1,56],
[74.9,64.4,65.7,56.2],
[67.4,71.7,65.5,57.2],
[66.9,71.8,65.3,57],
[73,68,62.5,63.7],
[70.2,73.7,58.5,54.7],
[67.8,72.6,55.9,51.8],
[65.7,68.6,57,53.7],
[64.6,73.3,69.4,55.8],
[68.3,74.3,56.8,56.1],
[74,74.7,67.8,49],
[71,72.4,66.9,48.2],
[74.7,72,70.5,49.9],
[69.4,72.3,55.5,52.9],
[70.2,72.6,55.8,47.7],
//10
[62.2,78.6,60.8,49.9],
[60.3,79.5,58.8,48.4],
[59.5,74.2,61.8,53.3],
[59.1,75.2,61.1,55.6],
[60.9,70.7,63.8,51.5],
[65.3,76.6,63.5,52.9],
[59.2,77.9,66.3,52.5],
[57.9,76.1,70.1,49.9],
[60.1,81.5,66.8,43.7],
[59.7,79.8,65.8,54.7],
[61.3,81.8,63,54.1],
[59.5,81.9,62.9,54.7],
[55,82.2,68.8,47.2],
[60.5,83.8,62.7,40],
//11
[62.5,78.7,70,44.9],
[58.9,83.9,69.7,44.1],
[54.9,80.6,73.8,58.4],
[54,79.2,75.5,59.8],
[55.3,77.2,67.9,51.7],
[54,80.2,65.7,50.9],
[53.9,82.6,74.3,49.2],
[58.5,82.3,71.8,39.8],
[55.9,81,66.4,39.9],
[55.2,83.5,67.9,39.5],
[52.4,84.5,85.5,41.4],
[50.1,79.7,70.5,40.4],
[51,79.7,71,40.1],
[55.5,80.9,71.5,37.7],
[51.3,81.7,69.6,37.8],
[50.1,82.3,67.4,39],
//12
[50.7,83.2,71,34.5],
[59,83.8,71.1,37.1],
[51.1,77.4,71.3,44.7],
[49.4,75.3,72.8,46.5],
[51.5,80.9,71.4,45],
[50.9,84.1,68.5,44],
[51.2,86.7,69,45.7],
//13
[46.9,81.7,70.1,52],
[48.1,81.2,68.3,51.6],
[53.3,83.1,75.3,44.2],
[45.5,76.7,79.1,45.7],
[52.7,78.4,79.9,47.1],
[55.5,81.5,76,45.9],
[50,73.8,79.3,48.7],
[54,74.2,81.7,51.6],
[41,75.7,77.3,46.8],
[40.9,76.9,75.7,45.4],
[42.4,78.7,76.2,46.1],
[48.3,74.7,81.2,49.9],
[43.5,69.7,80.6,44.6],
[42.4,70.1,82.1,46.3],
[43.1,70.1,84.4,48.4]
//14

];

var prediction = [1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,6,6,6,6,6,6,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
                  8,8,8,8,8,8,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,11,11,11,11,11,11,11,11,11,11,11,11,11,11,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,13,13,
                  13,13,13,13,13,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14];

knn.train(train, prediction);


var RSSIRequestPacket = {
  type: C.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST,
  destination64: "000000000000ffff",
  broadcastRadius: 0x01,
  options: 0x00,
  data: "test"
}

var requestRSSI = function(){
  sp.write(XBeeAPI.buildFrame(RSSIRequestPacket));
  console.log('inside');
}

sp.on("open", function () {
  console.log('open');
  requestRSSI();
  setInterval(requestRSSI, sampleDelay);
});


XBeeAPI.on("frame_object", function(frame)
{
  if (frame.type == 144)
  {
    switch(frame.data[1])
    {
      case 1:
              if(flag[0] != 1)
              {
                dataset[0][0] = frame.data[0];
                flag[0] = 1;
                count++;
              }
              break;
      case 2:
              if(flag[1] != 1)
              {
                dataset[0][1] = frame.data[0];
                flag[1] = 1;
                count++;
              }
              break;
      case 3:
              if(flag[2] != 1)
              {
                dataset[0][2] = frame.data[0];
                flag[2] = 1;
                count++;
              }
              break;           
      case 4:
              if(flag[3] != 1)
              {
                dataset[0][3] = frame.data[0];
                flag[3] = 1;
                count++;
              }
              break;
    }
    if(count == 4)
    {
      console.log(dataset);
      var ans = knn.predict(dataset);
      console.log(ans);
      /*if(ans!= -1)
      {
        io.emit('location', ans);
      }*/
      dataset = [[0, 0, 0, 0]];
      flag = [0,0,0,0];
      count = 0;
    }
  }
});