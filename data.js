const pool = require('./pool.js').pool;
const excel = require('exceljs');

async function doCreateTables(client)
{
	const sku_data_type = "VARCHAR(30)";
	const deviation_id_data_type = "VARCHAR(30)";
	const job_name_data_type = "VARCHAR(100)";
	const notes_data_type = "VARCHAR(255) NULL";

	await client.query('CREATE TABLE skus(' +
		`sku ${sku_data_type} PRIMARY KEY,` +
		'description VARCHAR(64) NULL,' +
		`notes ${notes_data_type}` +
		');'
	);

	await client.query('CREATE TABLE deviations(' +
		`id ${deviation_id_data_type} PRIMARY KEY,` +
		`notes ${notes_data_type}` +
		');'
	);

	await client.query('CREATE TABLE deviations_skus(' +
		`deviation_id ${deviation_id_data_type} REFERENCES deviations(id),` +
		`sku ${sku_data_type} REFERENCES skus(sku),` +
		'qty BIGINT NOT NULL,' +
		'price REAL DEFAULT 0,' +
		'PRIMARY KEY(deviation_id, sku));'
	);

	await client.query('CREATE TABLE jobs(' +
		`name ${job_name_data_type} PRIMARY KEY,` +
		`deviation_id ${deviation_id_data_type} REFERENCES deviations(id),` +
		`notes ${notes_data_type}` +
		');'
	);

	await client.query('CREATE TABLE job_skus(' +
		`job_name ${job_name_data_type} REFERENCES jobs,` +
		`sku ${sku_data_type} REFERENCES skus(sku),` +
		'qty BIGINT NOT NULL,' +
		'PRIMARY KEY(job_name, sku));'
	);

	await client.query('CREATE TABLE sales_tickets(' +
		'id VARCHAR(30) PRIMARY KEY,' +
		`job_name ${job_name_data_type} REFERENCES jobs,` +
		`notes ${notes_data_type}` +
		');'
	);

	await client.query('CREATE TABLE sales_tickets_skus(' +
		'sales_ticket VARCHAR(30) REFERENCES sales_tickets,' +
		`sku ${sku_data_type} REFERENCES skus(sku),` +
		'qty BIGINT NOT NULL,' +
		'PRIMARY KEY (sales_ticket, sku));'
	);
}

async function runIgnoreFailure(client, query)
{
	try {
		await client.query(query);
	} catch(e) {}
}

async function doDropTables(client)
{
	await runIgnoreFailure(client, 'DROP TABLE sales_tickets_skus CASCADE;');
	await runIgnoreFailure(client, 'DROP TABLE sales_tickets CASCADE;');
	await runIgnoreFailure(client, 'DROP TABLE job_skus CASCADE;');
	await runIgnoreFailure(client, 'DROP TABLE jobs CASCADE;');
	await runIgnoreFailure(client, 'DROP TABLE deviations_skus CASCADE;');
	await runIgnoreFailure(client, 'DROP TABLE deviations CASCADE;');
	await runIgnoreFailure(client, 'DROP TABLE skus CASCADE;');
}

async function resetTables()
{
	await doDropTables(pool);
	
	const client = await pool.connect();

	await client.query('BEGIN;');
	await doCreateTables(client)
	await client.query('COMMIT;');

	client.release();
}

async function writeExcelTableGeneric(client, wb, table)
{
	const sheet = wb.addWorksheet(table);
	const data = await client.query(`SELECT * FROM ${table};`);
	sheet.addRow(data.fields.map(f => f.name));
	for(const s of data.rows)
		sheet.addRow(data.fields.map(f => s[f.name])).commit();
	sheet.commit();
}

async function writeToExcelDeviations(client, wb)
{
	const sheet = wb.addWorksheet("deviations");
	const deviations = await client.query("SELECT * FROM deviations;");
	for(const d of writeToExcelDeviations.rows)
		sheet.addRow([d.id, d.notes]).commit();
	sheet.commit();
}

async function readFromExcelDeviations(client, wb)
{

}

async function writeToExcelDeviationSku(client, wb)
{
	const sheet = wb.addWorksheet("deviations_skus");
	const deviations_skus = await client.query("SELECT * FROM deviations_skus;");
	
}

async function getExcelData(res)
{
	res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
	const client = await pool.connect();
	const options = {
		stream: res,
		useStyles: true,
		useSharedStrings: true
	};
	const wb = new excel.stream.xlsx.WorkbookWriter(options);

	await client.query("BEGIN;");
	await writeExcelTableGeneric(client, wb, 'skus');
	await writeExcelTableGeneric(client, wb, 'deviations');
	await writeExcelTableGeneric(client, wb, 'deviations_skus');
	await writeExcelTableGeneric(client, wb, 'jobs');
	await writeExcelTableGeneric(client, wb, 'job_skus');
	await writeExcelTableGeneric(client, wb, 'sales_tickets');
	await writeExcelTableGeneric(client, wb, 'sales_tickets_skus');
	await wb.commit();
	client.query("COMMIT;").finally(() => client.release());
}

async function postExcelData()
{

}

async function publicExcelData(req, res)
{
	if(req.method == 'GET')
		await getExcelData(res);
	else if(req.method == 'POST')
		await postExcelData(req, res);
}

function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

const dummy_adjectives = [
	"red",
	"green",
	"blue",
	"orange",
	"fast",
	"slow",
	"instant-relief",
	"extended-release",
	"sugar-free",
	"gluten-free",
	"diet",
	"almost bug-free",
	"rambunctious",
	"misbehaving",
	"unfortunate",
	"lucky",
	"unexpected",
];

const dummy_nouns = [
	"dingus",
	"chingus",
	"bingus",
	"product",
	"stock",
	"supply",
	"supercalifragilisticexpialidocious",
	"Pepsi (we don't have Coke products)",
	"Coke (we don't have Pepsi products)",
];

function random_from_list(list)
{
	return list[(Math.random() * list.length - 1) | 0];
}

function random_description()
{
	return random_from_list(dummy_adjectives) + " " + random_from_list(dummy_nouns);
}

async function testData()
{
	const client = await pool.connect();
	client.query("BEGIN;");
	// insert 1,000 random SKUs
	for(var i = 0; i < 1000; ++i) {
		const sku = "SKU" + pad(i, 3, '0');
		const description = random_description();
		console.log(`Creating SKU \"${sku}\" with description \"${description}\"`);
		await client.query("INSERT INTO skus(sku, description) VALUES ($1, $2);", [sku, description]);
	}
	// create 50 random deviations
	for(var i = 0; i < 50; ++i) {
		const dev = "DEV" + pad(i, 2, '0');
		console.log(`Creating deviation \"${dev}\"`);
		await client.query("INSERT INTO deviations(id) VALUES ($1);", [dev]);
		var skus = [];
		for(var j = 0; j < 1000; ++j) {
			if(Math.random() * 20 > 1)
				continue;
			const sku = "SKU" + pad(j, 3, '0');
			const qty = (Math.random() * 100 + 1) | 0;
			const price = Math.random() * 10;
			skus.push({sku: sku, qty: qty});
			await client.query("INSERT INTO deviations_skus(deviation_id, sku, qty, price) VALUES ($1, $2, $3, $4);", [dev, sku, qty, price]);
		}
		// each deviation has 20 random jobs
		for(var j = 0; j < 20; ++j) {
			const job = "JOB" + pad(i, 2, '0') + pad(j, 2, '0');
			await client.query("INSERT INTO jobs(name, deviation_id) VALUES ($1, $2);", [job, dev]);
			for(const k of skus) {
				if(Math.random() > 0.5)
					continue;
				var qty = k.qty;
				if(qty <= 0)
					if(Math.random() > 0.01)
						continue;
					else
						qty = Math.random() * 10 | 0;
				else
					qty = qty * Math.random() | 0;
				if(qty == 0)
					continue;
				await client.query("INSERT INTO job_skus(job_name, sku, qty) VALUES ($1, $2, $3);", [job, k.sku, qty]);
			}
		}
	}

	// now let's do 50 sales tickets
	for(var i = 0; i < 50; ++i) {
		const ticket = "SALE" + pad(i, 2, '0');
		// pick a random job
		const job = "JOB" + pad(Math.random() * 50 | 0, 2, '0') + pad(Math.random() * 20 | 0, 2, '0');
		console.log(`Creating sales ticket \"${ticket}\" with job \"${job}\"`)
		await client.query("INSERT INTO sales_tickets(id, job_name) VALUES ($1, $2);", [ticket, job]);
		// what skus does this job have?
		const result = await client.query("SELECT * FROM job_skus WHERE job_name = $1;", [job]);
		for(const r of result.rows) {
			if(Math.random() < 0.9)
				continue;
			const qty = r.qty * Math.random() | 0;
			await client.query("INSERT INTO sales_tickets_skus(sales_ticket, sku, qty) VALUES ($1, $2, $3);", [ticket, r.sku, qty]);
		}
	}
	await client.query("COMMIT;");
	client.release();
}

module.exports = {
	resetTables,
	publicExcelData,
	testData
};
