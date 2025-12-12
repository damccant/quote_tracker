const pool = require('./pool.js').pool;
const excel = require('exceljs');
const entity = require('./entity.js');

function registerEndpoints(app)
{
	app.get('/sales/list/:rps/:page', entity.publicListGeneric(
			'SELECT id,job_name FROM sales_tickets ORDER BY job_name, id OFFSET $1 LIMIT $2;',
			'SELECT COUNT(*) FROM sales_tickets;',
			'Sales Tickets',
			[
				{name: 'id', pretty_name: 'Sales Ticket #', link: (r) => '/sales/detail/' + r.id},
				{name: 'job_name', pretty_name: 'Job Name', link: (r) => '/job/detail/' + r.job_name},
			]
		));
	app.get('/sales/detail/:id', entity.publicDetailGeneric(
			'SELECT id AS name,job_name,notes FROM sales_tickets WHERE id = $1;',
			[
				{name: 'name', pretty_name: 'Sales Ticket #'},
				{name: 'job_name', pretty_name: 'Job Name'},
				{name: 'notes', pretty_name: "Notes"}
			],
			'/sale/excel/',
			[
				{
					list_sql: 'SELECT qty, skus.sku, skus.description FROM sales_tickets_skus LEFT JOIN skus ON skus.sku = sales_tickets_skus.sku WHERE sales_ticket = $1;',
					columns: [
						{name: "qty", pretty_name: "Qty"},
						{name: "sku", pretty_name: "SKU", link: (r) => '/sku/detail/' + r.sku},
						{name: "description", pretty_name: "Description"},
					],
					item: "SKU"
				}
			]
		));
}

module.exports = {
	registerEndpoints
};
