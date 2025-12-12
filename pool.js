const Pool = require('pg').Pool;
const the_pool = new Pool({
	user: 'caprisun',
	host: 'localhost',
	database: 'caprisun',
	password: '4',
	port: 5432,
});

the_pool.connect();

const pool = the_pool;

module.exports = {
	pool
}