import isUrl from '../isUrl'
import isArray from 'lodash/isArray'
import isObject from 'lodash/isObject'
import zipObject from 'lodash/zipObject'
import keys from 'lodash/keys'
import combineLatest from '@rxjs/rx/observable/combinelatest'

// Allow URLs in multiple shapes:
// '/user'
// ['/user', '/user/login']
// {user: '/user', userLogin: '/user/login'}
export default function handleMultipleUrls(source) {
  return function(request) {
    const urls = request.url

    if (isArray(urls) && isUrl(urls[0])) {
      // [url, url] -> [val, val]
      const array = urls.map(url => source(Object.assign({}, request, {url})))
      return request.method === 'OBSERVE' ?
        combineLatest(array) :
        Promise.all(array)
    }

    else if (isObject(urls)) {
      // {k1: url, k2: url} -> {k1: val, k2: val}
      const ks = keys(urls)
      const array = ks.map(url => source(Object.assign({}, request, {url})))
      const combine = results => zipObject(ks, results)
      return request.method === 'OBSERVE' ?
        combineLatest(array).map(combine) :
        Promise.all(array).then(combine)
    }

    else {
      // url -> val
      return source(request)
    }
  }
}
