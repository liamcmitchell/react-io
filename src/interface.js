/*
A URL can be string beginning with / or array of url pieces:
source('/user/login')
source(['user', 'login'])

Multiple URLs are supported as an array or map:
source(['/user', '/user/login'])
source({
  user: '/user',
  userLogin: '/user/login'
})

source(url) -> observable
source(url).map(fn) -> observable
source(url).render(fn) -> react component
source(url).set(val) -> promise
source(url).call(request) -> promise
*/

import Rx from 'rx'
import mapValues from 'lodash/mapvalues'
import keys from 'lodash/keys'
import isArray from 'lodash/isarray'
import isString from 'lodash/isstring'
import zipObject from 'lodash/zipobject'
import filter from 'lodash/filter'

function isObservable(o) {
  return o && typeof o.subscribe === 'function'
}

function isPromise(o) {
  return o && typeof o.next === 'function'
}

function urlToString(url) {
  return typeof url === 'string' ?
    url :
    '/' + url.join('/')
}

function urlToArray(url) {
  return isArray(url) ?
    url :
    filter(url.split('/'))
}

// Url can be string beginning with / or array of url pieces.
function isUrl(url) {
  return isString(url) && url[0] === '/' ||
    isArray(url) && isString(url[0])
}

function isSingleUrl(urls) {
  return isArray(urls) && urls.length === 1
}

function singleUrl(urls) {
  if (!isSingleUrl(urls)) {
    throw new Error('Requires single url')
  }
  return urls[0]
}

function sourceTypeCheck(source) {
  return function(request) {
    if (!request.url || !isArray(request.url)) {
      throw new Error('Url must be an array')
    }
    if (!request.method || !isString(request.method)) {
      throw new Error('Method must be a string')
    }

    return source(request)
  }
}

function sourceRecursion(source) {
  return function(request) {
    if (!request.source) {
      request.source = sourceRecursion(source)
    }
    return source(request)
  }
}

function sourceNormalizeUrl(source) {
  return function(request) {
    const {url, method} = request
    return isPromise(url) || (method === 'OBSERVE' && isObservable(url)) ?
      url :
      source(Object.assign({}, request, {url: urlToArray(url)}))
  }
}

function sourceMultipleUrls(source) {
  return function(request) {
    const urls = request.url

    if (isString(urls)) {
      // url -> val
      return source(request)
    }

    else if (isArray(urls)) {
      // [url, url] -> [val, val]
      const array = urls.map(url => source(Object.assign({}, request, {url})))
      return request.method === 'OBSERVE' ?
        Rx.Observable.combineLatest(array) :
        Promise.all(array)
    }

    else {
      // {k1: url, k2: url} -> {k1: val, k2: val}
      const keys = keys(urls)
      const array = keys.map(url => source(Object.assign({}, request, {url})))
      const combine = results => zipObject(keys, results)
      return request.method === 'OBSERVE' ?
        Rx.Observable.combineLatest(array).map(combine) :
        Promise.all(array).then(combine)
    }
  }
}

// External API

// Return dev friendly API for given source.
export default function sourceInterface(source) {
  if (typeof source !== 'function') {
    throw new Error('Source must be a function')
  }

  source = sourceMultipleUrls(sourceNormalizeUrl(sourceRecursion(sourceTypeCheck(source))))

  return function createSourceInterface(url) {
    return new SourceInterface(source, url)
  }
}

function SourceInterface(source, url) {
  this.source = source
  this.url = url
}

SourceInterface.prototype.call = function(req) {
  return this.source(Object.assign({
    url: this.url
  }, req))
}

SourceInterface.prototype.subscribe = function() {
  const o = this.call({method: 'OBSERVE'})
  return o.subscribe.apply(o, arguments)
}

SourceInterface.prototype.next = function() {
  const p = this.call({method: 'GET'})
  return p.next.apply(p, arguments)
}

SourceInterface.prototype.set = function(value) {
  return this.call({
    method: 'SET',
    value: value
  })
}
