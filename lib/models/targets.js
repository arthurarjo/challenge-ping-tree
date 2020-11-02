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

function _handleFieldError (errors) {
  return { message: errors, statusCode: 400 }
}

function _verifyFields (data, callback) {
  var errors = []
  for (var prop in model) {
    if (model[prop].required && !data[prop]) errors.push(`Field ${prop} is required`)
  }
  if (errors.length) return callback(_handleFieldError(errors))
  return callback()
}

function addSet (set, callback) {
  _keyGenerator(null, function (err, key) {
    if (err) return callback(err)
    set.id = key.replace('targets:', '')
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
      if (field) {
        data = data.field
      }
      return callback(null, data)
    })
  })
}

function getAll (options, callback) {
  var targets = []
  redis.keys('targets:*', function (err, data) {
    if (err) return callback(err)
    if (data === undefined || data.length === 0) return callback(null, [])
    for (let i = 0; i < data.length; i++) {
      var element = data[i]
      redis.hgetall(element, function (err, target) {
        if (err) return callback(err)
        targets.push(target)
        if (data.length === (i + 1)) return callback(null, targets)
      })
    }
  })
}

function updateSet (key, update, callback) {
  _keyGenerator(key, function (err, key) {
    if (err) return callback(err)
    redis.hgetall(key, function (err, target) {
      if (err) return callback(err)
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

module.exports = {
  addSet,
  getSet,
  getAll,
  updateSet,
  deleteSet
}
