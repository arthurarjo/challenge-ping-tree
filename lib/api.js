var body = require('body/json')
var send = require('send-data/json')
var targetsModel = require('./models/targets')

function createTarget (req, res, opt, cb) {
  body(req, res, function (err, data) {
    if (err) return cb(err)
    var target = {
      url: data.url,
      value: data.value,
      maxAcceptsPerDay: data.maxAcceptsPerDay,
      accept: data.accept
    }
    targetsModel.addSet(target, function (err, data) {
      if (err) return cb(err)
      send(req, res, data)
    })
  })
}

function getAllTargets (req, res, opt, cb) {
  targetsModel.getAll(null, function (err, data) {
    if (err) return cb(err)
    send(req, res, data)
  })
}

module.exports = {
  createTarget,
  getAllTargets
}
