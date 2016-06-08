// JSON transform.
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
    return result.map(JSON.parse.bind(JSON))
  }
  else if (request.method === 'GET') {
    return result.next(JSON.parse.bind(JSON))
  }
  else {
    return result
  }
}
