const Pool = require('pg').Pool;
const the_pool = new Pool({
	user: 'hajoca',
	host: '172.16.1.225',
	database: 'hajoca',
	password: '4',
	port: 5432,
});

the_pool.connect();

const pool = the_pool;

module.exports = {
	pool
}