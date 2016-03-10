#!/usr/bin/env node
var cli = require('commander')
var restify = require('restify')
var assert = require('assert')

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
            'Authorization': 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjBlNmQ2MWFmNzdjMjI3NzIyZjdmODI2MjBmYzZhY2NlZGEwM2UzODEifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXRfaGFzaCI6IkZTOW1KNFliX1RSTGhSOUVmLTN2S0EiLCJhdWQiOiIxNDcwMjIyNTM2MDgtcDNuYmxlbmZkczFxNGhxbmE0bjdsYzRsYzRtOWFvaTYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTA1NzY4NzY5NTk5NDUwOTIxNTIiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXpwIjoiMTQ3MDIyMjUzNjA4LXAzbmJsZW5mZHMxcTRocW5hNG43bGM0bGM0bTlhb2k2LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiZW1haWwiOiJsZW9uYXJkby5sYUBnbWFpbC5jb20iLCJpYXQiOjE0NTc2MzY1ODEsImV4cCI6MTQ1NzY0MDE4MSwibmFtZSI6Ikxlb25hcmRvIEx1eiIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vLXU1Xy1Xa0luVGxBL0FBQUFBQUFBQUFJL0FBQUFBQUFBRkE4L1ZzcFcyT0xGbUJnL3M5Ni1jL3Bob3RvLmpwZyIsImdpdmVuX25hbWUiOiJMZW9uYXJkbyIsImZhbWlseV9uYW1lIjoiTHV6IiwibG9jYWxlIjoiZW4ifQ.JR4yJNlx_dR-BWAcQKJxJBnB-8qO3dpL2rs5m1Khge2MZjnpYYbzKwl-4MVpY52v35Bdk2EmGske-eWGthv1ioiARzJbCVszYowVfjPr6dc_y4lMbcKXnFvJzvFoPYnuOcpqgcbrXNzq62lPhtAPLSd45lHU1KvZKgaP7nwGfQzEPnaZ8VJvl3MOYHfZSJJ2mPTwYXqOoCjpbAMXxJlu1Hna-Rb0JbWgje2kQgeFbj6KCA8Gci91KgNn0EbWlwUqaYRlNpuqoBANiIe-xwixfR4Jawrnpr_eTkD7bgu_Z63Fm2hLJ8mfnAE8ywFXNPnt6XIDUL4LkKp9M9T0pdu3FQ',
            'hybris-tenant': 'conference'
          }
        };
}
