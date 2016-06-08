import create from '@rxjs/rx/observable/create'

export default function sourceMethods(methods) {
  return function(request) {
    const handler = methods[request.method] || methods.default

    if (handler) {
      // Return value is either an observable or a promise.
      if (request.method === 'OBSERVE') {
        return create(observer =>
          handler(request, observer)
        )
      }
      else {
        return new Promise((resolve, reject) =>
          handler(request, {resolve, reject})
        )
      }
    }
    else {
      throw new Error('Method not supported.', request)
    }
  }
}
