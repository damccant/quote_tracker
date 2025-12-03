const HTTP_PORT = 8080;

const express = require('express');
const path = require('path');
const http = require('http');

const app = express();

// bootstrap CSS
app.use(express.static(path.join(__dirname, "node_modules/bootstrap/dist")));
// bootstrap icons
app.use('/css', express.static(path.join(__dirname, "node_modules/bootstrap-icons/font")));
// datetime picker
app.use(express.static(path.join(__dirname, "node_modules/@popperjs/core/dist")))
app.use(express.static(path.join(__dirname, "node_modules/@eonasdan/tempus-dominus")));
//custom scripts
app.use(express.static(path.join(__dirname, "public")));


app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.get('/', (req, res) => {
	res.render('index');
});

const admin = require('./admin.js');
app.get('/admin', (req, res) => {
	res.render('admin');
});
app.get('/admin/reset', admin.publicResetTables);
app.post('/admin/reset', admin.publicResetTables);
app.get('/admin/dummy', admin.publicDummyData);
app.post('/admin/dummy', admin.publicDummyData);

const data = require('./data.js');
app.get('/admin/excel', data.publicExcelData);
app.post('/admin/excel', data.publicExcelData);

const sku = require('./sku.js');
sku.registerEndpoints(app);
app.get('/sku/create', sku.publicCreateSku);
app.post('/sku/create', sku.publicCreateSku);
app.get('/sku/detail/:sku', sku.publicDetailSku);
app.post('/sku/detail/:sku', sku.publicDetailSku);
app.get('/sku/excel/:sku', sku.publicExcelSku);
app.post('/sku/excel/:sku', sku.publicExcelSku);
app.get('/sku/delete/:sku', sku.publicDeleteSku);
app.post('/sku/delete/:sku', sku.publicDeleteSku);
app.post('/sku/forcedelete/:sku', sku.publicForceDeleteSku);
app.get('/sku/edit/:sku', sku.publicEditSku);
app.post('/sku/edit/:sku', sku.publicEditSku);

const deviation = require('./deviation.js');
deviation.registerEndpoints(app);

const order = require('./order.js');
app.get('/order/list/:page', order.publicListOrder);
app.get('/order/create', order.publicCreateOrder);
app.post('/order/create', order.publicCreateOrder);
app.get('/order/detail/:id', order.publicDetailOrder);
app.post('/order/detail/:id', order.publicDetailOrder);
app.get('/order/excel/:id', order.publicExcelOrder);
app.post('/order/excel/:id', order.publicExcelOrder);
app.get('/order/delete/:id', order.publicDeleteOrder);
app.post('/order/delete/:id', order.publicDeleteOrder);
app.post('/order/forcedelete/:id', order.publicForceDeleteOrder);
app.get('/order/edit/:id', order.publicEditOrder);
app.post('/order/edit/:id', order.publicEditOrder);

const job = require('./job.js');
job.registerEndpoints(app);

const sales = require('./sales.js');
sales.registerEndpoints(app);

const server = http.createServer(app);
server.listen(HTTP_PORT);
