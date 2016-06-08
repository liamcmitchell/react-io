import _ from 'underscore'

function checkRoutes(routes) {
  Object.keys(routes).forEach(route => {
    if (route.indexOf('/') !== -1) {
      throw new Error('Route cannot contain /')
    }
    if (typeof routes[route] !== 'function') {
      throw new Error('Route source must be a function')
    }
  })
}

function route(routes, request) {
  const currentPart = request.url[0]
  const nextUrl = request.url.slice(1)
  const nextRequest = Object.assign({}, request, {url: nextUrl})

  if (routes.hasOwnProperty(currentPart)) {
    return routes[currentPart].call(null, nextRequest)
  }
  else {
    throw new Error('No source found for route ' + currentPart)
  }
}

// Return source that delegates requests based on url.
export default function sourceRoutes(routes) {
  checkRoutes(routes)
  return route.bind(null, routes)
}
