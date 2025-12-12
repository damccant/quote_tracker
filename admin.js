const data = require('./data.js');

async function publicResetTables(req, res)
{
	if(req.method === 'GET') {
		res.render('confirm_action', {
			action: "Reset database",
			notes: [
				"This will permanently delete all SKUs, quotes, and all other information from the system.  This action cannot be undone!",
			],
			//confirm_destructive: "DELETE EVERYTHING",
		});
	}
	else if(req.method === 'POST') {
		await data.resetTables();
		res.redirect('/');
	}
}

async function publicDummyData(req, res)
{
	if(req.method === 'GET') {
		res.render('confirm_action', {
			action: "Insert fake data",
			notes: [
				"This will insert fake dummy data into the database for testing.  The only recovery from this afterwards is to delete all data afterwards (or make 1,000's of manual edits).",
				"Once testing is complete, use the \"Reset Database\" feature to delete all data and start over."
			],
			//confirm_destructive: "PERMANENTLY INSERT DUMMY DATA",
		});
	}
	else if(req.method === 'POST') {
		await data.testData();
		res.redirect("/sku/list/100/1");
	}
}

module.exports = {
	publicResetTables,
	publicDummyData,
};
