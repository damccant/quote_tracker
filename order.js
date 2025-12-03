const pool = require('./pool.js').pool;
const excel = require('exceljs');

const order_nice_types = [
	"Quote",
	"Job"
];

async function publicListOrder(req, res)
{
	const page = req.params.page ?? 1;
	const results = await pool.query('SELECT created, type, id FROM orders ORDER BY created DESC OFFSET $1 LIMIT 100;', [(page - 1) * 100]);
	res.render('list_order', {
		order_nice_types: order_nice_types,
		page: page,
		results: results.rows
	});
}

async function publicDetailOrder(req, res)
{
	const order = req.params.id;
	if(order == undefined)
	{
		res.status(400).send();
		return;
	}
	const info = await pool.query('SELECT created, id, type FROM orders WHERE id = $1;', [order]);
	if(info.rowCount == 0)
	{
		res.status(400).send();
		return;
	}
	const qty_detail = await pool.query('SELECT skus.sku, description, qty FROM inventory LEFT JOIN skus ON inventory.sku = skus.sku WHERE order_id = $1 ORDER BY skus.sku;', [order]);
	res.render('detail_order', {
		order_nice_types: order_nice_types,
		info: info.rows[0],
		qty_detail: qty_detail
	});
}

async function getExcelOrder(order, req, res)
{
	const result = await pool.query('SELECT created, id, type FROM orders WHERE id = $1;', [order]);
	if(result.rowCount == 0)
	{
		res.status(400).send();
		return;
	}
	
	const info = result.rows[0];
	const qty_detail = await pool.query('SELECT skus.sku, description, qty FROM inventory LEFT JOIN skus ON inventory.sku = skus.sku WHERE order_id = $1 ORDER BY skus.sku;', [order]);
	res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
	const options = {
		stream: res,
		useStyles: true,
		useSharedStrings: true
	};
	const wb = new excel.stream.xlsx.WorkbookWriter(options);
	const sheet = wb.addWorksheet(info.id);

	sheet.addRow(['Order ID', info.id]).commit();
	sheet.addRow(['Created', info.created]).commit();
	sheet.addRow(['Type', order_nice_types[info.type]]).commit();
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
		sheet.addRow([parseInt(d.qty), d.sku, d.description]).commit();
	}

	//table.commit();
	sheet.commit();
	await wb.commit();
}

async function publicExcelOrder(req, res)
{
	const order = req.params.id;
	if(order == undefined)
	{
		res.status(400).send();
		return;
	}
	if(req.method == "GET")
		await getExcelOrder(order, req, res);
	res.status(400).send();
}

async function publicCreateOrder(req, res)
{
	if(req.method == 'GET')
		res.render("create_order");
	else {
		res.status(500).send();
		return;
		const sku = req.body.sku;
		const description = req.body.description
		const notes = req.body.notes;
		const result = await pool.query('INSERT INTO skus(sku, description, notes) VALUES ($1, $2, $3);', [sku, description, notes]);
		if (result.affectedRows == 0)
			res.status(400).send();
		else
			res.redirect("/order/detail/" + order);
	}
}

async function publicDeleteOrder(req, res)
{
	const order_id = req.params.id;
	if(req.method == 'GET')
		res.render("delete_order"); // ???
	else {
		const result = await pool.query("DELETE FROM orders WHERE id = $1", [order_id]);
		if(result.affectedRows == 0)
			res.status(400).send();
		else
			res.redirect("/order/list/1");
	}
}

async function publicForceDeleteOrder(req, res)
{
	const order_id = req.params.order_id;
	if(req.method == 'GET')
		res.render("delete_order"); // ???
	else {
		const client = await pool.connect();
		await client.query("BEGIN;");
		await client.query("DELETE FROM inventory WHERE order_id = $1", [order_id]);
		await client.query("DELETE FROM orders WHERE id = $1", [order_id]);
		await client.query("COMMIT;");
		client.release();
		res.redirect("/order/list/1");
	}
}

async function publicEditOrder(req, res)
{
	const oldsku = req.params.sku;
	if(req.method == 'GET') {
		const result = await pool.query("SELECT * FROM orders WHERE id = $1", [oldsku]);
		if (result.rowCount < 1)
			res.status(400).send();
		else
			res.render("edit_order", result.rows[0]);
	}
	else {

	}	
}

module.exports = {
	publicListOrder,
	publicCreateOrder,
	publicDetailOrder,
	publicExcelOrder,
	publicDeleteOrder,
	publicForceDeleteOrder,
	publicEditOrder,
};