var redis = require('../redis')

var modelName = 'targets'

var model = {
  id: { type: 'int', required: true },
  url: { type: 'string', required: true },
  value: { type: 'float', required: true },
  maxAcceptsPerDay: { type: 'int', required: true },
  accept: { type: 'object', required: true }
}

function _keyGenerator (data, callback) {
  if (data) return callback(null, modelName + ':' + data.id)
  redis.incr('!' + modelName + ':id')
  redis.get('!targets:id', function (err, data) {
    if (err) return callback(err)
    return callback(null, modelName + ':' + data)
  })
}

function _handleError (errors) {
  return { message: errors, statusCode: 400 }
}

function _verifyFields (data, callback) {
  var errors = []
  for (var prop in model) {
    if (model[prop] && model[prop].required && !data[prop]) errors.push(`Field ${prop} is required`)
  }
  if (errors.length) return callback(_handleError(errors))
  return callback()
}

function addSet (set, callback) {
  _keyGenerator(null, function (err, key) {
    if (err) return callback(err)

    set.id = key.replace('targets:', '')
    set.accept = JSON.stringify(set.accept)
    set.visits = 0

    _verifyFields(set, function (err) {
      if (err) return callback(err)
      redis.hmset(key, set, function (err, data) {
        if (err) return callback(err)
        return callback(null, data)
      })
    })
  })
}

function getSet (key, field, callback) {
  _keyGenerator(key, function (err, key) {
    if (err) return callback(err)

    redis.hgetall(key, function (err, data) {
      if (err) return callback(err)
      data.accept = JSON.parse(data.accept)
      if (field) {
        data = data.field
      }
      return callback(null, data)
    })
  })
}

function getAll (callback) {
  var targets = []
  redis.keys('targets:*', function (err, data) {
    if (err) return callback(err)
    if (data === undefined || data.length === 0) return callback(null, [])
    for (let i = 0; i < data.length; i++) {
      var element = data[i]
      redis.hgetall(element, function (err, target) {
        if (err) return callback(err)

        target.accept = JSON.parse(target.accept)

        targets.push(target)
        if (data.length === (i + 1)) {
          targets.sort((a, b) => parseFloat(b.value) - parseFloat(a.value))

          return callback(null, targets)
        }
      })
    }
  })
}

function getAEligibleTarget (options, callback) {
  var targets = []
  redis.keys('targets:*', function (err, data) {
    if (err) return callback(err)
    if (data === undefined || data.length === 0) return callback(null, [])
    for (let i = 0; i < data.length; i++) {
      var element = data[i]
      redis.hgetall(element, function (err, target) {
        if (err) return callback(err)

        target.accept = JSON.parse(target.accept)

        var eligible = true
        var geoState = target.accept.geoState.$in
        var hour = target.accept.hour.$in

        if (options && options.geoState && !geoState.includes(options.geoState)) eligible = false
        if (options && options.hour && !hour.includes(options.hour.toString())) eligible = false
        if (target.maxAcceptsPerDay === target.visits) eligible = false

        if (eligible) targets.push(target)
        if (data.length === (i + 1)) {
          targets.sort((a, b) => parseFloat(b.value) - parseFloat(a.value))

          return callback(null, targets[0])
        }
      })
    }
  })
}

function updateSet (key, update, callback) {
  _keyGenerator(key, function (err, key) {
    if (err) return callback(err)
    redis.hgetall(key, function (err, target) {
      if (err) return callback(err)

      if (update.accept) update.accept = JSON.stringify(update.accept)

      redis.hmset(key, { ...target, ...update }, function (err, data) {
        if (err) return callback(err)
        return callback(null, data)
      })
    })
  })
}

function deleteSet (key, callback) {
  redis.del(this._key_generator(key), function (err, reply) {
    if (err) return false
    return callback(reply)
  })
}

function countVisit (key, callback) {
  _keyGenerator(key, function (err, key) {
    if (err) return callback(err)
    redis.hgetall(key, function (err, target) {
      if (err) return callback(err)

      redis.hmset(key, { ...target, visits: parseInt(target.visits) + 1 }, function (err, data) {
        if (err) return callback(err)
        return callback(null, data)
      })
    })
  })
}

module.exports = {
  addSet,
  getSet,
  getAll,
  updateSet,
  deleteSet,
  getAEligibleTarget,
  countVisit
}
