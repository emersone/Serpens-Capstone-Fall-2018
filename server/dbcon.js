var mysql = require('mysql');
var pool = mysql.createPool({
	connectionLimit : 10,
	host		: '35.232.161.155',
	user		: 'root',
	password	: 'serpens467',
	database	: 'users',
});

module.exports.pool = pool;
