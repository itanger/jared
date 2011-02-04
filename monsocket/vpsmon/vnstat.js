  var sys = require('sys');
  var spawn = require('child_process').spawn;
  var mon = spawn("vnstat",["-l"]);
  sys.puts("starting");


function format_string(line) {

        line = (""+line).replace(/^[\s\n]+|[\s\n]+$/g,"");
        line = line.replace(/[\t\s]+/g," ");
        return line;
}


  mon.stdout.on('data',function(data) {
		sys.puts(data);
		return;
		data = ""+data;
		if(data.indexOf("rx")>0) {
			var arr = data.split(" ");
			sys.puts("["+data+"]");
			sys.puts("out:"+arr[2]+","+arr[7]);
		}
		//sys.puts(data.match(/\d+/g));
		//sys.puts(data);
	});

  var http = require("http");
  http.createServer(function(req,res){
    res.sendHeader(200,{"Content-Type": "text/plain"});
    mon.stdout.on('data',function(data) {
        res.sendBody(data);
	});
  }).listen(8001);
