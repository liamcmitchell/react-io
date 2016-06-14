import isObservable from '../isObservable'
import create from '@rxjs/rx/observable/create'
import flatMapLatest from '@rxjs/rx/observable/flatmaplatest'
import startWith from '@rxjs/rx/observable/startwith'
import fromPromise from '@rxjs/rx/observable/frompromise'
import toPromise from '@rxjs/rx/observable/topromise'
import interval from '@rxjs/rx/observable/interval'
import take from '@rxjs/rx/observable/take'

function observeFromGet(GET, request) {
  return create(observer =>
    // Map interval to request.
    flatMapLatest(
      // Create interval (pollInterval or 10 mins) and emit value immediately.
      startWith(interval(request.pollInterval || 10 * 60 * 1000), 0),
      // Request.
      () => fromPromise(
        GET(Object.assign(request, {method: 'GET'}))
      )
    )
      .subscribe(observer)
  )
}

function getFromObserve(OBSERVE, request) {
  return toPromise(take(
    OBSERVE(Object.assign(request, {method: 'OBSERVE'}))
  , 1))
}

export default function sourceMethods(handlers) {
  const GET = handlers.GET || handlers.default
  // Allow shorthand for observable.
  const _OBSERVE = handlers.OBSERVE
  const OBSERVE = isObservable(_OBSERVE) ?
      () => _OBSERVE :
      _OBSERVE

  // TODO: Move GET/OBSERVE translation into another function?
  // This Would make this behaviour explicit.
  handlers = Object.assign({}, handlers, {
    GET: GET ?
      GET :
      // If we have OBSERVE but not GET, convert observe to promise.
      OBSERVE ?
        getFromObserve.bind(null, OBSERVE) :
        null,
    OBSERVE: OBSERVE ?
      OBSERVE :
      // If we have GET but not OBSERVE, create an observable to poll GET.
      GET ?
        observeFromGet.bind(null, GET) :
        null
  })

  return function handleMethod(request) {
    const {method} = request
    const handler = handlers[method] || handlers.default

    if (handler) {
      return handler(request)
    }
    else {
      throw new Error(`Method ${method} not supported`, request)
    }
  }
}
