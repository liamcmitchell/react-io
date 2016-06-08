import {isArrayUrl} from '../isUrl'

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

    return source(request)
  }
}
