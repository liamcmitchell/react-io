import map from '@rxjs/rx/observable/map'

const parse = JSON.parse.bind(JSON)

// JSON transform.
// Stringifies request.value and parses OBSERVE and GET.
// Requires recursion (request.source).
export default function jsonSource(request) {
  const newRequest = Object.assign({
    url: request.url.slice(1)
  }, request)

  // If sending a value, transform.
  if (request.hasOwnProperty('value')) {
    newRequest.value = JSON.stringify(request.value, null, 2)
  }

  const result = request.source(newRequest)

  if (request.method === 'OBSERVE') {
    return map(result, parse)
  }
  else if (request.method === 'GET') {
    return result.next(parse)
  }
  else {
    return result
  }
}
