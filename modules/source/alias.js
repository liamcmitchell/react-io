import {urlToArray} from '../url'

// Requires recursion (request.source).
export default function alias(upstreamUrl) {
  upstreamUrl = urlToArray(upstreamUrl)

  return function(request) {
    return request.source(Object.assign({}, request, {
      url: upstreamUrl.concat(request.url)
    }))
  }
}
