process.env.NODE_ENV = 'test'

var fs = require('fs')
var bl = require('bl')
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

test.serial.cb('shoud create a target', function (t) {
  var url = '/api/targets'
  var st = servertest(server(), url, { method: 'POST' })
  fs.createReadStream(`${__dirname}/defaultTarget.json`).pipe(st)
  st.pipe(bl(function (err, data) {
    t.falsy(err, 'no-model-error')
    t.is(data.toString(), '"OK"', 'target created')
    t.end()
  }))
})
