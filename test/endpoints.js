process.env.NODE_ENV = 'test'

var fs = require('fs')
var bl = require('bl')
var test = require('ava')
var servertest = require('servertest')

var server = require('../lib/server')
var targetsModel = require('../lib/models/targets')

var defaultTarget = {
  id: '1',
  url: 'http://example.com',
  value: '0.50',
  maxAcceptsPerDay: '3',
  accept: {
    geoState: {
      $in: ['ca', 'ny']
    },
    hour: {
      $in: ['13', '14', '15']
    }
  },
  visits: '0'
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
      t.deepEqual(res.body, [{
        accept: {
          geoState: {
            $in: ['ca', 'ny']
          },
          hour: {
            $in: ['13', '14', '15']
          }
        },
        id: '1',
        url: 'http://example.com',
        value: '0.50',
        maxAcceptsPerDay: '3',
        visits: '0'
      }], 'correct body content')
      t.end()
    })
  })
})

test.serial.cb('shoud get a target by id', function (t) {
  var url = '/api/target/1'
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct statusCode')
    t.deepEqual(res.body, {
      accept: {
        geoState: {
          $in: ['ca', 'ny']
        },
        hour: {
          $in: ['13', '14', '15']
        }
      },
      id: '1',
      url: 'http://example.com',
      value: '0.50',
      maxAcceptsPerDay: '3',
      visits: '0'
    }, 'correct body content')
    t.end()
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

test.serial.cb('shoud update a target', function (t) {
  var url = '/api/target/1'
  var st = servertest(server(), url, { method: 'POST' })
  fs.createReadStream(`${__dirname}/defaultTarget.json`).pipe(st)
  st.pipe(bl(function (err, data) {
    t.falsy(err, 'no-model-error')
    t.is(data.toString(), '"OK"', 'target created')
    t.end()
  }))
})

test.serial.cb('shoud get a target url', function (t) {
  var url = '/route'
  var st = servertest(server(), url, { method: 'POST' })
  fs.createReadStream(`${__dirname}/defaultVisitor.json`).pipe(st)
  st.pipe(bl(function (err, data) {
    t.falsy(err, 'no-model-error')
    t.deepEqual(JSON.parse(data.toString()), {
      decision: 'accept',
      url: 'http://example.com'
    }, 'decision accept')
    t.end()
  }))
})
