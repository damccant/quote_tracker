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
	app.get('/deviation/detail/:id', entity.publicDetailGeneric(
		'SELECT id AS name,notes FROM deviations WHERE id = $1;',
		[
			{name: 'name', pretty_name: 'Deviation ID'},
			{name: 'notes', pretty_name: "Notes"}
		],
		'/deviation/excel/',
		[
			{
				list_sql: 'SELECT skus.sku, skus.description, qty, price FROM deviations_skus LEFT JOIN skus ON skus.sku = deviations_skus.sku WHERE deviation_id = $1;',
				columns: [
					{name: "qty", pretty_name: "Qty"},
					{name: "sku", pretty_name: "SKU", link: (r) => '/sku/detail/' + r.sku},
					{name: "description", pretty_name: "Description"},
					{name: "price", pretty_name: "Price"}
				],
				item: "SKU"
			},
			{
				list_sql: 'SELECT name FROM jobs WHERE deviation_id = $1;',
				columns: [
					{name: "name", pretty_name: "Job Name", link: (r) => '/job/detail/' + r.name}
				],
				item: "Job"
			}
		]
	));
	app.get('/deviation/sku/:dev/:sku', entity.publicDetailCrossGeneric(
		['dev', 'sku'],
		'SELECT qty, price FROM deviations_skus WHERE deviation_id = $1 AND sku = $2;',
		[
			{name: 'qty', pretty_name: 'Deviation Quantity'},
			{name: 'price', pretty_name: 'Price'},
		],
		[
			{
				list_sql: 'SELECT deviation_id, job_skus.job_name, job_skus.qty FROM job_skus LEFT JOIN jobs ON job_skus.job_name = jobs.name WHERE deviation_id = $1 AND job_skus.sku = $2;',
				columns: [
					{name: 'deviation_id', pretty_name: 'Deviation'},
					{name: 'job_name', pretty_name: 'Job Name', link: (r) => '/job/detail/' + r.job_name},
					{name: 'qty', pretty_name: 'Qty'}
				],
				item: 'Job'
			}
		]
	));
}

module.exports = {
	registerEndpoints
};
