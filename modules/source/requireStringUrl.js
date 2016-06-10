import {isStringUrl, urlToArray} from '../url'

export default function requireStringUrl(source) {
  return function(request) {
    const url = request.url

    if (!isStringUrl(url)) {
      throw new Error('Url must be string starting with forward slash (/): ' + url)
    }

    return source(Object.assign({}, request, {url: urlToArray(url)}))
  }
}
