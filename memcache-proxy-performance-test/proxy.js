var net = require('net'),
	http = require('http'),
	tm = require('timers'),
	socketPool = require('./pool');

// 每秒输出内存占用信息
tm.setInterval(function () {
	var mem = process.memoryUsage();
	console.log('phy mem: ' + mem.rss + '; heap: ' + mem.heapTotal + '(' + (Math.ceil(mem.heapUsed/mem.heapTotal*1000) / 10) + '%)');
}, 1000);

// 连接池初始化
var pool = socketPool.create({host:'edp2.corp.alimama.com'});
// socket服务
net.createServer(function (stream) {
	stream.on('data', function (req) {
		pool.get(function(conn, pos) {
			conn.on('data', function(res) {
				if (stream.readyState !== 'closed') {
					stream.write(res);
				}
				conn.removeAllListeners('data');
				pool.release(pos);
			});
			conn.write(req);
		});
	});
}).listen(1234);

// http服务
http.createServer(function(req, res){
	if (req.url.match(/^\/get/)) {
		var r = req.url.replace(/^\/+/, '').replace(/\/+$/, '').replace(/\/+/, ' ') + "\r\n";
		pool.get(function(conn, pos) {
			conn.on('data', function(resdata) {
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.end(resdata);
				conn.removeAllListeners('data');
				pool.release(pos);
			});
			conn.write(r);
		});
	} else {
		res.writeHead(500, {'Content-Type': 'text/html'});
		res.end('<h3>Request Url Error</h3>');
	}
}).listen(1235);