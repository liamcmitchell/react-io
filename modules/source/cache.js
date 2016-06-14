import create from '@rxjs/rx/observable/create'
import tap from '@rxjs/rx/observable/tap'
import _finally from '@rxjs/rx/observable/finally'
import share from '@rxjs/rx/observable/share'
import startWith from '@rxjs/rx/observable/startwith'

// A cacheable observable needs to add itself to the cache on subscription
// and remove itself on unsubscribe.
function createCacheableObservable(source, cache, request) {
  const {url} = request

  return create(observer => {
    // If there is nothing in the cache, add it.
    if (!cache[url]) {
      // Get observable from wrapped source.
      const observable = source(request)
      // Allow later subscribers to start with the latest value.
      const tapped = tap(observable, v => {cache[url].lastValue = v})
      // Remove from cache when disposed.
      const cleaned = _finally(tapped, () => {delete cache[url]})
      // Add to cache.
      cache[url] = {
        // Share single observable.
        observable: share(cleaned)
      }
    }

    // Start with last value if possible.
    if (cache[url].hasOwnProperty('lastValue')) {
      return startWith(cache[url].observable, cache[url].lastValue)
        .subscribe(observer)
    }
    else {
      return cache[url].observable
        .subscribe(observer)
    }
  })
}

export default function cache(source) {
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
