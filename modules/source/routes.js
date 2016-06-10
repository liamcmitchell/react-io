// Return source that delegates requests based on url.
export default function routes(routes) {
  // Check routes.
  Object.keys(routes).forEach(route => {
    if (route.indexOf('/') !== -1) {
      throw new Error('Route cannot contain /')
    }
    if (typeof routes[route] !== 'function') {
      throw new Error('Route source must be a function')
    }
  })

  return function(request) {
    // Index route is defined as empty string.
    const route = request.url[0] || ''

    if (routes.hasOwnProperty(route)) {
      return routes[route](Object.assign({}, request, {
        url: request.url.slice(1)
      }))
    }
    else {
      // TODO: Better error message, what is the full url at this point?
      throw new Error('No source found for route ' + (route || '[index]'))
    }
  }
}
