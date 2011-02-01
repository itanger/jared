var sys = require("sys")
  , ws = require('../lib/ws/server');

var sys = require('sys');
var spawn = require('child_process').spawn;
var mon = spawn("iostat",["-I","5"]);
sys.puts("starting");

function format_string(line) {
	
	line = (""+line).replace(/^[\s\n]+|[\s\n]+$/g,"");
	line = line.replace(/[\t\s]+/g," ");
	return line;
}

var server = ws.createServer({debug: true});

// Handle WebSocket Requests
server.addListener("connection", function(conn){
  conn.send("Connection: "+conn.id);
  mon.stdout.on('data',function(data) {
	data = format_string(data);
	sys.puts(data);
    conn.send("#mon:"+data+"");
  });

  conn.addListener("message", function(message){
    conn.broadcast("<"+conn.id+"> "+message);
    conn.send("<"+conn.id+"> "+message);
    
    if(message == "error"){
      conn.emit("error", "test");
    }
  });
});

server.addListener("error", function(){
  console.log(Array.prototype.join.call(arguments, ", "));
});

server.addListener("disconnected", function(conn){
  server.broadcast("<"+conn.id+"> disconnected");
});

server.listen(8000);
