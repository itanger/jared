var net = require('net'),
	tm = require('timers');

exports.run = function(id, options) {
	// 默认参数
	var opt = {
		host : '127.0.0.1',
		port : 0,
		time : 10,
		msg : "",
		assert : "",
		cb : null,
		cl: null
	};
	// 压力结果
	var result = {
		id : id,
		ok : 0,
		err : 0,
		total : 0,
		begin : 0,
		end : 0,
		psecond : []
	}
	// 每秒检查结果
	var last ={
		ok : 0,
		err : 0,
		total : 0,
		begin : 0
	}
	for (key in options) {
		opt[key] = options[key];
	}
	// 创建连接
	var conn = net.createConnection(opt.port, opt.host);
	
	// 发送下一请求
	function next() {
		if (result.end > 0) {
			return;
		}
		result.total++;
		conn.write(opt.msg);
	}
	// 每秒统计
	function second() {
		var t = new Date().getTime();
		if (result.end > 0) {
			t = result.end;
		}
		var sec = {
			ok : result.ok - last.ok,
			err : result.err - last.err,
			total : result.total - last.total,
			time : t - last.begin
		};
		result.psecond.push(sec);
		console.log('wid:', id , '| ok:', sec.ok, '| err:', sec.err);
		last.ok = result.ok;
		last.err = result.err;
		last.total = result.total;
		last.begin = t;
		if (result.end == 0) {
			tm.setTimeout(second, 1000);
		} else {
			// 到达运行时限, worker工作完成
			if (opt.cl) {
				opt.cb.call(opt.cl, result);
			} else {
				opt.cb(result);
			}
			conn.end("");
		}
	}
	// 数据检查与技数
	conn.on('data', function(data){
		if (data != opt.assert) {
			result.err++;
		} else {
			result.ok++;
		}
		next();
	});
	conn.on('error', function() {
		result.err++;
	});
	// 启动worker
	result.begin = last.begin = new Date().getTime();
	tm.setTimeout(function(){
		result.end = new Date().getTime();
	}, opt.time * 1000);
	tm.setTimeout(second, 1000);
	tm.setTimeout(next, 1);
}