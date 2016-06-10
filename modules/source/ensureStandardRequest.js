import {isArrayUrl, urlToString} from '../url'
import isObservable from '../isObservable'
import isPromise from '../isPromise'

// Enforce standard request format for all sources.
export default function ensureStandardRequest(source) {
  return function(request) {
    // For perf and simplicity we want all urls to be an array.
    if (!request.url || !isArrayUrl(request.url)) {
      throw new Error('Url must be an array')
    }

    if (!request.method || typeof request.method !== 'string') {
      throw new Error('Method must be a string')
    }

    const result = source(request)

    if (request.method === 'OBSERVE') {
      if (!isObservable(result)) {
        throw new Error('Source must return observable for OBSERVE method: ' + urlToString(request.url))
      }
    }
    else {
      if (!isPromise(result)) {
        throw new Error('Source must return promise for non-OBSERVE methods: ' + urlToString(request.url))
      }
    }

    return result
  }
}
