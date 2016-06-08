import sourceMethods from 'source/methods'
import Rx from 'rx'
import _ from 'underscore'

// Get nested value.
function get(path, object) {
  return path.reduce((memo, key) =>
    _.isArray(memo) ?
      memo[parseInt(key, 10)] :
      memo[key]
  , object)
}

// Set nested value.
function set(path, object, value) {
  if (path.length === 0) {
    return value
  }
  const changed = path.length === 1 ?
    value :
    set(path.slice(1), get([path[0]], object), value)
  const clone = _.clone(object)
  if (_.isArray(object)) {
    object[parseInt(path[0], 10)] = changed
  }
  else {
    object[path[0]] = changed
  }
  return object
}

export default function memorySource(initialValue) {
  const subject = new Rx.BehaviorSubject(initialValue)

  return sourceMethods({
    OBSERVE: function(request, observer) {
      if (request.url.length === 0) {
        return subject.subscribe(observer)
      }
      else {
        return subject
          .map(get.bind(null, request.url))
          .subscribe(observer)
      }
    },
    SET: function(request, promise) {
      if (request.url.length === 0) {
        subject.onNext(request.value)
        promise.resolve()
      }
      else {
        subject.onNext(set(request.url, subject.getValue(), request.value))
        promise.resolve()
      }
    }
  })
}
