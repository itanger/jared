var Mysql = require("mysql-native")

function connect (opt) {
	var conn = new Mysql.createTCPClient(opt.host, opt.port);
	conn.auto_prepare = true;
	conn.auth(opt.database, opt.user, opt.password);
	return conn;
}

exports.run = function(opt, result, checkDone) {
	var conn = connect(opt);
	var close = function() {
		conn.close();
	}
	if (opt.mode == 'query') {
		var exec = function(){
			var query = conn.query(opt.sql);
			var num = 0;
			query.on('row', function(row) {
				if (++num >= opt.table) {
					num = 0;
					++result.ok;
					checkDone(exec, close);
				}
			});
		}
		result.linear.lastTime = result.begin = new Date().getTime();
		exec();
	} else {
		var exec = function(){
			var query = conn.execute(opt.sql);
			var num = 0;
			query.on('row', function(row) {
				if (++num >= opt.table) {
					num = 0;
					++result.ok;
					checkDone(exec, close);
				}
			});
		}
		result.linear.lastTime = result.begin = new Date().getTime();
		exec();
	}
}