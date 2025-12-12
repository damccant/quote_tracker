const pool = require('./pool.js').pool;
const excel = require('exceljs');

function publicListGeneric(get_sql, count_sql, item, columns)
{
	return async function(req, res) {
		const rps = req.params.rps ?? 100;
		const page = req.params.page ?? 1;
		const results = await pool.query(get_sql, [(page - 1) * rps, rps]);
		const count = (await pool.query(count_sql)).rows[0].count;
		res.render('list_generic', {
			page: page,
			page_count: Math.ceil(count / rps),
			item: item,
			columns: columns,
			rows: results.rows
		});
	}
}

function publicDetailGeneric(info_sql, columns, excel_url, details)
{
	return async function(req, res) {
		const id = req.params.id;
		if(id == undefined)
		{
			res.status(400).send();
			return;
		}
		const info = await pool.query(info_sql, [id]);
		if(info.rowCount == 0)
		{
			res.status(400).send();
			return;
		}
		for(var detail of details)
			detail.results = (await pool.query(detail.list_sql, [id])).rows;
		res.render('detail_generic', {
			excel_url: excel_url + id,
			info: info.rows[0],
			columns: columns,
			details: details
		});
	};
}

function publicDetailCrossGeneric(keys, info_sql, columns, details)
{
	return async function(req, res) {
		const multi = {};
		for(const key of keys)
		{
			multi[key] = req.params[key];
			if(multi[key] == undefined)
			{
				res.status(400).send();
				return;
			}
		}
		const sql_params = keys.map(k => multi[k]);
		const info = await pool.query(info_sql, sql_params);
		if(info.rowCount == 0)
		{
			res.status(400).send();
			return;
		}
		for(var detail of details)
			detail.results = (await pool.query(detail.list_sql, sql_params)).rows;
		res.render('detail_cross_generic', {
			keys: keys,
			multi: multi,
			info: info.rows[0],
			columns: columns,
			details: details
		});
	};
}

module.exports = {
	publicListGeneric,
	publicDetailGeneric,
	publicDetailCrossGeneric,
};
