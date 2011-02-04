var sys = require("sys")
	,http = require("http")
	,fs = require("fs")
	,url = require("url")
	,path = require("path")
	, ws = require('../lib/ws/server');

var sys = require('sys');
var spawn = require('child_process').spawn;
var mon = spawn("iostat",["-I","5"]);
var mon_realtime = spawn("vnstat",["-l"]);
sys.puts("starting");

function format_string(line) {
	
	line = (""+line).replace(/^[\s\n]+|[\s\n]+$/g,"");
	line = line.replace(/[\t\s]+/g," ");
	return line;
}



var httpServer = http.createServer(function(req, res){
	var uri = url.parse(req.url).pathname; 
	var filename = path.join(process.cwd(),uri);
	
	if(req.method == "GET"){
		if( req.url.indexOf("favicon") > -1 ){
      	res.writeHead(200, {'Content-Type': 'image/x-icon', 'Connection': 'close'});
      	res.end("");
    	} else {
		if(uri=="/")	filename = "mon-client.html";	
		path.exists(filename, function(exists) {  
			if(!exists) { 
				res.writeHeader(404, {"Content-Type": "text/plain"}); 
				res.write("404 Not Found\n");
				res.end(); 
				return; 
			}
			fs.readFile(filename, "binary", function(err, file) {  
				if(err) { 
					res.writeHeader(500, {"Content-Type": "text/plain"});
					res.write(err + "\n");  
					res.end();  
					return;
				}
				var ext = path.extname(filename);
				ext = ext ? ext.slice(1) : 'html';
				
				var contentTypes = {
				  "js": "application/x-javascript",
				  "css": "text/plain"
				}
				//res.writeHeader(200,{'Content-Type': contentTypes[ext] || 'text/html'});  
				res.writeHeader(200,{'Content-Type': contentTypes[ext] });  
				res.write(file,"binary");
				//res.write(file);
				res.end("");
				return;

			});
		});
/*
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
*/
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
	var mon2 = spawn("/bin/sh",["get_system_usage.sh"]);

    mon2.stdout.on('data',function(data) {
		data = format_string(data);
		sys.puts(data);
		if(conn._state==4)
    		conn.send("#mon2:"+data+"");
	});
	mon2.stderr.on('data',function(data){
		sys.puts("error : "+data);
	});

    mon_realtime.stdout.on('data',function(data) {
		data = format_string(data);
		if(data.indexOf("rx")==0)
		{
		if(conn._state==4)
    		conn.send("#mon_realtime:::"+data+"");
		}
	});
	var mon_summary = spawn("vnstat",["-s"]);
    mon_summary.stdout.on('data',function(data) {
		//data = format_string(data);
		if(conn._state==4)
    		conn.send("#mon_summary:::"+data+"");
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
	mon2.kill('SIGHUP');
});

server.listen(8080);
