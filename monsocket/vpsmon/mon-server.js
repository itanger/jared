var sys = require("sys")
	,http = require("http")
	,fs = require("fs")
	,url = require("url)
	,path = require("path")
	, ws = require('../lib/ws/server');

var sys = require('sys');
var spawn = require('child_process').spawn;
var mon = spawn("iostat",["-I","5"]);
var mon2 = spawn("/bin/sh",["./get_system_usage.sh"]);
sys.puts("starting");

function format_string(line) {
	
	line = (""+line).replace(/^[\s\n]+|[\s\n]+$/g,"");
	line = line.replace(/[\t\s]+/g," ");
	return line;
}

var httpServer = http.createServer(function(req, res){
	var uri = url.parse(request.url).pathname; 
	var filename = path.join(process.cwd(),uri);
  if(req.method == "GET"){
    if( req.url.indexOf("favicon") > -1 ){
      res.writeHead(200, {'Content-Type': 'image/x-icon', 'Connection': 'close'});
      res.end("");
    } else {
		path.exists(filename, function(exists) {  
			if(!exists) { 
				response.sendHeader(404, {"Content-Type": "text/plain"}); 
				response.write("404 Not Found\n");
				response.close(); 
				return; 
			}
			fs.readFile(filename, "binary", function(err, file) {  
			}
		}
      res.writeHead(200, {'Content-Type': 'text/html', 'Connection': 'close'});
      fs.createReadStream( path.normalize(path.join(__dirname, "mon-client.html")), {
        'flags': 'r',
        'encoding': 'binary',
        'mode': 0666,
        'bufferSize': 4 * 1024
      }).addListener("data", function(chunk){
        res.write(chunk, 'binary');
      }).addListener("end",function() {
        res.end();
      });
    }
  } else {
    res.writeHead(404);
    res.end();
  }
});



var server = ws.createServer({
	debug: true,
	server: httpServer});

// Handle WebSocket Requests
server.addListener("connection", function(conn){
	conn.send("Connection: "+conn.id);
	sys.puts("Connection: "+conn.id);
    mon2.stdout.on('data',function(data) {
	sys.puts(data);
	if(conn._state==4)
    	conn.send("#mon2:"+data+"");
	});
	mon2.stderr.on('data',function(data){
		sys.puts(data);
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

server.listen(8080);
