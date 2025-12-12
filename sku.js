const pool = require('./pool.js').pool;
const excel = require('exceljs');
const entity = require('./entity.js');
const fs = require('fs');
const sku_summary_query = fs.readFileSync('sku.sql').toString();

function registerEndpoints(app)
{
	app.get('/sku/list/:rps/:page', entity.publicListGeneric(
		'SELECT sku,description FROM skus ORDER BY sku OFFSET $1 LIMIT $2;',
		'SELECT COUNT(*) FROM skus',
		'SKU',
		[
			{name: 'sku', pretty_name: 'SKU', link: (r) => '/sku/detail/' + r.sku},
			{name: 'description', pretty_name: 'Description'},
		]
	));
	app.get('/sku/detail/:id', entity.publicDetailGeneric(
		'SELECT sku AS name,description,notes FROM skus WHERE sku = $1;',
		[
			{name: 'name', pretty_name: 'SKU'},
			{name: 'description', pretty_name: 'Description'},
			{name: 'notes', pretty_name: 'Notes'}
		],
		'/sku/excel/',
		[
			{
				list_sql: sku_summary_query,
				columns: [
					{name: 'deviation_id', pretty_name: 'Deviation', link_w_info: (i, r) => `/deviation/sku/${r.deviation_id}/${i.name}`},
					{name: 'price', pretty_name: 'Price'},
					{name: 'total', pretty_name: 'Total'},
					{name: 'allocated', pretty_name: 'Allocated'},
					{name: 'floating', pretty_name: 'Floating'},
					{name: 'sold', pretty_name: 'Sold'}
				],
				item: "Deviation"
			},
			{
				list_sql: 'SELECT deviation_id, qty, price FROM deviations_skus WHERE sku = $1;',
				columns: [
					{name: "qty", pretty_name: "Qty"},
					{name: "sku", pretty_name: "SKU", link: (r) => '/sku/detail/' + r.sku},
					{name: "description", pretty_name: "Description"},
				],
				item: "Deviation"
			},
			/*{
				list_sql: 'SELECT deviation_id,job_name,job_skus.qty,price FROM job_skus LEFT JOIN jobs ON jobs.name = job_skus.job_name WHERE sku = $1;'

			},*/

		]
	));
}

async function publicDetailSku(req, res)
{
	const sku = req.params.sku;
	if(sku == undefined)
	{
		res.status(400).send();
		return;
	}
	const info = await pool.query('SELECT sku, description, notes FROM skus WHERE skus.sku = $1;', [sku]);
	if(info.rowCount == 0)
	{
		res.status(400).send();
		return;
	}
	const qty_detail = await pool.query('SELECT orders.id, type, created, qty FROM inventory LEFT JOIN orders ON order_id = orders.id WHERE SKU = $1 ORDER BY created;', [sku]);
	res.render('detail_sku', {
		info: info.rows[0],
		qty_detail: qty_detail
	});
}

async function getExcelSku(sku, req, res)
{
	const result = await pool.query('SELECT sku, description, notes FROM skus WHERE skus.sku = $1;', [sku]);
	if(result.rowCount == 0)
	{
		res.status(400).send();
		return;
	}
	
	const info = result.rows[0];
	const qty_detail = await pool.query('SELECT orders.id, type, created, qty FROM inventory LEFT JOIN orders ON order_id = orders.id WHERE SKU = $1 ORDER BY created;', [sku]);
	res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
	const options = {
		stream: res,
		useStyles: true,
		useSharedStrings: true
	};
	const wb = new excel.stream.xlsx.WorkbookWriter(options);
	const sheet = wb.addWorksheet(info.sku);

	sheet.addRow(['SKU', info.sku]).commit();
	sheet.addRow(['Description', info.description]).commit();
	sheet.addRow(['Notes', info.notes]).commit();
	/*const table = sheet.addTable({
		name: 'OrderLines',
		ref: 'A4',
		headerRow: true,
		columns: [
			{name: "Qty", filterButton: true},
			{name: "SKU", filterButton: true},
			{name: "Description", filterButton: false},
		]
	});

	for(const d of qty_detail.rows) {
		table.addRow([d.qty, d.sku, d.description]).commit();
	}*/
	for(const d of qty_detail.rows) {
		sheet.addRow([d.created, d.id, d.type, parseInt(d.qty)]).commit();
	}

	//table.commit();
	sheet.commit();
	await wb.commit();
}

async function publicExcelSku(req, res)
{
	const sku = req.params.sku;
	if(sku == undefined)
	{
		res.status(400).send();
		return;
	}
	if(req.method == "GET")
		await getExcelSku(sku, req, res);
	res.status(400).send();
}

async function publicCreateSku(req, res)
{
	if(req.method == 'GET')
		res.render("create_sku");
	else {
		const sku = req.body.sku;
		const description = req.body.description
		const notes = req.body.notes;
		const result = await pool.query('INSERT INTO skus(sku, description, notes) VALUES ($1, $2, $3);', [sku, description, notes]);
		if (result.affectedRows == 0)
			res.status(400).send();
		else
			res.redirect("/sku/detail/" + sku);
	}
}

async function publicDeleteSku(req, res)
{
	const sku = req.params.sku;
	if(req.method == 'GET')
		res.render("delete_sku"); // ???
	else {
		const result = await pool.query("DELETE FROM skus WHERE sku = $1", [sku]);
		if(result.affectedRows == 0)
			res.status(400).send();
		else
			res.redirect("/sku/list/1");
	}
}

async function publicForceDeleteSku(req, res)
{
	const sku = req.params.sku;
	if(req.method == 'GET')
		res.render("delete_sku"); // ???
	else {
		const client = await pool.connect();
		await client.query("BEGIN;");
		await client.query("DELETE FROM inventory WHERE sku = $1", [sku]);
		await client.query("DELETE FROM skus WHERE sku = $1", [sku]);
		await client.query("COMMIT;");
		client.release();
		res.redirect("/sku/list/1");
	}
}

async function publicEditSku(req, res)
{
	const oldsku = req.params.sku;
	if(req.method == 'GET') {
		const result = await pool.query("SELECT * FROM skus WHERE sku = $1", [oldsku]);
		if (result.rowCount < 1)
			res.status(400).send();
		else
			res.render("edit_sku", result.rows[0]);
	}
	else {

	}	
}

module.exports = {
	registerEndpoints,
	publicCreateSku,
	publicDetailSku,
	publicExcelSku,
	publicDeleteSku,
	publicForceDeleteSku,
	publicEditSku,
};