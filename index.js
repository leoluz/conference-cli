#!/usr/bin/env node
var cli = require('commander');
var restify = require('restify'); 
var assert = require('assert');
var fs = require('fs');
var sync = require('synchronize');
var ProgressBar = require('progress');

var token = fs.readFileSync('token', 'utf8').toString().split('\n')[0];
var opts = {
    width: 40,
    total: talks.length-1,
    clear: true
};

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
    sync(client, 'post');
    var bar = new ProgressBar('  Creating talks [:bar] :percent :etas', opts);
    var result = {};
    sync.fiber(function() {
        talks.forEach(function(talk) {
            var response = client.post(buildOptions('/talks'), talk).res;
            var talkId = JSON.parse(response.body).id;
            var key = talk.startTime;
            if (key in result) {
                result[key].push(talkId);
            } else {
                result[key] = [talkId];
            }
            bar.tick(1);
        });
        var sortedKeys = Object.keys(result).sort();
        sortedKeys.forEach(function(key) {
            console.log('%s\n%s\n', key, result[key]);
        });
    });
}

function createEvent(events) {
    client.post(buildOptions('/events'), events, function(err, req, res, obj) {
        assert.ifError(err);
        console.log(obj.id);
    });
}

function buildOptions(endpoint) {
    return {
      path: endpoint,
      headers: {
		'Authorization': 'Bearer '+token,
		'hybris-tenant': 'conference',
		'hybris-scopes': 'hybris.conference_admin'
      }
    };
}
