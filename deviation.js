const pool = require('./pool.js').pool;
const excel = require('exceljs');
const entity = require('./entity.js');

function registerEndpoints(app)
{
	app.get('/deviation/list/:rps/:page', entity.publicListGeneric(
		'SELECT id FROM deviations ORDER BY id OFFSET $1 LIMIT $2;',
		'SELECT COUNT(*) FROM deviations',
		'Deviation',
		[
			{name: 'id', pretty_name: 'Deviation ID', link: (r) => '/deviation/detail/' + r.id},
		]
	));
}

module.exports = {
	registerEndpoints
};
