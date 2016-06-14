import isString from 'lodash/isString'
import isArray from 'lodash/isArray'
import isObject from 'lodash/isObject'
import isObservable from '../isObservable'
import isPromise from '../isPromise'
import zipObject from 'lodash/zipObject'
import keys from 'lodash/keys'
import map from 'lodash/map'
import _combineLatest from '@rxjs/rx/observable/combinelatest'
import map$ from '@rxjs/rx/observable/map'

// Workaround for https://github.com/Reactive-Extensions/RxJS/issues/1258
const combineLatest = array => _combineLatest.apply(null, array)

// Allow URLs in multiple shapes:
// '/user'
// ['/user', '/user/login']
// {user: '/user', userLogin: '/user/login'}
export default function handleMultipleUrls(source) {
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
        combineLatest(array) :
        Promise.all(array)
    }

    else if (isObject(urls) && !isPromise(urls) && !isObservable(urls)) {
      // {k1: url, k2: url} -> {k1: val, k2: val}
      const ks = keys(urls)
      const array = map(urls, url => source(Object.assign({}, request, {url})))
      const combine = results => zipObject(ks, results)
      return request.method === 'OBSERVE' ?
        map$(combineLatest(array), combine) :
        Promise.all(array).then(combine)
    }

    else {
      // url -> val
      return source(request)
    }
  }
}
