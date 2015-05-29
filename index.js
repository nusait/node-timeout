var fs = require('fs');
var express = require('express');
var Env = require('./.env.json');
var Config = require('./Config.json');
var app = express();
var http = require('http');
var https = require('https');
//var Promise = require('es6-promise').Promise;
var _ = require('underscore');
var request = require('request');
//var NanoTimer = require('nanotimer');
var moment = require('moment');
var server;
var timeoutTasks = [];

if (Env.secured === true) {

    var options = {
        key: fs.readFileSync(Env.cert_key),
        cert: fs.readFileSync(Env.cert_file),
    };

    server = https.createServer(options, app).listen(Env.secure_port);
} else {
    console.log('not secured');
    server = http.createServer(app).listen(Env.port);
}

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', Env['client-domain']);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.send(200);
    }
    else {
        next();
    }
};

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(allowCrossDomain);

setInterval(function () {
    var result = filterPendingTasks(timeoutTasks);
    timeoutTasks = result.pending;
    runTasks(result.expired);
}, 1000);


app.post('/timeout', function (req, res) {
    var data = req.body;
    var appName = data.app_name;

    if ( ! isValidAppName(appName)) {
        return res.status(400).json({message: 'not a valid app name'});
    }
    var delay = +data.delay_ms; //force type to int

    //var timer = new NanoTimer();
    console.log('hey, got your request of ' + delay + 'ms at ' + moment(new Date()).format('MMMM Do YYYY, h:mm:ss a') );

    var requestOptions = {
        url: data.url,
        method: data.method,
        headers: data.headers,
        postData: {
            mimeType: 'application/json',
            params: data.body
        }
    };

    function callback() {
        console.log('a ' + data.method + ' request was successful! at ' + moment(new Date()).format('MMMM Do YYYY, h:mm:ss a'));
    }


    var taskObj = {
        expirationTimestamp: (new Date()).getTime() + delay,
        task: function () {
            request(requestOptions, callback);
        }
    };

    timeoutTasks.push(taskObj);
    //timer.setTimeout(function () {
    //    request(requestOptions, callback);
    //}, '', delay + 'm');
    // setTimeout(function () {
    //     request(requestOptions, callback);
    // }, delay);

    return res.json({message: 'ok!'});
});



function filterPendingTasks(tasks) {
    var now = Date.now();
    function isExpired(aTask) {
        return aTask.expirationTimestamp < now;
    }

    function isNotExpired(aTask) {
        return ! isExpired(aTask);
    }

    var expiredTasks = tasks.filter(isExpired);
    var pendingTasks = tasks.filter(isNotExpired);

    return {
        expired: expiredTasks,
        pending: pendingTasks
    };
}

function runTasks(expiredTasks) {

    function runOneTask(expiredTask) {
        expiredTask.task();
    }

    expiredTasks.forEach(runOneTask);
}

function isValidAppName(app) {
    return !! Config.app_events[app];
}

app.get('/', function (req, res) {
    res.send('I am timeout node app!');
});

