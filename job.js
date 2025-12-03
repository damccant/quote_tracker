const pool = require('./pool.js').pool;
const excel = require('exceljs');
const entity = require('./entity.js');

function registerEndpoints(app)
{
	app.get('/job/list/:rps/:page', entity.publicListGeneric(
			'SELECT name,deviation_id FROM jobs ORDER BY deviation_id, name OFFSET $1 LIMIT $2;',
			'SELECT COUNT(*) FROM jobs;',
			'Job',
			[
				{name: 'name', pretty_name: 'Job Name', link: (r) => '/job/detail/' + r.name},
				{name: 'deviation_id', pretty_name: 'Deviation ID', link: (r) => '/deviation/detail/' + r.deviation_id},
			]
		));
	app.get('/job/detail/:id', entity.publicDetailGeneric(
			'SELECT name,deviation_id,notes FROM jobs WHERE name = $1;',
			[
				{name: 'name', pretty_name: 'Job Name'},
				{name: 'deviation_id', pretty_name: 'Deviation ID'},
				{name: 'notes', pretty_name: "Notes"}
			],
			'/job/excel/',
			{
				list_sql: 'SELECT qty, skus.sku, skus.description FROM job_skus LEFT JOIN skus ON skus.sku = job_skus.sku WHERE job_name = $1;',
				columns: [
					{name: "qty", pretty_name: "Qty"},
					{name: "sku", pretty_name: "SKU", link: (r) => '/sku/detail/' + r.sku},
					{name: "description", pretty_name: "Description"},
				],
				item: "SKU"
			}
		));
}

module.exports = {
	registerEndpoints
};
