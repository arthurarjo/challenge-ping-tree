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

function getTarget (req, res, opt, cb) {
  var id = opt.params.id

  targetsModel.getSet({ id }, null, function (err, target) {
    if (err) return cb(err)
    send(req, res, target)
  })
}

function getAllTargets (req, res, opt, cb) {
  targetsModel.getAll(function (err, data) {
    if (err) return cb(err)
    send(req, res, data)
  })
}

function updateTarget (req, res, opt, cb) {
  body(req, res, function (err, data) {
    if (err) return cb(err)
    var id = opt.params.id
    targetsModel.updateSet({ id }, data, function (err, target) {
      if (err) return cb(err)
      send(req, res, target)
    })
  })
}

function visitHandler (req, res, opt, cb) {
  body(req, res, function (err, data) {
    if (err) return cb(err)
    var options = {
      geoState: data.geoState,
      timestamp: new Date(data.timestamp)
    }
    targetsModel.getAEligibleTarget(options, function (err, target) {
      if (err) return cb(err)
      if (target) {
        targetsModel.countVisit({ id: target.id }, data.timestamp, function (err, data) {
          if (err) cb(err)
          send(req, res, { decision: 'accept', url: target.url })
        })
      } else {
        send(req, res, { decision: 'reject' })
      }
    })
  })
}

module.exports = {
  createTarget,
  getTarget,
  getAllTargets,
  updateTarget,
  visitHandler
}
