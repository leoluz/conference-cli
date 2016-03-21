#!/usr/bin/env node

var cli = require('commander');
var restify = require('restify'); 
var assert = require('assert');
var fs = require('fs');
var sync = require('synchronize');
var ProgressBar = require('progress');

var token = fs.readFileSync('token', 'utf8').toString().split('\n')[0];

//Stage
//var scopes = '';
//var conferece_url = '';
//var eventId = '';

//Prod
var scopes = '';
var conferece_url = 'https://yconference.yaas.io';
var eventId = '56e87e1b58d0ca001d82f0a0';

if (!token) {
    console.log('Error: token file not found!');
    process.exit(1);
}

var client = restify.createJsonClient({
    url: conferece_url,
    version: '*'
})

cli.arguments('<file>')
    .option('-r, --resource <resource name>', 'The resource name')
    .action(function(file) {
        var payload;
        if (cli.resource == 'talk') {
			payload = require(file)
            createTalks(payload.talks);
        } else if (cli.resource == 'event') {
			payload = require(file)
            createEvent(payload);
		} else if (cli.resource == 'feedback') {
			getFeedbacks();
        } else {
            cli.help();
        }
    })
    .parse(process.argv);

function createTalks(talks) {
    sync(client, 'post');
	var opts = {
		width: 40,
		total: talks.length-1,
		clear: true
	};
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

function getFeedbacks() {
	var opts = buildOptions('/events/'+eventId+'/feedbacks');
	client.get(opts, function(err, req, res, obj) {
        assert.ifError(err);
		obj.talks.forEach(function(talk) {
			console.log(talk.title, ' (', talk.speakers.join(','), ')');
			var comments = [];
			var stars = [0, 0, 0, 0, 0, 0];
			talk.feedbacks.forEach(function(feedback) {
				stars[feedback.stars] += 1;
				if (feedback.comment) {
					comments.push(feedback.comment);
				}
			});

			var totalStars = 0;
			var totalVoters = 0;

			for (var i = 1; i < stars.length; i++) {
				if (stars[i] > 0) {
					totalVoters += stars[i];
					totalStars += (i * stars[i]);
				}
			}
			var average = totalStars/totalVoters;
			console.log("*****", "\t", stars[5]);
			console.log("****", "\t", stars[4]);
			console.log("***", "\t", stars[3]);
			console.log("**", "\t", stars[2]);
			console.log("*", "\t", stars[1]);
			console.log("Avg: ", "\t", average.toFixed(2), "("+totalVoters+")\n");
			comments.forEach(function(comment) {
				console.log("-", comment);
			});
			console.log("\n----------------------------");
		});
	});
}

function buildOptions(endpoint) {
    return {
      path: endpoint,
      headers: {
		'Authorization': 'Bearer '+token,
		'hybris-tenant': 'conference',
		'hybris-scopes': scopes
      }
    };
}
