import urlToArray from './url-to-array'

export default function sourceAlias(upstreamUrl) {
  upstreamUrl = urlToArray(upstreamUrl)

  return function(request) {
    return request.source(Object.assign({}, request, {
      url: upstreamUrl.concat(request.url)
    }))
  }
}
