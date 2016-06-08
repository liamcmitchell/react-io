import Rx from 'rx'

export default function sourceMethods(methods) {
  return function(request) {
    const handler = methods[request.method] || methods.default

    if (handler) {
      // Return value is either an observable or a promise.
      if (request.method === 'OBSERVE') {
        return Rx.Observable.create(observer =>
          handler.call(null, request, observer)
        )
      }
      else {
        return new Promise((resolve, reject) =>
          handler.call(null, request, {resolve, reject})
        )
      }
    }
    else {
      throw new Error('Method not supported.', request)
    }
  }
}
