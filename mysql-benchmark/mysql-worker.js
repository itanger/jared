var ntv = require('./mysql-conn-native'),
	ntv2 = require('./mysql-conn-native2'),
	lib = require('./mysql-conn-libmysql');

exports.create = function(options, id) {
	var opt = {
		id : 1,
		host : 'localhost',
		port : 3306,
		user : root,
		password : '',
		database : null,
		sql : null,
		mode : 'callback',
		num : 100000,
		interval : 1000,
		cb : null,
		table : 0,
	}
	for (key in options){
		opt[key] = options[key];
	}
	var result = {
		id : opt.id,
		ok : 0,
		err : 0,
		begin : 0,
		end : 0,
		qps : 0,
		linear : {
			data : [],
			lastOk : 0,
			lastErr : 0,
			lastTime : 0
		}
	}
	var linear = function(){
		if (result.ok + result.err <= result.linear.lastOk + result.linear.lastErr) {
			return;
		}
		var data = process.memoryUsage();
		data.ok = result.ok - result.linear.lastOk;
		data.err = result.err - result.linear.lastErr;
		data.time = new Date().getTime() - result.linear.lastTime;
		result.linear.data.push(data);
		result.linear.lastOk = result.ok;
		result.linear.lastErr = result.err;
		result.linear.lastTime = new Date().getTime();
	}
	var itv = setInterval(linear, opt.interval);

	var checkDone = function(func, onEnd) {
		if (result.ok + result.err < opt.num) {
			func();
		} else {
			result.end = new Date().getTime();
			onEnd();
			clearInterval(itv);
			linear();
			if (opt.cb) {
				result.qps = ((result.ok + result.err) / (result.end - result.begin) * 1000)
				opt.cb(result);
			}
		}
	}

	if (opt.driver == 'native') {
		ntv.run(opt, result, checkDone);
	} else if (opt.driver == 'native2') {
		ntv2.run(opt, result, checkDone);
	}else {
		lib.run(opt, result, checkDone);
	}
}
