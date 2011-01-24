var workers = require('./bench-worker')
	tm = require('timers');
// 帮助信息
if (process.argv.length < 5) {
	console.log('Usage: ' + process.argv.join(' ') + ' $concurrent_num $run_seconds $port [$host]');
	return;
}
var Bench = function(options) {

	var me = {
		results : []
	}
	// daemon 参数
	var opt = {
		conc : 10
	}
	// worker参数
	var wopt = {
		cb : function(result) {
			this.results.push(result);
			if (me.results.length >= opt.conc) {
				opt.cb(me.results);
			}
		},
		cl : me
	};
	for (key in options) {
		opt[key] = options[key];
		if (key != 'conc' && key != 'cb' && key != 'cl') {
			wopt[key] = options[key];
		} 
	}
	for (var i = 0; i < opt.conc; i++) {
		console.log('worker ' + i + ' start.');
		workers.run(i, wopt);
	}
}

// 运行测试
Bench({
	conc : parseInt(process.argv[2]),
	time : parseInt(process.argv[3]),
	port : parseInt(process.argv[4]),
	host : process.argv[6] ? process.argv[6] : '127.0.0.1',
	// 请求
	msg : "get aaa\r\n",
	// 响应
	assert : "VALUE aaa 0 100\r\naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\r\nEND\r\n",
	cb : function(results) {
		//结果计算
		var res = {
			qps : {
				max : 0,
				min : 9999999999,
				avg : 0
			},
			elapsed : 0,
			total : 0,
			ok : 0,
			err : 0,
			psecond : []
		};
		for (var i = 0; i < results.length; i++) {
			var r = results[i];
			var time = r.end - r.begin;
			if (time > res.elapsed) {
				res.elapsed = time / 1000;
			}
			res.ok += r.ok;
			res.err += r.err;
			res.total += r.total;
			for (var j = 0; j < r.psecond.length; j++) {
				var l = r.psecond[j];
				var qps = l.total / l.time * 1000;
				if (res.psecond[j]) {
					res.psecond[j] += qps;
				} else {
					res.psecond[j] = qps;
				}
			}
		}
		for (var i = 0; i < res.psecond.length; i++) {
			var qps = res.psecond[i];
			if (qps > res.qps.max) {
				res.qps.max = qps;
			}
			if (qps < res.qps.min) {
				res.qps.min = qps;
			}
		}
		res.qps.avg = res.total / res.elapsed;
		console.log(res);
	}
});