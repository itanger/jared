var net = require('net'),
	tm = require('timers');
	
exports.create = function(options) {
	var me = {
		// 连接池
		conn : [],
		// 请求队列
		queue : [],
		// 可用连接堆栈
		stack : [],
		// 队列检查定时器
		tm : null,
		// 取得一个可用连接
		get : function(callback, caller){
			this.queue.push({cb:callback, caller:caller});
		},
		// 释放可用连接
		release : function(pos) {
			this.stack.push(pos);
		},
		// 关闭所有连接
		close : function() {
			tm.clearTimeout(this.tm);
			for (var i = 0; i < this.conn.length; i++) {
				if (this.conn[i].readyState !== 'closed') {
					this.conn[i].end();
				}
				delete this.conn[i];
			}
			for (var i = 0; i < this.queue.length; i++) {
				delete this.conn[i];
			}
			this.stack = [];
		}
	}
	// 默认参数
	var opt = {
		host : '127.0.0.1',
		port : '11211',
		size : 50,
		timeout : 30000
	}
	// 参数覆盖
	for (key in options) {
		opt[key] = options[key];
	}
	// 建立连接
	for (var i = 0; i < opt.size; i++){
		me.conn[i] = net.createConnection(opt.port, opt.host);
		me.stack[i] = i;
	}

	function check(){
		// 检查请求队列以及可用连接堆栈
		while (me.queue.length > 0 && me.stack.length > 0) {
			var pos = me.stack.pop();
			var cb = me.queue.shift();
			if (cb.caller) {
				cb.cb.call(cb.caller, me.conn[pos], pos);
			} else {
				cb.cb(me.conn[pos], pos);
			}
			delete cb, pos;
		}
		// 1毫秒后再次检查
		me.tm = tm.setTimeout(check, 1);
	}
	check();
	return me;
}