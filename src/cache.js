import Rx from 'rx'
import urlToString from './url-to-string'

// A cacheable observable needs to add itself to the cache on subsciption
// and remove itself on unsubscribe.
function createCacheableObservable(source, cache, request) {
  const url = urlToString(request.url)

  return Rx.Observable.create(observer => {
    // If there is nothing in the cache, add it.
    if (!cache[url]) {
      cache[url] = {
        observable: source(request)
          // Allow later subscribers to start with the latest value.
          .tap(v => {
            cache[url].lastValue = v
          })
          // Remove from cache when disposed.
          .finally(() => {
            delete cache[url]
          })
          // Share single observable.
          .publish().refCount()
      }
    }

    // Start with last value if possible.
    if (cache[url].hasOwnProperty('lastValue')) {
      return cache[url].observable
        .startWith(cache[url].lastValue)
        .subscribe(observer)
    }
    else {
      return cache[url].observable
        .subscribe(observer)
    }
  })
}

export default function sourceCache(source) {
  const cache = {}

  return function(request) {
    if (request.method === 'OBSERVE') {
      // The request isn't completed until subscription.
      return createCacheableObservable(source, cache, request)
    }
    else {
      return source(request)
    }
  }
}
