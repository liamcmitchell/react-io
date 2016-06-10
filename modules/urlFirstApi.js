// Allow using with jQuery-like syntax: io('/user/auth').render(auth => <b>{auth}</b>)
export default function urlFirstApi(source, methods = {}) {
  if (typeof source !== 'function') {
    throw new Error('Source must be a function')
  }

  // The temp object to chain methods off.
  function ioURL(url) {
    this.url = url
  }

  // Add methods to prototype.
  ioURL.prototype = Object.assign({
    // Call is the only method with access to source, all requests have to go through this.
    call: function(request) {
      return source(Object.assign({url: this.url}, request))
    }
  }, methods)

  return function io(url) {
    if (!url) {
      throw new Error('Url required e.g. io(url)')
    }
    return new ioURL(url)
  }
}
