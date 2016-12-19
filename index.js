'use strict';

const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, '.env')});
const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');
const methodOverride = require('method-override');
const port = parseInt(process.env.PORT, 10) || 8000;
const DEV = process.env.NODE_ENV !== 'production';

app.get("/", (req, res)=> {
    res.redirect("index.html");
});

app.use(methodOverride());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static(__dirname + '/public'));

app.use(errorHandler({
    dumpExceptions: true,
    showStack: true
}));

app.listen(port, '0.0.0.0', function onStart(err) {
    var info = `==> Listening on port ${port}. Open up http://0.0.0.0:${port}/ DEV: ${DEV}`
    if (err) {
        console.log(err);
    }
    console.info(info);
});
