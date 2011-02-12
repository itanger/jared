var	mysql = require('mysql-libmysqlclient');

function connect (opt) {

	var conn = mysql.createConnectionSync();
	conn.connectSync(opt.host, opt.user, opt.password, opt.database);
	conn.setCharsetSync('utf8');

	if (!conn.connectedSync()) {
		console.log("Connection error " + conn.connectErrno + ": " + conn.connectError);
		process.exit(1);
	}
	return conn;
}


exports.run = function(opt, result, checkDone) {
	var conn = connect(opt);
	var close = function() {
		conn.closeSync();
	}

	if (opt.mode == 'fetch') {

		var fetchDone = function(err, row) {
			if (err) {
				result.err++;
				checkDone(query, close);
				return;
			}
			result.ok++;
			checkDone(query, close);
		}
		var queryDone = function(err, res) {
			if (err) {
				result.err++;
				checkDone(query, close);
				return;
			}
			res.fetchAll(fetchDone);
		}
		var query = function() {
			conn.query(opt.sql, queryDone);
		}
		result.linear.lastTime = result.begin = new Date().getTime();
		query();
	} else if (opt.mode == 'exec') {
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
	}
}