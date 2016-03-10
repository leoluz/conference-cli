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
        console.log('resource: %s file: %s', cli.resource, file)
        var payload = require(file)

        var options = {
          path: '/talks',
          headers: {
            'hybris-tenant': 'conference'
          }
        }

        for (var i=0; i < payload.talks.length; i++) {
            client.post(options, payload.talks[i], function(err, req, res, obj) {
                assert.ifError(err)
                console.log('%d -> %s', res.statusCode, obj.id);
            })

        }
    })
    .parse(process.argv)
