var http = require('http'),
	fs = require('fs'),
	url = require('url'),
	page = null;
// static files read & watch
var readFile = function(files) {
	var buffers = {};
	// sync read
	var fread = function(file, cb){
		fs.readFile(file, 'binary', function(err, data){
			if (err) {
				throw err;
			}
			buffers[file] = new Buffer(data, 'binary');
			console.log('load', file)
		});
	}
	// watch changes
	var watch = function watch(file) {
		fs.watchFile(file, {persistent: true, interval: 100}, function (curr, prev) {
			if (curr.mtime.getTime() != prev.mtime.getTime()) {
				fread(file);
			}
		});
	}
	// run all files
	for (var i = 0; i < files.length; i++) {
		watch(files[i]);
		fread(files[i]);
	}
	return buffers;
}
// http query
var httpQuery = function(u, cb){
	console.log('http begin');
	// parse url
	var uinfo = url.parse(u);
	// create client
	var client = http.createClient(uinfo.port ? uinfo.port : 80, uinfo.hostname, false);
	var uri = uinfo.pathname + (uinfo.search ? uinfo.search : '');
	var req = client.request('GET', uri, {'host': uinfo.hostname});
	// send request
	req.end();
	console.log('http request sent');


	var len = 4096;
	var pointer = 0;
	var extendFactor = 2;
	// response start
	req.on('response', function (res) {
		if (res.headers['content-length']) {
			len = parseInt(res.headers['content-length']);
		}
		// body init
		var body = new Buffer(len);
		// chunk recived
		res.on('data', function(chunk){
			// extends
			if (pointer + chunk.length > len) {
				len *= extendFactor;
				body = body.copy(new Buffer(len), 0, 0);
				console.log('proxy extend to', len);
			}
			// copy chunk to buf
			chunk.copy(body, pointer, 0);
			// move pointer
			pointer += chunk.length;
		})
		// response end
		res.on('end', function() {
			cb(body.length > pointer ? body.slice(0, pointer) : body);
			console.log('proxy end', pointer);
		});
	})
}

// main server
var server = http.createServer(function (req, res){
	// main page
	if (req.url == '/') {
		res.writeHeader(200);
		res.end(page["pipe.html"]);
	// time serve
	} else if (req.url == '/time') {
		res.writeHeader(200);
		res.end(new Date().toString());
	// iframe recv
	} else if (req.url.match(/^\/iframe\//)) {
		var clientid = parseInt(req.url.substr(8));
		pipeClient.add(clientid, res, pipeClient.iframe);
		console.log('iframe connect', clientid);
	// ajax recv
	} else if (req.url.match(/^\/ajax\//)) {
		var clientid = parseInt(req.url.substr(6));
		pipeClient.add(clientid, res, pipeClient.ajax);
		console.log('ajax connect', clientid);
	// request listen
	} else if (req.url.match(/^\/req\//)) {
		res.writeHeader(200,{
			'Cache-Control': 'no-cache, must-revalidate'
		});
		res.end();
		// url parse
		var clientid = parseInt(req.url.substr(5, 13));
		// get page
		httpQuery("http://localhost:8000/time", function (data){
			console.log(data.toString());
			pipeClient.write(clientid, data);
			console.log("write", clientid, data.length);
		});
	// error pages
	} else {
		res.writeHeader(404, {"Content-Type" : "text/html"});
		res.end();
	}
});

var pipeClient = {
	timeout : 30000,
	client : {},
	prefix : "<script>s('",
	suffix : "');</script>",
	iframe : 'iframe',
	ajax : 'ajax',
	noise : null,
	noiseSize : 1024,
	page : null,
	init : function(){
		this.noise = new Buffer(1024);
		for (var i = 0; i < this.noiseSize; i++) {
			this.noise[i] = 32;
		}
		this.page = readFile(['iframe.html']);
	},
	add : function(id, res, type) {

		if (type == this.ajax) {
			res.writeHeader(200, {
				'Cache-Control': 'no-cache, must-revalidate'
			});
			res.write(this.noise);
		} else {
			res.writeHeader(200, {
				"Content-Type" : "multipart/x-mixed-replace",
				'Cache-Control': 'no-cache, must-revalidate'
			});
			res.write(this.page['iframe.html']);
			res.write(this.noise);
		}
		this.client[id] = {
			res : res,
			type : type,
			tm : setTimeout(function(){
				pipeClient.close(id);
			}, this.timeout)
		};
	},
	close : function (id) {
		console.log("client close", id)
		this.client[id].res.end();
		this.client[id].res = null;
		delete this.client[id];
	},
	write : function (id, data) {
		clearTimeout(this.client[id].tm);
		this.client[id].tm = setTimeout(function(){
			pipeClient.close(id);
		}, this.timeout);
		this.client[id].res.write(this.format(data, this.client[id].type));

	},
	format : function(data, type) {
		// with iframe
		if (type == this.iframe) {
			var buf = new Buffer(this.prefix.length + data.length + this.suffix.length);
			buf.write(this.prefix, 0, 'binary');
			data.copy(buf, this.prefix.length, 0);
			buf.write(this.suffix, this.prefix.length + data.length);
		// with ajax
		} else {
			var buf = new Buffer(data.length + 8);
			// set length
			buf.write(data.length.toString(16), 0, 'binary');
			// space padding
			for (var i = data.length.toString(16).length; i < 8; i++) {
				buf[i] = 32;
			}
			// set data
			data.copy(buf, 8, 0);
		}
		console.log(buf.toString());
		return buf;
	}
}
pipeClient.init();



page = readFile(['pipe.html']);
setTimeout(function(){
	server.listen(8000);
}, 500);