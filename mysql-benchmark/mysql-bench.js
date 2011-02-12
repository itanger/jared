var worker = require('./mysql-worker');
var argv = process.argv;
if (argv.length < 6) {
	console.log("Usage: " + argv[0] + ' ' + argv[1] + ' driver concurrent_num query_num table_size mode.');
	process.exit(1);
}
var driver = argv[2];
var con = parseInt(argv[3]);
var num = parseInt(argv[4]);
var table = 'test' + parseInt(argv[5]);
var sql = "SELECT * FROM `" + table + "`;";
var mode = argv[6];


var all = [];
var total = {
	ok : 0,
	err: 0,
	qps : 0,
	num : 0,
}
var opt = {
	driver : driver,
	host : 'dev2',
	database : 'qingdu',
	user : 'qingdu',
	password : '123',
	sql : sql,
	mode : mode,
	num : num,
	interval : 1000,
	cb : function(res) {
		all.push(res);
		total.ok += res.ok;
		total.err += res.err;
		total.qps += res.qps;
		++total.num;
		console.log(res.id + "\t" + res.ok + "\t" + res.err + "\t" + res.qps);
		if (total.num == con) {
			console.log("---------------------------------------------");
			console.log('total\t' + total.ok + "\t" + total.err + "\t" + total.qps);
			console.log("=============================================");
		}
	}
};
console.log("=============================================");
console.log("cid\tok\terr\tqps");
console.log("---------------------------------------------");
for (var i = 0; i < con; i++) {
	opt.id = "conn" + (i+1);
	worker.create(opt);
}
