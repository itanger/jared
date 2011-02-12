var Mysql = require('mysql').Client;

function connect (opt) {
	var conn = new Mysql();
	if (opt.host) {
		conn.host = opt.host;
	}
	if (opt.port) {
		conn.port = opt.port;
	}
	if (opt.user) {
		conn.user = opt.user;
	}
	if (opt.password) {
		conn.password = opt.password;
	}
	if (opt.database) {
		conn.database = opt.database;
	}
	conn.connect();
	return conn;
}


exports.run = function(opt, result, checkDone) {
	var conn = connect(opt);
	var close = function() {
		conn.end();
	}

	if (opt.mode == 'callback') {
		var queryDone = function(err, res) {
			if (err) {
				result.err++;
				checkDone(query, close);
				return;
			}
			result.ok++;
			checkDone(query, close);
		}
		var query = function() {
			conn.query(opt.sql, queryDone);
		}
		result.linear.lastTime = result.begin = new Date().getTime();
		query();
	} else if (opt.mode == 'event') {
		var exec = function(){
			var query = conn.query(opt.sql);
			query.on('error', function(err) {
				++result.err;
				checkDone(exec, close);
			})
			query.on('end', function(res) {
				++result.ok;
				checkDone(exec, close);
			});
		}
		result.linear.lastTime = result.begin = new Date().getTime();
		exec();
	}
}