#!/usr/bin/env node
var cli = require('commander');
var restify = require('restify');
var assert = require('assert');
var fs = require('fs');

var token = fs.readFileSync('token', 'utf8').toString().split('\n')[0];

if (!token) {
    console.log('Error: token file not found!');
    process.exit(1);
}

var client = restify.createJsonClient({
    url: 'http://localhost:3000',
    version: '*'
})

cli.arguments('<file>')
    .option('-r, --resource <resource name>', 'The resource name')
    .action(function(file) {
        var payload = require(file)
        if (cli.resource == 'talk') {
            createTalks(payload.talks);
        } else if (cli.resource == 'event') {
            createEvent(payload);
        } else {
            cli.help();
        }

    })
    .parse(process.argv);

function createTalks(talks) {
    for (var i=0; i < talks.length; i++) {
        var talk = talks[i];
        client.post(buildOptions('/talks'), talk, function(err, req, res, obj) {
            assert.ifError(err);
            printTalkInfo(obj.id);
        })
    }
}

function createEvent(events) {
    client.post(buildOptions('/events'), events, function(err, req, res, obj) {
        assert.ifError(err);
        console.log(obj.id);
    });
}

function printTalkInfo(talkId) {
    var opt = buildOptions('/talks/'+talkId);
    client.get(opt, function(err, req, res, obj) {
        console.log('%s, %s', obj.id, obj.startTime);
    })
}

function buildOptions(endpoint) {
    return {
      path: endpoint,
      headers: {
        'Authorization': token,
        'hybris-tenant': 'conference'
      }
    };
}
