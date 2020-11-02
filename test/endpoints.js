process.env.NODE_ENV = 'test'

var test = require('ava')
var servertest = require('servertest')

var server = require('../lib/server')
var targetsModel = require('../lib/models/targets')

var defaultTarget = {
  id: 'targets:1',
  url: 'http://example.com',
  value: '0.50',
  maxAcceptsPerDay: '10',
  accept: 'true'
}

test.serial.cb('healthcheck', function (t) {
  var url = '/health'
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.status, 'OK', 'status is ok')
    t.end()
  })
})

test.serial.cb('shoud get all targets', function (t) {
  var url = '/api/targets'
  targetsModel.addSet(defaultTarget, function (err, targets) {
    t.falsy(err, 'no-model-error')
    servertest(server(), url, { encoding: 'json' }, function (err, res) {
      t.falsy(err, 'no error')
      t.is(res.statusCode, 200, 'correct statusCode')
      t.deepEqual(res.body, [defaultTarget], 'correct body content')
      t.end()
    })
  })
})
