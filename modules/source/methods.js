import isObservable from '../isObservable'

export default function sourceMethods(methods) {
  return function(request) {
    const {method} = request

    // Allow fallback.
    const handler = methods[method] || methods.default

    if (handler) {
      // Allow shorthand for observable.
      if (method === 'OBSERVE' && isObservable(handler)) {
        return handler
      }
      return handler(request)
    }
    else {
      throw new Error('Method not found', request)
    }
  }
}
